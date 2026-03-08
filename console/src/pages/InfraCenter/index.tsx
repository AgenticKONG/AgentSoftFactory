import { useEffect, useState, useRef } from 'react';
import { Card, Row, Col, Typography, List, Spin, Button, message, Tabs, Input, Divider } from 'antd';
import { 
  Cpu, Zap, LayoutDashboard, 
  ChevronRight, Terminal, BookOpen
} from 'lucide-react';
import api from '../../api';
import { getApiUrl, getApiToken } from "../../api/config";

const { Title, Text } = Typography;

const InfraCenter = () => {
  const [loading, setLoading] = useState(true);
  const [infraData, setInfraData] = useState<any>(null);
  const [reflexJobs, setReflexJobs] = useState<any[]>([]);
  
  const [messages, setMessages] = useState<any[]>([
    { role: 'system', content: '[ CONNECTION ESTABLISHED: ASF INFRA LINK v2.0 ]' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchInfraData(), fetchReflexJobs(), fetchChatHistory()]);
      } catch (err) {
        console.error("Init failed:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
    const timer = setInterval(fetchChatHistory, 3000);
    return () => clearInterval(timer);
  }, []);

  const fetchChatHistory = async () => {
    try {
      const res = await fetch('/api/asf/infra/chat/history');
      const history = await res.json();
      if (history && Array.isArray(history) && history.length > 0) {
        setMessages([
          { role: 'system', content: '[ CONNECTION ESTABLISHED: ASF INFRA LINK v2.0 ]' },
          ...history
        ]);
      }
    } catch (err) { console.error("Failed to fetch history:", err); }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchInfraData = async () => {
    try {
      const res = await fetch('/api/asf/infra/info');
      const data = await res.json();
      setInfraData(data);
    } catch (err) { console.error(err); }
  };

  const fetchReflexJobs = async () => {
    try {
      const allJobs = await api.listCronJobs();
      setReflexJobs(Array.isArray(allJobs) ? allJobs.filter((job: any) => job.meta?.category === 'infra') : []);
    } catch (err) { console.error(err); }
  };

  const runReflexJob = async (jobId: string) => {
    try {
      await api.triggerCronJob(jobId);
      message.success("Reflex triggered.");
    } catch (err) { message.error("Failed."); }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isSending) return;
    const userMsg = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsSending(true);

    try {
      const response = await fetch(getApiUrl("/agent/process"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getApiToken()}`
        },
        body: JSON.stringify({
          input: [{ role: 'user', content: [{ type: 'text', text: inputValue }] }],
          session_id: "infra-governance",
          user_id: "architect",
          channel: "console",
          stream: false 
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const rawText = await response.text();
      try {
        const data = JSON.parse(rawText);
        const reply = data.output ? data.output[0] : data;
        const txt = typeof reply.content === 'string' ? reply.content : JSON.stringify(reply.content);
        setMessages(prev => [...prev, { role: 'system', content: String(txt) }]);
      } catch(e) { /* silent ignore Beacon update as polling will catch it */ }
    } catch (err: any) {
      message.error(err.message || "Failed to reach Brain.");
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Awakening Infra Agent..." />
      </div>
    );
  }

  // Final fallback for data
  const data = infraData || { state: {}, soul: { principles: [] }, evolution_logs: [] };

  const RenderStatistic = ({ title, value }: { title: string, value: string }) => (
    <div style={{ padding: '4px 0' }}>
      <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: '12px', fontWeight: 500 }}>{title}</div>
      <div style={{ color: '#1e2937', fontSize: '18px', fontWeight: 700 }}>{value || "N/A"}</div>
    </div>
  );

  const items = [
    {
      key: '1',
      label: <span className="tab-label"><LayoutDashboard size={14}/>Dashboard</span>,
      children: (
        <Card title="Operating State" className="ic-card">
          <Row gutter={48}>
            <Col span={8}><RenderStatistic title="Last Checkpoint" value={data.state?.last_checkpoint} /></Col>
            <Col span={8}><RenderStatistic title="Current Focus" value={data.state?.current_task} /></Col>
            <Col span={8}><RenderStatistic title="State Sync" value={data.state?.timestamp} /></Col>
          </Row>
          <Divider />
          <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
            <Title level={5}>Real-time Evolution Logs</Title>
            <List
              size="small"
              dataSource={data.evolution_logs || []}
              renderItem={(log: any) => (
                <List.Item><Text type="secondary">{log.time || "???"}:</Text> {log.action || "Idle"}</List.Item>
              )}
            />
          </div>
        </Card>
      ),
    },
    {
      key: '2',
      label: <span className="tab-label"><BookOpen size={14}/>Constitution</span>,
      children: (
        <Card title="Soul & Core Principles" className="ic-card">
          <div className="soul-hero">
            <Title level={4}>{data.soul?.identity || "ASF Infra Agent"}</Title>
            <Text type="secondary">Shared Consciousness v{data.soul?.version || "1.0"}</Text>
          </div>
          <List
            dataSource={data.soul?.principles || []}
            renderItem={(item: string) => (
              <List.Item className="soul-item">
                <span className="bullet">⚡</span> {item}
              </List.Item>
            )}
          />
        </Card>
      ),
    },
    {
      key: '3',
      label: <span className="tab-label"><Zap size={14}/>Reflex</span>,
      children: (
        <Row gutter={24}>
          <Col span={16}>
            <Card title="Evolution Backlog" className="ic-card">
              <pre className="backlog-viewer">{data.evolution_backlog || "Standby."}</pre>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="Housekeeping Jobs" className="ic-card">
              <List
                dataSource={reflexJobs}
                renderItem={job => (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Text strong>{job.name}</Text>
                    <Button type="primary" size="small" onClick={() => runReflexJob(job.id)}>Run</Button>
                  </div>
                )}
              />
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: '4',
      label: <span className="tab-label"><Terminal size={14}/>Terminal</span>,
      children: (
        <div className="terminal-container">
          <div className="terminal-header">
            <div className="term-dots"><span className="dot red"></span><span className="dot yellow"></span><span className="dot green"></span></div>
            <span className="term-title">architect@asf:~ (Soul Bridge)</span>
          </div>
          <div className="terminal-body" ref={scrollRef}>
            {messages.map((msg, i) => (
              <div key={i} className={`msg-row role-${msg.role}`}>
                <div className="msg-header">
                  <span className="msg-prefix">{msg.role === 'user' ? 'root@asf # ' : msg.role === 'system' ? '>> ' : '[INFRA] > '}</span>
                </div>
                <div className="msg-content">{msg.content}</div>
              </div>
            ))}
            {isSending && <div className="msg-row role-system">{'>>'} PROCESSING...</div>}
          </div>
          <div className="terminal-input-area">
            <Input 
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onPressEnter={sendMessage}
              placeholder="Enter command..."
              autoFocus
              className="term-input"
              prefix={<ChevronRight size={14} color="#2563eb"/>}
              disabled={isSending}
            />
          </div>
        </div>
      ),
    }
  ];

  return (
    <div className="ic-container">
      <div className="ic-header">
        <Title level={2}><Cpu size={28} color="#2563eb" /> Infra Agent Center</Title>
      </div>
      <Tabs defaultActiveKey="4" items={items} className="ic-tabs-main" />
      <style>{`
        .ic-container { padding: 24px; background: #f8fafc; min-height: 100vh; font-family: -apple-system, sans-serif; }
        .tab-label { display: flex; align-items: center; gap: 8px; font-weight: 500; }
        .ic-card { border-radius: 12px; border: 1px solid #e2e8f0; background: white; }
        .soul-hero { background: #eff6ff; padding: 16px; border-radius: 10px; margin-bottom: 16px; border: 1px solid #dbeafe; }
        .soul-item { padding: 6px 0 !important; border: none !important; font-size: 13px; }
        .bullet { margin-right: 8px; color: #2563eb; }
        .backlog-viewer { padding: 16px; background: #f1f5f9; border-radius: 8px; font-size: 12px; color: #334155; border: 1px solid #e2e8f0; white-space: pre-wrap; font-family: monospace; }
        
        .terminal-container { display: flex; flex-direction: column; height: calc(100vh - 220px); border-radius: 10px; overflow: hidden; background: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        .terminal-header { background: #f1f5f9; padding: 10px 16px; display: flex; align-items: center; border-bottom: 1px solid #e2e8f0; }
        .term-dots { display: flex; gap: 6px; margin-right: 16px; }
        .dot { width: 12px; height: 12px; border-radius: 50%; }
        .red { background: #ff5f56; } .yellow { background: #ffbd2e; } .green { background: #27c93f; }
        .term-title { color: #64748b; font-size: 12px; font-family: -apple-system, sans-serif; font-weight: 500; }
        
        .terminal-body { flex: 1; padding: 20px; overflow-y: auto; font-family: 'Menlo', 'Monaco', 'Courier New', monospace; color: #1f2937; line-height: 1.6; background: #ffffff; }
        .msg-row { margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
        .msg-header { margin-bottom: 4px; }
        .role-user { color: #2563eb; }
        .role-assistant { color: #059669; }
        .role-system { color: #7c3aed; opacity: 0.8; }
        .msg-prefix { font-weight: bold; font-size: 13px; }
        .msg-content { white-space: pre-wrap; word-break: break-all; padding-left: 12px; border-left: 2px solid #e2e8f0; }
        
        .terminal-input-area { background: #f8fafc; padding: 12px 16px; border-top: 1px solid #e2e8f0; }
        .term-input { background: transparent !important; border: none !important; color: #1f2937 !important; font-family: monospace !important; font-weight: 500; }
        .term-input:focus { box-shadow: none !important; }
      `}</style>
    </div>
  );
};

export default InfraCenter;

/**
 * 🛡️ ASF INFRA CENTER - SOURCE OF TRUTH (SOLIDIFIED)
 * Version: 1.6
 * Alignment: [SPEC-IC-P5-20260310]
 * Changes: 
 * 1. Fixed Card 1 Icon: Switched Shield to Activity per SPEC mapping.
 * 2. Switched from fetch to standard 'api' helper.
 * 3. Restored from corruption after DEV hallucination.
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, Row, Col, Typography, List, Spin, Button, message, Tabs, Input, Divider, Tag } from 'antd';
import { Cpu, Zap, LayoutDashboard, BookOpen, Activity, Clock, Shield, Play, Terminal, ChevronRight } from 'lucide-react';
import api from '../../api';
import { getApiToken } from "../../api/config";

const { Title, Text } = Typography;

const InfraCenter = () => {
  const [loading, setLoading] = useState(true);
  const [infraData, setInfraData] = useState<any>(null);
  const [reflexJobs, setReflexJobs] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchChatHistory = useCallback(async () => {
    try {
      console.log("[IC] Fetching chat history...");
      const history = await api.request<any[]>('/asf/infra/chat/history');
      console.log("[IC] Chat history received:", history);
      if (Array.isArray(history)) {
        console.log("[IC] Setting messages, count:", history.length);
        setMessages(history);
      }
    } catch (err) {
      console.error("[IC] Neural Link Sync Error:", err);
    }
  }, []);

  const fetchInfraData = useCallback(async () => {
      try {
        console.log("[IC] Fetching infra data...");
        const data = await api.request<any>('/asf/infra/info');
        console.log("[IC] Infra data received:", JSON.stringify(data).slice(0, 200));
        if (data) {
          console.log("[IC] Setting infraData state...");
          setInfraData(data);
          console.log("[IC] infraData state set, state:", data.state, "soul:", data.soul?.principles?.length);
        }
        return data;
      } catch (err) {
        console.error("[IC] Infra Data Fetch Error:", err);
        const fallback = { soul: { principles: [] }, state: {}, evolution_logs: [] };
        setInfraData(fallback);
        return null;
      }
    }, []);

  const fetchReflexJobs = useCallback(async () => {
    try {
      console.log("[IC] Fetching reflex jobs...");
      const allJobs = await api.listCronJobs();
      console.log("[IC] Reflex jobs received:", Array.isArray(allJobs) ? `${allJobs.length} jobs` : "null");
      const filtered = Array.isArray(allJobs) ? allJobs.filter((job: any) => job.meta?.category === 'infra') : [];
      setReflexJobs(filtered);
      return filtered;
    } catch (err) {
      console.error("[IC] Reflex List Error:", err);
      setReflexJobs([]);
      return [];
    }
  }, []);

  const runReflexJob = async (jobId: string) => {
    try {
      await api.triggerCronJob(jobId);
      message.success("Reflex Triggered.");
    } catch (err) {
      message.error("Reflex Failed.");
    }
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setLoading(true);
      try {
        const [infra, jobs, history] = await Promise.allSettled([
          fetchInfraData(),
          fetchReflexJobs(),
          fetchChatHistory()
        ]);
        console.log("[IC] Init complete:", { 
          infra: infra.status, 
          jobs: jobs.status, 
          history: history.status 
        });
      } catch (e) {
        console.error("Init failed:", e);
      } finally {
        if (mounted) {
          setLoading(false);
          console.log("[IC] Loading set to false");
        }
      }
    };
    const timer = setInterval(() => {
      if (mounted) fetchChatHistory();
    }, 5000);

    const forceTimeout = setTimeout(() => {
      console.log("[IC] Force timeout - setting loading=false");
      setLoading(false);
    }, 10000);

    init();

    return () => {
      mounted = false;
      clearInterval(timer);
      clearTimeout(forceTimeout);
    };
  }, [fetchInfraData, fetchReflexJobs, fetchChatHistory]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isSending) return;
    setMessages(prev => [...prev, { role: 'user', content: inputValue }]);
    const currentInput = inputValue;
    setInputValue('');
    setIsSending(true);

    try {
      await api.request("/agent/process", {
        method: "POST",
        body: JSON.stringify({
          input: [{
            role: 'user',
            content: [{ type: 'text', text: currentInput }]
          }],
          session_id: "infra-governance",
          user_id: "architect",
          channel: "console",
          stream: false 
        })
      });
      setTimeout(fetchChatHistory, 1000);
    } catch (err) {
      message.error("Link Broken: Neural connection failed.");
    } finally {
      setIsSending(false);
    }
  };

  const renderTab1 = () => (
    <Card 
      title={<span><Activity size={16} style={{marginRight:8, color:'#2563eb'}}/>Operational State</span>} 
      style={{borderRadius:16, border:'1px solid #e2e8f0', background: '#ffffff'}}
      bodyStyle={{padding: 24}}
    >
      <Row gutter={16}>
        <Col span={8}>
          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: '11px', display:'flex', alignItems:'center', gap:4 }}>
              <Activity size={12}/> Checkpoint
            </div>
            <div style={{ color: '#1e2937', fontSize: '16px', fontWeight: 800, marginTop: 8 }}>
              {infraData?.state?.last_checkpoint || "N/A"}
            </div>
          </div>
        </Col>
        <Col span={8}>
          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: '11px', display:'flex', alignItems:'center', gap:4 }}>
              <Zap size={12}/> Current Focus
            </div>
            <div style={{ color: '#1e2937', fontSize: '16px', fontWeight: 800, marginTop: 8 }}>
              {infraData?.state?.current_task || "Idle"}
            </div>
          </div>
        </Col>
        <Col span={8}>
          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: '11px', display:'flex', alignItems:'center', gap:4 }}>
              <Clock size={12}/> Brain Clock
            </div>
            <div style={{ color: '#1e2937', fontSize: '16px', fontWeight: 800, marginTop: 8 }}>
              {infraData?.state?.timestamp || "N/A"}
            </div>
          </div>
        </Col>
      </Row>
      
      <Divider orientation="left" style={{marginTop:32}}>Evolution Logs</Divider>
      <List 
        size="small" 
        dataSource={infraData?.evolution_logs || []} 
        renderItem={(log: any) => (
          <List.Item style={{border:'none', padding:'8px 0', textAlign:'left'}}>
            <div style={{ display:'flex', alignItems:'center', gap:8, textAlign:'left', width:'100%' }}>
              <Tag color="blue" style={{borderRadius:4}}>{log.time || 'N/A'}</Tag> 
              <Text strong style={{marginRight:8}}>{log.action || 'Unknown'}</Text>
              <Text type="secondary">{log.correction || ''}</Text>
            </div>
          </List.Item>
        )} 
        locale={{ emptyText: "No logs recovered." }}
      />
    </Card>
  );

  const renderTab2 = () => (
    <Card 
      title={<span><BookOpen size={16} style={{marginRight:8, color:'#2563eb'}}/>Soul Constitution</span>} 
      style={{borderRadius:16, border:'1px solid #e2e8f0', background: '#ffffff'}}
    >
      <List 
        dataSource={infraData?.soul?.principles || []} 
        renderItem={(item: string) => (
          <List.Item style={{padding: '16px 0', borderBottom: '1px solid #f1f5f9', textAlign:'left'}}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:12, textAlign:'left', width:'100%' }}>
              <span style={{color:'#2563eb', fontWeight:'bold', lineHeight:1.5}}>⚡</span> 
              <Text style={{fontSize: 14, flex:1}}>{item}</Text>
            </div>
          </List.Item>
        )} 
        locale={{ emptyText: "Constitutional principles not found." }}
      />
    </Card>
  );

  const renderTab3 = () => (
    <Row gutter={24}>
      <Col span={16}>
        <Card 
          title={<span><Zap size={16} style={{marginRight:8, color:'#2563eb'}}/>Evolution Backlog</span>} 
          style={{borderRadius:16, border:'1px solid #e2e8f0', background: '#ffffff'}}
        >
          <div style={{ 
            background:'#f1f5f9', 
            padding:20, 
            borderRadius:12, 
            fontFamily:'"Fira Code", monospace', 
            whiteSpace:'pre-wrap', 
            fontSize:12, 
            minHeight:400,
            maxHeight: 600,
            overflowY: 'auto',
            border: '1px solid #e2e8f0'
          }}>
            {infraData?.evolution_backlog || "DTHBH Roadmap is ready for expansion."}
          </div>
        </Card>
      </Col>
      <Col span={8}>
        <Card 
          title={<span><Cpu size={16} style={{marginRight:8, color:'#2563eb'}}/>Housekeeping Jobs</span>} 
          style={{borderRadius:16, border:'1px solid #e2e8f0', background: '#ffffff'}}
        >
          <List 
            dataSource={reflexJobs} 
            renderItem={(job: any) => (
              <List.Item 
                style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0'}}
              >
                <div>
                  <Text strong block>{job.name}</Text>
                  <Text type="secondary" style={{fontSize:11}}>Trigger agent reflex</Text>
                </div>
                <Button 
                  type="primary" 
                  shape="circle"
                  size="small" 
                  icon={<Play size={10} fill="currentColor"/>} 
                  onClick={() => runReflexJob(job.id)} 
                />
              </List.Item>
            )} 
            locale={{ emptyText: "No active reflex jobs." }}
          />
        </Card>
      </Col>
    </Row>
  );

  const renderTab4 = () => (
    <div className="terminal-container" style={{ 
      display:'flex', 
      flexDirection:'column', 
      height:'calc(100vh - 280px)', 
      background:'#fff', 
      border:'1px solid #e2e8f0', 
      borderRadius:12, 
      overflow:'hidden',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      textAlign:'left'
    }}>
      <div className="terminal-header" style={{ padding:'8px 16px', background:'#f8fafc', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:8 }}>
        <div style={{width:10, height:10, borderRadius:'50%', background:'#ff5f56'}}/>
        <div style={{width:10, height:10, borderRadius:'50%', background:'#ffbd2e'}}/>
        <div style={{width:10, height:10, borderRadius:'50%', background:'#27c93f'}}/>
        <span style={{fontSize:11, color:'#64748b', marginLeft:8, fontFamily:'monospace'}}>infra-governance-link</span>
      </div>
      <div className="terminal-body" ref={scrollRef} style={{ flex:1, padding:24, overflowY:'auto', fontFamily:'"Fira Code", monospace', background:'#fff', textAlign:'left' }}>
        {messages.length === 0 && <div style={{color:'#999'}}>No messages in session</div>}
        {messages.map((msg, i) => {
          console.log("[IC] Rendering msg", i, msg);
          return (
          <div key={i} style={{ marginBottom: 16, textAlign:'left' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <Text strong style={{ opacity: 0.4, fontSize:11 }}>{(msg.role || 'assistant') === 'user' ? 'root@asf # ' : '>> '}</Text>
              <Text style={{ opacity: 0.2, fontSize:10 }}>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}</Text>
            </div>
            <div style={{ 
              marginLeft: 0, 
              background: (msg.role || 'assistant') === 'user' ? '#f8fafc' : 'transparent',
              padding: (msg.role || 'assistant') === 'user' ? '8px 12px' : '0 12px',
              borderRadius: 8,
              borderLeft: (msg.role || 'assistant') === 'user' ? '2px solid #2563eb' : '2px solid #e2e8f0',
              color: '#1e2937',
              textAlign:'left'
            }}>
              {String(msg.content || '')}
            </div>
          </div>
        )})}
        {isSending && (
          <div style={{ opacity: 0.5 }}>
            <Text strong style={{ fontSize:11 }}>{">> "}</Text>
            <div style={{ marginLeft: 12, borderLeft: '2px solid #2563eb', paddingLeft: 12 }}>
              <Spin size="small" /> Processing instruction...
            </div>
          </div>
        )}
      </div>
      <div className="terminal-input-area" style={{ padding:16, background:'#f8fafc', borderTop:'1px solid #e2e8f0', textAlign:'left' }}>
        <Input 
          value={inputValue} 
          onChange={e => setInputValue(e.target.value)} 
          onPressEnter={sendMessage} 
          placeholder="Instruct the Brain..." 
          autoFocus 
          variant="borderless"
          prefix={<ChevronRight size={14} color="#2563eb"/>} 
          disabled={isSending} 
          style={{ padding:0, textAlign:'left' }}
        />
      </div>
    </div>
  );

  if (loading || !infraData) return (
    <div style={{ display: 'flex', flexDirection:'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background:'#f8fafc' }}>
      <Spin size="large" />
      <Text style={{marginTop:16, color:'#64748b'}}>Establishing Soul Bridge...</Text>
    </div>
  );

  return (
    <div className="ic-container" style={{ padding: '32px', background: '#f8fafc', minHeight: '100vh' }}>
      <div className="ic-header" style={{ marginBottom: 32, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
        <div>
          <Title level={2} style={{ margin: 0, display:'flex', alignItems:'center' }}>
            <Cpu size={32} color="#2563eb" style={{ marginRight: 12 }} /> 
            Infra Center
          </Title>
          <Text type="secondary" style={{fontSize:14}}>Digital Humanities Infrastructure Governance Matrix</Text>
        </div>
        <div style={{textAlign:'right'}}>
          <Tag color="green" style={{borderRadius:12, padding:'2px 12px'}}>Neural Link Active</Tag>
          <div style={{fontSize:10, color:'#999', marginTop:4}}>
            Debug: {infraData ? 'data OK' : 'NO DATA'} | Jobs: {reflexJobs.length} | Msgs: {messages.length}
          </div>
        </div>
      </div>

      <Tabs 
        defaultActiveKey="1" 
        size="large"
        items={[
          { 
            key: '1', 
            label: <span style={{display:'flex', alignItems:'center', gap:8}}><LayoutDashboard size={16}/>Operational Dashboard</span>, 
            children: renderTab1() 
          },
          { 
            key: '2', 
            label: <span style={{display:'flex', alignItems:'center', gap:8}}><BookOpen size={16}/>Soul Constitution</span>, 
            children: renderTab2() 
          },
          { 
            key: '3', 
            label: <span style={{display:'flex', alignItems:'center', gap:8}}><Zap size={16}/>Daemon Agents</span>, 
            children: renderTab3() 
          },
          { 
            key: '4', 
            label: <span style={{display:'flex', alignItems:'center', gap:8}}><Terminal size={16}/>Neural Link</span>, 
            children: renderTab4() 
          }
        ]} 
      />
    </div>
  );
};

export default InfraCenter;

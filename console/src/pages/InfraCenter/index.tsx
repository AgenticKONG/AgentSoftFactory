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
import ReactMarkdown from 'react-markdown';
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
  const [streamingContent, setStreamingContent] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

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
    
    // WebSocket connection for real-time updates
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/api/asf/infra/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[IC] WebSocket message:", data);
        if (data.type === 'new_message' || data.type === 'update') {
          fetchChatHistory();
        }
      } catch {}
    };
    
    ws.onerror = () => {
      console.log("[IC] WebSocket error, falling back to polling");
    };
    
    // SSE for streaming updates
    const sseUrl = `/api/asf/infra/chat/stream`;
    const eventSource = new EventSource(sseUrl);
    eventSourceRef.current = eventSource;
    
    eventSource.addEventListener('update', (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("[IC] SSE update:", data);
        fetchChatHistory();
      } catch {}
    });
    
    eventSource.onerror = () => {
      console.log("[IC] SSE error, relying on polling");
    };
    
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

    const reflexTimer = setInterval(() => {
      if (mounted) fetchReflexJobs();
    }, 30000);

    const infraTimer = setInterval(() => {
      if (mounted) fetchInfraData();
    }, 30000);

    const forceTimeout = setTimeout(() => {
      console.log("[IC] Force timeout - setting loading=false");
      setLoading(false);
    }, 10000);

    init();

    return () => {
      mounted = false;
      clearInterval(timer);
      clearInterval(reflexTimer);
      clearInterval(infraTimer);
      clearTimeout(forceTimeout);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [fetchInfraData, fetchReflexJobs, fetchChatHistory]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isSending) return;
    
    // Multi-line command support: split by && or ;;
    const commands = currentInput.split(/&&|;;|\n/).map(c => c.trim()).filter(c => c);
    const currentInput = inputValue;
    setInputValue('');
    setIsSending(true);
    setShowSuggestions(false);
    
    // Add to command history
    if (currentInput.trim()) {
      setCmdHistory(prev => {
        const filtered = prev.filter(c => c !== currentInput);
        return [currentInput, ...filtered].slice(0, 10);
      });
    }

    // Execute commands sequentially
    for (const cmd of commands) {
      setMessages(prev => [...prev, { role: 'user', content: cmd }]);
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
        await new Promise(r => setTimeout(r, 500)); // Small delay between commands
      } catch (err) {
        message.error(`Command failed: ${cmd}`);
      }
    }
    setTimeout(fetchChatHistory, 1000);
    setIsSending(false);
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
      {(() => {
        const logs = infraData?.evolution_logs || [];
        // Group by date
        const grouped: Record<string, any[]> = {};
        logs.forEach((log: any) => {
          const date = log.date || 'Unknown';
          if (!grouped[date]) grouped[date] = [];
          grouped[date].push(log);
        });
        const dates = Object.keys(grouped).sort().reverse();
        return dates.map(date => (
          <div key={date} style={{marginBottom: 16}}>
            <Text strong style={{color: '#2563eb', fontSize: 12}}>{date}</Text>
            <List 
              size="small" 
              dataSource={grouped[date]} 
              renderItem={(log: any) => (
                <List.Item style={{border:'none', padding:'4px 0', textAlign:'left'}}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, textAlign:'left', width:'100%' }}>
                    <Tag color="blue" style={{borderRadius:4}}>{log.time || 'N/A'}</Tag> 
                    <Text strong style={{marginRight:8}}>{log.action || 'Unknown'}</Text>
                    <Text type="secondary">{log.correction || ''}</Text>
                  </div>
                </List.Item>
              )} 
            />
          </div>
        ));
      })()}
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
          extra={<Button size="small" onClick={() => fetchReflexJobs()}>Refresh</Button>}
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
              <ReactMarkdown 
                components={{
                  code: ({node, className, children, ...props}) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match && !className;
                    return isInline ? (
                      <code style={{background:'#f1f5f9',padding:'2px 6px',borderRadius:4,fontFamily:'"Fira Code",monospace',fontSize:12}} {...props}>{children}</code>
                    ) : (
                      <pre style={{background:'#1e293b',color:'#e2e8f0',padding:12,borderRadius:8,overflow:'auto',fontSize:12}}>
                        <code {...props}>{children}</code>
                      </pre>
                    );
                  },
                  pre: ({children}) => <>{children}</>,
                }}
              >
                {String(msg.content || '')}
              </ReactMarkdown>
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
          onChange={e => {
            setInputValue(e.target.value);
            setShowSuggestions(e.target.value.length > 0);
          }} 
          onPressEnter={sendMessage} 
          placeholder="Instruct the Brain..." 
          autoFocus 
          variant="borderless"
          prefix={<ChevronRight size={14} color="#2563eb"/>} 
          disabled={isSending} 
          style={{ padding:0, textAlign:'left' }}
        />
        {showSuggestions && cmdHistory.length > 0 && inputValue && (
          <div style={{ position:'absolute', bottom:50, left:40, background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, padding:8, boxShadow:'0 4px 12px rgba(0,0,0,0.1)', zIndex:100 }}>
            <Text type="secondary" style={{fontSize:10}}>Recent commands:</Text>
            {cmdHistory.filter(c => c.toLowerCase().includes(inputValue.toLowerCase())).slice(0,3).map((cmd, i) => (
              <div key={i} style={{ padding:'4px 8px', cursor:'pointer', borderRadius:4 }} 
                onClick={() => { setInputValue(cmd); setShowSuggestions(false); }}>
                <Text style={{fontSize:12}}>{cmd}</Text>
              </div>
            ))}
          </div>
        )}
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

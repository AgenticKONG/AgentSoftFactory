import { useCallback, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { LayoutDashboard, Activity, Terminal, RefreshCw, Layers } from 'lucide-react';
import { Select, Tag, Button, Card, Row, Col, Spin, message } from 'antd';

const CustomNode = ({ data }: { data: { label: string; icon?: string } }) => {
  return (
    <div style={{ textAlign: 'center', minWidth: 80 }}>
      <Handle type="target" position={Position.Left} />
      <div style={{ fontSize: '20px', marginBottom: '4px' }}>{data.icon}</div>
      <div style={{ fontSize: '11px', fontWeight: 500 }}>{data.label}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

const TEAM_FLOWS: Record<string, any[]> = {
  "T1": [
    { id: 'user', label: 'Mission Goal', icon: '🎯', color: '#f8fafc' },
    { id: 'pm', label: 'PM Agent', icon: '👤', color: '#fff' },
    { id: 'dev', label: 'DEV Agent', icon: '⚡', color: '#fff' },
    { id: 'end', label: 'Complete', icon: '✅', color: '#f0fdf4' }
  ],
  "T2": [
    { id: 'user', label: 'Mission Goal', icon: '🎯', color: '#f8fafc' },
    { id: 'pm', label: 'PM Agent', icon: '👤', color: '#fff' },
    { id: 'dev', label: 'DEV Agent', icon: '⚡', color: '#fff' },
    { id: 'qa', label: 'QA Agent', icon: '🔍', color: '#fff' },
    { id: 'end', label: 'Complete', icon: '✅', color: '#f0fdf4' }
  ],
  "T3": [
    { id: 'user', label: 'Mission Goal', icon: '🎯', color: '#f8fafc' },
    { id: 'pm', label: 'PM Agent', icon: '👤', color: '#fff' },
    { id: 'vd', label: 'VD Agent', icon: '🎨', color: '#fff' },
    { id: 'dev', label: 'DEV Agent', icon: '⚡', color: '#fff' },
    { id: 'qa', label: 'QA Agent', icon: '🔍', color: '#fff' },
    { id: 'end', label: 'Complete', icon: '✅', color: '#f0fdf4' }
  ],
  "T4": [
    { id: 'user', label: 'Mission Goal', icon: '🎯', color: '#f8fafc' },
    { id: 'pm', label: 'PM Agent', icon: '👤', color: '#fff' },
    { id: 'vd', label: 'VD Agent', icon: '🎨', color: '#fff' },
    { id: 'human', label: 'Human Review', icon: '👥', color: '#fef3c7' },
    { id: 'dev', label: 'DEV Agent', icon: '⚡', color: '#fff' },
    { id: 'qa', label: 'QA Agent', icon: '🔍', color: '#fff' },
    { id: 'end', label: 'Complete', icon: '✅', color: '#f0fdf4' }
  ],
  "T5": [
    { id: 'user', label: 'Mission Goal', icon: '🎯', color: '#f8fafc' },
    { id: 'ia', label: 'Infra Agent', icon: '🏗️', color: '#dbeafe' },
    { id: 'jqa', label: 'Junior QA', icon: '🔬', color: '#fff' },
    { id: 'sqa', label: 'Senior QA', icon: '🛡️', color: '#fff' },
    { id: 'end', label: 'Complete', icon: '✅', color: '#f0fdf4' }
  ]
};

const Workstation = () => {
  const [searchParams] = useSearchParams();
  const [projectData, setProjectData] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentTeam, setCurrentTeam] = useState<string>('T1');
  
  const urlProjectId = searchParams.get('project');

  const teamNodes = useMemo(() => {
    const flow = TEAM_FLOWS[currentTeam] || TEAM_FLOWS.T1;
    const xStep = 250;
    return flow.map((node, idx) => ({
      id: node.id,
      type: 'custom',
      position: { x: idx * xStep, y: 100 },
      data: { label: node.label, icon: node.icon },
      style: { 
        background: node.color, 
        border: '2px solid #cbd5e1', 
        padding: '12px 16px', 
        borderRadius: '8px',
        minWidth: '120px',
        textAlign: 'center'
      }
    }));
  }, [currentTeam]);

  const teamEdges = useMemo(() => {
    const flow = TEAM_FLOWS[currentTeam] || TEAM_FLOWS.T1;
    const edges = [];
    for (let i = 0; i < flow.length - 1; i++) {
      edges.push({
        id: `e${i}-${i+1}`,
        source: flow[i].id,
        target: flow[i+1].id,
        animated: i < flow.length - 2,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: '#64748b', strokeWidth: 2 }
      });
    }
    return edges;
  }, [currentTeam]);

  const [nodes, setNodes, onNodesChange] = useNodesState(teamNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(teamEdges);

  useEffect(() => {
    setNodes(teamNodes);
    setEdges(teamEdges);
  }, [currentTeam, teamNodes, teamEdges, setNodes, setEdges]);

  useEffect(() => {
    if (urlProjectId) {
      setSelectedProjectId(urlProjectId);
    }
    fetchProjects();
  }, [urlProjectId]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/asf/projects/list');
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (err) {
      message.error("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedProjectId) return;
    
    const loadProject = async () => {
      try {
        const res = await fetch(`/api/asf/projects/${selectedProjectId}`);
        if (res.ok) {
          const data = await res.json();
          setProjectData(data);
          const team = data.team?.structure || 'T1';
          setCurrentTeam(team);
          setLogs(prev => [`[System] Loaded project: ${selectedProjectId} (Team: ${team})`, ...prev]);
        }
      } catch (err) {
        console.error("Failed to load project", err);
      }
    };
    loadProject();
  }, [selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId) return;

    const pollEvents = async () => {
      try {
        const res = await fetch(`/api/asf/projects/${selectedProjectId}/events/take`);
        if (res.ok) {
          const events = await res.json();
          events.forEach((evt: any) => {
            try {
              const data = JSON.parse(evt.text);
              if (data.type === 'asf_event') {
                setLogs(prev => [`[${new Date().toLocaleTimeString()}] [${data.node_id}] ${data.log}`, ...prev.slice(0, 100)]);
                
                const nodeMap: Record<string, string> = {
                  'DEV': 'dev', 'IA': 'ia', 'JQA': 'jqa', 'SQA': 'sqa',
                  'junior-qa': 'jqa', 'senior-qa': 'sqa',
                  'PM': 'pm', 'VD': 'vd', 'QA': 'qa', 'Human': 'human', 'USER': 'user'
                };
                const nodeId = nodeMap[data.node_id?.toLowerCase()] || data.node_id || 'user';
                
                if (data.status === 'thinking') {
                  setNodes(nds => nds.map(n => 
                    n.id === nodeId ? { ...n, style: { ...n.style, background: '#eff6ff', border: '3px solid #3b82f6' }} : n
                  ));
                } else if (data.status === 'completed') {
                  setNodes(nds => nds.map(n => 
                    n.id === nodeId ? { ...n, style: { ...n.style, background: '#f0fdf4', border: '3px solid #22c55e' }} : n
                  ));
                } else if (data.status === 'failed') {
                  setNodes(nds => nds.map(n => 
                    n.id === nodeId ? { ...n, style: { ...n.style, background: '#fef2f2', border: '3px solid #ef4444' }} : n
                  ));
                } else if (data.status === 'error') {
                  setNodes(nds => nds.map(n => 
                    n.id === nodeId ? { ...n, style: { ...n.style, background: '#fef3c7', border: '3px solid #f59e0b' }} : n
                  ));
                }
              }
            } catch (e) {
              if (evt.text && typeof evt.text === 'string') {
                setLogs(prev => [`[Raw] ${evt.text.substring(0, 100)}`, ...prev.slice(0, 100)]);
              }
            }
          });
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    };

    const timer = setInterval(pollEvents, 2000);
    return () => clearInterval(timer);
  }, [selectedProjectId]);

  const handleProjectChange = (id: string) => {
    setSelectedProjectId(id);
    setLogs(prev => [`[System] Switched to: ${id}`, ...prev]);
  };

  if (loading && !projects.length) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Loading Workstation..." />
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <div style={{ padding: '12px 24px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LayoutDashboard size={20} color="#3b82f6" />
          <span style={{ fontWeight: 600, fontSize: '14px' }}>ASF Workstation</span>
          
          <Select
            value={selectedProjectId}
            style={{ width: 240 }}
            placeholder="Select a project..."
            onChange={handleProjectChange}
            options={projects.map(p => ({ value: p.id, label: p.name || p.id }))}
            showSearch
            size="small"
            filterOption={(input, option) => 
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
          
          {selectedProjectId && (
            <Tag color="blue" style={{ fontSize: '11px' }}>
              {currentTeam} • {projectData?.meta?.process || 'P1'}
            </Tag>
          )}
        </div>
        
        <Button icon={<RefreshCw size={14} />} onClick={fetchProjects} size="small">
          Refresh
        </Button>
      </div>
      
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <ReactFlow 
            nodes={nodes} 
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            attributionPosition="bottom-left"
          >
            <Background color="#e2e8f0" gap={20} />
            <Controls />
            <MiniMap nodeColor={() => '#64748b'} />
          </ReactFlow>
        </div>

        <div style={{ width: '380px', background: '#0f172a', color: '#e2e8f0', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #334155' }}>
          <div style={{ padding: '14px 16px', background: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #334155' }}>
            <Terminal size={18} />
            <span style={{ fontWeight: 600, fontSize: '14px' }}>Agent Activity Stream</span>
            <Tag color="green" style={{ marginLeft: 'auto' }}>Live</Tag>
          </div>
          
          <div style={{ flex: 1, padding: '12px', fontSize: '12px', fontFamily: 'monospace', overflowY: 'auto' }}>
            {logs.length === 0 ? (
              <div style={{ color: '#64748b', textAlign: 'center', paddingTop: '40px' }}>
                No events yet. Select a project to start monitoring.
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} style={{ 
                  marginBottom: '10px', 
                  paddingLeft: '10px', 
                  borderLeft: i === 0 ? '3px solid #22c55e' : '2px solid #475569',
                  opacity: i === 0 ? 1 : 0.7,
                  wordBreak: 'break-word'
                }}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workstation;

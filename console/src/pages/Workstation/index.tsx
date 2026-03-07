import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Connection
} from 'reactflow';
import 'reactflow/dist/style.css';
import { LayoutDashboard, Box, Terminal, RefreshCw } from 'lucide-react';
import { Select, Tag, Spin, message, Button } from 'antd';

const initialNodes = [
  { id: 'user', position: { x: 0, y: 100 }, data: { label: 'Mission Goal' }, style: { background: '#f8fafc', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '8px' } },
  { id: 'pm', position: { x: 250, y: 100 }, data: { label: 'PM Agent' }, style: { background: '#fff', border: '1px solid #ddd', padding: '10px', borderRadius: '8px' } },
  { id: 'dev', position: { x: 500, y: 100 }, data: { label: 'DEV Agent' }, style: { background: '#fff', border: '1px solid #ddd', padding: '10px', borderRadius: '8px' } },
  { id: 'qa', position: { x: 750, y: 100 }, data: { label: 'QA Agent' }, style: { background: '#fff', border: '1px solid #ddd', padding: '10px', borderRadius: '8px' } }
];

const initialEdges = [
  { id: 'e1-2', source: 'user', target: 'pm', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e2-3', source: 'pm', target: 'dev', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e3-4', source: 'dev', target: 'qa', animated: true, markerEnd: { type: MarkerType.ArrowClosed } }
];

const Workstation = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [logs, setLogs] = useState<string[]>(["[System] Connected to factory monitor."]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const urlProject = searchParams.get('project');
    if (urlProject) {
      setSelectedProjectId(urlProject);
    }
    fetchProjects();
  }, [searchParams]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/asf/projects/list');
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      message.error("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = (id: string) => {
    setSelectedProjectId(id);
    setLogs(prev => [`[System] Switched monitor to: ${id}`, ...prev]);
  };

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // Polling Real-time Events from Backend
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
                updateUIFromEvent(data);
              }
            } catch (e) {
              // Not an ASF event, ignore or log as raw
              setLogs(prev => [`[Raw] ${evt.text}`, ...prev.slice(0, 50)]);
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

  const updateUIFromEvent = (data: any) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${data.log}`, ...prev.slice(0, 50)]);
    setNodes(nds => nds.map(node => {
      if (node.id === data.node_id) {
        return {
          ...node,
          style: { 
            ...node.style, 
            background: data.status === 'thinking' ? '#eff6ff' : '#f0fdf4',
            border: data.status === 'thinking' ? '2px solid #3b82f6' : '2px solid #22c55e'
          }
        };
      }
      return node;
    }));
  };

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 24px', background: 'white', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <LayoutDashboard size={20} color="#3b82f6" />
          <span style={{ fontWeight: 600 }}>ASF Workstation</span>
          <Select
            value={selectedProjectId}
            style={{ width: 240 }}
            onChange={handleProjectChange}
            options={projects.map(p => ({ value: p.id, label: p.name }))}
            suffixIcon={<Box size={14} />}
          />
          {selectedProjectId && <Tag color="green">Live Monitoring: {selectedProjectId}</Tag>}
        </div>
        <Button icon={<RefreshCw size={14} />} onClick={fetchProjects}>Refresh Registry</Button>
      </div>
      
      <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
        <div style={{ flex: 1 }}>
          <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} fitView>
            <Background color="#f8fafc" gap={20} />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        <div style={{ width: '350px', background: '#0f172a', color: '#e2e8f0', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #334155' }}>
          <div style={{ padding: '12px 16px', background: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={16} />
            <span style={{ fontWeight: 500, fontSize: '13px' }}>Agent Activity Stream</span>
          </div>
          <div style={{ flex: 1, padding: '12px', fontSize: '12px', fontFamily: 'monospace', overflowY: 'auto' }}>
            {logs.map((log, i) => (
              <div key={i} style={{ marginBottom: '8px', borderLeft: '2px solid #3b82f6', paddingLeft: '8px', opacity: i === 0 ? 1 : 0.7 }}>
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workstation;

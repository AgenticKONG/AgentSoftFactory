import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, List, Select, message, Spin, Space, Divider, Typography, Input, Row, Col, Modal, Tooltip, Alert, Form, InputNumber, Empty } from 'antd';
import { Users, Shield, Zap, Rocket, Save, ChevronLeft, Trash2, Settings2, Activity, CheckCircle2, AlertTriangle, ExternalLink, Cpu } from 'lucide-react';

const { Title, Text } = Typography;
const { TextArea } = Input;

const TEAM_DEFS: Record<string, any[]> = {
  "T1": [{ role: "PM" }, { role: "DEV" }],
  "T2": [{ role: "PM" }, { role: "DEV" }, { role: "QA" }],
  "T3": [{ role: "PM" }, { role: "VD" }, { role: "DEV" }, { role: "QA" }],
  "T4": [{ role: "PM" }, { role: "VD" }, { role: "DEV" }, { role: "QA" }, { role: "Infra" }],
  "T5": [{ role: "DEV", id: "infra-agent", name: "Infra Agent (Me)" }, { role: "Junior-QA", id: "llama3.2" }, { role: "Senior-QA", id: "glm-4.7" }]
};

const LEGACY_MAP: Record<string, string> = { "standard-v1": "T2", "viz-d3-v1": "T3" };

const ProjectDashboard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [launching, setLaunching] = useState(false);
  
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [cloneForm] = Form.useForm();

  const normalizeData = useCallback((data: any) => {
    if (!data) return null;
    const structure = data.team?.structure || LEGACY_MAP[data.team?.template] || "T1";
    const agents = Array.isArray(data.team?.agents) ? data.team.agents : [];
    const validStructure = TEAM_DEFS[structure] ? structure : "T1";
    const requiredRoles = TEAM_DEFS[validStructure].map(r => r.role.toUpperCase());
    const currentRoles = agents.map((a: any) => (a?.role || '').toUpperCase());
    const finalizedAgents = [...agents];
    requiredRoles.forEach(role => { if (!currentRoles.includes(role)) finalizedAgents.push({ role }); });
    return { ...data, meta: data.meta || { level: 'L1', category: 'CLI', process: 'P1' }, team: { ...data.team, structure: validStructure, agents: finalizedAgents } };
  }, []);

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/asf/projects/${projectId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const normalized = normalizeData(data);
      if (normalized) { setProject(normalized); setIsDirty(false); }
    } catch (err) { message.error("Matrix Unreachable."); }
  }, [projectId, normalizeData]);

  const fetchSupportData = useCallback(async () => {
    try {
      const [a, m] = await Promise.all([fetch('/api/asf/market/list'), fetch('/api/asf/models/list')]);
      if (a.ok) setAvailableAgents(await a.json());
      if (m.ok) setAvailableModels(await m.json());
    } catch (err) {}
  }, []);

  useEffect(() => {
    const init = async () => { setLoading(true); await Promise.all([loadProject(), fetchSupportData()]); setLoading(false); };
    init();
  }, [loadProject, fetchSupportData]);

  const updateState = (updater: (prev: any) => any) => {
    setProject((prev: any) => { if (!prev) return prev; const next = updater(prev); setIsDirty(true); return next; });
  };

  const handleSaveAll = async () => {
    if (!project) return false;
    setSaving(true);
    const payload = {
      team_structure: project.team.structure,
      process: project.meta.process || 'P1',
      level: project.meta.level,
      category: project.meta.category,
      mission_command: project.meta.mission_command,
      max_loops: project.meta.max_loops || 10,
      max_sqa_loops: project.meta.max_sqa_loops || 3,
      agents: project.team.agents.map((a: any) => ({ ...a, id: a.id || null, name: a.name || null }))
    };
    try {
      const res = await fetch(`/api/asf/projects/${projectId}/update`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) { message.success("Manifest Synced."); setIsDirty(false); return true; }
    } catch (err) { message.error("Sync failure."); } finally { setSaving(false); }
    return false;
  };

  const handleLaunch = async () => {
    if (!project?.meta?.mission_command?.trim()) return message.warning("Mission Required.");
    setLaunching(true);
    try {
      // Bob's feedback: Ensure forced save before launch
      const saved = await handleSaveAll();
      if (!saved) throw new Error("Pre-launch save failed");
      
      const res = await fetch(`/api/asf/projects/${projectId}/launch`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mission_briefing: project.meta.mission_command })
      });
      if (res.ok) { message.success("Active!"); navigate(`/workstation?project=${projectId}`); }
    } catch (err) { message.error("Launch Error."); } finally { setLaunching(false); }
  };

  if (loading || !project) return <div style={{ padding: 100, textAlign: 'center' }}><Spin size="large" /></div>;

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Button icon={<ChevronLeft size={16}/>} onClick={() => navigate('/projects')}>Back</Button>
        <Space>
          {isDirty ? <Tag color="orange" icon={<Activity size={12}/>}>Local Changes</Tag> : <Tag color="success" icon={<CheckCircle2 size={12}/>}>Synced</Tag>}
          <Button type="primary" icon={<Save size={16}/>} onClick={handleSaveAll} loading={saving} disabled={!isDirty}>Commit Config</Button>
        </Space>
      </div>

      <Row gutter={24}>
        <Col span={16}>
          <Card title={<span><Users size={18} style={{marginRight:8}}/> Team Mission Roster</span>} extra={<Tag color="purple">{project.team.structure}</Tag>}>
            <div style={{ marginBottom: 20, padding: 16, background: '#f1f5f9', borderRadius: 12 }}>
              <Row gutter={24}>
                <Col span={6}><Text strong style={{fontSize:10}}>TEAM (T)</Text><br/>
                  <Select value={project.team.structure} style={{width:'100%'}} onChange={v => {
                    const processId = v.replace('T', 'P');
                    Modal.confirm({ 
                      onOk: () => updateState(p => ({...p, team: {...p.team, structure:v, agents: JSON.parse(JSON.stringify(TEAM_DEFS[v]))}, meta: {...p.meta, process: processId}}))
                    })}}
                    options={Object.keys(TEAM_DEFS).map(k => ({value:k, label:k}))} />
                </Col>
                <Col span={6}><Text strong style={{fontSize:10}}>PROCESS (P)</Text><br/>
                  <Select value={project.meta.process} style={{width:'100%'}} onChange={v => {
                    const teamId = v.replace('P', 'T');
                    updateState(p => ({...p, meta: {...p.meta, process: v}, team: {...p.team, structure: TEAM_DEFS[teamId] ? teamId : p.team.structure}}));
                  }}
                    options={[{value:'P1',label:'P1: Linear'},{value:'P2',label:'P2: Agile'},{value:'P3',label:'P3: Visual'},{value:'P4',label:'P4: Review'},{value:'P5',label:'P5: Infra-Audit'}]} />
                </Col>
                <Col span={6}><Text strong style={{fontSize:10}}>JQA LIMIT</Text><br/>
                  <InputNumber min={1} value={project.meta.max_loops || 10} onChange={v => updateState(p => ({...p, meta: {...p.meta, max_loops: v}}))} />
                </Col>
                <Col span={6}><Text strong style={{fontSize:10}}>SQA LIMIT</Text><br/>
                  <InputNumber min={1} value={project.meta.max_sqa_loops || 3} onChange={v => updateState(p => ({...p, meta: {...p.meta, max_sqa_loops: v}}))} />
                </Col>
              </Row>
            </div>
            <List dataSource={project.team.agents || []} renderItem={(agent: any, idx: number) => (
              <Card size="small" style={{ marginBottom: 12, borderLeft: agent.id === 'infra-agent' ? '5px solid #2563eb' : '5px solid #cbd5e1' }}>
                <Row align="middle">
                  <Col span={4} style={{ textAlign: 'center' }}>
                    {agent.id === 'infra-agent' ? <Cpu size={24} color="#2563eb"/> : <Zap size={20} />}<br/><Text strong style={{fontSize:11}}>{agent.role}</Text>
                  </Col>
                  <Col span={20}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      {agent.id ? <Space><Title level={5} style={{ margin: 0 }}>{agent.name}</Title><Tag color="cyan">Clone</Tag></Space> : <Text type="secondary"><i>Vacant</i></Text>}
                      <Space>
                        {agent.id && <><Button type="text" size="small" icon={<Settings2 size={14}/>} onClick={() => { setEditingIndex(idx); cloneForm.setFieldsValue(agent); setIsCloneModalOpen(true); }}>Modify</Button>
                          {agent.id !== 'infra-agent' && <Button type="text" danger icon={<Trash2 size={14}/>} onClick={() => updateState(p => { const a = [...p.team.agents]; a[idx] = { role: a[idx].role }; return { ...p, team: { ...p.team, agents: a } }; })} />}</>
                        }
                      </Space>
                    </div>
                    {!agent.id && <Select placeholder="Assign Soul" style={{ width: '100%', marginTop: 8 }} onChange={async (v) => {
                      const r = await fetch(`/api/asf/market/agent/${v}`); const s = await r.json();
                      updateState(p => { const a = [...p.team.agents]; a[idx] = { ...a[idx], id: s.id, name: s.name, model: s.capabilities?.models?.[0], dna_prompt: s.dna_prompt }; return { ...p, team: { ...p.team, agents: a } }; });
                    }} options={availableAgents.map(a => ({ value: a.id, label: a.name }))} />}
                  </Col>
                </Row>
              </Card>
            )} />
          </Card>
          <Card title="Mission Command Briefing" style={{marginTop: 24, borderRadius: 16}}>
            <TextArea rows={5} value={project.meta?.mission_command || ''} onChange={e => updateState(p => ({...p, meta: {...p.meta, mission_command: e.target.value}}))} />
            <Button type="primary" size="large" block style={{ marginTop: 20, height: 55, background: '#10b981', borderRadius: 12 }} icon={<Rocket size={22}/>} onClick={handleLaunch} loading={launching}>LAUNCH PRODUCTION</Button>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Infrastructure Matrix" style={{ borderRadius: 16 }}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="ID"><code>{projectId}</code></Descriptions.Item>
              <Descriptions.Item label="Category">
                <Select 
                  value={project.meta?.category} 
                  size="small" 
                  style={{width:'100%'}} 
                  onChange={async v => {
                    const level = project.meta?.level || 'L1';
                    try {
                      const res = await fetch(`/api/asf/pc/defaults?category=${v}&level=${level}`);
                      const defaults = await res.json();
                      updateState(p => ({
                        ...p, 
                        meta: {...p.meta, category: v, level: defaults.level || level},
                        team: {...p.team, structure: defaults.team, agents: JSON.parse(JSON.stringify(TEAM_DEFS[defaults.team] || TEAM_DEFS.T1))}
                      }));
                    } catch {
                      updateState(p => ({...p, meta: {...p.meta, category: v}}));
                    }
                  }} 
                  options={['DATA','BACK','FRONT','VIZ','NARR','INFRA'].map(c => ({value:c, label:c}))} 
                />
              </Descriptions.Item>
              <Descriptions.Item label="Level">
                <Select 
                  value={project.meta?.level || 'L1'} 
                  size="small" 
                  style={{width:'100%'}} 
                  onChange={async v => {
                    const category = project.meta?.category || 'FRONT';
                    try {
                      const res = await fetch(`/api/asf/pc/defaults?category=${category}&level=${v}`);
                      const defaults = await res.json();
                      updateState(p => ({
                        ...p, 
                        meta: {...p.meta, level: v},
                        team: {...p.team, structure: defaults.team}
                      }));
                    } catch {
                      updateState(p => ({...p, meta: {...p.meta, level: v}}));
                    }
                  }} 
                  options={['L1','L2','L3','L4','L5'].map(l => ({value:l, label:l}))} 
                />
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
      <Modal title="Specialized Clone Config" open={isCloneModalOpen} onCancel={() => setIsCloneModalOpen(false)} onOk={() => {
        const v = cloneForm.getFieldsValue();
        updateState(p => { const a = [...p.team.agents]; a[editingIndex!] = { ...a[editingIndex!], ...v }; return { ...p, team: { ...p.team, agents: a } }; });
        setIsCloneModalOpen(false);
      }}>
        <Form form={cloneForm} layout="vertical">
          <Form.Item name="model" label="Model Override"><Select options={availableModels.map(m => ({value: m.id, label: m.name}))} /></Form.Item>
          <Form.Item name="dna_prompt" label="Local DNA Overwrite"><TextArea rows={8} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectDashboard;

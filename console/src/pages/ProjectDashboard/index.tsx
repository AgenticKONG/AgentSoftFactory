import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, List, Select, message, Spin, Space, Divider, Typography, Input, Row, Col, Modal, Tooltip, Alert, Form, InputNumber, Empty, Dropdown } from 'antd';
import { Users, Shield, Zap, Rocket, Save, ChevronLeft, Trash2, Settings2, Activity, CheckCircle2, AlertTriangle, ExternalLink, Cpu, Archive } from 'lucide-react';

const { Title, Text } = Typography;
const { TextArea } = Input;

const LEGACY_MAP: Record<string, string> = { "standard-v1": "T2", "viz-d3-v1": "T3" };

const ProjectDashboard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [rules, setRules] = useState<any>(null);
  
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [cloneForm] = Form.useForm();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [archiveReason, setArchiveReason] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

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
      const [a, m, r] = await Promise.all([
        fetch('/api/asf/market/list'), 
        fetch('/api/asf/models/list'),
        fetch('/api/asf/pc/rules')
      ]);
      if (a.ok) setAvailableAgents(await a.json());
      if (m.ok) setAvailableModels(await m.json());
      if (r.ok) setRules(await r.json());
    } catch (err) {}
  }, []);

  const TEAM_DEFS = useMemo(() => {
    if (!rules || !rules.teams) {
      return {
        "T1": [{ role: "PM" }, { role: "DEV" }],
        "T2": [{ role: "PM" }, { role: "DEV" }, { role: "QA" }],
        "T3": [{ role: "PM" }, { role: "VD" }, { role: "DEV" }, { role: "QA" }],
        "T4": [{ role: "PM" }, { role: "VD" }, { role: "DEV" }, { role: "QA" }, { role: "Infra" }],
        "T5": [{ role: "DEV", id: "infra-agent", name: "Infra Agent (Me)" }, { role: "Junior-QA", id: "llama3.2" }, { role: "Senior-QA", id: "glm-4.7" }]
      };
    }
    return rules.teams;
  }, [rules]);

  const teamOptions = useMemo(() => {
    if (!rules || !rules.teams) return [];
    return Object.keys(rules.teams).map(t => ({ value: t, label: t }));
  }, [rules]);

  const processOptions = useMemo(() => {
    if (!rules || !rules.processes) return [];
    return Object.keys(rules.processes).map(p => ({ value: p, label: `${p}: ${rules.processes[p].name}` }));
  }, [rules]);

  const categoryOptions = useMemo(() => {
    if (!rules || !rules.categories) return ['FRONT', 'BACK', 'DATA', 'VIZ', 'NARR', 'INFRA'];
    return Object.keys(rules.categories).map(c => ({ value: c, label: c }));
  }, [rules]);

  const levelOptions = useMemo(() => {
    if (!rules || !rules.levels) return [];
    const category = project?.meta?.category;
    let minRank = 1;
    if (category === 'INFRA') {
      minRank = 3;
    } else if (category === 'BACK' || category === 'VIZ') {
      minRank = 2;
    }
    return Object.keys(rules.levels)
      .filter(l => (rules.levels[l].rank || 0) >= minRank)
      .map(l => ({ value: l, label: l }));
  }, [rules, project?.meta?.category]);

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

  const handleDelete = async () => {
    if (deleteConfirmName !== projectId) {
      message.error("项目名称不匹配，删除已取消");
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/asf/projects/${projectId}`, { method: 'DELETE' });
      if (res.ok) {
        message.success("项目已删除");
        navigate('/projects');
      } else {
        const err = await res.json();
        message.error(err.detail || "删除失败");
      }
    } catch (err) {
      message.error("删除请求失败");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setDeleteConfirmName('');
    }
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      const res = await fetch(`/api/asf/projects/${projectId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: archiveReason })
      });
      if (res.ok) {
        message.success("项目已归档");
        navigate('/projects');
      } else {
        const err = await res.json();
        message.error(err.detail || "归档失败");
      }
    } catch (err) {
      message.error("归档请求失败");
    } finally {
      setIsArchiving(false);
      setIsArchiveModalOpen(false);
      setArchiveReason(null);
    }
  };

  if (loading || !project) return <div style={{ padding: 100, textAlign: 'center' }}><Spin size="large" /></div>;

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Button icon={<ChevronLeft size={16}/>} onClick={() => navigate('/projects')}>Back</Button>
        <Space>
          {isDirty ? <Tag color="orange" icon={<Activity size={12}/>}>Local Changes</Tag> : <Tag color="success" icon={<CheckCircle2 size={12}/>}>Synced</Tag>}
          <Button type="primary" icon={<Save size={16}/>} onClick={handleSaveAll} loading={saving} disabled={!isDirty}>Commit Config</Button>
          <Button type="default" icon={<Archive size={16}/>} onClick={() => setIsArchiveModalOpen(true)}>Archive</Button>
          <Dropdown menu={{
            items: [
              { key: 'delete', label: 'Permanent Delete', icon: <Trash2 size={14}/>, danger: true, onClick: () => setIsDeleteModalOpen(true) }
            ]
          }} trigger={['click']}>
            <Button type="text" danger icon={<Trash2 size={16}/>} style={{ marginLeft: '8px' }} />
          </Dropdown>
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
                    options={teamOptions.map(k => ({value:k.value, label:k.label}))} />
                </Col>
                <Col span={6}><Text strong style={{fontSize:10}}>PROCESS (P)</Text><br/>
                  <Select value={project.meta.process} style={{width:'100%'}} onChange={v => {
                    const teamId = v.replace('P', 'T');
                    updateState(p => ({...p, meta: {...p.meta, process: v}, team: {...p.team, structure: TEAM_DEFS[teamId] ? teamId : p.team.structure}}));
                  }}
                    options={processOptions.map(p => ({value:p.value, label:p.label}))} />
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
                  options={categoryOptions.map(c => ({value:c.value, label:c.label}))} 
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
                  options={levelOptions.map(l => ({value:l.value, label:l.label}))} 
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

      <Modal
        title={<span style={{ color: '#ef4444' }}><AlertTriangle size={20} style={{ marginRight: 8 }} />危险操作确认</span>}
        open={isDeleteModalOpen}
        onCancel={() => { setIsDeleteModalOpen(false); setDeleteConfirmName(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setIsDeleteModalOpen(false); setDeleteConfirmName(''); }}>
            取消
          </Button>,
          <Button
            key="delete"
            danger
            type="primary"
            loading={isDeleting}
            disabled={deleteConfirmName !== projectId}
            onClick={handleDelete}
          >
            确认删除
          </Button>
        ]}
      >
        <Alert
          type="error"
          showIcon
          icon={<AlertTriangle size={16} />}
          message="此操作不可恢复"
          description="删除项目将永久移除所有相关数据，包括项目文件、历史记录和配置。"
          style={{ marginBottom: 16 }}
        />
        <div style={{ marginTop: 16 }}>
          <Text strong>请输入项目名称 "<code>{projectId}</code>" 以确认删除：</Text>
          <Input
            style={{ marginTop: 8 }}
            placeholder={`输入 "${projectId}" 确认`}
            value={deleteConfirmName}
            onChange={e => setDeleteConfirmName(e.target.value)}
          />
        </div>
      </Modal>

      <Modal
        title={<span style={{ color: '#f59e0b' }}><Archive size={20} style={{ marginRight: 8 }} />归档项目</span>}
        open={isArchiveModalOpen}
        onCancel={() => { setIsArchiveModalOpen(false); setArchiveReason(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setIsArchiveModalOpen(false); setArchiveReason(null); }}>
            取消
          </Button>,
          <Button
            key="archive"
            type="primary"
            loading={isArchiving}
            onClick={handleArchive}
          >
            确认归档
          </Button>
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <Text>归档项目 "<strong>{projectId}</strong>" 后，它将从项目列表中隐藏，但可以随时恢复。</Text>
        </div>
        <Form layout="vertical">
          <Form.Item label="归档原因（可选）">
            <Select
              placeholder="选择归档原因"
              value={archiveReason}
              onChange={setArchiveReason}
              allowClear
              options={[
                { value: 'completed', label: '已完成' },
                { value: 'paused', label: '暂停/搁置' },
                { value: 'merged', label: '已合并到其他项目' },
                { value: 'other', label: '其他' }
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectDashboard;

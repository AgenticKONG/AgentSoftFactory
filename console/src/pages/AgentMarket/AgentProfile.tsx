import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography, Tag, List, Divider, Spin, Button, message, Space, Avatar, Descriptions, Modal, Form, Input, Select } from 'antd';
import { ChevronLeft, Zap, Shield, BookOpen, Activity, Target, Sparkles, Edit3 } from 'lucide-react';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const AgentProfile = () => {
  const { agentId } = useParams();
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [availableSkills, setAvailableSkills] = useState<any[]>([]);
  const [availableMCPs, setAvailableMCPs] = useState<any[]>([]);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAgent();
  }, [agentId]);

  const fetchAgent = async () => {
    try {
      const res = await fetch(`/api/asf/market/agent/${agentId}`);
      if (!res.ok) throw new Error("Agent not found");
      const data = await res.json();
      setAgent(data);
      form.setFieldsValue({
        specialty: data.specialty || [],
        identity: data.identity,
        dna_prompt: data.dna_prompt,
        model: data.capabilities?.models?.[0] || 'llama3.2',
        skills: data.capabilities?.skills || [],
        mcp: data.capabilities?.mcp || [],
      });
    } catch (err) {
      console.error("Error fetching agent profile:", err);
      message.error("Failed to load Agent Profile.");
      navigate('/agent-market');
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [modelsRes, skillsRes, mcpRes] = await Promise.all([
        fetch('/api/asf/models/list'),
        fetch('/api/skills'),
        fetch('/api/mcp')
      ]);
      
      if (modelsRes.ok) setAvailableModels(await modelsRes.json());
      if (skillsRes.ok) {
        const allSkills = await skillsRes.json();
        // Only allow selecting 'customized' skills. 'builtin' are considered essential.
        setAvailableSkills(allSkills.filter((s: any) => s.source === 'customized'));
      }
      if (mcpRes.ok) setAvailableMCPs(await mcpRes.json());
    } catch (err) {
      console.error("Error fetching options:", err);
    }
  };

  const handleEditClick = () => {
    fetchOptions();
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      
      // Robust merge of capabilities
      const currentCaps = agent.capabilities || {};
      const newCapabilities = {
        ...currentCaps,
        models: [values.model],
        skills: values.skills || [],
        mcp: values.mcp || []
      };

      const payload = {
        specialty: values.specialty || [],
        identity: values.identity,
        dna_prompt: values.dna_prompt,
        capabilities: newCapabilities
      };

      const res = await fetch(`/api/asf/market/soul/update/${agentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Update failed");
      }
      
      message.success("Agent Soul updated successfully.");
      setIsEditModalOpen(false);
      fetchAgent();
    } catch (err: any) {
      console.error("Update Error:", err);
      message.error(err.message || "Failed to update Agent Soul.");
    }
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}><Spin size="large" tip="Recalling Soul..." /></div>;
  if (!agent) return <div style={{ padding: '100px', textAlign: 'center' }}><Text type="secondary">The soul of {agentId} has not been recorded yet.</Text></div>;

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <Button type="link" icon={<ChevronLeft size={16} />} onClick={() => navigate('/agent-market')}>Back to Market</Button>
        <Button type="primary" icon={<Edit3 size={16} style={{marginRight: 8}}/>} onClick={handleEditClick}>Edit Soul</Button>
      </div>

      <Row gutter={24}>
        <Col span={8}>
          <Card style={{ borderRadius: '16px', textAlign: 'center', padding: '20px' }}>
            <Avatar size={120} src={`https://api.dicebear.com/7.x/bottts/svg?seed=${agent.id}`} style={{ marginBottom: '20px' }} />
            <Title level={3}>{agent.name}</Title>
            <Tag color="blue" style={{marginBottom: 12}}>{agent.role}</Tag>
            <div style={{ marginBottom: '16px' }}>
               {(agent.specialty || []).map((s: string) => <Tag key={s} style={{borderRadius: 4}}>{s}</Tag>)}
            </div>
            <Divider />
            <div style={{ textAlign: 'left' }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Success Rate"><Text strong type="success">{(agent.stats?.avg_success_rate * 100).toFixed(1)}%</Text></Descriptions.Item>
                <Descriptions.Item label="Projects">{agent.stats?.projects_completed}</Descriptions.Item>
                <Descriptions.Item label="Efficiency">{agent.stats?.token_efficiency}</Descriptions.Item>
                <Descriptions.Item label="Model"><Tag color="orange">{agent.capabilities?.models?.[0] || 'N/A'}</Tag></Descriptions.Item>
              </Descriptions>
            </div>
          </Card>
        </Col>

        <Col span={16}>
          <Card title={<span><Shield size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Sovereign Identity</span>} style={{ borderRadius: '16px', marginBottom: '24px' }}>
            <Paragraph style={{ fontSize: '16px', lineHeight: 1.8 }}>{agent.identity}</Paragraph>
          </Card>

          <Card title={<span><Zap size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> DNA Prompt (System Logic)</span>} style={{ borderRadius: '16px', marginBottom: '24px' }}>
            <div style={{ background: '#f1f5f9', padding: '16px', borderRadius: '8px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
              {agent.dna_prompt}
            </div>
          </Card>

          <Row gutter={16}>
            <Col span={12}>
              <Card title={<span><Target size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Capabilities</span>} style={{ borderRadius: '16px' }}>
                <Text strong>Technical Skills:</Text>
                <div style={{ marginTop: '8px', marginBottom: '16px' }}>
                  {agent.capabilities?.skills?.length > 0 ? 
                    agent.capabilities.skills.map((s: string) => <Tag key={s} color="purple">{s}</Tag>) :
                    <Text type="secondary" size="small">None</Text>
                  }
                </div>
                <Text strong>MCP Tools:</Text>
                <div style={{ marginTop: '8px', marginBottom: '16px' }}>
                  {agent.capabilities?.mcp?.length > 0 ? 
                    agent.capabilities.mcp.map((m: string) => <Tag key={m} color="cyan">{m}</Tag>) :
                    <Text type="secondary" size="small">None</Text>
                  }
                </div>
                <Text strong>Languages:</Text>
                <div style={{ marginTop: '8px' }}>
                  {agent.capabilities?.languages?.map((l: string) => <Tag key={l}>{l}</Tag>)}
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card title={<span><BookOpen size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Hard Memories</span>} style={{ borderRadius: '16px' }}>
                <List
                  dataSource={agent.memories || []}
                  renderItem={(m: string) => (
                    <List.Item style={{ padding: '8px 0', border: 'none' }}>
                      <Text><Sparkles size={12} color="#3b82f6" style={{ marginRight: '8px' }} /> {m}</Text>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      <Modal
        title={<span><Edit3 size={18} style={{marginRight: 8}}/> Configure Agent Soul</span>}
        open={isEditModalOpen}
        onOk={handleUpdate}
        onCancel={() => setIsEditModalOpen(false)}
        width={800}
        okText="Update Soul"
      >
        <Form form={form} layout="vertical" style={{marginTop: 20}}>
          <Form.Item name="specialty" label="Expertise Specialties (Market Tags)">
            <Select mode="tags" placeholder="Add specialty tags (e.g. D3.js, React)..." style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="identity" label="Sovereign Identity" rules={[{required: true}]}>
            <TextArea rows={3} placeholder="Describe the agent's core identity..." />
          </Form.Item>
          
          <Form.Item name="dna_prompt" label="DNA Prompt (System Logic)" rules={[{required: true}]}>
            <TextArea rows={6} placeholder="The core system prompt that defines behavior..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="model" label="Primary Model">
                <Select placeholder="Select LLM">
                  {availableModels.map(m => <Select.Option key={m.id} value={m.id}>{m.name}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="skills" label="Skills Set">
                <Select mode="multiple" placeholder="Select Skills">
                  {availableSkills.map(s => <Select.Option key={s.name} value={s.name}>{s.name}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="mcp" label="MCP Tools">
                <Select mode="multiple" placeholder="Select MCPs">
                  {availableMCPs.map(m => <Select.Option key={m.name} value={m.name}>{m.name}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default AgentProfile;

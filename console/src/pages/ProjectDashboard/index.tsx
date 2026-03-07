import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, List, Select, message, Spin, Space, Divider, Typography, Input, Row, Col } from 'antd';
import { Users, Shield, Zap, Rocket, Save, ChevronLeft, Send } from 'lucide-react';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ProjectDashboard = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [missionDescription, setMissionDescription] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (projectId) fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/asf/projects/${projectId}`);
      const data = await res.json();
      setProject(data);
    } catch (err) {
      message.error("Failed to load project details.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/asf/projects/${projectId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agents: project.team.agents }),
      });
      if (res.ok) message.success("Team configuration saved!");
    } catch (err) {
      message.error("Failed to save configuration.");
    }
  };

  const handleLaunch = async () => {
    if (!missionDescription.trim()) {
      message.warning("Please enter a Mission Briefing before launching.");
      return;
    }
    setLaunching(true);
    try {
      const response = await fetch(`/api/asf/projects/${projectId}/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mission_briefing: missionDescription }),
      });
      
      if (response.ok) {
        message.success("Factory Loop Started!");
        navigate(`/workstation?project=${projectId}`);
      } else {
        message.error("Failed to launch factory.");
      }
    } catch (err) {
      message.error("Launch failed due to network error.");
    } finally {
      setLaunching(false);
    }
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}><Spin size="large" /></div>;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <Button type="link" icon={<ChevronLeft size={16} />} onClick={() => navigate('/projects')}>Back to Projects</Button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>{project.meta.name}</Title>
          <Text type="secondary">ID: {project.project_id} | Status: <Tag color="orange">Awaiting Launch</Tag></Text>
        </div>
        <Space>
          <Button icon={<Save size={16} />} onClick={handleSave}>Save Configuration</Button>
        </Space>
      </div>

      <Row gutter={24}>
        <Col span={16}>
          <Card title={<span><Users size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Team 整备室</span>} style={{ marginBottom: '24px' }}>
            <List
              dataSource={project.team.agents}
              renderItem={(agent: any, index: number) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<div style={{ width: '40px', height: '40px', background: '#f0f7ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap size={20} color="#3b82f6" /></div>}
                    title={<strong>{agent.role}</strong>}
                    description={
                      <Space>
                        <span>Model: 
                          <Select size="small" value={agent.model || 'llama3.2'} style={{ width: 120, marginLeft: '8px' }} 
                            onChange={(val) => {
                              const newAgents = [...project.team.agents];
                              newAgents[index].model = val;
                              setProject({...project, team: { ...project.team, agents: newAgents }});
                            }}
                            options={[{value: 'llama3.2', label: 'Llama 3.2'}, {value: 'deepseek-coder', label: 'DeepSeek'}]} 
                          />
                        </span>
                        <Divider type="vertical" />
                        <span>Skills: {agent.skills?.length || 0} mounted</span>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          <Card title={<span><Send size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Mission Command (任务简报)</span>}>
            <TextArea 
              rows={4} 
              placeholder="Enter your specific project requirements here..." 
              value={missionDescription}
              onChange={(e) => setMissionDescription(e.target.value)}
              style={{ marginBottom: '20px', borderRadius: '8px' }}
            />
            <Button 
              type="primary" 
              size="large" 
              icon={<Rocket size={18} />} 
              block 
              loading={launching}
              onClick={handleLaunch}
              style={{ height: '54px', background: '#10b981', borderColor: '#10b981' }}
            >
              LAUNCH AGENT FACTORY
            </Button>
          </Card>
        </Col>

        <Col span={8}>
          <Card title={<span><Shield size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Infrastructure Binding</span>}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Host Root"><code>/AgentSoftFactory</code></Descriptions.Item>
              <Descriptions.Item label="Data Persistence">Enabled</Descriptions.Item>
              <Descriptions.Item label="Sandbox">Host-Level</Descriptions.Item>
            </Descriptions>
            <Divider />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              The Infra Agent will audit all generated shell commands and file modifications within the workspace.
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProjectDashboard;

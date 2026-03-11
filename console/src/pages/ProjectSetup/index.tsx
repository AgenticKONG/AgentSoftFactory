import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Card, message, Typography, Row, Col } from 'antd';
import { useNavigate } from 'react-router-dom';
import { FolderPlus } from 'lucide-react';

const { Title, Paragraph } = Typography;

const ProjectSetup = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/asf/pc/rules');
      const data = await res.json();
      if (data && data.categories && data.levels) {
        setRules(data);
        // Sync initial defaults
        const currentCat = form.getFieldValue('category') || 'FRONT';
        const currentLevel = form.getFieldValue('level') || 'L1';
        handleLCOnChange(currentCat, currentLevel);
      }
    } catch (err) {
      console.error("Failed to load PC rules", err);
    }
  };

  const handleLCOnChange = async (category: string, level: string) => {
    if (category && level) {
      try {
        const res = await fetch(`/api/asf/pc/defaults?category=${category}&level=${level}`);
        const defaults = await res.json();
        if (defaults && defaults.team) {
          form.setFieldsValue({
            team_structure: defaults.team,
            process: defaults.process,
            max_loops: defaults.max_loops
          });
        }
      } catch (err) {
        console.error("Failed to fetch defaults", err);
      }
    }
  };

  const handleTChange = (teamId: string) => {
    if (teamId && typeof teamId === 'string') {
      const processId = teamId.replace('T', 'P'); 
      form.setFieldsValue({ process: processId });
    }
  };

  const handlePChange = (processId: string) => {
    if (processId && typeof processId === 'string') {
      const teamId = processId.replace('P', 'T');
      form.setFieldsValue({ team_structure: teamId });
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    const payload = {
      id: values.project_id,
      name: values.name,
      description: values.description,
      specs: {
        category: values.category,
        level: values.level,
        team: values.team_structure,
        process: values.process
      }
    };

    try {
      const response = await fetch('/api/asf/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        message.success('Project initialized successfully!');
        navigate(`/projects/${values.project_id}`);
      } else {
        const errData = await response.json();
        message.error(errData.detail || 'Failed to initialize project.');
      }
    } catch (error) {
      message.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <FolderPlus size={32} color="#3b82f6" />
          <Title level={2} style={{ margin: 0 }}>Create New ASF Project</Title>
        </div>
        
        <Paragraph style={{ color: '#666', marginBottom: '30px' }}>
          Initialize a specialized Multi-Agent team and governance process based on L-C-T-P-F framework.
        </Paragraph>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ level: 'L1', category: 'FRONT' }}
          onValuesChange={(changedValues, allValues) => {
            if (changedValues.category || changedValues.level) {
              handleLCOnChange(allValues.category, allValues.level);
            }
            if (changedValues.team_structure) {
              handleTChange(changedValues.team_structure);
            }
            if (changedValues.process) {
              handlePChange(changedValues.process);
            }
          }}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Project ID (Slug)"
                name="project_id"
                rules={[{ required: true, message: 'Please enter a unique project ID!' }]}
              >
                <Input placeholder="e.g. 002-life-river-plus" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Display Name"
                name="name"
                rules={[{ required: true, message: 'Please enter a display name!' }]}
              >
                <Input placeholder="e.g. Life River Component PLUS" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} placeholder="Describe the goal of this project..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Category (业务领域)" name="category" rules={[{ required: true }]}>
                <Select placeholder="Select category">
                  {rules && rules.categories ? Object.keys(rules.categories).map(c => (
                    <Select.Option key={c} value={c}>{c} ({rules.categories[c].id})</Select.Option>
                  )) : (
                    <Select.Option value="FRONT">FRONT (C1)</Select.Option>
                  )}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Level (演进等级)" name="level" rules={[{ required: true }]}>
                <Select placeholder="Select level">
                  {rules && rules.levels ? Object.keys(rules.levels).map(l => {
                    const levelInfo = rules.levels[l];
                    const rank = levelInfo ? levelInfo.rank : 0;
                    const desc = l === 'L5' ? 'Architecture Core' : (rank >= 3 ? 'System Page' : 'Functional Unit');
                    return <Select.Option key={l} value={l}>{l}: {desc}</Select.Option>;
                  }) : (
                    <Select.Option value="L1">L1: Functional Unit</Select.Option>
                  )}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Team (T-Selection)" name="team_structure" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="T1">T1: Duo (PM + DEV)</Select.Option>
                  <Select.Option value="T2">T2: Trio (PM + DEV + QA)</Select.Option>
                  <Select.Option value="T3">T3: Quad (PM + VD + DEV + QA)</Select.Option>
                  <Select.Option value="T4">T4: Elite (PM + VD + DEV + QA + HUMAN)</Select.Option>
                  <Select.Option value="T5">T5: INFRA Elite (IA + JQA + SQA)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Process (P-Ordering)" name="process" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="P1">P1: Direct</Select.Option>
                  <Select.Option value="P2">P2: Verified</Select.Option>
                  <Select.Option value="P3">P3: Visual</Select.Option>
                  <Select.Option value="P4">P4: Review</Select.Option>
                  <Select.Option value="P5">P5: INFRA</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: '20px' }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              size="large" 
              block
              style={{ height: '48px', borderRadius: '8px', background: '#3b82f6' }}
            >
              Configure and Initialize Project Team
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ProjectSetup;

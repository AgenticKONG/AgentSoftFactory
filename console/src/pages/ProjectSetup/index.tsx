import React, { useState, useEffect, useMemo } from 'react';
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
        const currentCat = form.getFieldValue('category') || 'FRONT';
        const currentLevel = form.getFieldValue('level') || 'L1';
        handleLCOnChange(currentCat, currentLevel);
      }
    } catch (err) {
      console.error("Failed to load PC rules", err);
    }
  };

  const getLevelDesc = (level: string) => {
    const rank = rules?.levels?.[level]?.rank || 0;
    if (level === 'L5') return 'Architecture Core';
    if (rank >= 4) return 'System Page';
    if (rank >= 3) return 'Composite Component';
    if (rank >= 2) return 'Functional Unit';
    return 'Atomic Task';
  };

  const getLevelOptions = useMemo(() => {
    if (!rules || !rules.levels) return [];
    const category = form.getFieldValue('category');
    
    let minRank = 1;
    if (category === 'INFRA') {
      minRank = 3;
    } else if (category === 'BACK' || category === 'VIZ') {
      minRank = 2;
    }
    
    return Object.keys(rules.levels)
      .filter(l => rules.levels[l].rank >= minRank)
      .map(l => ({
        value: l,
        label: `${l}: ${getLevelDesc(l)}`
      }));
  }, [rules, form.getFieldValue('category')]);

  const handleLCOnChange = async (category: string, level: string) => {
    if (category && level) {
      try {
        const res = await fetch(`/api/asf/pc/defaults?category=${category}&level=${level}`);
        const defaults = await res.json();
        if (defaults && defaults.team) {
          form.setFieldsValue({
            team_structure: defaults.team,
            process: defaults.process,
            level: defaults.level || level,
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
      
      let updates: any = { process: processId };
      
      if (teamId === 'T5') {
        updates.category = 'INFRA';
        updates.level = 'L3';
      } else if (teamId === 'T3' || teamId === 'T4') {
        const category = form.getFieldValue('category');
        if (category !== 'VIZ' && category !== 'NARR') {
          updates.category = 'VIZ';
          updates.level = 'L3';
        }
      }
      
      form.setFieldsValue(updates);
      if (updates.category) {
        handleLCOnChange(updates.category, updates.level || form.getFieldValue('level'));
      }
    }
  };

  const handlePChange = (processId: string) => {
    if (processId && typeof processId === 'string') {
      let teamId = processId.replace('P', 'T');
      
      let updates: any = { team_structure: teamId };
      
      if (processId === 'P5') {
        updates.category = 'INFRA';
        updates.level = 'L3';
      } else if (processId === 'P3' || processId === 'P4') {
        const category = form.getFieldValue('category');
        if (category !== 'VIZ' && category !== 'NARR') {
          updates.category = 'VIZ';
          updates.level = 'L3';
        }
      }
      
      form.setFieldsValue(updates);
      if (updates.category) {
        handleLCOnChange(updates.category, updates.level || form.getFieldValue('level'));
      }
    }
  };

  const handleCategoryChange = (category: string) => {
    let level = form.getFieldValue('level');
    const minRank = category === 'INFRA' ? 3 : (category === 'BACK' || category === 'VIZ' ? 2 : 1);
    const currentRank = rules?.levels?.[level]?.rank || 0;
    
    if (currentRank < minRank) {
      const levels = Object.keys(rules?.levels || {}).filter(l => (rules?.levels?.[l]?.rank || 0) >= minRank);
      level = levels[0] || level;
    }
    
    form.setFieldsValue({ level });
    handleLCOnChange(category, level);
  };

  const handleLevelChange = (level: string) => {
    const category = form.getFieldValue('category');
    handleLCOnChange(category, level);
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

  const teamOptions = useMemo(() => {
    if (!rules || !rules.teams) return [];
    return Object.keys(rules.teams).map(t => ({
      value: t,
      label: `${t}: ${rules.teams[t].join(' + ')}`
    }));
  }, [rules]);

  const processOptions = useMemo(() => {
    if (!rules || !rules.processes) return [];
    return Object.keys(rules.processes).map(p => ({
      value: p,
      label: `${p}: ${rules.processes[p].name}`
    }));
  }, [rules]);

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
            if (changedValues.category) {
              handleCategoryChange(changedValues.category);
            }
            if (changedValues.level) {
              handleLevelChange(changedValues.level);
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
                    <Select.Option key={c} value={c}>
                      {c} ({rules.categories[c].sovereign_agent})
                    </Select.Option>
                  )) : (
                    <Select.Option value="FRONT">FRONT</Select.Option>
                  )}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Level (演进等级)" name="level" rules={[{ required: true }]}>
                <Select placeholder="Select level">
                  {getLevelOptions.length > 0 ? getLevelOptions.map(l => (
                    <Select.Option key={l.value} value={l.value}>{l.label}</Select.Option>
                  )) : (
                    <Select.Option value="L1">L1: Atomic Task</Select.Option>
                  )}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Team (T-Selection)" name="team_structure" rules={[{ required: true }]}>
                <Select placeholder="Select team">
                  {teamOptions.length > 0 ? teamOptions.map(t => (
                    <Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>
                  )) : (
                    <>
                      <Select.Option value="T1">T1</Select.Option>
                      <Select.Option value="T2">T2</Select.Option>
                      <Select.Option value="T3">T3</Select.Option>
                      <Select.Option value="T4">T4</Select.Option>
                      <Select.Option value="T5">T5</Select.Option>
                    </>
                  )}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Process (P-Ordering)" name="process" rules={[{ required: true }]}>
                <Select placeholder="Select process">
                  {processOptions.length > 0 ? processOptions.map(p => (
                    <Select.Option key={p.value} value={p.value}>{p.label}</Select.Option>
                  )) : (
                    <>
                      <Select.Option value="P1">P1</Select.Option>
                      <Select.Option value="P2">P2</Select.Option>
                      <Select.Option value="P3">P3</Select.Option>
                      <Select.Option value="P4">P4</Select.Option>
                      <Select.Option value="P5">P5</Select.Option>
                    </>
                  )}
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

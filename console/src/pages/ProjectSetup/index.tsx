import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Card, message, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { FolderPlus, Settings2 } from 'lucide-react';

const { Title, Paragraph } = Typography;

const ProjectSetup = () => {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/asf/projects/templates');
      const data = await res.json();
      setTemplates(data);
    } catch (err) {
      console.error(err);
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/asf/projects/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        message.success('Project initialized successfully!');
        navigate(`/projects/${values.project_id}`);
      } else {
        message.error(data.detail || 'Failed to initialize project.');
      }
    } catch (error) {
      message.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <FolderPlus size={32} color="#3b82f6" />
          <Title level={2} style={{ margin: 0 }}>Create New ASF Project</Title>
        </div>
        
        <Paragraph style={{ color: '#666', marginBottom: '30px' }}>
          Initialize a specialized Multi-Agent team for your software engineering task.
        </Paragraph>

        <Form
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ template: 'viz-d3-v1' }}
        >
          <Form.Item
            label="Project ID (Slug)"
            name="project_id"
            rules={[{ required: true, message: 'Please enter a unique project ID!' }]}
          >
            <Input placeholder="e.g. 002-life-river-plus" />
          </Form.Item>

          <Form.Item
            label="Display Name"
            name="name"
            rules={[{ required: true, message: 'Please enter a display name!' }]}
          >
            <Input placeholder="e.g. Life River Component PLUS" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} placeholder="Describe the goal of this project..." />
          </Form.Item>

          <Form.Item label="Team Template" name="template" rules={[{ required: true }]}>
            <Select 
              placeholder="Select a gene template..."
              options={templates.map(t => ({
                value: t.id,
                label: (
                  <div>
                    <div style={{ fontWeight: 600 }}>{t.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{t.description}</div>
                  </div>
                )
              }))} 
            />
          </Form.Item>

          <Form.Item style={{ marginTop: '40px' }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              size="large" 
              block
              style={{ height: '48px', borderRadius: '8px' }}
            >
              Initialize Project Team
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ProjectSetup;

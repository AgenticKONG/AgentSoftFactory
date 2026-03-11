import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Typography, Tag, Button, Empty, Spin, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ArrowRight, FolderPlus } from 'lucide-react';

const { Title, Paragraph, Text } = Typography;

const ProjectList = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/asf/projects/list');
      const data = await res.json();
      if (data && data.projects) {
        setProjects(data.projects);
      } else {
        setProjects([]);
      }
    } catch (err) {
      message.error("Failed to load project list.");
    } finally {
      setLoading(false);
    }
  };


  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}><Spin size="large" tip="Loading ASF Factory Status..." /></div>;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>ASF Project Registry</Title>
          <Paragraph type="secondary">Manage and monitor your autonomous agent teams.</Paragraph>
        </div>
        <Button 
          type="primary" 
          icon={<FolderPlus size={16} />} 
          size="large" 
          onClick={() => navigate('/project-setup')}
        >
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Empty description="No projects initialized yet." />
      ) : (
        <Row gutter={[24, 24]}>
          {projects.map((p) => (
            <Col xs={24} sm={12} lg={8} key={p.id}>
              <Card 
                hoverable 
                style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}
                actions={[
                  <Button type="link" onClick={() => navigate(`/projects/${p.id}`)}>Configure Team</Button>,
                  <Button type="link" onClick={() => navigate('/workstation')}>Live View <ArrowRight size={14} /></Button>
                ]}
              >
                <Card.Meta
                  avatar={<div style={{ width: '40px', height: '40px', background: '#eff6ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Briefcase size={20} color="#3b82f6" /></div>}
                  title={<span style={{ fontSize: '18px' }}>{p.name}</span>}
                  description={
                    <div style={{ marginTop: '8px' }}>
                      <Tag color="blue">{p.id}</Tag>
                      <div style={{ marginTop: '12px' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>Path: {p.path}</Text>
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default ProjectList;

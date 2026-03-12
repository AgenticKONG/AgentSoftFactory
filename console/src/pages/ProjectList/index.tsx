import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Typography, Tag, Button, Empty, Spin, message, Switch, Space, Tooltip, Divider } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ArrowRight, FolderPlus, Archive, RotateCcw, Eye, Shield } from 'lucide-react';

const { Title, Paragraph, Text } = Typography;

const ProjectList = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
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

  const handleUnarchive = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/asf/projects/${projectId}/unarchive`, { method: 'POST' });
      if (res.ok) {
        message.success("Project restored successfully.");
        fetchProjects();
      } else {
        message.error("Failed to restore project.");
      }
    } catch (err) {
      message.error("Failed to restore project.");
    }
  };

  const filteredProjects = projects.filter(p => showArchived ? true : !p.archived);
  
  const isInfraProject = (p: any) => {
    // 方式1: category 字段为 INFRA
    if (p.category === 'INFRA') return true;
    // 方式2: project_id 以 infra- 开头
    if (p.id && p.id.startsWith('infra-')) return true;
    return false;
  };
  
  const infraProjects = filteredProjects.filter(p => isInfraProject(p));
  const regularProjects = filteredProjects.filter(p => !isInfraProject(p));
  
  const activeCount = projects.filter(p => !p.archived).length;
  const archivedCount = projects.filter(p => p.archived).length;
  
  const infraActiveCount = projects.filter(p => isInfraProject(p) && !p.archived).length;
  const regularActiveCount = projects.filter(p => !isInfraProject(p) && !p.archived).length;
  const infraArchivedCount = projects.filter(p => isInfraProject(p) && p.archived).length;
  const regularArchivedCount = projects.filter(p => !isInfraProject(p) && p.archived).length;

  const renderProjectCard = (p: any, isInfra: boolean) => (
    <Col xs={24} sm={12} lg={8} key={p.id}>
      <Card 
        hoverable 
        style={{ 
          borderRadius: '12px', 
          border: isInfra 
            ? (p.archived ? '2px solid #fcd34d' : '2px solid #8b5cf6')
            : (p.archived ? '1px solid #fcd34d' : '1px solid #f0f0f0'),
          opacity: p.archived ? 0.7 : 1,
          background: p.archived ? '#fffbeb' : (isInfra ? '#faf5ff' : '#fff'),
          transition: 'all 0.2s ease'
        }}
        actions={p.archived ? [
          <Tooltip title="Restore">
            <Button type="link" onClick={(e) => handleUnarchive(p.id, e)}>
              <RotateCcw size={14} /> Restore
            </Button>
          </Tooltip>,
          <Button type="link" onClick={() => navigate('/workstation')}>Live View <ArrowRight size={14} /></Button>
        ] : [
          <Button type="link" onClick={() => navigate(`/projects/${p.id}`)}>Configure Team</Button>,
          <Button type="link" onClick={() => navigate('/workstation')}>Live View <ArrowRight size={14} /></Button>
        ]}
      >
        <Card.Meta
          avatar={
            <div style={{ 
              width: '40px', 
              height: '40px', 
              background: isInfra 
                ? (p.archived ? '#fef3c7' : '#ede9fe')
                : (p.archived ? '#fef3c7' : '#eff6ff'), 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              {isInfra 
                ? (p.archived ? <Archive size={20} color="#f59e0b" /> : <Shield size={20} color="#8b5cf6" />)
                : (p.archived ? <Archive size={20} color="#f59e0b" /> : <Briefcase size={20} color="#3b82f6" />)
              }
            </div>
          }
          title={
            <Space>
              <span style={{ fontSize: '18px' }}>{p.name}</span>
              {p.archived && <Tag color="warning">Archived</Tag>}
              {isInfra && !p.archived && <Tag color="purple">T5</Tag>}
            </Space>
          }
          description={
            <div style={{ marginTop: '8px' }}>
              <Space>
                <Tag color={isInfra ? 'purple' : (p.archived ? 'warning' : 'blue')}>{p.id}</Tag>
                {isInfra && <Tag color="purple">{p.category}</Tag>}
                {p.level && <Tag>{p.level}</Tag>}
              </Space>
              {p.archived && p.archived_reason && (
                <Tag color="default" style={{ marginLeft: '4px' }}>{p.archived_reason}</Tag>
              )}
              <div style={{ marginTop: '12px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>Path: {p.path}</Text>
              </div>
              {p.archived && p.archived_at && (
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    Archived: {new Date(p.archived_at).toLocaleDateString()}
                  </Text>
                </div>
              )}
            </div>
          }
        />
      </Card>
    </Col>
  );

  const renderSection = (title: string, count: number, projectList: any[], isInfra: boolean) => {
    if (projectList.length === 0) return null;
    
    return (
      <div style={{ marginBottom: '32px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '16px',
          padding: '12px 16px',
          background: isInfra ? '#f5f3ff' : '#f8fafc',
          borderRadius: '8px',
          borderLeft: isInfra ? '4px solid #8b5cf6' : '4px solid #3b82f6'
        }}>
          <Space>
            {isInfra ? <Shield size={20} color="#8b5cf6" /> : <Briefcase size={20} color="#3b82f6" />}
            <Title level={4} style={{ margin: 0, color: isInfra ? '#7c3aed' : '#1e293b' }}>
              {title} ({count})
            </Title>
          </Space>
          {isInfra && <Tag color="purple">INFRA</Tag>}
        </div>
        <Row gutter={[24, 24]}>
          {projectList.map((p) => renderProjectCard(p, isInfra))}
        </Row>
      </div>
    );
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}><Spin size="large" tip="Loading ASF Factory Status..." /></div>;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>ASF Project Registry</Title>
          <Paragraph type="secondary">Manage and monitor your autonomous agent teams.</Paragraph>
        </div>
        <Space>
          {archivedCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye size={16} style={{ color: '#64748b' }} />
              <Switch 
                checked={showArchived} 
                onChange={setShowArchived} 
                size="small"
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Show Archived ({archivedCount})
              </Text>
            </div>
          )}
          <Button 
            type="primary" 
            icon={<FolderPlus size={16} />} 
            size="large" 
            onClick={() => navigate('/project-setup')}
          >
            New Project
          </Button>
        </Space>
      </div>

      <div style={{ marginBottom: '24px', color: '#64748b', fontSize: '13px' }}>
        Showing {filteredProjects.length} of {projects.length} projects
        <Space>
          {infraActiveCount > 0 && <Tag color="purple">{infraActiveCount} INFRA</Tag>}
          {regularActiveCount > 0 && <Tag>{regularActiveCount} Regular</Tag>}
        </Space>
        {showArchived && archivedCount > 0 && (
          <Text type="secondary"> ({infraArchivedCount} INFRA archived, {regularArchivedCount} archived)</Text>
        )}
        {!showArchived && archivedCount > 0 && (
          <Text type="secondary"> ({archivedCount} archived - toggle to show)</Text>
        )}
      </div>

      {filteredProjects.length === 0 ? (
        <Empty description="No projects initialized yet." />
      ) : (
        <>
          {renderSection('INFRA Projects (T5)', infraProjects.length, infraProjects, true)}
          {infraProjects.length > 0 && regularProjects.length > 0 && <Divider style={{ margin: '24px 0' }} />}
          {renderSection('Regular Projects', regularProjects.length, regularProjects, false)}
        </>
      )}
    </div>
  );
};

export default ProjectList;

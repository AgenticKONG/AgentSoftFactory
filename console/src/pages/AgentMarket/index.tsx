import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Col, Row, Typography, Tag, Button, Empty, Spin, message, Space, Avatar } from 'antd';
import { Sparkles, ArrowRight, UserPlus, Info } from 'lucide-react';

const { Title, Text, Paragraph } = Typography;

const AgentMarket = () => {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMarket();
  }, []);

  const fetchMarket = async () => {
    try {
      const res = await fetch('/api/asf/market/list');
      const data = await res.json();
      setAgents(data);
    } catch (err) {
      console.error(err);
      message.error("Failed to load Agent Market.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}><Spin size="large" tip="Loading Agents Market..." /></div>;

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ marginBottom: '32px' }}>
        <Title level={2}><Sparkles size={28} color="#2563eb" style={{ marginRight: '12px' }} /> Agent Factory Market</Title>
        <Paragraph type="secondary">
          Hire specialized Agents for your projects. Each Agent has its own Sovereign Soul and unique memory.
        </Paragraph>
      </div>

      {agents.length === 0 ? (
        <Empty description="No Agents found in the market." />
      ) : (
        <Row gutter={[24, 24]}>
          {agents.map((agent) => (
            <Col xs={24} sm={12} lg={8} key={agent.id}>
              <Card 
                hoverable 
                style={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                actions={[
                  <Button type="link" icon={<Info size={14}/>} onClick={() => navigate(`/agent-market/${agent.id}`)}>View Profile</Button>,
                  <Button type="primary" ghost size="small" style={{ borderRadius: '6px' }}>Hire Clone</Button>
                ]}
              >
                <Card.Meta
                  avatar={<Avatar size={48} src={`https://api.dicebear.com/7.x/bottts/svg?seed=${agent.id}`} />}
                  title={<span style={{ fontSize: '18px' }}>{agent.name}</span>}
                  description={
                    <div style={{ marginTop: '8px' }}>
                      <Space wrap>
                        <Tag color="blue">{agent.role}</Tag>
                        <Tag color="purple">Exp: {agent.experience || 'L1'}</Tag>
                      </Space>
                      <div style={{ marginTop: '12px' }}>
                        <Text strong style={{ fontSize: '12px' }}>Specialty:</Text>
                        <div style={{ marginTop: '4px' }}>
                          {(agent.specialty || []).map((s: string) => <Tag key={s} style={{ fontSize: '10px' }}>{s}</Tag>)}
                        </div>
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

export default AgentMarket;

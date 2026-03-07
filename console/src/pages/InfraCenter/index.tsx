import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Tag, List, Divider, Timeline, Spin, message, Space } from 'antd';
import { Cpu, Shield, Database, Activity, Zap, History } from 'lucide-react';

const { Title, Text, Paragraph } = Typography;

const InfraCenter = () => {
  const [loading, setLoading] = useState(true);
  const [infraData, setInfraData] = useState<any>(null);

  useEffect(() => {
    fetchInfraData();
  }, []);

  const fetchInfraData = async () => {
    setLoading(true);
    try {
      // In a real scenario, we'll create this endpoint in asf.py
      const res = await fetch('/api/asf/infra/info');
      const data = await res.json();
      setInfraData(data);
    } catch (err) {
      // message.error("Failed to load Infra memory.");
      // Mocking for now to show UI structure
      setInfraData({
        soul: {
          version: "1.0 (Shared Soul)",
          identity: "Infra Agent / Architect",
          principles: [
            "Environment Safety: No silent host changes outside .venv",
            "Audit Integrity: Log all major decisions",
            "Shared Consciousness: Sync state between CLI and ASF"
          ]
        },
        state: {
          last_checkpoint: "MISSION_001_COMPLETED",
          timestamp: new Date().toLocaleString(),
          current_task: "Optimizing Multi-Agent Workflow"
        },
        evolution_logs: [
          { time: '20:45', action: 'Detected LLM Response mismatch', correction: 'Added precise text extraction logic' },
          { time: '21:15', action: 'Refinement Loop failed 3 iterations', correction: 'Implemented Hardcoded SPEC for recovery test' },
          { time: '21:50', action: 'Sidebar UI cluttered', correction: 'Reorganized Project group and unified Registry' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !infraData) return <div style={{ padding: '100px', textAlign: 'center' }}><Spin size="large" /></div>;

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100%' }}>
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Cpu size={28} color="#3b82f6" /> Infra Agent Center
        </Title>
        <Paragraph type="secondary">Digital Partner & Architect Consciousness Interface</Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Column: Soul & State */}
        <Col span={16}>
          <Card 
            title={<span><Shield size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> The Soul (Identity & Principles)</span>}
            bordered={false}
            style={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', marginBottom: '24px' }}
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '8px' }}>
                <Text strong style={{ fontSize: '16px', color: '#1e40af' }}>{infraData.soul.identity}</Text>
                <div style={{ marginTop: '4px' }}><Tag color="blue">v{infraData.soul.version}</Tag> <Tag color="green">Active</Tag></div>
              </div>
              
              <List
                header={<strong>Core Principles</strong>}
                dataSource={infraData.soul.principles}
                renderItem={(item: string) => (
                  <List.Item style={{ padding: '8px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '6px', height: '6px', background: '#3b82f6', borderRadius: '50%' }} />
                      <Text>{item}</Text>
                    </div>
                  </List.Item>
                )}
              />
            </Space>
          </Card>

          <Card 
            title={<span><Activity size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Infrastructure Pulse</span>}
            bordered={false}
            style={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ padding: '16px', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
                  <Text type="secondary" size="small">Last Known Status</Text>
                  <div style={{ marginTop: '8px', fontSize: '18px', fontWeight: 600 }}>{infraData.state.last_checkpoint}</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ padding: '16px', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
                  <Text type="secondary" size="small">Current Focus</Text>
                  <div style={{ marginTop: '8px', fontSize: '18px', fontWeight: 600, color: '#3b82f6' }}>{infraData.state.current_task}</div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Right Column: Evolution Logs */}
        <Col span={8}>
          <Card 
            title={<span><History size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Evolution Logs (Offline Feedback)</span>}
            bordered={false}
            style={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', height: '100%' }}
          >
            <Timeline
              items={infraData.evolution_logs.map((log: any) => ({
                color: 'blue',
                children: (
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{log.time} - {log.action}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Correction: {log.correction}</div>
                  </div>
                ),
              }))}
            />
            <Divider />
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <Zap size={12} style={{ marginRight: 4 }} /> 
                Autonomous Evolution Active
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default InfraCenter;

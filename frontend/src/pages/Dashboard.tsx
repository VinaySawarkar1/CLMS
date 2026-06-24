import { useQuery } from '@tanstack/react-query';
import { Row, Col, Card, Statistic, Typography, Space, Badge, Divider, Spin } from 'antd';
import {
  FileTextOutlined, ClockCircleOutlined, WarningOutlined,
  SafetyCertificateOutlined, ExperimentOutlined, TeamOutlined, RiseOutlined,
} from '@ant-design/icons';
import { getDashboard } from '../api';

const { Title, Text } = Typography;

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  loading?: boolean;
}

function StatCard({ label, value, icon, color, bg, loading }: StatCardProps) {
  return (
    <Card
      style={{
        borderRadius: 12,
        border: 'none',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ display: 'flex', alignItems: 'stretch', height: 100 }}>
        <div style={{
          width: 70, background: bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 28, color }}>{icon}</span>
        </div>
        <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {loading ? (
            <Spin size="small" />
          ) : (
            <Statistic
              title={<Text style={{ fontSize: 12, color: '#666', fontWeight: 500 }}>{label}</Text>}
              value={value ?? 0}
              valueStyle={{ fontSize: 28, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.2 }}
            />
          )}
        </div>
      </div>
    </Card>
  );
}

const WIDGETS = [
  { key: 'todaysJobs', label: "Today's Jobs", icon: <FileTextOutlined />, color: '#1677ff', bg: '#e6f0ff' },
  { key: 'pendingJobs', label: 'Pending Jobs', icon: <ClockCircleOutlined />, color: '#fa8c16', bg: '#fff7e6' },
  { key: 'overdueJobs', label: 'Overdue Jobs', icon: <WarningOutlined />, color: '#f5222d', bg: '#fff1f0' },
  { key: 'certificatesIssued', label: 'Certificates Issued', icon: <SafetyCertificateOutlined />, color: '#52c41a', bg: '#f6ffed' },
  { key: 'masterDue', label: 'Master Due', icon: <ExperimentOutlined />, color: '#722ed1', bg: '#f9f0ff' },
  { key: 'customers', label: 'Total Customers', icon: <TeamOutlined />, color: '#13c2c2', bg: '#e6fffb' },
];

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, color: '#1a1a2e' }}>
          <Space>
            <RiseOutlined style={{ color: '#1677ff' }} />
            Dashboard
          </Space>
        </Title>
        <Text style={{ color: '#666', fontSize: 13 }}>
          Real-time overview of your calibration laboratory operations
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        {WIDGETS.map((w) => (
          <Col xs={24} sm={12} md={8} key={w.key}>
            <StatCard
              label={w.label}
              value={data?.[w.key] ?? 0}
              icon={w.icon}
              color={w.color}
              bg={w.bg}
              loading={isLoading}
            />
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <Badge status="processing" />
                <span>System Status</span>
              </Space>
            }
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>Calibration Engine</Text>
                <Badge status="success" text="Operational" />
              </div>
              <Divider style={{ margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>Certificate Generator</Text>
                <Badge status="success" text="Operational" />
              </div>
              <Divider style={{ margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>Uncertainty Engine (GUM)</Text>
                <Badge status="success" text="Operational" />
              </div>
              <Divider style={{ margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>Digital Signature Workflow</Text>
                <Badge status="success" text="Operational" />
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <SafetyCertificateOutlined style={{ color: '#1677ff' }} />
                <span>Accreditation Info</span>
              </Space>
            }
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">Standard</Text>
                <Text strong>ISO/IEC 17025:2017</Text>
              </div>
              <Divider style={{ margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">Accreditation Body</Text>
                <Text strong>NABL</Text>
              </div>
              <Divider style={{ margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">Disciplines</Text>
                <Text strong>7 Active</Text>
              </div>
              <Divider style={{ margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">Uncertainty Method</Text>
                <Text strong>GUM (k=2, 95.45%)</Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

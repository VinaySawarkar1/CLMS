import { useQuery } from '@tanstack/react-query';
import { Row, Col, Card, Statistic, Typography, Space, Badge, Divider, Spin, Tag, Button, Table } from 'antd';
import {
  FileTextOutlined, ClockCircleOutlined, WarningOutlined,
  SafetyCertificateOutlined, ExperimentOutlined, TeamOutlined, RiseOutlined,
  PlusOutlined, ToolOutlined, UserOutlined, FileSearchOutlined,
  DollarOutlined, FieldTimeOutlined, DashboardOutlined,
} from '@ant-design/icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { getDashboard, getJobs, getKpis } from '../api';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  iconColor: string;
  loading?: boolean;
  trend?: number;
}

function StatCard({ label, value, icon, gradient, iconBg, iconColor, loading, trend }: StatCardProps) {
  return (
    <Card
      style={{
        borderRadius: 16,
        border: 'none',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        background: gradient,
      }}
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 110 }}>
        <div style={{
          width: 76, background: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 30, color: iconColor }}>{icon}</span>
        </div>
        <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {loading ? (
            <Spin size="small" />
          ) : (
            <>
              <Statistic
                title={<Text style={{ fontSize: 12, color: '#555', fontWeight: 600, letterSpacing: 0.3 }}>{label}</Text>}
                value={value ?? 0}
                valueStyle={{ fontSize: 30, fontWeight: 800, color: '#1a1a2e', lineHeight: 1.2 }}
              />
              {trend !== undefined && (
                <Text style={{ fontSize: 11, color: trend >= 0 ? '#52c41a' : '#ff4d4f', marginTop: 2 }}>
                  {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs last week
                </Text>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

const WIDGETS = [
  {
    key: 'todaysJobs', label: "Today's Jobs",
    icon: <FileTextOutlined />,
    iconColor: '#1677ff', iconBg: 'rgba(22,119,255,0.12)',
    gradient: 'linear-gradient(135deg, #ffffff 0%, #e8f0ff 100%)',
  },
  {
    key: 'pendingJobs', label: 'Pending Jobs',
    icon: <ClockCircleOutlined />,
    iconColor: '#fa8c16', iconBg: 'rgba(250,140,22,0.12)',
    gradient: 'linear-gradient(135deg, #ffffff 0%, #fff3e0 100%)',
  },
  {
    key: 'overdueJobs', label: 'Overdue Jobs',
    icon: <WarningOutlined />,
    iconColor: '#f5222d', iconBg: 'rgba(245,34,45,0.10)',
    gradient: 'linear-gradient(135deg, #ffffff 0%, #fff0f0 100%)',
  },
  {
    key: 'certificatesIssued', label: 'Certificates Issued',
    icon: <SafetyCertificateOutlined />,
    iconColor: '#52c41a', iconBg: 'rgba(82,196,26,0.12)',
    gradient: 'linear-gradient(135deg, #ffffff 0%, #f0fff4 100%)',
  },
  {
    key: 'masterDue', label: 'Masters Due',
    icon: <ExperimentOutlined />,
    iconColor: '#722ed1', iconBg: 'rgba(114,46,209,0.10)',
    gradient: 'linear-gradient(135deg, #ffffff 0%, #f5f0ff 100%)',
  },
  {
    key: 'customers', label: 'Total Customers',
    icon: <TeamOutlined />,
    iconColor: '#13c2c2', iconBg: 'rgba(19,194,194,0.10)',
    gradient: 'linear-gradient(135deg, #ffffff 0%, #e6fffb 100%)',
  },
];

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: '#1677ff',
  WAITING: '#faad14',
  ASSIGNED: '#13c2c2',
  IN_CALIBRATION: '#722ed1',
  PENDING_REVIEW: '#fa8c16',
  CORRECTION_REQUIRED: '#f5222d',
  APPROVED: '#52c41a',
  CERTIFICATE_GENERATED: '#389e0d',
  DELIVERED: '#08979c',
  CLOSED: '#8c8c8c',
};

const STATUS_TAG_COLORS: Record<string, string> = {
  RECEIVED: 'blue',
  WAITING: 'gold',
  ASSIGNED: 'cyan',
  IN_CALIBRATION: 'purple',
  PENDING_REVIEW: 'orange',
  CORRECTION_REQUIRED: 'red',
  APPROVED: 'green',
  CERTIFICATE_GENERATED: 'success',
  DELIVERED: 'geekblue',
  CLOSED: 'default',
};

const JOB_STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Received',
  WAITING: 'Waiting',
  ASSIGNED: 'Assigned',
  IN_CALIBRATION: 'In Calibration',
  PENDING_REVIEW: 'Pending Review',
  CORRECTION_REQUIRED: 'Correction Req.',
  APPROVED: 'Approved',
  CERTIFICATE_GENERATED: 'Cert. Generated',
  DELIVERED: 'Delivered',
  CLOSED: 'Closed',
};

export default function Dashboard() {
  const nav = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  });

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs-all'],
    queryFn: () => getJobs(),
  });

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: getKpis,
  });

  const monthly: { month: string; count: number }[] = kpis?.monthlyCalibration ?? [];
  const maxMonthly = Math.max(1, ...monthly.map((m) => m.count));
  const productivity: { engineer: string; jobs: number }[] = kpis?.engineerProductivity ?? [];
  const maxProd = Math.max(1, ...productivity.map((p) => p.jobs));

  // Build pipeline chart data from jobs
  const pipelineData = (() => {
    if (!jobsData) return [];
    const counts: Record<string, number> = {};
    (jobsData as any[]).forEach((j: any) => {
      counts[j.status] = (counts[j.status] ?? 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([status, count]) => ({
        status: JOB_STATUS_LABELS[status] ?? status,
        count,
        color: STATUS_COLORS[status] ?? '#8c8c8c',
        rawStatus: status,
      }));
  })();

  // Recent 5 jobs
  const recentJobs = jobsData ? (jobsData as any[]).slice(0, 5) : [];

  const recentJobColumns = [
    {
      title: 'Job #',
      dataIndex: 'jobNumber',
      key: 'jobNumber',
      render: (v: string, r: any) => (
        <a onClick={() => nav(`/jobs/${r.id}`)} style={{ fontWeight: 600, color: '#1677ff' }}>{v}</a>
      ),
    },
    {
      title: 'Instrument',
      dataIndex: ['instrument', 'name'],
      key: 'instrument',
      render: (_: any, r: any) => r.instrument?.name ?? '—',
    },
    {
      title: 'Customer',
      dataIndex: ['customer', 'name'],
      key: 'customer',
      render: (_: any, r: any) => r.customer?.name ?? '—',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={STATUS_TAG_COLORS[s] ?? 'default'} style={{ fontSize: 11 }}>
          {JOB_STATUS_LABELS[s] ?? s}
        </Tag>
      ),
    },
  ];

  const quickLinks = [
    { label: 'New Job', icon: <PlusOutlined />, path: '/jobs', color: '#1677ff' },
    { label: 'Instruments', icon: <ToolOutlined />, path: '/instruments', color: '#722ed1' },
    { label: 'Customers', icon: <UserOutlined />, path: '/customers', color: '#13c2c2' },
    { label: 'Certificates', icon: <SafetyCertificateOutlined />, path: '/certificates', color: '#52c41a' },
    { label: 'Reports', icon: <FileSearchOutlined />, path: '/reports', color: '#fa8c16' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
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

      {/* Stat Cards */}
      <Row gutter={[16, 16]}>
        {WIDGETS.map((w) => (
          <Col xs={24} sm={12} md={8} key={w.key}>
            <StatCard
              label={w.label}
              value={data?.[w.key] ?? 0}
              icon={w.icon}
              iconColor={w.iconColor}
              iconBg={w.iconBg}
              gradient={w.gradient}
              loading={isLoading}
            />
          </Col>
        ))}
      </Row>

      {/* Pipeline Chart + Quick Links */}
      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <FileTextOutlined style={{ color: '#1677ff' }} />
                <span style={{ fontWeight: 700 }}>Job Status Pipeline</span>
              </Space>
            }
            style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
            styles={{ body: { paddingTop: 8 } }}
          >
            {jobsLoading ? (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin />
              </div>
            ) : pipelineData.length === 0 ? (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text type="secondary">No job data yet</Text>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={pipelineData} margin={{ top: 8, right: 16, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="status"
                    tick={{ fontSize: 11, fill: '#555' }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#555' }} allowDecimals={false} />
                  <Tooltip
                    formatter={(v: any) => [v, 'Jobs']}
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {pipelineData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <span style={{ fontWeight: 700 }}>Quick Links</span>
              </Space>
            }
            style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', height: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={10}>
              {quickLinks.map((ql) => (
                <Button
                  key={ql.path}
                  icon={ql.icon}
                  onClick={() => nav(ql.path)}
                  style={{
                    width: '100%', textAlign: 'left', borderRadius: 10,
                    height: 44, fontWeight: 600,
                    borderColor: ql.color + '55', color: ql.color,
                    background: ql.color + '0d',
                  }}
                >
                  {ql.label}
                </Button>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Recent Jobs */}
      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined style={{ color: '#fa8c16' }} />
                <span style={{ fontWeight: 700 }}>Recent Jobs</span>
              </Space>
            }
            extra={
              <Button type="link" onClick={() => nav('/jobs')} style={{ padding: 0, fontWeight: 600 }}>
                View All →
              </Button>
            }
            style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
          >
            <Table
              dataSource={recentJobs}
              columns={recentJobColumns}
              rowKey="id"
              loading={jobsLoading}
              pagination={false}
              size="small"
              locale={{ emptyText: 'No jobs yet — create your first job to get started.' }}
            />
          </Card>
        </Col>
      </Row>

      {/* System Status + Accreditation */}
      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <Badge status="processing" />
                <span style={{ fontWeight: 700 }}>System Status</span>
              </Space>
            }
            style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              {[
                'Calibration Engine',
                'Certificate Generator',
                'Uncertainty Engine (GUM)',
                'Digital Signature Workflow',
              ].map((sys, i) => (
                <div key={i}>
                  {i > 0 && <Divider style={{ margin: '4px 0' }} />}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>{sys}</Text>
                    <Badge status="success" text="Operational" />
                  </div>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <SafetyCertificateOutlined style={{ color: '#1677ff' }} />
                <span style={{ fontWeight: 700 }}>Accreditation Info</span>
              </Space>
            }
            style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
          >
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {[
                ['Standard', 'ISO/IEC 17025:2017'],
                ['Accreditation Body', 'NABL'],
                ['Disciplines', '7 Active'],
                ['Uncertainty Method', 'GUM (k=2, 95.45%)'],
              ].map(([label, val], i) => (
                <div key={i}>
                  {i > 0 && <Divider style={{ margin: '4px 0' }} />}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">{label}</Text>
                    <Text strong>{val}</Text>
                  </div>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

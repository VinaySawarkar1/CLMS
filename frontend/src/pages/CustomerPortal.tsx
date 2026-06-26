import { useState } from 'react';
import axios from 'axios';
import {
  Alert, Badge, Button, Card, Form, Input, Space, Table, Tabs, Tag, Typography,
} from 'antd';
import {
  ExperimentOutlined, FilePdfOutlined, SafetyCertificateOutlined,
  ToolOutlined, UserOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const apiHost = (import.meta.env.VITE_API_BASE as string | undefined);
const baseURL = apiHost ? `https://${apiHost}/api` : '/api';

// Separate axios instance for portal — uses its own token key
const portalApi = axios.create({ baseURL });
portalApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('clms_portal_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const pGet = (url: string) => portalApi.get(url).then((r) => r.data);
const pPost = (url: string, body?: any) => portalApi.post(url, body).then((r) => r.data);

// ─────────────────── Status tag colours ──────────────────────────────────────

const JOB_STATUS_COLOR: Record<string, string> = {
  RECEIVED: 'default',
  WAITING: 'orange',
  ASSIGNED: 'blue',
  IN_CALIBRATION: 'processing',
  PENDING_REVIEW: 'gold',
  CORRECTION_REQUIRED: 'error',
  APPROVED: 'cyan',
  CERTIFICATE_GENERATED: 'green',
  DELIVERED: 'success',
  CLOSED: 'default',
};

function dueDateColor(date: string | null | undefined): string {
  if (!date) return 'inherit';
  const diff = (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return '#ff4d4f';
  if (diff <= 30) return '#fa8c16';
  return '#52c41a';
}

// ─────────────────── Tabs content ────────────────────────────────────────────

function JobsTab() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  if (!loaded) {
    pGet('/portal/jobs').then((d) => { setJobs(d); setLoaded(true); });
  }

  const columns = [
    { title: 'Job No.', dataIndex: 'jobNumber', key: 'jobNumber' },
    {
      title: 'Instrument',
      key: 'instrument',
      render: (_: any, row: any) => row.instrument?.name ?? '—',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Tag color={JOB_STATUS_COLOR[v] ?? 'default'}>{v?.replace(/_/g, ' ')}</Tag>
      ),
    },
    {
      title: 'Received',
      dataIndex: 'receivedAt',
      key: 'receivedAt',
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      title: 'Certificate',
      key: 'cert',
      render: (_: any, row: any) =>
        row.certificate?.isLocked ? (
          <Tag color="green">
            <SafetyCertificateOutlined /> {row.certificate.certificateNumber}
          </Tag>
        ) : (
          <Tag color="default">Pending</Tag>
        ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={jobs}
      rowKey="id"
      loading={!loaded}
      pagination={{ pageSize: 15 }}
      size="small"
    />
  );
}

function CertificatesTab() {
  const [certs, setCerts] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  if (!loaded) {
    pGet('/portal/certificates').then((d) => { setCerts(d); setLoaded(true); });
  }

  const downloadCert = async (certId: string) => {
    const res = await portalApi.get(`/reports/certificate/${certId}.html`, { responseType: 'text' });
    const blob = new Blob([res.data], { type: 'text/html' });
    window.open(URL.createObjectURL(blob), '_blank');
  };

  const columns = [
    { title: 'Cert. No.', dataIndex: 'certificateNumber', key: 'certificateNumber' },
    {
      title: 'Instrument',
      key: 'instrument',
      render: (_: any, row: any) => row.job?.instrument?.name ?? '—',
    },
    {
      title: 'Serial No.',
      key: 'serial',
      render: (_: any, row: any) => row.job?.instrument?.serialNumber ?? '—',
    },
    {
      title: 'Issue Date',
      dataIndex: 'issueDate',
      key: 'issueDate',
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, row: any) => (
        <Button
          size="small"
          icon={<FilePdfOutlined />}
          onClick={() => downloadCert(row.id)}
          type="primary"
          ghost
        >
          Download
        </Button>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={certs}
      rowKey="id"
      loading={!loaded}
      pagination={{ pageSize: 15 }}
      size="small"
    />
  );
}

function InstrumentsTab() {
  const [instruments, setInstruments] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expandedInstrumentId, setExpandedInstrumentId] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, any[]>>({});

  if (!loaded) {
    pGet('/portal/instruments').then((d) => { setInstruments(d); setLoaded(true); });
  }

  const loadHistory = (instrumentId: string) => {
    if (history[instrumentId]) {
      setExpandedInstrumentId(expandedInstrumentId === instrumentId ? null : instrumentId);
      return;
    }
    pGet('/portal/jobs').then((jobs: any[]) => {
      const filtered = jobs.filter((j: any) => j.instrument?.id === instrumentId)
        .sort((a: any, b: any) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
      setHistory((h) => ({ ...h, [instrumentId]: filtered }));
      setExpandedInstrumentId(instrumentId);
    });
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (v: string) => <Text strong>{v}</Text> },
    { title: 'Make', dataIndex: 'make', key: 'make', render: (v: any) => v ?? '—' },
    { title: 'Serial No.', dataIndex: 'serialNumber', key: 'serialNumber', render: (v: any) => v ?? '—' },
    {
      title: 'Last Calibrated',
      dataIndex: 'lastCalibrationDate',
      key: 'lastCal',
      render: (v: string | null) => v ? new Date(v).toLocaleDateString() : '—',
    },
    {
      title: 'Next Due Date',
      dataIndex: 'nextDueDate',
      key: 'nextDue',
      render: (v: string | null) =>
        v ? (
          <Text strong style={{ color: dueDateColor(v) }}>
            {new Date(v).toLocaleDateString()}
          </Text>
        ) : (
          '—'
        ),
    },
    {
      title: 'Status',
      dataIndex: 'nextDueDate',
      key: 'dueSt',
      render: (v: string | null) => {
        if (!v) return <Tag>No Due Date</Tag>;
        const diff = (new Date(v).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (diff < 0) return <Tag color="error">Overdue</Tag>;
        if (diff <= 30) return <Tag color="warning">Due Soon</Tag>;
        return <Tag color="success">OK</Tag>;
      },
    },
    {
      title: 'History',
      key: 'hist',
      render: (_: any, row: any) => (
        <Button size="small" type="link" onClick={() => loadHistory(row.id)}>
          {expandedInstrumentId === row.id ? 'Hide' : 'View History'}
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Table
        columns={columns}
        dataSource={instruments}
        rowKey="id"
        loading={!loaded}
        pagination={{ pageSize: 15 }}
        size="small"
      />
      {expandedInstrumentId && history[expandedInstrumentId] && (
        <Badge.Ribbon text="Calibration History" color="blue">
          <Card size="small" style={{ background: '#f0f5ff' }}>
            <Table
              size="small"
              rowKey="id"
              dataSource={history[expandedInstrumentId]}
              pagination={false}
              columns={[
                { title: 'Job No.', dataIndex: 'jobNumber', key: 'j' },
                { title: 'Received', dataIndex: 'receivedAt', key: 'r', render: (v: string) => new Date(v).toLocaleDateString() },
                { title: 'Status', dataIndex: 'status', key: 's', render: (s: string) => <Tag color={JOB_STATUS_COLOR[s] ?? 'default'}>{s?.replace(/_/g, ' ')}</Tag> },
                {
                  title: 'Certificate', key: 'cert',
                  render: (_: any, r: any) => r.certificate?.isLocked
                    ? <Tag color="green">{r.certificate.certificateNumber}</Tag>
                    : <Tag>—</Tag>,
                },
              ]}
            />
          </Card>
        </Badge.Ribbon>
      )}
    </Space>
  );
}

// ─────────────────── Main Component ──────────────────────────────────────────

export default function CustomerPortal() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('clms_portal_token'));
  const [customerName, setCustomerName] = useState(
    localStorage.getItem('clms_portal_customer') ?? '',
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form] = Form.useForm();

  const handleLogin = async (values: { email: string; labAccreditationCode: string }) => {
    setError('');
    setLoading(true);
    try {
      const data = await pPost('/portal/login', values);
      localStorage.setItem('clms_portal_token', data.accessToken);
      localStorage.setItem('clms_portal_customer', data.customer?.name ?? '');
      setCustomerName(data.customer?.name ?? '');
      setLoggedIn(true);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Login failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('clms_portal_token');
    localStorage.removeItem('clms_portal_customer');
    setLoggedIn(false);
    setCustomerName('');
  };

  if (!loggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f3460 0%, #16213e 40%, #1a1a2e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, #52c41a, #237804)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 32px rgba(82,196,26,0.4)',
            }}>
              <UserOutlined style={{ fontSize: 32, color: '#fff' }} />
            </div>
            <Title level={2} style={{ color: '#fff', margin: 0, letterSpacing: 1 }}>Customer Portal</Title>
            <Text style={{ color: '#8c9db5', fontSize: 13 }}>Track your calibration jobs &amp; certificates</Text>
          </div>

          <Card style={{ borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.4)', border: 'none' }}
            styles={{ body: { padding: '36px 40px' } }}>
            <Title level={4} style={{ marginBottom: 4 }}>Sign In</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 24, fontSize: 13 }}>
              Enter your registered email and lab accreditation code
            </Text>

            {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 20 }} />}

            <Form form={form} onFinish={handleLogin} layout="vertical" size="large">
              <Form.Item
                name="email"
                label="Email Address"
                rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
              >
                <Input prefix={<UserOutlined style={{ color: '#bbb' }} />} placeholder="your@email.com" />
              </Form.Item>
              <Form.Item
                name="labAccreditationCode"
                label="Lab Accreditation Code"
                rules={[{ required: true, message: 'Please enter the lab accreditation code' }]}
              >
                <Input
                  prefix={<ExperimentOutlined style={{ color: '#bbb' }} />}
                  placeholder="e.g. CC-1234"
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  style={{ height: 44, borderRadius: 8, fontWeight: 600, fontSize: 15, background: '#52c41a', borderColor: '#52c41a' }}
                >
                  Access Portal
                </Button>
              </Form.Item>
            </Form>
          </Card>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text style={{ color: '#4a5568', fontSize: 12 }}>
              © 2025 Calibration Laboratory Management System. All rights reserved.
            </Text>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 24,
          background: 'linear-gradient(135deg, #0f3460, #16213e)',
          borderRadius: 16, padding: '20px 28px',
        }}>
          <Space>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'linear-gradient(135deg, #52c41a, #237804)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <UserOutlined style={{ fontSize: 22, color: '#fff' }} />
            </div>
            <div>
              <Title level={4} style={{ color: '#fff', margin: 0 }}>Customer Portal</Title>
              <Text style={{ color: '#8c9db5', fontSize: 13 }}>Welcome, {customerName}</Text>
            </div>
          </Space>
          <Button onClick={handleLogout} style={{ borderRadius: 8 }}>Sign Out</Button>
        </div>

        {/* Content */}
        <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <Tabs
            defaultActiveKey="jobs"
            items={[
              {
                key: 'jobs',
                label: (
                  <Space>
                    <ToolOutlined />
                    Jobs
                  </Space>
                ),
                children: <JobsTab />,
              },
              {
                key: 'certificates',
                label: (
                  <Space>
                    <SafetyCertificateOutlined />
                    Certificates
                  </Space>
                ),
                children: <CertificatesTab />,
              },
              {
                key: 'instruments',
                label: (
                  <Space>
                    <ExperimentOutlined />
                    Instruments
                  </Space>
                ),
                children: <InstrumentsTab />,
              },
            ]}
          />
        </Card>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Badge status="success" text={<Text style={{ color: '#8c9db5', fontSize: 12 }}>Secured Customer Portal · ISO/IEC 17025 NABL Accredited System</Text>} />
        </div>
      </div>
    </div>
  );
}

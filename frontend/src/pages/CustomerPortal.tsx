import { useState } from 'react';
import axios from 'axios';
import {
  Alert, Badge, Button, Card, Col, Form, Input, Rate, Row, Space, Table, Tabs, Tag, Typography, message, Modal,
} from 'antd';
import {
  ExperimentOutlined, FilePdfOutlined, SafetyCertificateOutlined,
  ToolOutlined, UserOutlined, WarningOutlined, StarOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

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
  RECEIVED: 'default', WAITING: 'orange', ASSIGNED: 'blue',
  IN_CALIBRATION: 'processing', PENDING_REVIEW: 'gold',
  CORRECTION_REQUIRED: 'error', APPROVED: 'cyan',
  CERTIFICATE_GENERATED: 'green', DELIVERED: 'success', CLOSED: 'default',
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
    { title: 'Instrument', key: 'instrument', render: (_: any, row: any) => row.instrument?.name ?? '—' },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (v: string) => <Tag color={JOB_STATUS_COLOR[v] ?? 'default'}>{v?.replace(/_/g, ' ')}</Tag>,
    },
    { title: 'Received', dataIndex: 'receivedAt', key: 'receivedAt', render: (v: string) => new Date(v).toLocaleDateString() },
    {
      title: 'Certificate', key: 'cert',
      render: (_: any, row: any) =>
        row.certificate?.isLocked
          ? <Tag color="green"><SafetyCertificateOutlined /> {row.certificate.certificateNumber}</Tag>
          : <Tag color="default">Pending</Tag>,
    },
  ];

  return (
    <Table columns={columns} dataSource={jobs} rowKey="id" loading={!loaded} pagination={{ pageSize: 15 }} size="small" />
  );
}

function CertificatesTab() {
  const [certs, setCerts] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  if (!loaded) {
    pGet('/portal/certificates').then((d) => { setCerts(d); setLoaded(true); });
  }

  const downloadCert = async (certId: string, certNumber: string) => {
    setDownloading(certId);
    try {
      const cert = await portalApi.get(`/portal/certificates/${certId}/download`).then(r => r.data);
      const job = cert.job;
      const inst = job?.instrument ?? {};
      const datasheets = job?.datasheets ?? [];

      // Build HTML certificate
      const rows = datasheets.flatMap((ds: any) =>
        (ds.observations ?? []).map((obs: any) =>
          `<tr><td>${obs.nominalValue ?? ''}</td><td>${obs.measuredValue ?? ''}</td><td>${obs.error ?? ''}</td><td>${obs.expandedUncertainty ?? ''}</td></tr>`
        )
      ).join('');

      const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Certificate ${certNumber}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; padding: 20px; }
  .header { text-align: center; border-bottom: 2px solid #1677ff; padding-bottom: 12px; margin-bottom: 16px; }
  .title { font-size: 18px; font-weight: bold; color: #1677ff; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; margin-bottom: 16px; }
  .label { color: #666; font-size: 11px; }
  .value { font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th { background: #e6f4ff; font-size: 11px; }
  th, td { border: 1px solid #ccc; padding: 5px 8px; text-align: center; }
  .footer { margin-top: 40px; display: flex; justify-content: space-between; }
  @media print { body { padding: 10px; } }
</style></head><body>
<div class="header">
  <div class="title">CALIBRATION CERTIFICATE</div>
  <div style="color:#666;font-size:11px;">Certificate No: ${cert.certificateNumber} | Issued: ${cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : ''}</div>
</div>
<div class="grid">
  <div><div class="label">Customer</div><div class="value">${job?.customer?.name ?? ''}</div></div>
  <div><div class="label">Job No</div><div class="value">${job?.jobNumber ?? ''}</div></div>
  <div><div class="label">Instrument</div><div class="value">${inst.name ?? ''}</div></div>
  <div><div class="label">Make / Model</div><div class="value">${[inst.make, inst.model].filter(Boolean).join(' / ')}</div></div>
  <div><div class="label">Serial No</div><div class="value">${inst.serialNumber ?? '—'}</div></div>
  <div><div class="label">Range</div><div class="value">${inst.range ?? '—'}</div></div>
  <div><div class="label">Certificate Type</div><div class="value">${cert.type ?? 'NABL'}</div></div>
</div>
${rows ? `<div style="font-weight:600;margin-bottom:6px;">Calibration Results</div>
<table><thead><tr><th>Nominal</th><th>Measured</th><th>Error</th><th>Expanded Uncertainty</th></tr></thead>
<tbody>${rows}</tbody></table>` : '<p style="color:#888">No observation data recorded.</p>'}
<div class="footer">
  <div><div class="label">Traceability</div><div class="value">NABL/NPL/BIPM</div></div>
  <div style="text-align:right"><div style="font-weight:600">Authorized Signatory</div><div class="label" style="margin-top:32px">Technical Manager</div></div>
</div>
<script>window.onload=()=>window.print();</script>
</body></html>`;

      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? 'Download failed');
    } finally {
      setDownloading(null);
    }
  };

  const columns = [
    { title: 'Cert. No.', dataIndex: 'certificateNumber', key: 'certificateNumber', render: (v: string) => <Text strong>{v}</Text> },
    { title: 'Instrument', key: 'instrument', render: (_: any, row: any) => row.job?.instrument?.name ?? '—' },
    { title: 'Serial No.', key: 'serial', render: (_: any, row: any) => row.job?.instrument?.serialNumber ?? '—' },
    { title: 'Issue Date', dataIndex: 'issueDate', key: 'issueDate', render: (v: string) => new Date(v).toLocaleDateString() },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (v: string) => <Tag color={v === 'NABL' ? 'blue' : 'default'}>{v ?? 'NABL'}</Tag> },
    {
      title: 'Action', key: 'action',
      render: (_: any, row: any) => (
        <Button
          size="small"
          icon={<FilePdfOutlined />}
          loading={downloading === row.id}
          onClick={() => downloadCert(row.id, row.certificateNumber)}
          type="primary"
          ghost
        >
          Download
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="Click Download to open a print-ready certificate in a new tab. Use your browser's Print function (Ctrl+P) to save as PDF."
        style={{ marginBottom: 8 }}
      />
      <Table columns={columns} dataSource={certs} rowKey="id" loading={!loaded} pagination={{ pageSize: 15 }} size="small" />
    </Space>
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
      const filtered = jobs
        .filter((j: any) => j.instrument?.id === instrumentId)
        .sort((a: any, b: any) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
      setHistory((h) => ({ ...h, [instrumentId]: filtered }));
      setExpandedInstrumentId(instrumentId);
    });
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (v: string) => <Text strong>{v}</Text> },
    { title: 'Make', dataIndex: 'make', key: 'make', render: (v: any) => v ?? '—' },
    { title: 'Serial No.', dataIndex: 'serialNumber', key: 'serialNumber', render: (v: any) => v ?? '—' },
    { title: 'Last Calibrated', dataIndex: 'lastCalibrationDate', key: 'lastCal', render: (v: string | null) => v ? new Date(v).toLocaleDateString() : '—' },
    {
      title: 'Next Due Date', dataIndex: 'nextDueDate', key: 'nextDue',
      render: (v: string | null) =>
        v ? <Text strong style={{ color: dueDateColor(v) }}>{new Date(v).toLocaleDateString()}</Text> : '—',
    },
    {
      title: 'Status', dataIndex: 'nextDueDate', key: 'dueSt',
      render: (v: string | null) => {
        if (!v) return <Tag>No Due Date</Tag>;
        const diff = (new Date(v).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (diff < 0) return <Tag color="error">Overdue</Tag>;
        if (diff <= 30) return <Tag color="warning">Due Soon</Tag>;
        return <Tag color="success">OK</Tag>;
      },
    },
    {
      title: 'History', key: 'hist',
      render: (_: any, row: any) => (
        <Button size="small" type="link" onClick={() => loadHistory(row.id)}>
          {expandedInstrumentId === row.id ? 'Hide' : 'View History'}
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Table columns={columns} dataSource={instruments} rowKey="id" loading={!loaded} pagination={{ pageSize: 15 }} size="small" />
      {expandedInstrumentId && history[expandedInstrumentId] && (
        <Badge.Ribbon text="Calibration History" color="blue">
          <Card size="small" style={{ background: '#f0f5ff' }}>
            <Table
              size="small" rowKey="id" dataSource={history[expandedInstrumentId]} pagination={false}
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

function ComplaintTab() {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (vals: any) => {
    setSubmitting(true);
    try {
      await pPost('/portal/complaints', vals);
      setDone(true);
      form.resetFields();
      message.success('Complaint submitted. The lab team will review it.');
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? 'Submission failed');
    } finally { setSubmitting(false); }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', maxWidth: 600 }}>
      <div>
        <Title level={5} style={{ margin: 0 }}><WarningOutlined /> Raise a Complaint</Title>
        <Paragraph type="secondary" style={{ marginTop: 4 }}>
          Your complaint will be logged in the lab's quality system and reviewed by the team.
        </Paragraph>
      </div>
      {done && (
        <Alert
          type="success"
          showIcon
          message="Complaint submitted successfully"
          description="The lab's quality team will review your complaint and follow up."
          action={<Button size="small" onClick={() => setDone(false)}>Submit Another</Button>}
        />
      )}
      {!done && (
        <Card style={{ borderRadius: 12 }}>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item name="subject" label="Subject" rules={[{ required: true, message: 'Please enter a subject' }]}>
              <Input placeholder="e.g. Certificate delay, Incorrect measurement, etc." />
            </Form.Item>
            <Form.Item name="description" label="Description" rules={[{ required: true, message: 'Please describe your complaint' }]}>
              <Input.TextArea rows={5} placeholder="Please describe your complaint in detail — include job numbers, dates, and any other relevant information." />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} icon={<WarningOutlined />} danger>
              Submit Complaint
            </Button>
          </Form>
        </Card>
      )}
    </Space>
  );
}

function FeedbackTab() {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (vals: any) => {
    setSubmitting(true);
    try {
      await pPost('/portal/feedback', vals);
      setDone(true);
      form.resetFields();
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? 'Submission failed');
    } finally { setSubmitting(false); }
  };

  const ratingDesc: Record<number, string> = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', maxWidth: 600 }}>
      <div>
        <Title level={5} style={{ margin: 0 }}><StarOutlined /> Share Your Feedback</Title>
        <Paragraph type="secondary" style={{ marginTop: 4 }}>
          Help us improve by rating your experience. Your feedback is valuable.
        </Paragraph>
      </div>
      {done ? (
        <Alert
          type="success"
          showIcon
          message="Thank you for your feedback!"
          description="Your ratings have been recorded and will help us improve our services."
          action={<Button size="small" onClick={() => setDone(false)}>Submit Again</Button>}
        />
      ) : (
        <Card style={{ borderRadius: 12 }}>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Row gutter={24}>
              <Col xs={24} sm={12}>
                <Form.Item name="serviceRating" label="Service Quality" rules={[{ required: true, message: 'Required' }]} initialValue={5}>
                  <Rate tooltips={Object.values(ratingDesc)} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="qualityRating" label="Calibration Quality" rules={[{ required: true, message: 'Required' }]} initialValue={5}>
                  <Rate tooltips={Object.values(ratingDesc)} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="tatRating" label="Turnaround Time" rules={[{ required: true, message: 'Required' }]} initialValue={5}>
                  <Rate tooltips={Object.values(ratingDesc)} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="supportRating" label="Customer Support" rules={[{ required: true, message: 'Required' }]} initialValue={5}>
                  <Rate tooltips={Object.values(ratingDesc)} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="comments" label="Additional Comments">
              <Input.TextArea rows={4} placeholder="Any specific feedback, suggestions, or compliments..." />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} icon={<StarOutlined />}>
              Submit Feedback
            </Button>
          </Form>
        </Card>
      )}
    </Space>
  );
}

// ─────────────────── Main Component ──────────────────────────────────────────

export default function CustomerPortal() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('clms_portal_token'));
  const [customerName, setCustomerName] = useState(localStorage.getItem('clms_portal_customer') ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form] = Form.useForm();

  const handleLogin = async (values: { email: string; password: string; labAccreditationCode: string }) => {
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
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, #52c41a, #237804)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', boxShadow: '0 8px 32px rgba(82,196,26,0.4)',
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
              Enter your registered email, password, and lab code
            </Text>

            {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 20 }} />}

            <Form form={form} onFinish={handleLogin} layout="vertical" size="large">
              <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}>
                <Input prefix={<UserOutlined style={{ color: '#bbb' }} />} placeholder="your@email.com" />
              </Form.Item>
              <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Please enter your password' }]}>
                <Input.Password prefix={<span style={{ color: '#bbb', fontSize: 14 }}>🔒</span>} placeholder="Your portal password" />
              </Form.Item>
              <Form.Item name="labAccreditationCode" label="Lab Accreditation Code" rules={[{ required: true }]}>
                <Input prefix={<ExperimentOutlined style={{ color: '#bbb' }} />} placeholder="e.g. CC-1234" />
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
                label: <Space><ToolOutlined />Jobs</Space>,
                children: <JobsTab />,
              },
              {
                key: 'certificates',
                label: <Space><SafetyCertificateOutlined />Certificates</Space>,
                children: <CertificatesTab />,
              },
              {
                key: 'instruments',
                label: <Space><ExperimentOutlined />Instruments</Space>,
                children: <InstrumentsTab />,
              },
              {
                key: 'complaint',
                label: <Space><WarningOutlined />Raise Complaint</Space>,
                children: <ComplaintTab />,
              },
              {
                key: 'feedback',
                label: <Space><StarOutlined />Feedback</Space>,
                children: <FeedbackTab />,
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

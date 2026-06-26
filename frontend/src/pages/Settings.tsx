import { useState } from 'react';
import {
  Card, Col, Row, Typography, Space, Tag, Button, Divider, Alert, Spin, message,
  Form, Input,
} from 'antd';
import {
  SettingOutlined, CheckCircleFilled, SafetyCertificateOutlined,
  FileTextOutlined, CompressOutlined, ApartmentOutlined, UserOutlined,
  DatabaseOutlined, EditOutlined, SaveOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLabSettings, updateLabSettings, loadSampleData, getUser } from '../api';

const { Title, Text, Paragraph } = Typography;

interface Template {
  id: string;
  name: string;
  description: string;
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
  borderColor: string;
}

const TEMPLATES: Template[] = [
  {
    id: 'nabl',
    name: 'NABL Accredited',
    description: 'Full NABL format with accreditation number, ULR, and complete traceability chain. Compliant with NABL Doc-17 requirements.',
    badge: 'NABL',
    badgeColor: '#1677ff',
    icon: <SafetyCertificateOutlined style={{ fontSize: 28, color: '#1677ff' }} />,
    borderColor: '#1677ff',
  },
  {
    id: 'iso17025',
    name: 'ISO/IEC 17025 Formal',
    description: 'Formal ISO report with uncertainty budget prominently displayed. Suitable for international clients and ILAC recognition.',
    badge: 'ISO',
    badgeColor: '#13c2c2',
    icon: <FileTextOutlined style={{ fontSize: 28, color: '#13c2c2' }} />,
    borderColor: '#13c2c2',
  },
  {
    id: 'compact',
    name: 'Compact Single-Page',
    description: 'Condensed one-page format for simple instruments. Ideal for quick turnaround and routine calibrations.',
    badge: 'Compact',
    badgeColor: '#52c41a',
    icon: <CompressOutlined style={{ fontSize: 28, color: '#52c41a' }} />,
    borderColor: '#52c41a',
  },
  {
    id: 'traceability',
    name: 'Detailed Traceability',
    description: 'Extended format with full reference standard chain and uncertainty breakdown. Best for high-precision calibrations.',
    badge: 'Detailed',
    badgeColor: '#722ed1',
    icon: <ApartmentOutlined style={{ fontSize: 28, color: '#722ed1' }} />,
    borderColor: '#722ed1',
  },
  {
    id: 'customer-branded',
    name: 'Customer-Branded',
    description: 'Simplified format with customer logo space and minimal lab branding. Popular for OEM and white-label calibrations.',
    badge: 'Custom',
    badgeColor: '#fa8c16',
    icon: <UserOutlined style={{ fontSize: 28, color: '#fa8c16' }} />,
    borderColor: '#fa8c16',
  },
];

export default function Settings() {
  const user = getUser();
  const labId = user?.labId ?? '';
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['lab-settings', labId],
    queryFn: () => getLabSettings(labId),
    enabled: !!labId,
  });

  const selectedTemplate: string = (settings as any)?.certTemplate ?? 'nabl';

  const saveMutation = useMutation({
    mutationFn: (templateId: string) => updateLabSettings(labId, { certTemplate: templateId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lab-settings', labId] });
      message.success('Certificate template saved');
    },
    onError: () => message.error('Failed to save settings'),
  });

  const [profileForm] = Form.useForm();
  const [profileEditing, setProfileEditing] = useState(false);
  const profileMutation = useMutation({
    mutationFn: (values: Record<string, string>) => updateLabSettings(labId, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lab-settings', labId] });
      message.success('Lab profile saved');
      setProfileEditing(false);
    },
    onError: () => message.error('Failed to save profile'),
  });

  const s = settings as any ?? {};

  const [seedLoading, setSeedLoading] = useState(false);
  const [seedResult, setSeedResult] = useState<{ type: 'success' | 'info'; msg: string } | null>(null);

  const handleLoadSampleData = async () => {
    setSeedLoading(true);
    setSeedResult(null);
    try {
      const res: any = await loadSampleData();
      if (res?.message?.includes('already')) {
        setSeedResult({ type: 'info', msg: res.message });
      } else {
        const counts = res?.counts
          ? Object.entries(res.counts)
              .map(([k, v]) => `${v} ${k}`)
              .join(', ')
          : '';
        setSeedResult({ type: 'success', msg: `${res?.message ?? 'Done'}${counts ? `: ${counts}` : ''}` });
        qc.invalidateQueries();
      }
    } catch (e: any) {
      setSeedResult({ type: 'info', msg: e?.response?.data?.message ?? 'Error loading sample data' });
    } finally {
      setSeedLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <Title level={3} style={{ margin: 0, color: '#1a1a2e' }}>
          <Space>
            <SettingOutlined style={{ color: '#1677ff' }} />
            Lab Settings
          </Space>
        </Title>
        <Text style={{ color: '#666', fontSize: 13 }}>
          Configure certificate templates and lab preferences
        </Text>
      </div>

      {/* Lab Information */}
      <Card
        style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: 24 }}
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#1677ff' }} />
            <span style={{ fontWeight: 700 }}>Lab Information</span>
          </Space>
        }
      >
        <Row gutter={[24, 12]}>
          <Col xs={24} md={8}>
            <Text type="secondary" style={{ fontSize: 12 }}>Lab Name</Text>
            <div style={{ fontWeight: 600, fontSize: 16, marginTop: 4 }}>{user?.lab?.name ?? '—'}</div>
          </Col>
          <Col xs={24} md={8}>
            <Text type="secondary" style={{ fontSize: 12 }}>Accreditation Number</Text>
            <div style={{ fontWeight: 600, fontSize: 16, marginTop: 4 }}>
              {user?.lab?.accreditationNumber ?? <Text type="secondary">Not set</Text>}
            </div>
          </Col>
          <Col xs={24} md={8}>
            <Text type="secondary" style={{ fontSize: 12 }}>Accreditation Status</Text>
            <div style={{ marginTop: 6 }}>
              <Tag color={user?.lab?.status === 'APPROVED' ? 'success' : 'warning'}>
                {user?.lab?.status ?? 'PENDING'}
              </Tag>
            </div>
          </Col>
        </Row>
        <Divider style={{ margin: '16px 0' }} />
        <Paragraph type="secondary" style={{ margin: 0, fontSize: 12 }}>
          Lab information is managed by the platform administrator. Contact support to update accreditation details.
        </Paragraph>
      </Card>

      {/* Lab Profile (editable) */}
      <Card
        style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: 24 }}
        title={
          <Space>
            <EditOutlined style={{ color: '#52c41a' }} />
            <span style={{ fontWeight: 700 }}>Lab Profile</span>
          </Space>
        }
        extra={
          profileEditing ? (
            <Space>
              <Button size="small" onClick={() => setProfileEditing(false)}>Cancel</Button>
              <Button
                size="small" type="primary" icon={<SaveOutlined />}
                loading={profileMutation.isPending}
                onClick={() => profileForm.submit()}
              >Save</Button>
            </Space>
          ) : (
            <Button
              size="small" icon={<EditOutlined />}
              onClick={() => {
                profileForm.setFieldsValue({
                  labPhone: s.labPhone ?? '',
                  labEmail: s.labEmail ?? '',
                  labWebsite: s.labWebsite ?? '',
                  logoUrl: s.logoUrl ?? '',
                  signatoryName: s.signatoryName ?? '',
                  signatoryDesignation: s.signatoryDesignation ?? '',
                });
                setProfileEditing(true);
              }}
            >Edit</Button>
          )
        }
      >
        {isLoading ? <Spin /> : profileEditing ? (
          <Form form={profileForm} layout="vertical" onFinish={(vals) => profileMutation.mutate(vals)}>
            <Row gutter={[16, 0]}>
              <Col xs={24} md={8}>
                <Form.Item name="labPhone" label="Phone">
                  <Input placeholder="+91 98765 43210" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="labEmail" label="Email" rules={[{ type: 'email', message: 'Enter valid email' }]}>
                  <Input placeholder="lab@example.com" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="labWebsite" label="Website">
                  <Input placeholder="https://www.yourlab.com" />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item name="logoUrl" label="Logo URL" help="Paste a public image URL or base64 data URL — shown on certificates">
                  <Input placeholder="https://..." />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="signatoryName" label="Authorized Signatory Name">
                  <Input placeholder="Dr. A. Kumar" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="signatoryDesignation" label="Authorized Signatory Designation">
                  <Input placeholder="Technical Manager / Quality Manager" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        ) : (
          <Row gutter={[24, 16]}>
            {[
              { label: 'Phone', value: s.labPhone },
              { label: 'Email', value: s.labEmail },
              { label: 'Website', value: s.labWebsite },
              { label: 'Authorized Signatory', value: s.signatoryName ? `${s.signatoryName}${s.signatoryDesignation ? ` — ${s.signatoryDesignation}` : ''}` : undefined },
              { label: 'Logo URL', value: s.logoUrl },
            ].map(({ label, value }) => (
              <Col xs={24} md={8} key={label}>
                <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
                <div style={{ fontWeight: 500, marginTop: 4, wordBreak: 'break-all', fontSize: 13 }}>
                  {value || <Text type="secondary">Not set</Text>}
                </div>
              </Col>
            ))}
            {s.logoUrl && (
              <Col xs={24}>
                <img src={s.logoUrl} alt="Lab Logo Preview" style={{ maxHeight: 60, maxWidth: 200, objectFit: 'contain', border: '1px solid #f0f0f0', borderRadius: 8, padding: 4 }} />
              </Col>
            )}
          </Row>
        )}
        <Divider style={{ margin: '16px 0 0' }} />
        <Paragraph type="secondary" style={{ margin: 0, fontSize: 12 }}>
          These details appear in the header and footer of all calibration certificates.
        </Paragraph>
      </Card>

      {/* Certificate Templates */}
      <Card
        style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: 24 }}
        title={
          <Space>
            <FileTextOutlined style={{ color: '#722ed1' }} />
            <span style={{ fontWeight: 700 }}>Certificate Templates</span>
          </Space>
        }
        extra={
          <Tag color="purple">Select one</Tag>
        }
      >
        <Paragraph type="secondary" style={{ marginBottom: 20, fontSize: 13 }}>
          Choose the certificate format used when generating calibration certificates. The selected template
          applies to all new certificates issued by this lab.
        </Paragraph>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        ) : (
          <Row gutter={[16, 16]}>
            {TEMPLATES.map((t) => {
              const isSelected = selectedTemplate === t.id;
              return (
                <Col xs={24} sm={12} md={8} key={t.id}>
                  <Card
                    hoverable
                    onClick={() => saveMutation.mutate(t.id)}
                    style={{
                      borderRadius: 14,
                      border: `2px solid ${isSelected ? t.borderColor : '#f0f0f0'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: isSelected ? t.borderColor + '08' : '#fff',
                      boxShadow: isSelected ? `0 4px 16px ${t.borderColor}30` : '0 2px 8px rgba(0,0,0,0.04)',
                      position: 'relative',
                    }}
                    styles={{ body: { padding: '20px 16px' } }}
                  >
                    {isSelected && (
                      <CheckCircleFilled
                        style={{
                          position: 'absolute', top: 12, right: 12,
                          color: t.borderColor, fontSize: 20,
                        }}
                      />
                    )}
                    <Space direction="vertical" size={10} style={{ width: '100%' }}>
                      <div>{t.icon}</div>
                      <div>
                        <Text strong style={{ fontSize: 14 }}>{t.name}</Text>
                        <div style={{ marginTop: 4 }}>
                          <Tag
                            style={{
                              background: t.badgeColor + '15',
                              color: t.badgeColor,
                              border: `1px solid ${t.badgeColor}40`,
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            {t.badge}
                          </Tag>
                        </div>
                      </div>
                      <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.5 }}>
                        {t.description}
                      </Text>
                      {isSelected && (
                        <Tag
                          icon={<CheckCircleFilled />}
                          color="success"
                          style={{ marginTop: 4, borderRadius: 8, fontWeight: 600 }}
                        >
                          Selected
                        </Tag>
                      )}
                    </Space>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Card>

      {/* Sample Data */}
      <Card
        style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
        title={
          <Space>
            <DatabaseOutlined style={{ color: '#fa8c16' }} />
            <span style={{ fontWeight: 700 }}>Sample Data</span>
          </Space>
        }
      >
        <Paragraph style={{ marginBottom: 16, fontSize: 13 }} type="secondary">
          Load realistic sample data to explore the system — customers, instruments, jobs, certificates,
          documents, and more. This is a one-time operation; running it again will do nothing if data is already present.
        </Paragraph>

        {seedResult && (
          <Alert
            type={seedResult.type}
            message={seedResult.msg}
            style={{ marginBottom: 16, borderRadius: 10 }}
            showIcon
            closable
            onClose={() => setSeedResult(null)}
          />
        )}

        <Button
          type="primary"
          icon={<DatabaseOutlined />}
          loading={seedLoading}
          onClick={handleLoadSampleData}
          style={{ borderRadius: 10, height: 42, fontWeight: 600 }}
          danger={false}
        >
          Load Sample Data
        </Button>
        <Text type="secondary" style={{ display: 'block', marginTop: 10, fontSize: 12 }}>
          Creates 5 customers, instruments, jobs, tasks, environmental records, invoices, quotations,
          NCRs, documents, and internal audits for demonstration purposes.
        </Text>
      </Card>
    </div>
  );
}

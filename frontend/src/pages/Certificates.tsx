import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button, Card, Col, Modal, Row, Space, Steps, Table, Tag, Typography, Alert,
} from 'antd';
import {
  SafetyCertificateOutlined, CheckCircleOutlined, ClockCircleOutlined,
  PrinterOutlined, LockOutlined,
} from '@ant-design/icons';
import { getJob, getJobs, signCertificate, openCertificateReport } from '../api';

const { Title, Text } = Typography;

const STAGES = ['ENGINEER', 'REVIEWER', 'TECHNICAL_MANAGER', 'QUALITY_MANAGER', 'FINAL_LOCK'];
const CERT_STATES = ['CERTIFICATE_GENERATED', 'DELIVERED', 'CLOSED'];

const STAGE_LABELS: Record<string, string> = {
  ENGINEER: 'Engineer', REVIEWER: 'Reviewer', TECHNICAL_MANAGER: 'Tech Manager',
  QUALITY_MANAGER: 'QA Manager', FINAL_LOCK: 'Final Lock',
};

export default function Certificates() {
  const qc = useQueryClient();
  const [openJob, setOpenJob] = useState<string | null>(null);

  const { data: jobs = [], isLoading } = useQuery({ queryKey: ['jobs', ''], queryFn: () => getJobs() });
  const certJobs = jobs.filter((j: any) => CERT_STATES.includes(j.status));

  const { data: detail } = useQuery({
    queryKey: ['job-detail', openJob],
    queryFn: () => getJob(openJob!),
    enabled: !!openJob,
  });
  const cert = detail?.certificate;
  const signedStages: string[] = (cert?.signatures || []).map((s: any) => s.stage);
  const nextStage = STAGES[signedStages.length];
  const currentStep = signedStages.length;

  const signMut = useMutation({
    mutationFn: (stage: string) => signCertificate(cert.id, stage),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-detail', openJob] });
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const STATUS_COLORS: Record<string, string> = {
    CERTIFICATE_GENERATED: 'blue', DELIVERED: 'green', CLOSED: 'default',
  };

  const columns = [
    {
      title: 'Job No.',
      dataIndex: 'jobNumber',
      key: 'jobNumber',
      render: (v: string) => <Text strong style={{ color: '#1677ff' }}>{v}</Text>,
    },
    {
      title: 'Customer',
      dataIndex: ['customer', 'name'],
      key: 'customer',
    },
    {
      title: 'Instrument',
      dataIndex: ['instrument', 'name'],
      key: 'instrument',
    },
    {
      title: 'Certificate No.',
      dataIndex: ['certificate', 'certificateNumber'],
      key: 'certNumber',
      render: (v: string) => v ? <Tag color="geekblue">{v}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => <Tag color={STATUS_COLORS[v] || 'default'}>{v.replace(/_/g, ' ')}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, row: any) => (
        <Button
          type="primary"
          size="small"
          icon={<SafetyCertificateOutlined />}
          onClick={() => setOpenJob(row.id)}
        >
          Open
        </Button>
      ),
    },
  ];

  const stepItems = STAGES.map((st, idx) => {
    const sig = (cert?.signatures || []).find((s: any) => s.stage === st);
    return {
      title: STAGE_LABELS[st],
      description: sig ? `Signed by ${sig.signedByName}` : (idx === currentStep && !cert?.isLocked ? 'Pending' : ''),
      icon: sig ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : (idx === currentStep ? <ClockCircleOutlined style={{ color: '#1677ff' }} /> : undefined),
    };
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <Space>
            <SafetyCertificateOutlined style={{ color: '#1677ff' }} />
            Certificates
          </Space>
        </Title>
        <Text type="secondary">View and sign calibration certificates</Text>
      </div>

      <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        {certJobs.length === 0 && !isLoading && (
          <Alert
            type="info"
            message="No certificates yet"
            description="Generate a certificate from an APPROVED job on the Jobs page."
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Table
          columns={columns}
          dataSource={certJobs}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 15, showTotal: (t) => `Total ${t} certificates` }}
          size="middle"
        />
      </Card>

      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#1677ff' }} />
            <span>{cert?.certificateNumber || 'Certificate'}</span>
            {cert?.isLocked && <Tag color="green" icon={<LockOutlined />}>Finalised</Tag>}
          </Space>
        }
        open={!!openJob}
        onCancel={() => setOpenJob(null)}
        footer={null}
        width={680}
      >
        {cert ? (
          <div style={{ padding: '8px 0' }}>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '12px 16px' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Type</Text>
                  <div><Text strong>{cert.type}</Text></div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '12px 16px' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Locked (Immutable)</Text>
                  <div><Tag color={cert.isLocked ? 'green' : 'orange'}>{cert.isLocked ? 'Yes' : 'No'}</Tag></div>
                </div>
              </Col>
            </Row>

            <Text strong style={{ display: 'block', marginBottom: 16 }}>Signature Workflow</Text>
            <Steps
              current={currentStep}
              items={stepItems}
              direction="vertical"
              size="small"
              status={cert.isLocked ? 'finish' : 'process'}
              style={{ marginBottom: 24 }}
            />

            <Space>
              {!cert.isLocked && nextStage && (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  loading={signMut.isPending}
                  onClick={() => signMut.mutate(nextStage)}
                >
                  Sign as {STAGE_LABELS[nextStage] || nextStage}
                </Button>
              )}
              <Button
                icon={<PrinterOutlined />}
                onClick={() => openCertificateReport(cert.id)}
              >
                Print / View Certificate
              </Button>
            </Space>

            {cert.isLocked && (
              <Alert
                type="success"
                message="Certificate is finalised and immutable"
                icon={<LockOutlined />}
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Text type="secondary">Loading certificate details...</Text>
          </div>
        )}
      </Modal>
    </div>
  );
}

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert, Badge, Button, Card, Col, Descriptions, Drawer, Input, Row, Space, Steps, Tag, Typography, message, Spin,
} from 'antd';
import {
  SafetyCertificateOutlined, CheckCircleOutlined, ClockCircleOutlined,
  PrinterOutlined, LockOutlined, UserOutlined, FileDoneOutlined, PlusCircleOutlined, ExportOutlined,
} from '@ant-design/icons';
import { getJob, getJobs, signCertificate, generateCertificate, openCertificateReport, getUser } from '../api';
import { exportToCsv } from '../utils/export';

const { Title, Text } = Typography;

const STAGES = ['TECHNICAL_MANAGER', 'QUALITY_MANAGER'];
const STAGE_LABELS: Record<string, string> = {
  TECHNICAL_MANAGER: 'Technical Manager',
  QUALITY_MANAGER: 'QA Manager',
};
const CERT_STATUSES = ['CERTIFICATE_GENERATED', 'DELIVERED', 'CLOSED'];

const STATUS_COLORS: Record<string, string> = {
  CERTIFICATE_GENERATED: 'blue',
  DELIVERED: 'green',
  CLOSED: 'default',
};

export default function Certificates() {
  const qc = useQueryClient();
  const me = getUser();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs', ''],
    queryFn: () => getJobs(),
  });

  const certJobs = (jobs as any[]).filter((j: any) => CERT_STATUSES.includes(j.status)).filter((j: any) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return (
      j.jobNumber?.toLowerCase().includes(q) ||
      j.customer?.name?.toLowerCase().includes(q) ||
      j.instrument?.name?.toLowerCase().includes(q) ||
      j.certificate?.certificateNumber?.toLowerCase().includes(q)
    );
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['job-detail', selectedJobId],
    queryFn: () => getJob(selectedJobId!),
    enabled: !!selectedJobId,
  });

  const cert = detail?.certificate;
  const signedStages: string[] = (cert?.signatures || []).map((s: any) => s.stage);
  const nextStage = STAGES[signedStages.length];

  const isAdmin = me?.role === 'LAB_ADMIN' || me?.role === 'TECHNICAL_MANAGER';

  const signMut = useMutation({
    mutationFn: (stage: string) => signCertificate(cert!.id, stage),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-detail', selectedJobId] });
      qc.invalidateQueries({ queryKey: ['jobs'] });
      message.success('Signature applied successfully');
    },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Failed to sign'),
  });

  const genMut = useMutation({
    mutationFn: (jobId: string) => generateCertificate({ jobId, type: 'NABL' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-detail', selectedJobId] });
      qc.invalidateQueries({ queryKey: ['jobs'] });
      message.success('Certificate generated successfully');
    },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Failed to generate certificate'),
  });


  const signatureSteps = STAGES.map((st, idx) => {
    const sig = (cert?.signatures || []).find((s: any) => s.stage === st);
    return {
      title: <span style={{ fontSize: 12 }}>{STAGE_LABELS[st]}</span>,
      description: sig
        ? <Text type="success" style={{ fontSize: 11 }}>✓ {sig.signedByName}</Text>
        : (idx === signedStages.length && !cert?.isLocked
          ? <Text type="secondary" style={{ fontSize: 11 }}>Pending</Text>
          : null),
      icon: sig
        ? <CheckCircleOutlined style={{ color: '#52c41a' }} />
        : (idx === signedStages.length
          ? <ClockCircleOutlined style={{ color: '#1677ff' }} />
          : undefined),
    };
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <Space>
            <SafetyCertificateOutlined style={{ color: '#1677ff' }} />
            Certificates
          </Space>
        </Title>
        <Text type="secondary">
          Review, approve, and sign calibration certificates
        </Text>
      </div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <Input.Search
          placeholder="Search by job no., customer, instrument, cert no..."
          allowClear
          value={searchText}
          onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
          style={{ width: 340 }}
        />
        <Button
          icon={<ExportOutlined />}
          onClick={() => exportToCsv('certificates.csv', certJobs as any[], [
            { key: 'jobNumber', label: 'Job No' },
            { key: 'certificate.certificateNumber', label: 'Cert Number' },
            { key: 'customer.name', label: 'Customer' },
            { key: 'instrument.name', label: 'Instrument' },
            { key: 'status', label: 'Status' },
            { key: 'certificate.isLocked', label: 'Locked' },
          ])}
        >
          Export CSV
        </Button>
      </div>

      {/* Info banner */}
      <Alert
        type="info"
        showIcon
        message='Certificates are generated from APPROVED jobs. Go to Jobs → Status → "Generate Certificate" to create one.'
        style={{ marginBottom: 20, borderRadius: 8 }}
      />

      {/* Certificate cards */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
      )}

      {!isLoading && certJobs.length === 0 && (
        <Card style={{ textAlign: 'center', borderRadius: 12, padding: '48px 0' }}>
          <FileDoneOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
          <div>
            <Text type="secondary" style={{ fontSize: 15 }}>No certificates yet</Text>
          </div>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Approve a calibration job and generate its certificate from the Jobs page.
          </Text>
        </Card>
      )}

      <Row gutter={[16, 16]}>
        {certJobs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((job: any) => {
          const sigs: any[] = job.certificate?.signatures || [];
          const sigCount = sigs.length;
          const isLocked = job.certificate?.isLocked;
          const certNum = job.certificate?.certificateNumber;

          return (
            <Col xs={24} sm={24} md={12} lg={8} key={job.id}>
              <Card
                hoverable
                style={{
                  borderRadius: 12,
                  border: isLocked ? '1.5px solid #b7eb8f' : '1.5px solid #e6f4ff',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }}
                actions={[
                  <Button
                    key="review"
                    type="primary"
                    icon={<SafetyCertificateOutlined />}
                    onClick={() => setSelectedJobId(job.id)}
                    size="small"
                  >
                    Review & Sign
                  </Button>,
                ]}
              >
                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <Text strong style={{ color: '#1677ff', fontSize: 15 }}>{job.jobNumber}</Text>
                      <div style={{ marginTop: 2 }}>
                        {certNum
                          ? <Tag color="geekblue" style={{ fontSize: 11 }}>{certNum}</Tag>
                          : <Tag color="orange" style={{ fontSize: 11 }}>Cert# Pending</Tag>
                        }
                      </div>
                    </div>
                    <Tag color={STATUS_COLORS[job.status] || 'default'}>
                      {job.status?.replace(/_/g, ' ')}
                    </Tag>
                  </div>

                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Customer</Text>
                    <div><Text strong>{job.customer?.name}</Text></div>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Instrument</Text>
                    <div><Text>{job.instrument?.name}</Text></div>
                  </div>

                  <div style={{ marginTop: 4 }}>
                    {isLocked ? (
                      <Tag color="green" icon={<LockOutlined />}>Finalised &amp; Locked</Tag>
                    ) : (
                      <Badge
                        status="processing"
                        text={
                          <Text style={{ fontSize: 12 }}>
                            {sigCount} / {STAGES.length} signatures — next: {STAGE_LABELS[STAGES[sigCount]] ?? 'complete'}
                          </Text>
                        }
                      />
                    )}
                  </div>
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>

      {certJobs.length > PAGE_SIZE && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Button.Group>
            <Button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</Button>
            <Button disabled>{currentPage} / {Math.ceil(certJobs.length / PAGE_SIZE)}</Button>
            <Button disabled={currentPage >= Math.ceil(certJobs.length / PAGE_SIZE)} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
          </Button.Group>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, certJobs.length)} of {certJobs.length}
            </Text>
          </div>
        </div>
      )}

      {/* ── Certificate Review Drawer ── */}
      <Drawer
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#1677ff' }} />
            <span>Certificate Review</span>
            {cert?.isLocked && <Tag color="green" icon={<LockOutlined />}>Finalised</Tag>}
          </Space>
        }
        open={!!selectedJobId}
        onClose={() => setSelectedJobId(null)}
        width={560}
        footer={
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            {!cert && !detailLoading && detail && isAdmin && (
              <Button
                type="primary"
                icon={<PlusCircleOutlined />}
                loading={genMut.isPending}
                onClick={() => genMut.mutate(detail.id)}
              >
                Generate Certificate
              </Button>
            )}
            {cert && (
              <>
                <Button
                  icon={<PrinterOutlined />}
                  onClick={() => openCertificateReport(cert.id)}
                >
                  Print / View PDF
                </Button>
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
              </>
            )}
          </Space>
        }
      >
        {detailLoading && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" tip="Loading certificate..." />
          </div>
        )}

        {!detailLoading && detail && !cert && (
          <Alert
            type="warning"
            message="Certificate not yet generated"
            description={
              isAdmin
                ? 'This job does not have a certificate record. Click "Generate Certificate" below to create one.'
                : 'This job does not have a certificate record yet. Please ask a Lab Admin or Technical Manager to generate it.'
            }
            showIcon
          />
        )}

        {!detailLoading && cert && (
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            {/* Job / Cert info */}
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="Job No." span={1}>
                <Text strong>{detail?.jobNumber}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Certificate No." span={1}>
                <Tag color="geekblue">{cert.certificateNumber}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Customer" span={2}>
                {detail?.customer?.name}
              </Descriptions.Item>
              <Descriptions.Item label="Instrument" span={2}>
                {detail?.instrument?.name}
                {detail?.instrument?.serialNumber && (
                  <Text type="secondary"> · S/N {detail.instrument.serialNumber}</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Type" span={1}>
                <Tag color="blue">{cert.type}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Locked" span={1}>
                {cert.isLocked
                  ? <Tag color="green" icon={<LockOutlined />}>Yes — Immutable</Tag>
                  : <Tag color="orange">No — Pending signatures</Tag>}
              </Descriptions.Item>
            </Descriptions>

            {/* Signature workflow */}
            <div>
              <Text strong style={{ display: 'block', marginBottom: 16 }}>
                Signature Workflow ({signedStages.length} / {STAGES.length} complete)
              </Text>
              <Steps
                direction="vertical"
                size="small"
                current={signedStages.length}
                status={cert.isLocked ? 'finish' : 'process'}
                items={signatureSteps}
              />
            </div>

            {cert.isLocked && (
              <Alert
                type="success"
                message="Certificate is finalised and immutable"
                description="All signatures have been collected. This certificate is now permanently locked and ready for delivery."
                showIcon
                icon={<LockOutlined />}
              />
            )}

            {!cert.isLocked && nextStage && (
              <Alert
                type="info"
                showIcon
                icon={<UserOutlined />}
                message={`Awaiting: ${STAGE_LABELS[nextStage]}`}
                description={`The next signature required is from: ${STAGE_LABELS[nextStage]}. Click "Sign" below to apply your signature.`}
              />
            )}
          </Space>
        )}
      </Drawer>
    </div>
  );
}

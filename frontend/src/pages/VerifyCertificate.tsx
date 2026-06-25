import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, Result, Spin, Descriptions, Tag, Typography, Space } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { api } from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface VerifyResult {
  valid: boolean;
  reason?: string;
  certificate?: {
    certificateNumber: string;
    type: string;
    issueDate: string;
    isLocked: boolean;
    labName?: string;
    labAccreditation?: string;
    customerName: string;
    instrumentName: string;
    instrumentMake?: string;
    instrumentModel?: string;
    instrumentSerial?: string;
    jobNumber: string;
  };
}

export default function VerifyCertificate() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const hash = params.get('h') ?? '';
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/portal/verify/${id}`, { params: { h: hash } })
      .then((r) => setResult(r.data))
      .catch(() => setResult({ valid: false, reason: 'Could not reach verification server' }))
      .finally(() => setLoading(false));
  }, [id, hash]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4ff' }}>
        <Spin size="large" tip="Verifying certificate..." />
      </div>
    );
  }

  const cert = result?.certificate;

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Card style={{ maxWidth: 640, width: '100%', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <SafetyCertificateOutlined style={{ fontSize: 40, color: '#1677ff' }} />
          <Title level={3} style={{ margin: '8px 0 0' }}>Certificate Verification</Title>
          <Text type="secondary">CLMS · Calibration Laboratory Management System</Text>
        </div>

        {result?.valid ? (
          <>
            <Result
              icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              status="success"
              title="Certificate is Authentic"
              subTitle="This calibration certificate has been verified and its integrity is confirmed."
            />
            {cert && (
              <Descriptions column={1} bordered size="small" style={{ marginTop: 16 }}>
                <Descriptions.Item label="Certificate No.">
                  <Space>
                    <strong>{cert.certificateNumber}</strong>
                    <Tag color="blue">{cert.type}</Tag>
                    {cert.isLocked && <Tag color="green">Locked / Finalised</Tag>}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Issue Date">{dayjs(cert.issueDate).format('DD MMM YYYY')}</Descriptions.Item>
                <Descriptions.Item label="Laboratory">{cert.labName ?? '—'}{cert.labAccreditation && ` (${cert.labAccreditation})`}</Descriptions.Item>
                <Descriptions.Item label="Customer">{cert.customerName}</Descriptions.Item>
                <Descriptions.Item label="Instrument">{cert.instrumentName}</Descriptions.Item>
                <Descriptions.Item label="Make / Model">{[cert.instrumentMake, cert.instrumentModel].filter(Boolean).join(' / ') || '—'}</Descriptions.Item>
                <Descriptions.Item label="Serial No.">{cert.instrumentSerial ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Job No.">{cert.jobNumber}</Descriptions.Item>
              </Descriptions>
            )}
          </>
        ) : (
          <Result
            icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
            status="error"
            title="Verification Failed"
            subTitle={result?.reason ?? 'This certificate could not be verified.'}
          />
        )}

        <div style={{ textAlign: 'center', marginTop: 24, color: '#8c8c8c', fontSize: 12 }}>
          Powered by CLMS · ISO/IEC 17025
        </div>
      </Card>
    </div>
  );
}

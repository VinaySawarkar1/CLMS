import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, Table, Tag, Button, Space, Typography, Segmented, Popconfirm, message, Statistic, Row, Col,
} from 'antd';
import {
  BankOutlined, CheckCircleOutlined, CloseCircleOutlined, StopOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { getLabs, updateLabStatus } from '../api';

const { Title, Text } = Typography;

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'gold',
  APPROVED: 'green',
  REJECTED: 'red',
  SUSPENDED: 'volcano',
};

export default function Labs() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>('ALL');

  const { data: labs = [], isLoading } = useQuery({
    queryKey: ['labs', filter],
    queryFn: () => getLabs(filter === 'ALL' ? undefined : filter),
  });

  const mutate = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateLabStatus(id, status),
    onSuccess: () => {
      message.success('Lab status updated');
      qc.invalidateQueries({ queryKey: ['labs'] });
    },
    onError: () => message.error('Failed to update lab'),
  });

  const counts = {
    pending: labs.filter((l: any) => l.status === 'PENDING').length,
    approved: labs.filter((l: any) => l.status === 'APPROVED').length,
    total: labs.length,
  };

  const columns = [
    {
      title: 'Lab', dataIndex: 'name', key: 'name',
      render: (name: string, row: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{row.contactEmail}</Text>
        </Space>
      ),
    },
    { title: 'Accreditation', dataIndex: 'accreditationNumber', key: 'acc', render: (v: string) => v || '—' },
    {
      title: 'Users', dataIndex: ['_count', 'users'], key: 'users',
      render: (_: any, row: any) => row._count?.users ?? 0,
    },
    {
      title: 'Jobs', dataIndex: ['_count', 'jobs'], key: 'jobs',
      render: (_: any, row: any) => row._count?.jobs ?? 0,
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={STATUS_COLOR[s]}>{s}</Tag>,
    },
    {
      title: 'Registered', dataIndex: 'createdAt', key: 'createdAt',
      render: (d: string) => new Date(d).toLocaleDateString(),
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: any, row: any) => (
        <Space>
          {row.status !== 'APPROVED' && (
            <Popconfirm title="Approve this lab?" onConfirm={() => mutate.mutate({ id: row.id, status: 'APPROVED' })}>
              <Button type="primary" size="small" icon={<CheckCircleOutlined />}>Approve</Button>
            </Popconfirm>
          )}
          {row.status === 'PENDING' && (
            <Popconfirm title="Reject this lab?" onConfirm={() => mutate.mutate({ id: row.id, status: 'REJECTED' })}>
              <Button danger size="small" icon={<CloseCircleOutlined />}>Reject</Button>
            </Popconfirm>
          )}
          {row.status === 'APPROVED' && (
            <Popconfirm title="Suspend this lab?" onConfirm={() => mutate.mutate({ id: row.id, status: 'SUSPENDED' })}>
              <Button danger size="small" icon={<StopOutlined />}>Suspend</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3} style={{ margin: 0 }}><BankOutlined /> Calibration Labs</Title>
        <Text type="secondary">Review and manage lab registrations across the platform</Text>
      </div>

      <Row gutter={16}>
        <Col span={8}>
          <Card><Statistic title="Pending Approval" value={counts.pending} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#faad14' }} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="Active Labs" value={counts.approved} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="Total Labs" value={counts.total} prefix={<BankOutlined />} /></Card>
        </Col>
      </Row>

      <Card>
        <Segmented
          options={['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']}
          value={filter}
          onChange={(v) => setFilter(v as string)}
          style={{ marginBottom: 16 }}
        />
        <Table
          rowKey="id"
          loading={isLoading}
          dataSource={labs}
          columns={columns}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </Space>
  );
}

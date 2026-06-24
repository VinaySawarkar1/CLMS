import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, Table, Tag, Button, Space, Typography, Segmented, Popconfirm, message, Statistic, Row, Col,
  Modal, Form, Input, Drawer,
} from 'antd';
import {
  BankOutlined, CheckCircleOutlined, CloseCircleOutlined, StopOutlined, ClockCircleOutlined,
  UserOutlined, KeyOutlined, TeamOutlined,
} from '@ant-design/icons';
import { getLabs, updateLabStatus, getLabUsers, resetLabUserPassword } from '../api';

const { Title, Text } = Typography;

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'gold',
  APPROVED: 'green',
  REJECTED: 'red',
  SUSPENDED: 'volcano',
};

const ROLE_COLOR: Record<string, string> = {
  LAB_ADMIN: 'purple',
  TECHNICAL_MANAGER: 'geekblue',
  CALIBRATION_ENGINEER: 'cyan',
  SERVICE_ENGINEER: 'blue',
  DATA_ENTRY_OPERATOR: 'default',
};

export default function Labs() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>('ALL');
  const [selectedLab, setSelectedLab] = useState<any>(null);
  const [usersDrawerOpen, setUsersDrawerOpen] = useState(false);
  const [resetModal, setResetModal] = useState<{ open: boolean; user: any; labId: string }>({ open: false, user: null, labId: '' });
  const [resetForm] = Form.useForm();

  const { data: labs = [], isLoading } = useQuery({
    queryKey: ['labs', filter],
    queryFn: () => getLabs(filter === 'ALL' ? undefined : filter),
  });

  const { data: labUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['lab-users-admin', selectedLab?.id],
    queryFn: () => getLabUsers(selectedLab!.id),
    enabled: Boolean(selectedLab?.id && usersDrawerOpen),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateLabStatus(id, status),
    onSuccess: () => {
      message.success('Lab status updated');
      qc.invalidateQueries({ queryKey: ['labs'] });
    },
    onError: () => message.error('Failed to update lab'),
  });

  const resetMut = useMutation({
    mutationFn: ({ labId, userId, newPassword }: { labId: string; userId: string; newPassword: string }) =>
      resetLabUserPassword(labId, userId, newPassword),
    onSuccess: () => {
      message.success('Password reset successfully');
      setResetModal({ open: false, user: null, labId: '' });
      resetForm.resetFields();
    },
    onError: () => message.error('Failed to reset password'),
  });

  const counts = {
    pending: (labs as any[]).filter((l: any) => l.status === 'PENDING').length,
    approved: (labs as any[]).filter((l: any) => l.status === 'APPROVED').length,
    total: (labs as any[]).length,
  };

  const userColumns = [
    {
      title: 'Name', dataIndex: 'fullName', key: 'fullName',
      render: (n: string, row: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{n}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{row.email}</Text>
        </Space>
      ),
    },
    {
      title: 'Role', dataIndex: 'role', key: 'role',
      render: (r: string) => <Tag color={ROLE_COLOR[r]}>{r.replace(/_/g, ' ')}</Tag>,
    },
    {
      title: 'Active', dataIndex: 'isActive', key: 'isActive',
      render: (a: boolean) => <Tag color={a ? 'green' : 'red'}>{a ? 'Active' : 'Inactive'}</Tag>,
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: any, row: any) => (
        <Button
          size="small"
          icon={<KeyOutlined />}
          onClick={() => {
            setResetModal({ open: true, user: row, labId: selectedLab!.id });
            resetForm.resetFields();
          }}
        >
          Reset Password
        </Button>
      ),
    },
  ];

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
      title: 'Users', key: 'users',
      render: (_: any, row: any) => row._count?.users ?? 0,
    },
    {
      title: 'Jobs', key: 'jobs',
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
        <Space wrap>
          <Button
            size="small"
            icon={<TeamOutlined />}
            onClick={() => { setSelectedLab(row); setUsersDrawerOpen(true); }}
          >
            Users
          </Button>
          {row.status !== 'APPROVED' && (
            <Popconfirm title="Approve this lab?" onConfirm={() => statusMut.mutate({ id: row.id, status: 'APPROVED' })}>
              <Button type="primary" size="small" icon={<CheckCircleOutlined />}>Approve</Button>
            </Popconfirm>
          )}
          {row.status === 'PENDING' && (
            <Popconfirm title="Reject this lab?" onConfirm={() => statusMut.mutate({ id: row.id, status: 'REJECTED' })}>
              <Button danger size="small" icon={<CloseCircleOutlined />}>Reject</Button>
            </Popconfirm>
          )}
          {row.status === 'APPROVED' && (
            <Popconfirm title="Suspend this lab?" onConfirm={() => statusMut.mutate({ id: row.id, status: 'SUSPENDED' })}>
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
          dataSource={labs as any[]}
          columns={columns}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Users Drawer */}
      <Drawer
        title={
          <Space>
            <UserOutlined />
            <span>Users — {selectedLab?.name}</span>
          </Space>
        }
        width={600}
        open={usersDrawerOpen}
        onClose={() => setUsersDrawerOpen(false)}
      >
        <Table
          rowKey="id"
          loading={usersLoading}
          dataSource={labUsers as any[]}
          columns={userColumns}
          pagination={false}
          size="small"
        />
      </Drawer>

      {/* Reset Password Modal */}
      <Modal
        title={
          <Space>
            <KeyOutlined />
            <span>Reset Password — {resetModal.user?.fullName}</span>
          </Space>
        }
        open={resetModal.open}
        onCancel={() => { setResetModal({ open: false, user: null, labId: '' }); resetForm.resetFields(); }}
        onOk={() => resetForm.submit()}
        confirmLoading={resetMut.isPending}
        okText="Reset Password"
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          Resetting password for: <strong>{resetModal.user?.email}</strong>
        </Text>
        <Form form={resetForm} layout="vertical" onFinish={(v) => resetMut.mutate({ labId: resetModal.labId, userId: resetModal.user?.id, newPassword: v.newPassword })}>
          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[{ required: true, min: 6, message: 'Minimum 6 characters' }]}
          >
            <Input.Password placeholder="Enter new password" />
          </Form.Item>
          <Form.Item
            name="confirm"
            label="Confirm Password"
            dependencies={['newPassword']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirm new password" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, Table, Tag, Button, Space, Typography, Segmented, Popconfirm, message, Statistic, Row, Col,
  Modal, Form, Input, Drawer, Select, DatePicker, Progress, Tooltip, Badge,
} from 'antd';
import {
  BankOutlined, CheckCircleOutlined, CloseCircleOutlined, StopOutlined, ClockCircleOutlined,
  UserOutlined, KeyOutlined, TeamOutlined, CrownOutlined, RiseOutlined, GlobalOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getLabs, updateLabStatus, getLabUsers, resetLabUserPassword, updateLabPlan, getPlatformStats } from '../api';

const { Title, Text } = Typography;

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'gold', APPROVED: 'green', REJECTED: 'red', SUSPENDED: 'volcano',
};

const ROLE_COLOR: Record<string, string> = {
  LAB_ADMIN: 'purple', TECHNICAL_MANAGER: 'geekblue', CALIBRATION_ENGINEER: 'cyan',
  SERVICE_ENGINEER: 'blue', DATA_ENTRY_OPERATOR: 'default',
};

const PLAN_COLOR: Record<string, string> = {
  STARTER: 'default', GROWTH: 'blue', BUSINESS: 'gold', ENTERPRISE: 'purple',
};

const PLAN_LABEL: Record<string, string> = {
  STARTER: 'Starter (25 users)',
  GROWTH: 'Growth (50 users)',
  BUSINESS: 'Business (100 users)',
  ENTERPRISE: 'Enterprise (Custom)',
};

const PLAN_MAX: Record<string, number> = {
  STARTER: 25, GROWTH: 50, BUSINESS: 100, ENTERPRISE: 999999,
};

export default function Labs() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>('ALL');
  const [selectedLab, setSelectedLab] = useState<any>(null);
  const [usersDrawerOpen, setUsersDrawerOpen] = useState(false);
  const [resetModal, setResetModal] = useState<{ open: boolean; user: any; labId: string }>({ open: false, user: null, labId: '' });
  const [planModal, setPlanModal] = useState<{ open: boolean; lab: any }>({ open: false, lab: null });
  const [resetForm] = Form.useForm();
  const [planForm] = Form.useForm();

  const { data: labs = [], isLoading } = useQuery({
    queryKey: ['labs', filter],
    queryFn: () => getLabs(filter === 'ALL' ? undefined : filter),
  });

  const { data: platformStats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: getPlatformStats,
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
      qc.invalidateQueries({ queryKey: ['platform-stats'] });
    },
    onError: () => message.error('Failed to update lab'),
  });

  const planMut = useMutation({
    mutationFn: ({ id, plan, planExpiresAt }: { id: string; plan: string; planExpiresAt?: string | null }) =>
      updateLabPlan(id, plan, planExpiresAt),
    onSuccess: () => {
      message.success('Plan updated successfully');
      qc.invalidateQueries({ queryKey: ['labs'] });
      qc.invalidateQueries({ queryKey: ['platform-stats'] });
      setPlanModal({ open: false, lab: null });
      planForm.resetFields();
    },
    onError: () => message.error('Failed to update plan'),
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
          onClick={() => { setResetModal({ open: true, user: row, labId: selectedLab!.id }); resetForm.resetFields(); }}
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
      title: 'Plan', dataIndex: 'plan', key: 'plan',
      render: (p: string, row: any) => {
        const max = PLAN_MAX[p] ?? 25;
        const used = row._count?.users ?? 0;
        const pct = Math.min(100, Math.round((used / max) * 100));
        return (
          <Space direction="vertical" size={2} style={{ width: 140 }}>
            <Tag color={PLAN_COLOR[p]}>{p}</Tag>
            <Tooltip title={`${used} / ${max === 999999 ? '∞' : max} users`}>
              <Progress
                percent={pct}
                size="small"
                strokeColor={pct >= 90 ? '#ff4d4f' : pct >= 70 ? '#faad14' : '#52c41a'}
                showInfo={false}
              />
            </Tooltip>
            <Text style={{ fontSize: 11, color: '#888' }}>{used}/{max === 999999 ? '∞' : max} users</Text>
          </Space>
        );
      },
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
        <Space wrap size={4}>
          <Button size="small" icon={<TeamOutlined />} onClick={() => { setSelectedLab(row); setUsersDrawerOpen(true); }}>Users</Button>
          <Button
            size="small"
            icon={<CrownOutlined />}
            onClick={() => {
              setPlanModal({ open: true, lab: row });
              planForm.setFieldsValue({
                plan: row.plan,
                planExpiresAt: row.planExpiresAt ? dayjs(row.planExpiresAt) : null,
              });
            }}
          >
            Plan
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

  // Stats from platform stats endpoint
  const statsByStatus: Record<string, number> = {};
  ((platformStats as any)?.labsByStatus ?? []).forEach((r: any) => { statsByStatus[r.status] = r._count.id; });
  const statsByPlan: Record<string, number> = {};
  ((platformStats as any)?.labsByPlan ?? []).forEach((r: any) => { statsByPlan[r.plan] = r._count.id; });

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3} style={{ margin: 0 }}><GlobalOutlined /> Platform Management</Title>
        <Text type="secondary">Manage labs, plans, users and platform health</Text>
      </div>

      {/* Platform Stats */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic title="Total Labs" value={(platformStats as any)?.totalLabs ?? 0} prefix={<BankOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Total Users" value={(platformStats as any)?.totalUsers ?? 0} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending Approval"
              value={statsByStatus['PENDING'] ?? 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Labs"
              value={statsByStatus['APPROVED'] ?? 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Plan distribution */}
      <Row gutter={16}>
        {['STARTER', 'GROWTH', 'BUSINESS', 'ENTERPRISE'].map((p) => (
          <Col span={6} key={p}>
            <Card size="small">
              <Statistic
                title={<Tag color={PLAN_COLOR[p]}>{p}</Tag>}
                value={statsByPlan[p] ?? 0}
                suffix="labs"
                prefix={<RiseOutlined />}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Labs Table */}
      <Card title={<Space><BankOutlined /><span>Calibration Labs</span></Space>}>
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
          scroll={{ x: 900 }}
        />
      </Card>

      {/* Users Drawer */}
      <Drawer
        title={<Space><UserOutlined /><span>Users — {selectedLab?.name}</span></Space>}
        width={620}
        open={usersDrawerOpen}
        onClose={() => setUsersDrawerOpen(false)}
        extra={
          selectedLab && (
            <Space>
              <Tag color={PLAN_COLOR[selectedLab.plan]}>{selectedLab.plan}</Tag>
              <Text type="secondary">{selectedLab._count?.users ?? 0} / {PLAN_MAX[selectedLab.plan] === 999999 ? '∞' : PLAN_MAX[selectedLab.plan]} users</Text>
            </Space>
          )
        }
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

      {/* Plan Modal */}
      <Modal
        title={<Space><CrownOutlined /><span>Manage Plan — {planModal.lab?.name}</span></Space>}
        open={planModal.open}
        onCancel={() => { setPlanModal({ open: false, lab: null }); planForm.resetFields(); }}
        onOk={() => planForm.submit()}
        confirmLoading={planMut.isPending}
        okText="Update Plan"
      >
        <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
          <Text type="secondary">Current plan: </Text>
          <Tag color={PLAN_COLOR[planModal.lab?.plan]}>{planModal.lab?.plan}</Tag>
          <Text type="secondary" style={{ marginLeft: 8 }}>
            {planModal.lab?._count?.users ?? 0} / {PLAN_MAX[planModal.lab?.plan] === 999999 ? '∞' : PLAN_MAX[planModal.lab?.plan]} users
          </Text>
        </div>

        <Form form={planForm} layout="vertical" onFinish={(v) => {
          planMut.mutate({
            id: planModal.lab!.id,
            plan: v.plan,
            planExpiresAt: v.planExpiresAt ? v.planExpiresAt.toISOString() : null,
          });
        }}>
          <Form.Item name="plan" label="Subscription Plan" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="STARTER">
                <Space><Badge color="default" /><span>Starter — up to 25 users</span></Space>
              </Select.Option>
              <Select.Option value="GROWTH">
                <Space><Badge color="blue" /><span>Growth — up to 50 users</span></Space>
              </Select.Option>
              <Select.Option value="BUSINESS">
                <Space><Badge color="gold" /><span>Business — up to 100 users</span></Space>
              </Select.Option>
              <Select.Option value="ENTERPRISE">
                <Space><Badge color="purple" /><span>Enterprise — custom / unlimited</span></Space>
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="planExpiresAt" label="Plan Expiry Date (optional — leave blank for no expiry)">
            <DatePicker style={{ width: '100%' }} disabledDate={(d) => d.isBefore(dayjs(), 'day')} />
          </Form.Item>
        </Form>

        <div style={{ marginTop: 8, padding: 12, background: '#fffbe6', borderRadius: 8, border: '1px solid #ffe58f' }}>
          <Text style={{ fontSize: 12 }}>
            <strong>Pricing reference:</strong> Contact sales for pricing information
          </Text>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        title={<Space><KeyOutlined /><span>Reset Password — {resetModal.user?.fullName}</span></Space>}
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
          <Form.Item name="newPassword" label="New Password" rules={[{ required: true, min: 6, message: 'Minimum 6 characters' }]}>
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

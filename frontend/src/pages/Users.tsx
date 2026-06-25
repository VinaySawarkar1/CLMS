import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, Table, Tag, Button, Space, Typography, Modal, Form, Input, Select, Switch, message, Divider,
} from 'antd';
import { UsergroupAddOutlined, PlusOutlined } from '@ant-design/icons';
import { getUser, getLabUsers, createLabUser, updateLabUserRole, setLabUserActive } from '../api';

const { Title, Text } = Typography;

const ASSIGNABLE_ROLES = [
  { value: 'TECHNICAL_MANAGER', label: 'Technical Manager' },
  { value: 'CALIBRATION_ENGINEER', label: 'Calibration Engineer' },
  { value: 'SERVICE_ENGINEER', label: 'Service Engineer' },
  { value: 'DATA_ENTRY_OPERATOR', label: 'Data Entry Operator' },
];

const ROLE_COLOR: Record<string, string> = {
  LAB_ADMIN: 'purple',
  TECHNICAL_MANAGER: 'geekblue',
  CALIBRATION_ENGINEER: 'cyan',
  SERVICE_ENGINEER: 'blue',
  DATA_ENTRY_OPERATOR: 'default',
};

const ENGINEER_ROLES = new Set(['CALIBRATION_ENGINEER', 'SERVICE_ENGINEER']);

export default function Users() {
  const qc = useQueryClient();
  const me = getUser();
  const labId = me?.labId ?? '';
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const selectedRole = Form.useWatch('role', form);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['lab-users', labId],
    queryFn: () => getLabUsers(labId),
    enabled: Boolean(labId),
  });

  const createMut = useMutation({
    mutationFn: (body: any) => createLabUser(labId, body),
    onSuccess: () => {
      message.success('User created');
      setOpen(false);
      form.resetFields();
      qc.invalidateQueries({ queryKey: ['lab-users'] });
    },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Failed to create user'),
  });

  const roleMut = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => updateLabUserRole(labId, userId, role),
    onSuccess: () => {
      message.success('Role updated');
      qc.invalidateQueries({ queryKey: ['lab-users'] });
    },
  });

  const activeMut = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) => setLabUserActive(labId, userId, isActive),
    onSuccess: () => {
      message.success('Status updated');
      qc.invalidateQueries({ queryKey: ['lab-users'] });
    },
  });

  const columns = [
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
      render: (role: string, row: any) =>
        role === 'LAB_ADMIN' ? (
          <Tag color={ROLE_COLOR[role]}>Lab Admin</Tag>
        ) : (
          <Select
            value={role}
            size="small"
            style={{ width: 200 }}
            options={ASSIGNABLE_ROLES}
            onChange={(v) => roleMut.mutate({ userId: row.id, role: v })}
          />
        ),
    },
    {
      title: 'Active', dataIndex: 'isActive', key: 'isActive',
      render: (active: boolean, row: any) =>
        row.role === 'LAB_ADMIN' ? (
          <Tag color="green">Always</Tag>
        ) : (
          <Switch
            checked={active}
            onChange={(checked) => activeMut.mutate({ userId: row.id, isActive: checked })}
          />
        ),
    },
    {
      title: 'Joined', dataIndex: 'createdAt', key: 'createdAt',
      render: (d: string) => new Date(d).toLocaleDateString(),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}><UsergroupAddOutlined /> Team Members</Title>
          <Text type="secondary">Manage users and their roles in {me?.lab?.name ?? 'your lab'}</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>Add User</Button>
      </div>

      <Card>
        <Table rowKey="id" loading={isLoading} dataSource={users} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title="Add Team Member"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMut.isPending}
        okText="Create User"
      >
        <Form form={form} layout="vertical" onFinish={(v) => {
          const payload: any = { ...v };
          if (payload.skills) {
            payload.skills = String(payload.skills).split(',').map((s: string) => s.trim()).filter(Boolean);
          }
          createMut.mutate(payload);
        }}>
          <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}>
            <Input placeholder="Jane Doe" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="jane@lab.com" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
            <Input.Password placeholder="Minimum 6 characters" />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]} initialValue="DATA_ENTRY_OPERATOR">
            <Select options={ASSIGNABLE_ROLES} />
          </Form.Item>
          {ENGINEER_ROLES.has(selectedRole) && (
            <>
              <Divider plain style={{ margin: '8px 0 12px' }}>Engineer Details</Divider>
              <Form.Item name="employeeCode" label="Employee Code" extra="Leave blank to auto-generate (e.g. ENG-001)">
                <Input placeholder="ENG-001" />
              </Form.Item>
              <Form.Item name="skills" label="Skills (comma separated)">
                <Input placeholder="Mechanical, Thermal, Pressure..." />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </Space>
  );
}

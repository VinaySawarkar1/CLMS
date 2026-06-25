import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button, Card, Col, Form, Input, Modal, Row, Space, Table, Tag, Typography, Select, Alert,
} from 'antd';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import { createEngineer, getEngineers } from '../api';

const { Title, Text } = Typography;

export default function Engineers() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const { data = [], isLoading } = useQuery({ queryKey: ['engineers'], queryFn: getEngineers });

  const mut = useMutation({
    mutationFn: () => {
      const values = form.getFieldsValue();
      return createEngineer({
        ...values,
        skills: values.skills ? values.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['engineers'] });
      setOpen(false);
      form.resetFields();
    },
  });

  const columns = [
    {
      title: 'Employee Code',
      dataIndex: 'employeeCode',
      key: 'employeeCode',
      width: 140,
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Name',
      dataIndex: ['user', 'fullName'],
      key: 'name',
      render: (v: string) => <Text strong>{v || '—'}</Text>,
    },
    {
      title: 'Email',
      dataIndex: ['user', 'email'],
      key: 'email',
      render: (v: string) => v || <Text type="secondary">—</Text>,
    },
    {
      title: 'Skills',
      dataIndex: 'skills',
      key: 'skills',
      render: (skills: string[]) => (
        <Space size={4} wrap>
          {(skills || []).map((s) => <Tag key={s} color="geekblue">{s}</Tag>)}
          {(!skills || skills.length === 0) && <Text type="secondary">—</Text>}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <Space>
                <UserOutlined style={{ color: '#1677ff' }} />
                Engineers
              </Space>
            </Title>
            <Text type="secondary">Manage calibration engineers and their skill profiles</Text>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)} size="large">
              New Engineer
            </Button>
          </Col>
        </Row>
      </div>

      <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 15, showTotal: (t) => `Total ${t} engineers` }}
          size="middle"
        />
      </Card>

      <Modal
        title={<Space><UserOutlined /><span>New Engineer</span></Space>}
        open={open}
        onCancel={() => { setOpen(false); form.resetFields(); }}
        onOk={() => form.validateFields().then(() => mut.mutate())}
        okText="Create Engineer"
        confirmLoading={mut.isPending}
        width={480}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="employeeCode" label="Employee Code" rules={[{ required: true }]}>
                <Input placeholder="ENG-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}>
                <Input placeholder="John Doe" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="Login Email" rules={[{ required: true, message: 'Email is the login id' }]}>
                <Input placeholder="engineer@lab.com" type="email" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="password" label="Login Password" rules={[{ required: true, min: 6, message: 'Min 6 characters' }]}>
                <Input.Password placeholder="Set a password" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="role" label="Role" initialValue="CALIBRATION_ENGINEER">
            <Select
              options={[
                { value: 'CALIBRATION_ENGINEER', label: 'Calibration Engineer' },
                { value: 'SERVICE_ENGINEER', label: 'Service Engineer' },
              ]}
            />
          </Form.Item>
          <Form.Item name="skills" label="Skills (comma separated)">
            <Input placeholder="Mechanical, Thermal, Pressure..." />
          </Form.Item>
          <Alert
            type="info"
            showIcon
            message="The engineer logs in with this email & password and will only see jobs assigned to them."
          />
        </Form>
      </Modal>
    </div>
  );
}

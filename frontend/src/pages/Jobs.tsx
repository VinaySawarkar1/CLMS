import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button, Card, Col, Form, Modal, Row, Select, Space, Table, Tag, Typography, Input, Tooltip, Dropdown,
} from 'antd';
import {
  PlusOutlined, FileTextOutlined, ThunderboltOutlined, SafetyCertificateOutlined,
  ArrowRightOutlined, EllipsisOutlined,
} from '@ant-design/icons';
import {
  assignJob, createJob, generateCertificate, getCustomers, getEngineers,
  getInstruments, getJobs, setJobStatus,
} from '../api';

const { Title, Text } = Typography;

const STATUSES = [
  'RECEIVED', 'WAITING', 'ASSIGNED', 'IN_CALIBRATION', 'PENDING_REVIEW',
  'CORRECTION_REQUIRED', 'APPROVED', 'CERTIFICATE_GENERATED', 'DELIVERED', 'CLOSED',
];

const NEXT: Record<string, string[]> = {
  RECEIVED: ['WAITING', 'ASSIGNED'], WAITING: ['ASSIGNED'], ASSIGNED: ['IN_CALIBRATION'],
  IN_CALIBRATION: ['PENDING_REVIEW'], PENDING_REVIEW: ['CORRECTION_REQUIRED', 'APPROVED'],
  CORRECTION_REQUIRED: ['IN_CALIBRATION'], APPROVED: ['CERTIFICATE_GENERATED'],
  CERTIFICATE_GENERATED: ['DELIVERED'], DELIVERED: ['CLOSED'], CLOSED: [],
};

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: 'default', WAITING: 'orange', ASSIGNED: 'blue', IN_CALIBRATION: 'processing',
  PENDING_REVIEW: 'gold', CORRECTION_REQUIRED: 'red', APPROVED: 'green',
  CERTIFICATE_GENERATED: 'cyan', DELIVERED: 'purple', CLOSED: 'default',
};

export default function Jobs() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const customerId = Form.useWatch('customerId', form);

  const { data = [], isLoading } = useQuery({ queryKey: ['jobs', statusFilter], queryFn: () => getJobs(statusFilter) });
  const { data: customers = [] } = useQuery({ queryKey: ['customers', ''], queryFn: () => getCustomers() });
  const { data: engineers = [] } = useQuery({ queryKey: ['engineers'], queryFn: getEngineers });
  const { data: instruments = [] } = useQuery({
    queryKey: ['instruments', customerId],
    queryFn: () => getInstruments(customerId),
    enabled: !!customerId,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['jobs'] });
  const createMut = useMutation({
    mutationFn: () => createJob(form.getFieldsValue()),
    onSuccess: () => { refresh(); setOpen(false); form.resetFields(); },
  });
  const assignMut = useMutation({ mutationFn: (v: { id: string; engineerId: string }) => assignJob(v.id, v.engineerId), onSuccess: refresh });
  const statusMut = useMutation({ mutationFn: (v: { id: string; s: string }) => setJobStatus(v.id, v.s), onSuccess: refresh });
  const certMut = useMutation({ mutationFn: (jobId: string) => generateCertificate({ jobId, type: 'NABL' }), onSuccess: refresh });

  const columns = [
    {
      title: 'Job No.',
      dataIndex: 'jobNumber',
      key: 'jobNumber',
      width: 130,
      render: (v: string, row: any) => (
        <RouterLink to={`/jobs/${row.id}`} style={{ fontWeight: 600, color: '#1677ff' }}>{v}</RouterLink>
      ),
    },
    {
      title: 'Customer',
      dataIndex: ['customer', 'name'],
      key: 'customer',
      render: (v: string) => <Text>{v}</Text>,
    },
    {
      title: 'Instrument',
      dataIndex: ['instrument', 'name'],
      key: 'instrument',
      render: (v: string) => <Text>{v}</Text>,
    },
    {
      title: 'Engineer',
      key: 'engineer',
      width: 180,
      render: (_: any, row: any) => (
        <Select
          size="small"
          value={row.engineerId || undefined}
          placeholder="Assign..."
          style={{ width: '100%' }}
          onChange={(val) => assignMut.mutate({ id: row.id, engineerId: val })}
          options={engineers.map((en: any) => ({
            value: en.id,
            label: en.user?.fullName || en.employeeCode,
          }))}
        />
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (v: string) => <Tag color={STATUS_COLORS[v] || 'default'}>{v.replace(/_/g, ' ')}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: any, row: any) => {
        const nextStatuses = NEXT[row.status] || [];
        const menuItems = [
          ...nextStatuses.map((s) => ({
            key: s,
            label: `→ ${s.replace(/_/g, ' ')}`,
            icon: <ArrowRightOutlined />,
            onClick: () => statusMut.mutate({ id: row.id, s }),
          })),
          ...(row.status === 'APPROVED' ? [{
            key: 'gen-cert',
            label: 'Generate Certificate',
            icon: <SafetyCertificateOutlined />,
            onClick: () => certMut.mutate(row.id),
          }] : []),
        ];

        return (
          <Space size="small">
            <Tooltip title="Open calibration workspace">
              <RouterLink to={`/jobs/${row.id}`}>
                <Button size="small" type="primary" icon={<ThunderboltOutlined />}>Calibrate</Button>
              </RouterLink>
            </Tooltip>
            {menuItems.length > 0 && (
              <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                <Button size="small" icon={<EllipsisOutlined />} />
              </Dropdown>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <Space>
                <FileTextOutlined style={{ color: '#1677ff' }} />
                Calibration Jobs
              </Space>
            </Title>
            <Text type="secondary">Track and manage all calibration jobs through their lifecycle</Text>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)} size="large">
              New Job
            </Button>
          </Col>
        </Row>
      </div>

      <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ marginBottom: 16 }}>
          <Select
            placeholder="Filter by status"
            allowClear
            value={statusFilter}
            onChange={(v) => setStatusFilter(v)}
            style={{ width: 260 }}
            options={STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))}
          />
        </div>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 15, showTotal: (t) => `Total ${t} jobs` }}
          size="middle"
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={<Space><PlusOutlined /><span>New Calibration Job</span></Space>}
        open={open}
        onCancel={() => { setOpen(false); form.resetFields(); }}
        onOk={() => form.validateFields().then(() => createMut.mutate())}
        okText="Create Job"
        confirmLoading={createMut.isPending}
        width={500}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="customerId" label="Customer" rules={[{ required: true }]}>
            <Select
              placeholder="Select customer"
              showSearch
              options={customers.map((c: any) => ({ value: c.id, label: c.name }))}
              filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
              onChange={() => form.setFieldValue('instrumentId', undefined)}
            />
          </Form.Item>
          <Form.Item name="instrumentId" label="Instrument" rules={[{ required: true }]}>
            <Select
              placeholder={customerId ? 'Select instrument' : 'Select a customer first'}
              disabled={!customerId}
              options={instruments.map((i: any) => ({
                value: i.id,
                label: `${i.name}${i.serialNumber ? ` (${i.serialNumber})` : ''}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea rows={2} placeholder="Optional notes or instructions" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

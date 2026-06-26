import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button, Card, Col, Drawer, Form, Modal, Row, Select, Space, Table, Tag,
  Typography, Input, Switch, DatePicker, message, Descriptions, Badge, Steps,
} from 'antd';
import {
  PlusOutlined, FileTextOutlined, ThunderboltOutlined, SafetyCertificateOutlined,
  ArrowRightOutlined, UserOutlined, EnvironmentOutlined, EditOutlined, ExportOutlined,
} from '@ant-design/icons';
import {
  assignJob, createJob, generateCertificate, getCustomers, getEngineers,
  getInstruments, getJobs, setJobStatus, getUser,
} from '../api';
import { exportToCsv } from '../utils/export';
import { findProcedure, groupedProcedures, Procedure } from '../procedures';

const { Title, Text } = Typography;

const STATUSES = [
  'RECEIVED', 'WAITING', 'ASSIGNED', 'IN_CALIBRATION', 'PENDING_REVIEW',
  'CORRECTION_REQUIRED', 'APPROVED', 'CERTIFICATE_GENERATED', 'DELIVERED', 'CLOSED',
];

const NEXT: Record<string, string[]> = {
  RECEIVED: ['WAITING', 'ASSIGNED'],
  WAITING: ['ASSIGNED'],
  ASSIGNED: ['IN_CALIBRATION'],
  IN_CALIBRATION: ['PENDING_REVIEW'],
  PENDING_REVIEW: ['CORRECTION_REQUIRED', 'APPROVED'],
  CORRECTION_REQUIRED: ['IN_CALIBRATION'],
  APPROVED: [],
  CERTIFICATE_GENERATED: ['DELIVERED'],
  DELIVERED: ['CLOSED'],
  CLOSED: [],
};

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: 'default', WAITING: 'orange', ASSIGNED: 'blue',
  IN_CALIBRATION: 'processing', PENDING_REVIEW: 'gold',
  CORRECTION_REQUIRED: 'red', APPROVED: 'green',
  CERTIFICATE_GENERATED: 'cyan', DELIVERED: 'purple', CLOSED: 'default',
};

const STATUS_ORDER = [
  'RECEIVED', 'WAITING', 'ASSIGNED', 'IN_CALIBRATION', 'PENDING_REVIEW',
  'APPROVED', 'CERTIFICATE_GENERATED', 'DELIVERED', 'CLOSED',
];

export default function Jobs() {
  const qc = useQueryClient();
  const me = getUser();
  const isAdmin = me?.role === 'LAB_ADMIN' || me?.role === 'TECHNICAL_MANAGER';

  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [searchText, setSearchText] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkCustomerId, setBulkCustomerId] = useState<string | undefined>();
  const [bulkSelectedInstruments, setBulkSelectedInstruments] = useState<string[]>([]);
  const [assignTarget, setAssignTarget] = useState<any>(null);
  const [statusTarget, setStatusTarget] = useState<any>(null);
  const [detailJob, setDetailJob] = useState<any>(null);
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();
  const customerId = Form.useWatch('customerId', form);
  const isOnsite = Form.useWatch('isOnsite', form);
  const selectedProcedureId = Form.useWatch('procedureId', form);
  const selectedProc = findProcedure(selectedProcedureId);

  // Build grouped procedure options for the job creation form
  const procedureGroupedOptions = Object.entries(groupedProcedures()).map(([discipline, subs]) => ({
    label: discipline,
    options: Object.entries(subs as any).flatMap(([sub, procs]: [string, any]) =>
      (procs as Procedure[]).map((p) => ({
        value: p.id,
        label: `${sub} › ${p.label} (${p.unit})`,
      }))
    ),
  }));

  const handleProcedureChange = (id: string) => {
    const p = findProcedure(id);
    form.setFieldValue('procedureId', id);
    form.setFieldValue('procedureRangeIndex', 0);
    if (p) {
      const unit = p.ranges && p.ranges.length ? p.ranges[0].unit : p.unit;
      form.setFieldValue('unitOfMeasurement', unit);
    }
  };

  const handleRangeChange = (idx: number) => {
    form.setFieldValue('procedureRangeIndex', idx);
    const p = findProcedure(selectedProcedureId);
    const r = p?.ranges?.[idx];
    if (r) form.setFieldValue('unitOfMeasurement', r.unit);
  };

  const { data = [], isLoading } = useQuery({
    queryKey: ['jobs', statusFilter],
    queryFn: () => getJobs(statusFilter),
  });
  const { data: customers = [] } = useQuery({ queryKey: ['customers', ''], queryFn: () => getCustomers() });
  const { data: engineers = [] } = useQuery({ queryKey: ['engineers'], queryFn: getEngineers });
  const { data: instruments = [] } = useQuery({
    queryKey: ['instruments', customerId],
    queryFn: () => getInstruments(customerId),
    enabled: !!customerId,
  });
  const { data: bulkInstruments = [] } = useQuery({
    queryKey: ['instruments', bulkCustomerId],
    queryFn: () => getInstruments(bulkCustomerId),
    enabled: !!bulkCustomerId,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['jobs'] });
  };

  const createMut = useMutation({
    mutationFn: () => {
      const v = form.getFieldsValue();
      return createJob({ ...v, visitDate: v.visitDate ? v.visitDate.toISOString() : undefined });
    },
    onSuccess: () => {
      refresh();
      setCreateOpen(false);
      form.resetFields();
      message.success('Job created successfully');
    },
    onError: (e: any) => {
      const d = e?.response?.data;
      message.error(`Job creation failed: ${d?.message ?? e?.message ?? 'Unknown error'}`, 8);
    },
  });

  const assignMut = useMutation({
    mutationFn: ({ jobId, engineerId }: { jobId: string; engineerId: string }) =>
      assignJob(jobId, engineerId),
    onSuccess: () => {
      refresh();
      setAssignTarget(null);
      assignForm.resetFields();
      message.success('Engineer assigned');
    },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Failed to assign engineer'),
  });

  const statusMut = useMutation({
    mutationFn: ({ jobId, status }: { jobId: string; status: string }) =>
      setJobStatus(jobId, status),
    onSuccess: () => {
      refresh();
      setStatusTarget(null);
      message.success('Status updated');
    },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Failed to update status'),
  });

  const certMut = useMutation({
    mutationFn: (jobId: string) => generateCertificate({ jobId, type: 'NABL' }),
    onSuccess: () => {
      refresh();
      setStatusTarget(null);
      message.success('Certificate generated');
    },
    onError: (e: any) => {
      const d = e?.response?.data;
      message.error(`Certificate generation failed: ${d?.message ?? e?.message ?? 'Unknown error'}`, 8);
    },
  });

  const bulkCreateMut = useMutation({
    mutationFn: async (instrumentIds: string[]) => {
      const results = await Promise.allSettled(
        instrumentIds.map((instrumentId) => createJob({ customerId: bulkCustomerId, instrumentId }))
      );
      const created = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;
      return { created, failed };
    },
    onSuccess: ({ created, failed }) => {
      refresh();
      setBulkOpen(false);
      setBulkCustomerId(undefined);
      setBulkSelectedInstruments([]);
      if (failed) {
        message.warning(`${created} job(s) created, ${failed} failed`);
      } else {
        message.success(`${created} job(s) created successfully`);
      }
    },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Bulk create failed'),
  });

  const engineerName = (job: any) => {
    if (!job.engineer) return null;
    return job.engineer.user?.fullName || job.engineer.employeeCode;
  };

  const columns = [
    {
      title: 'Job No.',
      dataIndex: 'jobNumber',
      key: 'jobNumber',
      width: 140,
      render: (v: string, row: any) => (
        <RouterLink to={`/jobs/${row.id}`} style={{ fontWeight: 700, color: '#1677ff' }}>
          {v}
        </RouterLink>
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
      key: 'instrument',
      render: (_: any, row: any) => (
        <Space direction="vertical" size={0}>
          <Text>{row.instrument?.name}</Text>
          {row.isOnsite && (
            <Tag color="geekblue" icon={<EnvironmentOutlined />} style={{ fontSize: 11 }}>Onsite</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Engineer',
      key: 'engineer',
      width: 160,
      render: (_: any, row: any) => {
        const name = engineerName(row);
        return name
          ? <Tag color="blue" icon={<UserOutlined />}>{name}</Tag>
          : <Tag color="default">Unassigned</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 170,
      render: (v: string) => (
        <Tag color={STATUS_COLORS[v] || 'default'} style={{ fontSize: 12 }}>
          {v.replace(/_/g, ' ')}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      render: (_: any, row: any) => (
        <Space size={6} wrap>
          <RouterLink to={`/jobs/${row.id}`}>
            <Button size="small" type="primary" icon={<ThunderboltOutlined />}>
              Open
            </Button>
          </RouterLink>
          {isAdmin && (
            <Button
              size="small"
              icon={<UserOutlined />}
              onClick={() => { setAssignTarget(row); assignForm.setFieldValue('engineerId', row.engineerId || undefined); }}
            >
              Assign
            </Button>
          )}
          {row.status !== 'CLOSED' && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => setStatusTarget(row)}
            >
              Status
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const currentStepIdx = (status: string) => STATUS_ORDER.indexOf(status);

  return (
    <div>
      {/* Header */}
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
            {isAdmin && (
              <Space>
                <Button icon={<PlusOutlined />} onClick={() => setBulkOpen(true)} size="large">
                  Bulk Create Jobs
                </Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)} size="large">
                  New Job
                </Button>
              </Space>
            )}
          </Col>
        </Row>
      </div>

      {/* Filter + Table */}
      <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <Space wrap>
            <Input.Search
              placeholder="Search job no., customer, instrument..."
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 280 }}
            />
            <Select
              placeholder="Filter by status"
              allowClear
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
              style={{ width: 200 }}
              options={STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))}
            />
          </Space>
          <Button
            icon={<ExportOutlined />}
            onClick={() => exportToCsv('jobs.csv', data as any[], [
              { key: 'jobNumber', label: 'Job No' },
              { key: 'customer.name', label: 'Customer' },
              { key: 'instrument.name', label: 'Instrument' },
              { key: 'engineer.user.fullName', label: 'Engineer' },
              { key: 'status', label: 'Status' },
              { key: 'createdAt', label: 'Created At' },
            ])}
          >
            Export CSV
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={(data as any[]).filter((j: any) => {
            if (!searchText) return true;
            const q = searchText.toLowerCase();
            return (
              j.jobNumber?.toLowerCase().includes(q) ||
              j.customer?.name?.toLowerCase().includes(q) ||
              j.instrument?.name?.toLowerCase().includes(q) ||
              j.engineer?.user?.fullName?.toLowerCase().includes(q)
            );
          })}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 15, showTotal: (t) => `Total ${t} jobs` }}
          size="middle"
          scroll={{ x: 900 }}
        />
      </Card>

      {/* ── Create Job Modal ── */}
      <Modal
        title={<Space><PlusOutlined /><span>New Calibration Job</span></Space>}
        open={createOpen}
        onCancel={() => { setCreateOpen(false); form.resetFields(); }}
        onOk={() => form.validateFields().then(() => createMut.mutate())}
        okText="Create Job"
        confirmLoading={createMut.isPending}
        width={540}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customerId" label="Customer" rules={[{ required: true }]}>
                <Select
                  placeholder="Select customer"
                  showSearch
                  options={customers.map((c: any) => ({ value: c.id, label: c.name }))}
                  filterOption={(input, opt) =>
                    (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                  onChange={() => form.setFieldValue('instrumentId', undefined)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="instrumentId" label="Instrument" rules={[{ required: true }]}>
                <Select
                  placeholder={customerId ? 'Select instrument' : 'Select customer first'}
                  disabled={!customerId}
                  options={instruments.map((i: any) => ({
                    value: i.id,
                    label: `${i.name}${i.serialNumber ? ` (${i.serialNumber})` : ''}`,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          {/* ── Calibration Procedure (locked at job creation) ── */}
          <Form.Item
            name="procedureId"
            label="Instrument Procedure (Discipline / Sub-discipline)"
            rules={[{ required: true, message: 'Select the calibration procedure' }]}
          >
            <Select
              placeholder="Select discipline › instrument..."
              options={procedureGroupedOptions}
              showSearch
              filterOption={(input, opt) =>
                (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              onChange={handleProcedureChange}
              style={{ width: '100%' }}
            />
          </Form.Item>
          {selectedProc?.ranges && selectedProc.ranges.length > 1 && (
            <Row gutter={16}>
              <Col span={16}>
                <Form.Item name="procedureRangeIndex" label="Parameter / Range" rules={[{ required: true }]}>
                  <Select
                    options={selectedProc.ranges.map((r, i) => ({
                      value: i,
                      label: `${r.parameter}${r.rangeText ? ` (${r.rangeText})` : ` (${r.unit})`}`,
                    }))}
                    onChange={handleRangeChange}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="unitOfMeasurement" label="Unit">
                  <Input placeholder="mm, bar, °C..." />
                </Form.Item>
              </Col>
            </Row>
          )}
          {selectedProc && !(selectedProc.ranges && selectedProc.ranges.length > 1) && (
            <Form.Item name="unitOfMeasurement" label="Unit of Measurement">
              <Input placeholder="mm, bar, °C..." />
            </Form.Item>
          )}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="challanNo" label="Challan No.">
                <Input placeholder="DC / Challan number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="poNumber" label="Purchase Order No.">
                <Input placeholder="PO number" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="calibrationProcedureNo" label="Procedure No.">
                <Input placeholder="e.g. CM 45" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="conditionOfItem" label="Item Condition" initialValue="OK (As Received)">
                <Input placeholder="OK (As Received)" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="isOnsite" label="Onsite Calibration?" valuePropName="checked" initialValue={false}>
            <Switch checkedChildren="Onsite" unCheckedChildren="In-lab" />
          </Form.Item>
          {isOnsite && (
            <Row gutter={16}>
              <Col span={16}>
                <Form.Item name="siteAddress" label="Site Address" rules={[{ required: true }]}>
                  <Input.TextArea rows={2} placeholder="Customer site address" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="visitDate" label="Visit Date">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          )}
          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea rows={2} placeholder="Optional notes" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Assign Engineer Modal ── */}
      <Modal
        title={
          <Space>
            <UserOutlined />
            <span>Assign Engineer — {assignTarget?.jobNumber}</span>
          </Space>
        }
        open={!!assignTarget}
        onCancel={() => { setAssignTarget(null); assignForm.resetFields(); }}
        onOk={() =>
          assignForm.validateFields().then((v) =>
            assignMut.mutate({ jobId: assignTarget.id, engineerId: v.engineerId })
          )
        }
        okText="Assign"
        confirmLoading={assignMut.isPending}
        width={420}
      >
        <div style={{ marginBottom: 16 }}>
          {assignTarget && (
            <Descriptions size="small" column={1} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Customer">{assignTarget.customer?.name}</Descriptions.Item>
              <Descriptions.Item label="Instrument">{assignTarget.instrument?.name}</Descriptions.Item>
              <Descriptions.Item label="Current Status">
                <Tag color={STATUS_COLORS[assignTarget.status]}>{assignTarget.status?.replace(/_/g, ' ')}</Tag>
              </Descriptions.Item>
            </Descriptions>
          )}
          <Form form={assignForm} layout="vertical">
            <Form.Item name="engineerId" label="Select Engineer" rules={[{ required: true, message: 'Please select an engineer' }]}>
              <Select
                showSearch
                placeholder="Choose engineer..."
                options={engineers.map((e: any) => ({
                  value: e.id,
                  label: `${e.user?.fullName || e.employeeCode} (${e.employeeCode})`,
                }))}
                filterOption={(input, opt) =>
                  (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* ── Status Update Modal ── */}
      <Modal
        title={
          <Space>
            <EditOutlined />
            <span>Update Status — {statusTarget?.jobNumber}</span>
          </Space>
        }
        open={!!statusTarget}
        onCancel={() => setStatusTarget(null)}
        footer={null}
        width={480}
      >
        {statusTarget && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <Steps
                size="small"
                current={currentStepIdx(statusTarget.status)}
                items={STATUS_ORDER.map((s) => ({
                  title: <span style={{ fontSize: 11 }}>{s.replace(/_/g, ' ')}</span>,
                }))}
                style={{ overflowX: 'auto' }}
              />
            </div>

            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
              Current: <Tag color={STATUS_COLORS[statusTarget.status]}>{statusTarget.status?.replace(/_/g, ' ')}</Tag>
            </Text>

            {(NEXT[statusTarget.status] || []).length === 0 ? (
              <Tag color="default" style={{ fontSize: 13, padding: '6px 16px' }}>Job is closed — no further transitions</Tag>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                <Text strong>Move to:</Text>
                {(NEXT[statusTarget.status] || []).map((s) => (
                  <Button
                    key={s}
                    icon={<ArrowRightOutlined />}
                    style={{ width: '100%', textAlign: 'left', height: 44 }}
                    loading={statusMut.isPending}
                    onClick={() => statusMut.mutate({ jobId: statusTarget.id, status: s })}
                  >
                    {s.replace(/_/g, ' ')}
                  </Button>
                ))}
                {statusTarget.status === 'APPROVED' && isAdmin && (
                  <Button
                    type="primary"
                    icon={<SafetyCertificateOutlined />}
                    style={{ width: '100%', textAlign: 'left', height: 44 }}
                    loading={certMut.isPending}
                    onClick={() => certMut.mutate(statusTarget.id)}
                  >
                    Generate Certificate
                  </Button>
                )}
              </Space>
            )}
          </div>
        )}
      </Modal>

      {/* ── Bulk Create Jobs Modal ── */}
      <Modal
        title={<Space><PlusOutlined /><span>Bulk Create Jobs</span></Space>}
        open={bulkOpen}
        onCancel={() => { setBulkOpen(false); setBulkCustomerId(undefined); setBulkSelectedInstruments([]); }}
        onOk={() => bulkCreateMut.mutate(bulkSelectedInstruments)}
        okText={`Create ${bulkSelectedInstruments.length} Job(s)`}
        okButtonProps={{ disabled: !bulkSelectedInstruments.length || !bulkCustomerId }}
        confirmLoading={bulkCreateMut.isPending}
        width={540}
      >
        <Space direction="vertical" style={{ width: '100%', marginTop: 16 }} size="middle">
          <Form.Item label="Customer" style={{ marginBottom: 0 }}>
            <Select
              placeholder="Select customer"
              showSearch
              value={bulkCustomerId}
              onChange={(v) => { setBulkCustomerId(v); setBulkSelectedInstruments([]); }}
              options={(customers as any[]).map((c: any) => ({ value: c.id, label: c.name }))}
              filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
              style={{ width: '100%' }}
            />
          </Form.Item>
          {bulkCustomerId && (
            <Form.Item label="Select Instruments" style={{ marginBottom: 0 }}>
              <Select
                mode="multiple"
                placeholder="Select one or more instruments"
                value={bulkSelectedInstruments}
                onChange={setBulkSelectedInstruments}
                options={(bulkInstruments as any[]).map((i: any) => ({
                  value: i.id,
                  label: `${i.name}${i.serialNumber ? ` (SN: ${i.serialNumber})` : ''}`,
                }))}
                style={{ width: '100%' }}
                filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
              />
            </Form.Item>
          )}
          {bulkSelectedInstruments.length > 0 && (
            <Tag color="blue">{bulkSelectedInstruments.length} job(s) will be created with status RECEIVED</Tag>
          )}
        </Space>
      </Modal>
    </div>
  );
}

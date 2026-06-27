import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button, Card, Form, Input, Modal, Popconfirm, Space, Table, Tag, Typography, Row, Col, message,
  Drawer, Timeline, Empty, Spin,
} from 'antd';
import {
  PlusOutlined, TeamOutlined, SearchOutlined, ExportOutlined, EditOutlined, DeleteOutlined, ImportOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { createCustomer, getCustomers, updateCustomer, deleteCustomer, importCustomers, getCustomerTimeline } from '../api';
import { exportToCsv } from '../utils/export';
import ImportModal from '../components/ImportModal';

const { Title, Text } = Typography;

const IMPORT_COLS = [
  { key: 'code', label: 'Customer Code', required: true },
  { key: 'name', label: 'Name', required: true },
  { key: 'gstin', label: 'GSTIN' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'address', label: 'Address' },
];

export default function Customers() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [timelineCustomer, setTimelineCustomer] = useState<any>(null);
  const { data: timeline = [], isLoading: timelineLoading } = useQuery({
    queryKey: ['customer-timeline', timelineCustomer?.id],
    queryFn: () => getCustomerTimeline(timelineCustomer.id),
    enabled: !!timelineCustomer?.id,
  });
  const [form] = Form.useForm();

  const { data = [], isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => getCustomers(search || undefined),
  });

  useEffect(() => {
    if (highlightId && (data as any[]).length > 0) {
      const el = document.getElementById(`customer-row-${highlightId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Clear the param after a moment so browser back works cleanly
      const t = setTimeout(() => setSearchParams({}, { replace: true }), 3000);
      return () => clearTimeout(t);
    }
  }, [highlightId, data]);

  const refresh = () => qc.invalidateQueries({ queryKey: ['customers'] });

  const saveMut = useMutation({
    mutationFn: () => {
      const vals = form.getFieldsValue();
      return editing ? updateCustomer(editing.id, vals) : createCustomer(vals);
    },
    onSuccess: () => {
      refresh(); setOpen(false); setEditing(null); form.resetFields();
      message.success(editing ? 'Customer updated' : 'Customer created');
    },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Save failed'),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => { refresh(); message.success('Customer deleted'); },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Delete failed'),
  });

  const openNew = () => { setEditing(null); form.resetFields(); setOpen(true); };
  const openEdit = (row: any) => { setEditing(row); form.setFieldsValue(row); setOpen(true); };

  const columns = [
    {
      title: 'Code', dataIndex: 'code', key: 'code', width: 120,
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Name', dataIndex: 'name', key: 'name',
      render: (v: string) => <Text strong>{v}</Text>,
    },
    { title: 'GSTIN', dataIndex: 'gstin', key: 'gstin', render: (v: string) => v || <Text type="secondary">—</Text> },
    { title: 'Email', dataIndex: 'email', key: 'email', render: (v: string) => v || <Text type="secondary">—</Text> },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', render: (v: string) => v || <Text type="secondary">—</Text> },
    { title: 'Address', dataIndex: 'address', key: 'address', ellipsis: true, render: (v: string) => v || <Text type="secondary">—</Text> },
    {
      title: 'Actions', key: 'actions', width: 160,
      render: (_: any, row: any) => (
        <Space>
          <Button size="small" icon={<HistoryOutlined />} onClick={() => setTimelineCustomer(row)}>Timeline</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
          <Popconfirm title="Delete this customer?" onConfirm={() => delMut.mutate(row.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
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
              <Space><TeamOutlined style={{ color: '#1677ff' }} />Customers</Space>
            </Title>
            <Text type="secondary">Manage laboratory customers and client details</Text>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ExportOutlined />}
                onClick={() => exportToCsv('customers.csv', data as any[], [
                  { key: 'name', label: 'Name' },
                  { key: 'code', label: 'Code' },
                  { key: 'gstin', label: 'GSTIN' },
                  { key: 'email', label: 'Email' },
                  { key: 'phone', label: 'Phone' },
                  { key: 'address', label: 'Address' },
                ])}
              >
                Export CSV
              </Button>
              <Button icon={<ImportOutlined />} onClick={() => setImportOpen(true)}>
                Import CSV
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={openNew} size="large">
                New Customer
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search by name, code or email..."
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 320 }}
            allowClear
          />
        </div>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 15, showTotal: (t) => `Total ${t} customers` }}
          size="middle"
          scroll={{ x: 900 }}
          onRow={(row: any) => ({
            id: `customer-row-${row.id}`,
            style: highlightId === row.id
              ? { background: '#e6f4ff', transition: 'background 1s' }
              : undefined,
          })}
        />
      </Card>

      <Modal
        title={<Space><PlusOutlined /><span>{editing ? 'Edit Customer' : 'New Customer'}</span></Space>}
        open={open}
        onCancel={() => { setOpen(false); setEditing(null); form.resetFields(); }}
        onOk={() => form.validateFields().then(() => saveMut.mutate())}
        okText={editing ? 'Update' : 'Create Customer'}
        confirmLoading={saveMut.isPending}
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="code" label="Customer Code" rules={editing ? [] : [{ required: true }]}>
                <Input placeholder="CUST-001" disabled={!!editing} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                <Input placeholder="Company / Individual name" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="gstin" label="GSTIN">
                <Input placeholder="22AAAAA0000A1Z5" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="Email">
                <Input placeholder="contact@company.com" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="Phone">
                <Input placeholder="+91 9876543210" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="address" label="Address">
                <Input placeholder="City, State" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <ImportModal
        open={importOpen}
        onClose={() => { setImportOpen(false); refresh(); }}
        title="Customers"
        columns={IMPORT_COLS}
        onImport={(records) => importCustomers(records)}
        templateFilename="customers-import-template.csv"
      />

      <Drawer
        title={timelineCustomer ? <Space><HistoryOutlined />{timelineCustomer.name} — History</Space> : ''}
        open={!!timelineCustomer}
        onClose={() => setTimelineCustomer(null)}
        width={560}
      >
        {timelineLoading ? <Spin /> : (timeline as any[]).length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No history yet for this customer" />
        ) : (
          <Timeline
            items={(timeline as any[]).map((e: any) => ({
              color: TIMELINE_COLORS[e.type] ?? 'gray',
              children: (
                <div>
                  <Space size={6} wrap>
                    <Tag color={TIMELINE_COLORS[e.type] ?? 'default'}>{e.type}</Tag>
                    <Text strong style={{ fontSize: 13 }}>{e.title}</Text>
                  </Space>
                  <div><Text type="secondary" style={{ fontSize: 12 }}>{dayjs(e.date).format('DD MMM YYYY, HH:mm')}</Text></div>
                </div>
              ),
            }))}
          />
        )}
      </Drawer>
    </div>
  );
}

const TIMELINE_COLORS: Record<string, string> = {
  QUOTATION: 'purple', PO: 'geekblue', CALIBRATION: 'blue', CERTIFICATE: 'green',
  INVOICE: 'orange', PAYMENT: 'gold', COMPLAINT: 'red', DELIVERY: 'cyan',
};

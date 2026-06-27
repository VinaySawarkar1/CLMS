import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, Table, Tag, Button, Space, Typography, Modal, Form, Input, InputNumber,
  Select, DatePicker, message, Row, Col, Divider, Statistic, Drawer, Descriptions,
  Popconfirm, Tooltip, Badge,
} from 'antd';
import {
  ShoppingCartOutlined, PlusOutlined, DeleteOutlined, EyeOutlined,
  CheckCircleOutlined, CloseCircleOutlined, SendOutlined, CopyOutlined, DownloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getPurchaseOrders, createPurchaseOrder, updatePurchaseOrder,
  setPurchaseOrderStatus, deletePurchaseOrder, getPurchaseOrderStats, getCustomers, getLab, getUser,
} from '../api';
import { downloadPurchaseOrderPdf } from '../utils/pdfExport';

const { Title, Text } = Typography;

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'default', PENDING_APPROVAL: 'orange', APPROVED: 'blue',
  SENT: 'cyan', PARTIALLY_RECEIVED: 'purple', COMPLETED: 'green',
  CANCELLED: 'red', CLOSED: 'gray',
};

const GST_RATES = [0, 5, 12, 18, 28];

function LineItemsForm({ form }: { form: any }) {
  const items = Form.useWatch('lineItems', form) ?? [{ description: '', quantity: 1, unitPrice: 0, gstRate: 18 }];

  const addRow = () => {
    form.setFieldsValue({ lineItems: [...items, { description: '', quantity: 1, unitPrice: 0, gstRate: 18 }] });
  };
  const removeRow = (i: number) => {
    const updated = [...items];
    updated.splice(i, 1);
    form.setFieldsValue({ lineItems: updated });
  };

  const taxable = items.reduce((sum: number, item: any) => {
    const line = (item?.quantity || 0) * (item?.unitPrice || 0);
    const disc = line * ((item?.discountPct || 0) / 100);
    return sum + (line - disc);
  }, 0);
  const gstTotal = items.reduce((sum: number, item: any) => {
    const line = (item?.quantity || 0) * (item?.unitPrice || 0);
    const disc = line * ((item?.discountPct || 0) / 100);
    const taxable = line - disc;
    return sum + (taxable * ((item?.gstRate || 18) / 100));
  }, 0);

  return (
    <div>
      <div style={{ background: '#f5f5f5', padding: 8, borderRadius: 6, marginBottom: 8 }}>
        <Row gutter={8}>
          <Col span={8}><Text strong style={{ fontSize: 12 }}>Description</Text></Col>
          <Col span={3}><Text strong style={{ fontSize: 12 }}>Qty</Text></Col>
          <Col span={4}><Text strong style={{ fontSize: 12 }}>Unit Price</Text></Col>
          <Col span={3}><Text strong style={{ fontSize: 12 }}>Disc%</Text></Col>
          <Col span={3}><Text strong style={{ fontSize: 12 }}>GST%</Text></Col>
          <Col span={2}><Text strong style={{ fontSize: 12 }}>Del</Text></Col>
        </Row>
      </div>
      {items.map((_: any, i: number) => (
        <Row gutter={8} key={i} style={{ marginBottom: 6 }}>
          <Col span={8}>
            <Form.Item name={['lineItems', i, 'description']} rules={[{ required: true, message: '' }]} style={{ margin: 0 }}>
              <Input placeholder="Item description" />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item name={['lineItems', i, 'quantity']} rules={[{ required: true }]} style={{ margin: 0 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name={['lineItems', i, 'unitPrice']} rules={[{ required: true }]} style={{ margin: 0 }}>
              <InputNumber min={0} prefix="₹" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item name={['lineItems', i, 'discountPct']} style={{ margin: 0 }}>
              <InputNumber min={0} max={100} suffix="%" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item name={['lineItems', i, 'gstRate']} style={{ margin: 0 }}>
              <Select style={{ width: '100%' }} options={GST_RATES.map(r => ({ value: r, label: `${r}%` }))} />
            </Form.Item>
          </Col>
          <Col span={2}>
            <Button danger icon={<DeleteOutlined />} size="small" onClick={() => removeRow(i)} disabled={items.length === 1} />
          </Col>
        </Row>
      ))}
      <Button type="dashed" onClick={addRow} block icon={<PlusOutlined />} style={{ marginTop: 4 }}>Add Item</Button>
      <div style={{ background: '#e6f4ff', borderRadius: 6, padding: 12, marginTop: 12 }}>
        <Row justify="end" gutter={24}>
          <Col><Text>Taxable: <Text strong>₹{taxable.toFixed(2)}</Text></Text></Col>
          <Col><Text>GST: <Text strong>₹{gstTotal.toFixed(2)}</Text></Text></Col>
          <Col><Text type="success">Total: <Text strong style={{ fontSize: 16 }}>₹{(taxable + gstTotal).toFixed(2)}</Text></Text></Col>
        </Row>
      </div>
    </div>
  );
}

export default function PurchaseOrders() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<any>(null);
  const [form] = Form.useForm();

  const { data: orders = [], isLoading } = useQuery({ queryKey: ['purchaseOrders'], queryFn: () => getPurchaseOrders() });
  const { data: stats } = useQuery({ queryKey: ['poStats'], queryFn: getPurchaseOrderStats });
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: () => getCustomers() });
  const labId = getUser()?.labId ?? '';
  const { data: company } = useQuery({ queryKey: ['lab', labId], queryFn: () => getLab(labId), enabled: !!labId });

  const refresh = () => { qc.invalidateQueries({ queryKey: ['purchaseOrders'] }); qc.invalidateQueries({ queryKey: ['poStats'] }); };

  const createMut = useMutation({
    mutationFn: (vals: any) => createPurchaseOrder({
      ...vals,
      expectedDate: vals.expectedDate?.toISOString(),
      lineItems: vals.lineItems ?? [],
    }),
    onSuccess: () => { message.success('Purchase Order created'); setOpen(false); form.resetFields(); refresh(); },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Failed'),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => setPurchaseOrderStatus(id, status),
    onSuccess: () => { message.success('Status updated'); refresh(); },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Failed'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deletePurchaseOrder(id),
    onSuccess: () => { message.success('Purchase Order deleted'); refresh(); },
  });

  const columns = [
    { title: 'PO Number', dataIndex: 'poNumber', key: 'po', render: (v: string) => <Text strong style={{ color: '#1677ff' }}>{v}</Text> },
    { title: 'Supplier', key: 'sup', render: (_: any, r: any) => r.supplier?.name ?? '—' },
    {
      title: 'PO Date', dataIndex: 'poDate', key: 'date',
      render: (v: string) => dayjs(v).format('DD MMM YYYY'),
    },
    {
      title: 'Expected By', dataIndex: 'expectedDate', key: 'exp',
      render: (v: string) => v ? dayjs(v).format('DD MMM YYYY') : '—',
    },
    { title: 'Total', dataIndex: 'totalAmount', key: 'total', render: (v: number) => <Text strong>₹{v?.toFixed(2)}</Text> },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string, row: any) => (
        <Space>
          <Tag color={STATUS_COLOR[s]}>{s.replace(/_/g, ' ')}</Tag>
          {s === 'DRAFT' && (
            <Tooltip title="Approve">
              <Button size="small" type="primary" icon={<CheckCircleOutlined />}
                onClick={() => statusMut.mutate({ id: row.id, status: 'APPROVED' })} />
            </Tooltip>
          )}
          {s === 'APPROVED' && (
            <Tooltip title="Mark Sent">
              <Button size="small" icon={<SendOutlined />}
                onClick={() => statusMut.mutate({ id: row.id, status: 'SENT' })} />
            </Tooltip>
          )}
          {s === 'SENT' && (
            <Tooltip title="Mark Completed">
              <Button size="small" type="primary" icon={<CheckCircleOutlined />}
                onClick={() => statusMut.mutate({ id: row.id, status: 'COMPLETED' })} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: any, row: any) => (
        <Space>
          <Tooltip title="View Details">
            <Button size="small" icon={<EyeOutlined />} onClick={() => setViewing(row)} />
          </Tooltip>
          <Tooltip title="Download PDF">
            <Button size="small" icon={<DownloadOutlined />} onClick={() => downloadPurchaseOrderPdf(row, company ?? {})} />
          </Tooltip>
          {['DRAFT', 'CANCELLED'].includes(row.status) && (
            <Popconfirm title="Delete this PO?" onConfirm={() => deleteMut.mutate(row.id)} okType="danger">
              <Tooltip title="Delete">
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
          {!['COMPLETED', 'CLOSED', 'CANCELLED'].includes(row.status) && (
            <Popconfirm title="Cancel this PO?" onConfirm={() => statusMut.mutate({ id: row.id, status: 'CANCELLED' })}>
              <Tooltip title="Cancel">
                <Button size="small" danger icon={<CloseCircleOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}><ShoppingCartOutlined /> Purchase Orders</Title>
          <Text type="secondary">Manage supplier purchase orders and track delivery</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>New Purchase Order</Button>
      </div>

      {stats && (
        <Row gutter={16}>
          <Col span={6}><Card><Statistic title="Total POs" value={stats.total} /></Card></Col>
          <Col span={6}><Card><Statistic title="Draft" value={stats.draft} valueStyle={{ color: '#888' }} /></Card></Col>
          <Col span={6}><Card><Statistic title="Approved" value={stats.approved} valueStyle={{ color: '#1677ff' }} /></Card></Col>
          <Col span={6}><Card><Statistic title="Total Value" value={`₹${(stats.totalValue ?? 0).toFixed(0)}`} /></Card></Col>
        </Row>
      )}

      <Card>
        <Table rowKey="id" loading={isLoading} dataSource={orders as any[]} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>

      {/* Create Modal */}
      <Modal
        title={<Space><ShoppingCartOutlined />New Purchase Order</Space>}
        open={open}
        onCancel={() => { setOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={createMut.isPending}
        okText="Create PO"
        width={860}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(v) => createMut.mutate(v)}
          initialValues={{ lineItems: [{ description: '', quantity: 1, unitPrice: 0, gstRate: 18 }] }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="supplierId" label="Supplier" rules={[{ required: true }]}>
                <Select
                  showSearch
                  placeholder="Select supplier"
                  optionFilterProp="label"
                  options={(customers as any[]).map((c: any) => ({ value: c.id, label: `${c.code} — ${c.name}` }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expectedDate" label="Expected Delivery Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="supplierRef" label="Supplier Reference">
                <Input placeholder="Supplier quotation / ref number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="paymentTerms" label="Payment Terms">
                <Select placeholder="Select terms" options={[
                  { value: 'Immediate', label: 'Immediate' },
                  { value: 'Net 15', label: 'Net 15 Days' },
                  { value: 'Net 30', label: 'Net 30 Days' },
                  { value: 'Net 60', label: 'Net 60 Days' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="deliveryAddress" label="Delivery Address">
            <Input.TextArea rows={2} placeholder="Delivery / receiving address" />
          </Form.Item>
          <Divider>Line Items</Divider>
          <LineItemsForm form={form} />
          <Divider />
          <Form.Item name="notes" label="Notes to Supplier">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* View Drawer */}
      <Drawer
        title={`Purchase Order — ${viewing?.poNumber}`}
        open={!!viewing}
        onClose={() => setViewing(null)}
        width={600}
        extra={<Button icon={<DownloadOutlined />} onClick={() => downloadPurchaseOrderPdf(viewing, company ?? {})}>Download PDF</Button>}
      >
        {viewing && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Tag color={STATUS_COLOR[viewing.status]} style={{ fontSize: 14, padding: '4px 12px' }}>
              {viewing.status.replace(/_/g, ' ')}
            </Tag>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="PO Number" span={2}>{viewing.poNumber}</Descriptions.Item>
              <Descriptions.Item label="Supplier">{viewing.supplier?.name}</Descriptions.Item>
              <Descriptions.Item label="PO Date">{dayjs(viewing.poDate).format('DD MMM YYYY')}</Descriptions.Item>
              <Descriptions.Item label="Expected Delivery">
                {viewing.expectedDate ? dayjs(viewing.expectedDate).format('DD MMM YYYY') : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Terms">{viewing.paymentTerms ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Delivery Address" span={2}>{viewing.deliveryAddress ?? '—'}</Descriptions.Item>
            </Descriptions>
            <div>
              <Text strong>Line Items</Text>
              <Table
                size="small"
                style={{ marginTop: 8 }}
                pagination={false}
                dataSource={(viewing.lineItems ?? []).map((item: any, i: number) => ({ ...item, key: i }))}
                columns={[
                  { title: 'Description', dataIndex: 'description', key: 'd' },
                  { title: 'Qty', dataIndex: 'quantity', key: 'q' },
                  { title: 'Rate', dataIndex: 'unitPrice', key: 'r', render: (v: number) => `₹${v}` },
                  { title: 'GST%', dataIndex: 'gstRate', key: 'g', render: (v: number) => `${v ?? 18}%` },
                ]}
              />
            </div>
            <Descriptions bordered size="small">
              <Descriptions.Item label="Sub Total">₹{viewing.subTotal?.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="GST (CGST+SGST+IGST)">
                ₹{((viewing.cgst ?? 0) + (viewing.sgst ?? 0) + (viewing.igst ?? 0)).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Total Amount">
                <Text strong style={{ fontSize: 16 }}>₹{viewing.totalAmount?.toFixed(2)}</Text>
              </Descriptions.Item>
            </Descriptions>
            {viewing.notes && (
              <Card size="small" title="Notes"><Text>{viewing.notes}</Text></Card>
            )}
          </Space>
        )}
      </Drawer>
    </Space>
  );
}

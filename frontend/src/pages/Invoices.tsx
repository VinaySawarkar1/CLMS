import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, Table, Tag, Button, Space, Typography, Modal, Form, Input, InputNumber,
  Select, DatePicker, message, Row, Col, Divider, Statistic, Drawer, Descriptions,
  Popconfirm, Tooltip, Alert,
} from 'antd';
import {
  FileTextOutlined, PlusOutlined, DeleteOutlined, EyeOutlined,
  CheckCircleOutlined, DollarOutlined, CloseCircleOutlined, DownloadOutlined, EditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getInvoices, createInvoiceDraft, finaliseInvoice, updateInvoice,
  recordPayment, cancelInvoice, deleteInvoice, getInvoiceStats, getCustomers, getLab, getUser,
} from '../api';
import { downloadInvoicePdf } from '../utils/pdfExport';

const { Title, Text } = Typography;

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'default', ISSUED: 'blue', PARTIALLY_PAID: 'orange',
  PAID: 'green', OVERDUE: 'red', CANCELLED: 'default',
};

const GST_RATES = [0, 5, 12, 18, 28];

function LineItemsEditor({ form }: { form: any }) {
  const items = Form.useWatch('lineItems', form) ?? [{ description: '', quantity: 1, unitPrice: 0, gstRate: 18 }];

  const addRow = () => form.setFieldsValue({ lineItems: [...items, { description: '', quantity: 1, unitPrice: 0, gstRate: 18 }] });
  const removeRow = (i: number) => {
    const updated = [...items];
    updated.splice(i, 1);
    form.setFieldsValue({ lineItems: updated });
  };

  const taxable = items.reduce((s: number, item: any) => {
    const lt = (item?.quantity || 0) * (item?.unitPrice || 0);
    const d = lt * ((item?.discountPct || 0) / 100);
    return s + (lt - d);
  }, 0);
  const gstTotal = items.reduce((s: number, item: any) => {
    const lt = (item?.quantity || 0) * (item?.unitPrice || 0);
    const d = lt * ((item?.discountPct || 0) / 100);
    const tx = lt - d;
    return s + (tx * ((item?.gstRate || 18) / 100));
  }, 0);

  return (
    <div>
      <div style={{ background: '#f5f5f5', padding: 8, borderRadius: 6, marginBottom: 8 }}>
        <Row gutter={8}>
          <Col span={7}><Text strong style={{ fontSize: 12 }}>Description / HSN</Text></Col>
          <Col span={3}><Text strong style={{ fontSize: 12 }}>Qty</Text></Col>
          <Col span={3}><Text strong style={{ fontSize: 12 }}>Unit</Text></Col>
          <Col span={3}><Text strong style={{ fontSize: 12 }}>Unit Price</Text></Col>
          <Col span={2}><Text strong style={{ fontSize: 12 }}>Disc%</Text></Col>
          <Col span={2}><Text strong style={{ fontSize: 12 }}>GST%</Text></Col>
          <Col span={2}></Col>
        </Row>
      </div>
      {items.map((_: any, i: number) => (
        <Row gutter={8} key={i} style={{ marginBottom: 6 }}>
          <Col span={7}>
            <Form.Item name={['lineItems', i, 'description']} rules={[{ required: true, message: '' }]} style={{ margin: 0 }}>
              <Input placeholder="Description" />
            </Form.Item>
          </Col>
          <Col span={3}><Form.Item name={['lineItems', i, 'quantity']} rules={[{ required: true }]} style={{ margin: 0 }}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
          <Col span={3}><Form.Item name={['lineItems', i, 'unit']} style={{ margin: 0 }}><Input placeholder="Nos/Hrs/Set" /></Form.Item></Col>
          <Col span={3}><Form.Item name={['lineItems', i, 'unitPrice']} rules={[{ required: true }]} style={{ margin: 0 }}><InputNumber min={0} prefix="₹" style={{ width: '100%' }} /></Form.Item></Col>
          <Col span={2}><Form.Item name={['lineItems', i, 'discountPct']} style={{ margin: 0 }}><InputNumber min={0} max={100} suffix="%" style={{ width: '100%' }} /></Form.Item></Col>
          <Col span={2}>
            <Form.Item name={['lineItems', i, 'gstRate']} style={{ margin: 0 }}>
              <Select style={{ width: '100%' }} options={GST_RATES.map(r => ({ value: r, label: `${r}%` }))} />
            </Form.Item>
          </Col>
          <Col span={2}><Button danger icon={<DeleteOutlined />} size="small" onClick={() => removeRow(i)} disabled={items.length === 1} /></Col>
        </Row>
      ))}
      <Button type="dashed" onClick={addRow} block icon={<PlusOutlined />} style={{ marginTop: 4 }}>Add Line Item</Button>
      <div style={{ background: '#e6f7ff', borderRadius: 6, padding: 12, marginTop: 12 }}>
        <Row justify="end" gutter={24}>
          <Col><Text>Taxable: <Text strong>₹{taxable.toFixed(2)}</Text></Text></Col>
          <Col><Text>GST: <Text strong>₹{gstTotal.toFixed(2)}</Text></Text></Col>
          <Col><Text type="success">Total: <Text strong style={{ fontSize: 16 }}>₹{(taxable + gstTotal).toFixed(2)}</Text></Text></Col>
        </Row>
      </div>
    </div>
  );
}

export default function Invoices() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewing, setViewing] = useState<any>(null);
  const [payFor, setPayFor] = useState<any>(null);
  const [form] = Form.useForm();
  const [payForm] = Form.useForm();

  const { data: invoices = [], isLoading } = useQuery({ queryKey: ['invoices'], queryFn: () => getInvoices() });
  const { data: stats } = useQuery({ queryKey: ['invoiceStats'], queryFn: getInvoiceStats });
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: () => getCustomers() });
  const labId = getUser()?.labId ?? '';
  const { data: company } = useQuery({ queryKey: ['lab', labId], queryFn: () => getLab(labId), enabled: !!labId });

  const refresh = () => { qc.invalidateQueries({ queryKey: ['invoices'] }); qc.invalidateQueries({ queryKey: ['invoiceStats'] }); };

  const openEdit = (row: any) => {
    setEditing(row);
    form.setFieldsValue({
      customerId: row.customerId,
      issueDate: row.issueDate ? dayjs(row.issueDate) : undefined,
      dueDate: row.dueDate ? dayjs(row.dueDate) : undefined,
      customerPoNumber: row.customerPoNumber,
      paymentTerms: row.paymentTerms,
      placeOfSupply: row.placeOfSupply,
      termsConditions: row.termsConditions,
      notes: row.notes,
      lineItems: row.lineItems ?? [],
    });
    setOpen(true);
  };

  const createMut = useMutation({
    mutationFn: (vals: any) => {
      const body = { ...vals, issueDate: vals.issueDate?.toISOString(), dueDate: vals.dueDate?.toISOString(), lineItems: vals.lineItems ?? [] };
      if (editing) return updateInvoice(editing.id, body);
      return vals._action === 'issue' ? createInvoiceDraft(body).then((r: any) => finaliseInvoice(r.id)) : createInvoiceDraft(body);
    },
    onSuccess: (_, vars: any) => {
      const msg = editing ? 'Invoice updated' : (vars._action === 'issue' ? 'Invoice issued' : 'Draft saved');
      message.success(msg);
      setOpen(false); setEditing(null); form.resetFields(); refresh();
    },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Failed'),
  });

  const finaliseMut = useMutation({
    mutationFn: (id: string) => finaliseInvoice(id),
    onSuccess: () => { message.success('Invoice finalised'); refresh(); },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Failed'),
  });

  const payMut = useMutation({
    mutationFn: () => {
      const { amount, method, reference } = payForm.getFieldsValue();
      return recordPayment(payFor.id, { amount: Number(amount), method, reference });
    },
    onSuccess: () => { message.success('Payment recorded'); setPayFor(null); payForm.resetFields(); refresh(); },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Failed'),
  });

  const cancelMut = useMutation({
    mutationFn: (id: string) => cancelInvoice(id),
    onSuccess: () => { message.success('Invoice cancelled'); refresh(); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteInvoice(id),
    onSuccess: () => { message.success('Invoice deleted'); refresh(); },
  });

  const columns = [
    { title: 'Invoice No.', dataIndex: 'invoiceNumber', key: 'inv', render: (v: string, r: any) => (
      <Button type="link" style={{ padding: 0, fontWeight: 600 }} onClick={() => setViewing(r)}>{v}</Button>
    )},
    { title: 'Customer', key: 'cust', render: (_: any, r: any) => r.customer?.name ?? '—' },
    { title: 'Issue Date', dataIndex: 'issueDate', key: 'date', render: (v: string) => v ? dayjs(v).format('DD MMM YYYY') : '—' },
    { title: 'Due Date', dataIndex: 'dueDate', key: 'due', render: (v: string) => {
      if (!v) return '—';
      const overdue = dayjs(v).isBefore(dayjs(), 'day');
      return <Text type={overdue ? 'danger' : undefined}>{dayjs(v).format('DD MMM YYYY')}</Text>;
    }},
    { title: 'Amount', dataIndex: 'totalAmount', key: 'amt', render: (v: number) => <Text strong>₹{v?.toFixed(2)}</Text> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={STATUS_COLOR[s]}>{s.replace(/_/g, ' ')}</Tag> },
    {
      title: 'Actions', key: 'actions',
      render: (_: any, row: any) => (
        <Space>
          <Tooltip title="View Details"><Button size="small" icon={<EyeOutlined />} onClick={() => setViewing(row)} /></Tooltip>
          <Tooltip title="Download PDF"><Button size="small" icon={<DownloadOutlined />} onClick={() => downloadInvoicePdf(row, company ?? {})} /></Tooltip>
          {row.status === 'DRAFT' && (
            <Tooltip title="Edit Invoice"><Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} /></Tooltip>
          )}
          {row.status === 'DRAFT' && (
            <Tooltip title="Finalise Invoice">
              <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => finaliseMut.mutate(row.id)} />
            </Tooltip>
          )}
          {['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(row.status) && (
            <Tooltip title="Record Payment">
              <Button size="small" type="primary" icon={<DollarOutlined />} onClick={() => setPayFor(row)} />
            </Tooltip>
          )}
          {row.status === 'DRAFT' && (
            <Popconfirm title="Cancel this invoice?" onConfirm={() => cancelMut.mutate(row.id)}>
              <Tooltip title="Cancel"><Button size="small" danger icon={<CloseCircleOutlined />} /></Tooltip>
            </Popconfirm>
          )}
          {['DRAFT', 'CANCELLED'].includes(row.status) && (
            <Popconfirm title="Delete this invoice?" onConfirm={() => deleteMut.mutate(row.id)} okType="danger">
              <Tooltip title="Delete"><Button size="small" danger icon={<DeleteOutlined />} /></Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const outstanding = stats ? (stats.issued?.value ?? 0) + (stats.partiallyPaid?.value ?? 0) : 0;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}><FileTextOutlined /> Invoices</Title>
          <Text type="secondary">Create and manage GST tax invoices and payment collections</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>New Invoice</Button>
      </div>

      {stats && (
        <Row gutter={16}>
          <Col span={6}><Card><Statistic title="Total Invoices" value={stats.total} /></Card></Col>
          <Col span={6}><Card><Statistic title="Outstanding" prefix="₹" value={outstanding.toFixed(0)} valueStyle={{ color: '#fa8c16' }} /></Card></Col>
          <Col span={6}><Card><Statistic title="Collected" prefix="₹" value={(stats.totalCollected ?? 0).toFixed(0)} valueStyle={{ color: '#52c41a' }} /></Card></Col>
          <Col span={6}><Card><Statistic title="Paid Invoices" value={stats.paid?.count ?? 0} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        </Row>
      )}

      <Card>
        <Table rowKey="id" loading={isLoading} dataSource={invoices as any[]} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>

      {/* Create / Edit Invoice Modal */}
      <Modal
        title={<Space><FileTextOutlined />{editing ? 'Edit Invoice' : 'New Invoice'}</Space>}
        open={open}
        onCancel={() => { setOpen(false); setEditing(null); form.resetFields(); }}
        footer={editing ? [
          <Button key="cancel" onClick={() => { setOpen(false); setEditing(null); form.resetFields(); }}>Cancel</Button>,
          <Button key="save" type="primary" onClick={() => form.submit()} loading={createMut.isPending}>Save Changes</Button>,
        ] : [
          <Button key="cancel" onClick={() => { setOpen(false); form.resetFields(); }}>Cancel</Button>,
          <Button key="draft" onClick={() => { form.setFieldsValue({ _action: 'draft' }); form.submit(); }} loading={createMut.isPending}>Save as Draft</Button>,
          <Button key="issue" type="primary" onClick={() => { form.setFieldsValue({ _action: 'issue' }); form.submit(); }} loading={createMut.isPending}>Issue Invoice</Button>,
        ]}
        width={900}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(v) => createMut.mutate(v)}
          initialValues={{ lineItems: [{ description: '', quantity: 1, unitPrice: 0, gstRate: 18 }], _action: 'issue' }}
        >
          <Form.Item name="_action" hidden><Input /></Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customerId" label="Customer" rules={[{ required: true }]}>
                <Select
                  showSearch placeholder="Select customer" optionFilterProp="label"
                  options={(customers as any[]).map((c: any) => ({ value: c.id, label: `${c.code} — ${c.name}` }))}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="issueDate" label="Invoice Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="dueDate" label="Due Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="customerPoNumber" label="Customer PO Number">
                <Input placeholder="Customer's PO reference" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="paymentTerms" label="Payment Terms">
                <Select placeholder="Select" options={[
                  { value: 'Immediate', label: 'Immediate' },
                  { value: 'Net 15', label: 'Net 15 Days' },
                  { value: 'Net 30', label: 'Net 30 Days' },
                  { value: 'Net 60', label: 'Net 60 Days' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="placeOfSupply" label="Place of Supply">
                <Input placeholder="State (e.g. Maharashtra)" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Line Items</Divider>
          <LineItemsEditor form={form} />

          <Divider />
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="termsConditions" label="Terms & Conditions">
                <Input.TextArea rows={2} placeholder="Payment terms, delivery conditions..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="notes" label="Notes to Customer">
                <Input.TextArea rows={2} placeholder="Notes visible on invoice PDF..." />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        title={<Space><DollarOutlined />Record Payment — {payFor?.invoiceNumber}</Space>}
        open={!!payFor}
        onCancel={() => { setPayFor(null); payForm.resetFields(); }}
        onOk={() => payForm.submit()}
        confirmLoading={payMut.isPending}
        okText="Record Payment"
        destroyOnClose
      >
        {payFor && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Alert
              message={`Outstanding: ₹${(payFor.totalAmount - payFor.payments?.reduce((s: number, p: any) => s + p.amount, 0)).toFixed(2)}`}
              type="info"
            />
            <Form form={payForm} layout="vertical" onFinish={() => payMut.mutate(undefined)}>
              <Form.Item name="amount" label="Amount Received" rules={[{ required: true }]}>
                <InputNumber
                  prefix="₹" style={{ width: '100%' }} min={0.01}
                  max={payFor.totalAmount - payFor.payments?.reduce((s: number, p: any) => s + p.amount, 0)}
                />
              </Form.Item>
              <Form.Item name="method" label="Payment Mode">
                <Select placeholder="Select" options={[
                  { value: 'Cash', label: 'Cash' }, { value: 'NEFT', label: 'NEFT' },
                  { value: 'RTGS', label: 'RTGS' }, { value: 'UPI', label: 'UPI' },
                  { value: 'Cheque', label: 'Cheque' }, { value: 'Card', label: 'Card' },
                ]} />
              </Form.Item>
              <Form.Item name="reference" label="Transaction Reference">
                <Input placeholder="UTR / cheque number / transaction ID" />
              </Form.Item>
            </Form>
          </Space>
        )}
      </Modal>

      {/* Invoice Detail Drawer */}
      <Drawer
        title={`Invoice — ${viewing?.invoiceNumber}`}
        open={!!viewing}
        onClose={() => setViewing(null)}
        width={680}
        extra={<Button icon={<DownloadOutlined />} onClick={() => downloadInvoicePdf(viewing, company ?? {})}>Download PDF</Button>}
      >
        {viewing && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Tag color={STATUS_COLOR[viewing.status]} style={{ fontSize: 14, padding: '4px 12px' }}>
              {viewing.status.replace(/_/g, ' ')}
            </Tag>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Invoice No." span={2}>{viewing.invoiceNumber}</Descriptions.Item>
              <Descriptions.Item label="Customer">{viewing.customer?.name}</Descriptions.Item>
              <Descriptions.Item label="GSTIN">{viewing.customer?.gstin ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Issue Date">{viewing.issueDate ? dayjs(viewing.issueDate).format('DD MMM YYYY') : '—'}</Descriptions.Item>
              <Descriptions.Item label="Due Date">
                {viewing.dueDate ? (
                  <Text type={dayjs(viewing.dueDate).isBefore(dayjs(), 'day') ? 'danger' : undefined}>
                    {dayjs(viewing.dueDate).format('DD MMM YYYY')}
                  </Text>
                ) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Customer PO">{viewing.customerPoNumber ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Place of Supply">{viewing.placeOfSupply ?? '—'}</Descriptions.Item>
            </Descriptions>

            <div>
              <Text strong>Line Items</Text>
              <Table
                size="small" style={{ marginTop: 8 }} pagination={false}
                dataSource={(viewing.lineItems ?? []).map((item: any, i: number) => ({ ...item, key: i }))}
                columns={[
                  { title: 'Description', dataIndex: 'description', key: 'd' },
                  { title: 'Qty', dataIndex: 'quantity', key: 'q' },
                  { title: 'Rate', dataIndex: 'unitPrice', key: 'r', render: (v: number) => `₹${v}` },
                  { title: 'Disc%', dataIndex: 'discountPct', key: 'dp', render: (v: number) => v ? `${v}%` : '—' },
                  { title: 'GST%', dataIndex: 'gstRate', key: 'g', render: (v: number) => `${v ?? 18}%` },
                ]}
              />
            </div>

            <Descriptions bordered size="small">
              <Descriptions.Item label="Sub Total">₹{viewing.amount?.toFixed(2)}</Descriptions.Item>
              {viewing.cgst > 0 && <Descriptions.Item label="CGST">₹{viewing.cgst?.toFixed(2)}</Descriptions.Item>}
              {viewing.sgst > 0 && <Descriptions.Item label="SGST">₹{viewing.sgst?.toFixed(2)}</Descriptions.Item>}
              {viewing.igst > 0 && <Descriptions.Item label="IGST">₹{viewing.igst?.toFixed(2)}</Descriptions.Item>}
              <Descriptions.Item label="Total Amount">
                <Text strong style={{ fontSize: 16 }}>₹{viewing.totalAmount?.toFixed(2)}</Text>
              </Descriptions.Item>
            </Descriptions>

            {viewing.payments && viewing.payments.length > 0 && (
              <div>
                <Text strong>Payments Received</Text>
                <Table
                  size="small" style={{ marginTop: 8 }} pagination={false}
                  dataSource={viewing.payments.map((p: any, i: number) => ({ ...p, key: i }))}
                  columns={[
                    { title: 'Date', dataIndex: 'paidAt', key: 'd', render: (v: string) => dayjs(v).format('DD MMM YYYY') },
                    { title: 'Amount', dataIndex: 'amount', key: 'a', render: (v: number) => `₹${v?.toFixed(2)}` },
                    { title: 'Mode', dataIndex: 'method', key: 'm', render: (v: string) => v ?? '—' },
                  ]}
                />
                <div style={{ textAlign: 'right', marginTop: 8 }}>
                  <Text>Balance Due: </Text>
                  <Text strong style={{ fontSize: 16 }}>
                    ₹{Math.max(0, viewing.totalAmount - viewing.payments.reduce((s: number, p: any) => s + p.amount, 0)).toFixed(2)}
                  </Text>
                </div>
              </div>
            )}

            {viewing.notes && <Card size="small" title="Notes"><Text>{viewing.notes}</Text></Card>}
            {viewing.termsConditions && <Card size="small" title="Terms & Conditions"><Text>{viewing.termsConditions}</Text></Card>}
          </Space>
        )}
      </Drawer>
    </Space>
  );
}

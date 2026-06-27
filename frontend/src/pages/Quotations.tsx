import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, Table, Tag, Button, Space, Typography, Modal, Form, Input, InputNumber,
  Select, DatePicker, message, Row, Col, Divider, Statistic, Drawer, Descriptions,
  Popconfirm, Tooltip, Progress,
} from 'antd';
import {
  FileDoneOutlined, PlusOutlined, DeleteOutlined, EyeOutlined,
  CopyOutlined, CheckCircleOutlined, CloseCircleOutlined, SendOutlined, DownloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getQuotations, createQuotation, setQuotationStatus, updateQuotation,
  deleteQuotation, duplicateQuotation, getQuotationStats, getCustomers, getLab, getUser,
} from '../api';
import { downloadQuotationPdf } from '../utils/pdfExport';

const { Title, Text } = Typography;

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'default', SENT: 'blue', VIEWED: 'cyan', ACCEPTED: 'green',
  REJECTED: 'red', EXPIRED: 'orange', SUPERSEDED: 'gray', CONVERTED: 'purple',
};

const STATUS_OPTIONS = ['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED'];
const GST_RATES = [0, 5, 12, 18, 28];

function LineItemsEditor({ form }: { form: any }) {
  const items = Form.useWatch('items', form) ?? [{ description: '', quantity: 1, unitPrice: 0, gstRate: 18 }];

  const addRow = () => form.setFieldsValue({ items: [...items, { description: '', quantity: 1, unitPrice: 0, gstRate: 18 }] });
  const removeRow = (i: number) => {
    const updated = [...items]; updated.splice(i, 1);
    form.setFieldsValue({ items: updated });
  };

  const taxable = items.reduce((s: number, item: any) => {
    const lt = (item?.quantity || 0) * (item?.unitPrice || 0);
    return s + lt - lt * ((item?.discountPct || 0) / 100);
  }, 0);
  const gst = items.reduce((s: number, item: any) => {
    const lt = (item?.quantity || 0) * (item?.unitPrice || 0);
    const tx = lt - lt * ((item?.discountPct || 0) / 100);
    return s + tx * ((item?.gstRate || 18) / 100);
  }, 0);

  return (
    <div>
      <div style={{ background: '#f5f5f5', padding: '6px 8px', borderRadius: 6, marginBottom: 8 }}>
        <Row gutter={8}>
          {['Description', 'Qty', 'Unit Price', 'Disc%', 'GST%', ''].map((h, i) => (
            <Col key={i} span={i === 0 ? 8 : i === 5 ? 2 : 3}><Text strong style={{ fontSize: 12 }}>{h}</Text></Col>
          ))}
        </Row>
      </div>
      {items.map((_: any, i: number) => (
        <Row gutter={8} key={i} style={{ marginBottom: 6 }}>
          <Col span={8}><Form.Item name={['items', i, 'description']} rules={[{ required: true, message: '' }]} style={{ margin: 0 }}><Input placeholder="Service / product" /></Form.Item></Col>
          <Col span={3}><Form.Item name={['items', i, 'quantity']} rules={[{ required: true }]} style={{ margin: 0 }}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
          <Col span={3}><Form.Item name={['items', i, 'unitPrice']} rules={[{ required: true }]} style={{ margin: 0 }}><InputNumber min={0} prefix="₹" style={{ width: '100%' }} /></Form.Item></Col>
          <Col span={3}><Form.Item name={['items', i, 'discountPct']} style={{ margin: 0 }}><InputNumber min={0} max={100} suffix="%" style={{ width: '100%' }} /></Form.Item></Col>
          <Col span={3}><Form.Item name={['items', i, 'gstRate']} style={{ margin: 0 }}><Select style={{ width: '100%' }} options={GST_RATES.map(r => ({ value: r, label: `${r}%` }))} /></Form.Item></Col>
          <Col span={2}><Button danger icon={<DeleteOutlined />} size="small" onClick={() => removeRow(i)} disabled={items.length === 1} /></Col>
        </Row>
      ))}
      <Button type="dashed" onClick={addRow} block icon={<PlusOutlined />} style={{ marginTop: 4 }}>Add Item</Button>
      <div style={{ background: '#e6f7ff', borderRadius: 6, padding: 12, marginTop: 10 }}>
        <Row justify="end" gutter={24}>
          <Col><Text>Taxable: <Text strong>₹{taxable.toFixed(2)}</Text></Text></Col>
          <Col><Text>GST: <Text strong>₹{gst.toFixed(2)}</Text></Text></Col>
          <Col><Text type="success">Total: <Text strong style={{ fontSize: 16 }}>₹{(taxable + gst).toFixed(2)}</Text></Text></Col>
        </Row>
      </div>
    </div>
  );
}

export default function Quotations() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<any>(null);
  const [form] = Form.useForm();

  const { data: quotes = [], isLoading } = useQuery({ queryKey: ['quotations'], queryFn: () => getQuotations() });
  const { data: stats } = useQuery({ queryKey: ['quotationStats'], queryFn: getQuotationStats });
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: () => getCustomers() });
  const labId = getUser()?.labId ?? '';
  const { data: company } = useQuery({ queryKey: ['lab', labId], queryFn: () => getLab(labId), enabled: !!labId });

  const refresh = () => { qc.invalidateQueries({ queryKey: ['quotations'] }); qc.invalidateQueries({ queryKey: ['quotationStats'] }); };

  const createMut = useMutation({
    mutationFn: (vals: any) => createQuotation({
      ...vals,
      validUntil: vals.validUntil?.toISOString(),
      items: vals.items ?? [],
    }),
    onSuccess: () => { message.success('Quotation created'); setOpen(false); form.resetFields(); refresh(); },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Failed'),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => setQuotationStatus(id, status),
    onSuccess: () => { message.success('Status updated'); refresh(); },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Failed'),
  });

  const dupMut = useMutation({
    mutationFn: (id: string) => duplicateQuotation(id),
    onSuccess: () => { message.success('Quotation duplicated'); refresh(); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteQuotation(id),
    onSuccess: () => { message.success('Quotation deleted'); refresh(); },
  });

  const columns = [
    { title: 'Quote No.', dataIndex: 'quoteNumber', key: 'q', render: (v: string, r: any) => (
      <Button type="link" style={{ padding: 0, fontWeight: 600 }} onClick={() => setViewing(r)}>{v}</Button>
    )},
    { title: 'Customer', key: 'cust', render: (_: any, r: any) => r.customer?.name ?? '—' },
    { title: 'Subject', dataIndex: 'subject', key: 'sub', render: (v: string) => v ?? '—', ellipsis: true },
    { title: 'Total', dataIndex: 'totalAmount', key: 'tot', render: (v: number) => <Text strong>₹{v?.toFixed(2)}</Text> },
    { title: 'Valid Until', dataIndex: 'validUntil', key: 'valid',
      render: (v: string) => {
        if (!v) return '—';
        const exp = dayjs(v).isBefore(dayjs(), 'day');
        return <Text type={exp ? 'danger' : undefined}>{dayjs(v).format('DD MMM YYYY')}</Text>;
      },
    },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={STATUS_COLOR[s]}>{s}</Tag> },
    {
      title: 'Actions', key: 'actions',
      render: (_: any, row: any) => (
        <Space>
          <Tooltip title="View"><Button size="small" icon={<EyeOutlined />} onClick={() => setViewing(row)} /></Tooltip>
          <Tooltip title="Download PDF"><Button size="small" icon={<DownloadOutlined />} onClick={() => downloadQuotationPdf(row, company ?? {})} /></Tooltip>
          {row.status === 'DRAFT' && (
            <Tooltip title="Mark Sent">
              <Button size="small" icon={<SendOutlined />} onClick={() => statusMut.mutate({ id: row.id, status: 'SENT' })} />
            </Tooltip>
          )}
          {['SENT', 'VIEWED'].includes(row.status) && (
            <>
              <Tooltip title="Accept"><Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => statusMut.mutate({ id: row.id, status: 'ACCEPTED' })} /></Tooltip>
              <Tooltip title="Reject"><Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => statusMut.mutate({ id: row.id, status: 'REJECTED' })} /></Tooltip>
            </>
          )}
          <Tooltip title="Duplicate">
            <Button size="small" icon={<CopyOutlined />} onClick={() => dupMut.mutate(row.id)} />
          </Tooltip>
          {row.status === 'DRAFT' && (
            <Popconfirm title="Delete this quotation?" onConfirm={() => deleteMut.mutate(row.id)} okType="danger">
              <Tooltip title="Delete"><Button size="small" danger icon={<DeleteOutlined />} /></Tooltip>
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
          <Title level={3} style={{ margin: 0 }}><FileDoneOutlined /> Quotations</Title>
          <Text type="secondary">Create price proposals and track acceptance</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>New Quotation</Button>
      </div>

      {stats && (
        <Row gutter={16}>
          <Col span={4}><Card size="small"><Statistic title="Total" value={stats.total} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="Draft" value={stats.draft} valueStyle={{ color: '#888' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="Sent" value={stats.sent} valueStyle={{ color: '#1677ff' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="Accepted" value={stats.accepted} valueStyle={{ color: '#52c41a' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="Rejected" value={stats.rejected} valueStyle={{ color: '#f5222d' }} /></Card></Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="Win Rate" value={stats.winRate} suffix="%" valueStyle={{ color: stats.winRate >= 50 ? '#52c41a' : '#fa8c16' }} />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        <Table rowKey="id" loading={isLoading} dataSource={quotes as any[]} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>

      {/* Create Modal */}
      <Modal
        title={<Space><FileDoneOutlined />New Quotation</Space>}
        open={open}
        onCancel={() => { setOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={createMut.isPending}
        okText="Create Quotation"
        width={880}
        destroyOnClose
      >
        <Form
          form={form} layout="vertical"
          onFinish={(v) => createMut.mutate(v)}
          initialValues={{ items: [{ description: '', quantity: 1, unitPrice: 0, gstRate: 18 }] }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customerId" label="Customer" rules={[{ required: true }]}>
                <Select showSearch placeholder="Select customer" optionFilterProp="label"
                  options={(customers as any[]).map((c: any) => ({ value: c.id, label: `${c.code} — ${c.name}` }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="validUntil" label="Valid Until" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="subject" label="Subject / Title">
                <Input placeholder="Brief description of this quotation" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="reference" label="Reference Number">
                <Input placeholder="Customer enquiry or PO reference" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="deliveryTerms" label="Delivery Terms">
                <Input placeholder="Ex-works, freight included, etc." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="placeOfSupply" label="Place of Supply">
                <Input placeholder="Customer's state" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Line Items</Divider>
          <LineItemsEditor form={form} />
          <Divider />

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="termsConditions" label="Terms & Conditions">
                <Input.TextArea rows={2} placeholder="Payment terms, delivery, warranty..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="notes" label="Internal Notes">
                <Input.TextArea rows={2} placeholder="Not visible on PDF" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Detail Drawer */}
      <Drawer title={`Quotation — ${viewing?.quoteNumber}`} open={!!viewing} onClose={() => setViewing(null)} width={660}>
        {viewing && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Tag color={STATUS_COLOR[viewing.status]} style={{ fontSize: 14, padding: '4px 12px' }}>{viewing.status}</Tag>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Quote No." span={2}>{viewing.quoteNumber}</Descriptions.Item>
              <Descriptions.Item label="Customer">{viewing.customer?.name}</Descriptions.Item>
              <Descriptions.Item label="Created">{dayjs(viewing.createdAt).format('DD MMM YYYY')}</Descriptions.Item>
              <Descriptions.Item label="Valid Until">
                {viewing.validUntil ? dayjs(viewing.validUntil).format('DD MMM YYYY') : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Reference">{viewing.reference ?? '—'}</Descriptions.Item>
              {viewing.subject && <Descriptions.Item label="Subject" span={2}>{viewing.subject}</Descriptions.Item>}
            </Descriptions>

            <div>
              <Text strong>Line Items</Text>
              <Table
                size="small" style={{ marginTop: 8 }} pagination={false}
                dataSource={(viewing.items ?? []).map((item: any, i: number) => ({ ...item, key: i }))}
                columns={[
                  { title: 'Description', dataIndex: 'description', key: 'd' },
                  { title: 'Qty', dataIndex: 'quantity', key: 'q' },
                  { title: 'Rate', dataIndex: 'unitPrice', key: 'r', render: (v: number) => `₹${v}` },
                  { title: 'GST%', dataIndex: 'gstRate', key: 'g', render: (v: number) => `${v ?? 18}%` },
                ]}
              />
            </div>

            <Descriptions bordered size="small">
              <Descriptions.Item label="Sub Total">₹{viewing.amount?.toFixed(2)}</Descriptions.Item>
              {viewing.cgst > 0 && <Descriptions.Item label="CGST">₹{viewing.cgst?.toFixed(2)}</Descriptions.Item>}
              {viewing.sgst > 0 && <Descriptions.Item label="SGST">₹{viewing.sgst?.toFixed(2)}</Descriptions.Item>}
              {viewing.igst > 0 && <Descriptions.Item label="IGST">₹{viewing.igst?.toFixed(2)}</Descriptions.Item>}
              <Descriptions.Item label="Grand Total"><Text strong style={{ fontSize: 16 }}>₹{viewing.totalAmount?.toFixed(2)}</Text></Descriptions.Item>
            </Descriptions>

            <Space>
              {viewing.status === 'DRAFT' && (
                <Button type="primary" icon={<SendOutlined />} onClick={() => { statusMut.mutate({ id: viewing.id, status: 'SENT' }); setViewing(null); }}>
                  Mark Sent
                </Button>
              )}
              {['SENT', 'VIEWED'].includes(viewing.status) && (
                <>
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => { statusMut.mutate({ id: viewing.id, status: 'ACCEPTED' }); setViewing(null); }}>Accept</Button>
                  <Button danger icon={<CloseCircleOutlined />} onClick={() => { statusMut.mutate({ id: viewing.id, status: 'REJECTED' }); setViewing(null); }}>Reject</Button>
                </>
              )}
              <Button icon={<CopyOutlined />} onClick={() => { dupMut.mutate(viewing.id); setViewing(null); }}>Duplicate</Button>
              <Button icon={<DownloadOutlined />} onClick={() => downloadQuotationPdf(viewing, company ?? {})}>Download PDF</Button>
            </Space>
          </Space>
        )}
      </Drawer>
    </Space>
  );
}

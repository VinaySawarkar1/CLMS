import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, Table, Tag, Button, Space, Typography, Modal, Form, Input, InputNumber, Select, DatePicker, message, Row, Col, Divider,
} from 'antd';
import { FileDoneOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getQuotations, createQuotation, setQuotationStatus, getCustomers } from '../api';

const { Title, Text } = Typography;

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'default', SENT: 'blue', ACCEPTED: 'green', REJECTED: 'red', CONVERTED: 'purple',
};
const STATUS_FLOW = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'CONVERTED'];

export default function Quotations() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: quotes = [], isLoading } = useQuery({ queryKey: ['quotations'], queryFn: getQuotations });
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: () => getCustomers() });

  const createMut = useMutation({
    mutationFn: (vals: any) => createQuotation({
      customerId: vals.customerId,
      taxRate: vals.taxRate ?? 18,
      validUntil: vals.validUntil ? vals.validUntil.toISOString() : undefined,
      notes: vals.notes,
      items: (vals.items ?? []).map((i: any) => ({ description: i.description, quantity: Number(i.quantity), rate: Number(i.rate) })),
    }),
    onSuccess: () => {
      message.success('Quotation created');
      setOpen(false); form.resetFields();
      qc.invalidateQueries({ queryKey: ['quotations'] });
    },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Failed'),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => setQuotationStatus(id, status),
    onSuccess: () => { message.success('Status updated'); qc.invalidateQueries({ queryKey: ['quotations'] }); },
  });

  const columns = [
    { title: 'Quote No.', dataIndex: 'quoteNumber', key: 'q', render: (v: string) => <Text strong>{v}</Text> },
    { title: 'Customer', key: 'cust', render: (_: any, r: any) => r.customer?.name ?? '—' },
    { title: 'Amount', dataIndex: 'amount', key: 'amt', render: (v: number) => `₹${v.toFixed(2)}` },
    { title: 'Tax', dataIndex: 'taxAmount', key: 'tax', render: (v: number) => `₹${v.toFixed(2)}` },
    { title: 'Total', dataIndex: 'totalAmount', key: 'tot', render: (v: number) => <Text strong>₹{v.toFixed(2)}</Text> },
    {
      title: 'Valid Until', dataIndex: 'validUntil', key: 'valid',
      render: (v: string) => v ? dayjs(v).format('DD MMM YYYY') : '—',
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string, row: any) => (
        <Select
          size="small"
          value={s}
          style={{ width: 130 }}
          onChange={(v) => statusMut.mutate({ id: row.id, status: v })}
          options={STATUS_FLOW.map((x) => ({ value: x, label: x }))}
          // @ts-ignore antd Select label render
          labelRender={() => <Tag color={STATUS_COLOR[s]}>{s}</Tag>}
        />
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}><FileDoneOutlined /> Quotations</Title>
          <Text type="secondary">Create quotes for customers before raising calibration jobs</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>New Quotation</Button>
      </div>

      <Card>
        <Table rowKey="id" loading={isLoading} dataSource={quotes as any[]} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title="New Quotation"
        open={open}
        onCancel={() => { setOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={createMut.isPending}
        okText="Create Quotation"
        width={720}
      >
        <Form form={form} layout="vertical" onFinish={(v) => createMut.mutate(v)} initialValues={{ taxRate: 18, items: [{ description: '', quantity: 1, rate: 0 }] }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customerId" label="Customer" rules={[{ required: true }]}>
                <Select
                  showSearch
                  placeholder="Select customer"
                  optionFilterProp="label"
                  options={(customers as any[]).map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))}
                />
              </Form.Item>
            </Col>
            <Col span={6}><Form.Item name="taxRate" label="Tax / GST (%)"><InputNumber min={0} max={100} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={6}><Form.Item name="validUntil" label="Valid Until"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          </Row>

          <Divider orientation="left" plain>Line Items</Divider>
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Row gutter={8} key={key} align="middle">
                    <Col span={12}><Form.Item {...rest} name={[name, 'description']} rules={[{ required: true, message: 'Required' }]}><Input placeholder="Service description" /></Form.Item></Col>
                    <Col span={5}><Form.Item {...rest} name={[name, 'quantity']} rules={[{ required: true }]}><InputNumber min={1} placeholder="Qty" style={{ width: '100%' }} /></Form.Item></Col>
                    <Col span={5}><Form.Item {...rest} name={[name, 'rate']} rules={[{ required: true }]}><InputNumber min={0} placeholder="Rate ₹" style={{ width: '100%' }} /></Form.Item></Col>
                    <Col span={2}><Button danger type="text" icon={<DeleteOutlined />} onClick={() => remove(name)} /></Col>
                  </Row>
                ))}
                <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add({ description: '', quantity: 1, rate: 0 })}>Add Item</Button>
              </>
            )}
          </Form.List>

          <Form.Item name="notes" label="Notes" style={{ marginTop: 16 }}><Input.TextArea rows={2} placeholder="Terms, delivery, etc." /></Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

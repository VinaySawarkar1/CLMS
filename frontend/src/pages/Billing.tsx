import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button, Card, Col, Form, InputNumber, Modal, Row, Select, Space, Table, Tag, Typography,
} from 'antd';
import { PlusOutlined, DollarOutlined, CheckOutlined } from '@ant-design/icons';
import { createInvoice, getCustomers, getInvoices, payInvoice } from '../api';

const { Title, Text } = Typography;

export default function Billing() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [payFor, setPayFor] = useState<any>(null);
  const [payForm] = Form.useForm();
  const [createForm] = Form.useForm();

  const { data = [], isLoading } = useQuery({ queryKey: ['invoices'], queryFn: getInvoices });
  const { data: customers = [] } = useQuery({ queryKey: ['customers', ''], queryFn: () => getCustomers() });

  const refresh = () => qc.invalidateQueries({ queryKey: ['invoices'] });
  const createMut = useMutation({
    mutationFn: () => {
      const { customerId, amount } = createForm.getFieldsValue();
      return createInvoice({ customerId, amount: Number(amount) });
    },
    onSuccess: () => { refresh(); setOpen(false); createForm.resetFields(); },
  });
  const payMut = useMutation({
    mutationFn: () => payInvoice(payFor.id, { amount: Number(payForm.getFieldValue('amount')) }),
    onSuccess: () => { refresh(); setPayFor(null); payForm.resetFields(); },
  });

  const columns = [
    {
      title: 'Invoice No.',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (v: string) => <Text strong style={{ color: '#1677ff' }}>{v}</Text>,
    },
    {
      title: 'Customer',
      dataIndex: ['customer', 'name'],
      key: 'customer',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => <Text>₹{v?.toFixed(2)}</Text>,
    },
    {
      title: 'Tax (GST 18%)',
      dataIndex: 'taxAmount',
      key: 'tax',
      render: (v: number) => <Text type="secondary">₹{v?.toFixed(2)}</Text>,
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'total',
      render: (v: number) => <Text strong>₹{v?.toFixed(2)}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Tag color={v === 'PAID' ? 'green' : v === 'PARTIAL' ? 'orange' : 'red'}>
          {v}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, row: any) => (
        row.status !== 'PAID' && (
          <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => setPayFor(row)}>
            Record Payment
          </Button>
        )
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
                <DollarOutlined style={{ color: '#52c41a' }} />
                Billing
              </Space>
            </Title>
            <Text type="secondary">Manage invoices and payment records</Text>
          </Col>
          <Col>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)} size="large">
                New Invoice
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 15, showTotal: (t) => `Total ${t} invoices` }}
          size="middle"
        />
      </Card>

      <Modal
        title={<Space><PlusOutlined /><span>New Invoice</span></Space>}
        open={open}
        onCancel={() => { setOpen(false); createForm.resetFields(); }}
        onOk={() => createForm.validateFields().then(() => createMut.mutate())}
        okText="Create Invoice (+ 18% GST)"
        confirmLoading={createMut.isPending}
        width={480}
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="customerId" label="Customer" rules={[{ required: true }]}>
            <Select
              placeholder="Select customer"
              options={customers.map((c: any) => ({ value: c.id, label: c.name }))}
              showSearch
              filterOption={(i, o) => (o?.label as string)?.toLowerCase().includes(i.toLowerCase())}
            />
          </Form.Item>
          <Form.Item name="amount" label="Amount (before tax)" rules={[{ required: true }]}>
            <InputNumber
              prefix="₹"
              style={{ width: '100%' }}
              min={0}
              precision={2}
              placeholder="0.00"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<Space><CheckOutlined /><span>Record Payment — {payFor?.invoiceNumber}</span></Space>}
        open={!!payFor}
        onCancel={() => { setPayFor(null); payForm.resetFields(); }}
        onOk={() => payForm.validateFields().then(() => payMut.mutate())}
        okText="Record Payment"
        confirmLoading={payMut.isPending}
        width={400}
      >
        <Form form={payForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="amount" label="Payment Amount" rules={[{ required: true }]}>
            <InputNumber
              prefix="₹"
              style={{ width: '100%' }}
              min={0}
              precision={2}
              placeholder="0.00"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

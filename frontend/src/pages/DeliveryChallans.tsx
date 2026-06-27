import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, Table, Tag, Button, Space, Typography, Modal, Form, Input, InputNumber,
  Select, DatePicker, message, Row, Col, Divider, Statistic, Drawer, Descriptions,
  Popconfirm, Tooltip, Steps,
} from 'antd';
import {
  CarOutlined, PlusOutlined, DeleteOutlined, EyeOutlined,
  CheckCircleOutlined, CloseCircleOutlined, SendOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getDeliveryChallans, createDeliveryChallan, dispatchChallan,
  markChallanDelivered, setDeliveryChallanStatus, deleteDeliveryChallan,
  getDeliveryChallanStats, getCustomers,
} from '../api';

const { Title, Text } = Typography;

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'default', DISPATCHED: 'blue', DELIVERED: 'green',
  CLOSED: 'purple', CANCELLED: 'red',
};

const STATUS_STEP: Record<string, number> = {
  DRAFT: 0, DISPATCHED: 1, DELIVERED: 2, CLOSED: 3,
};

export default function DeliveryChallans() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<any>(null);
  const [form] = Form.useForm();

  const { data: challans = [], isLoading } = useQuery({ queryKey: ['deliveryChallans'], queryFn: () => getDeliveryChallans() });
  const { data: stats } = useQuery({ queryKey: ['dcStats'], queryFn: getDeliveryChallanStats });
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: () => getCustomers() });

  const refresh = () => { qc.invalidateQueries({ queryKey: ['deliveryChallans'] }); qc.invalidateQueries({ queryKey: ['dcStats'] }); };

  const createMut = useMutation({
    mutationFn: (vals: any) => createDeliveryChallan({
      ...vals,
      expectedDelivery: vals.expectedDelivery?.toISOString(),
      lineItems: (vals.lineItems ?? []).map((item: any) => ({
        description: item.description, quantity: Number(item.quantity || 0), unit: item.unit, remarks: item.remarks,
      })),
    }),
    onSuccess: () => { message.success('Delivery Challan created'); setOpen(false); form.resetFields(); refresh(); },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Failed'),
  });

  const dispatchMut = useMutation({
    mutationFn: (id: string) => dispatchChallan(id),
    onSuccess: () => { message.success('Challan dispatched'); refresh(); },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Failed'),
  });

  const deliverMut = useMutation({
    mutationFn: (id: string) => markChallanDelivered(id),
    onSuccess: () => { message.success('Marked as delivered'); refresh(); },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Failed'),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => setDeliveryChallanStatus(id, status),
    onSuccess: () => { message.success('Status updated'); refresh(); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteDeliveryChallan(id),
    onSuccess: () => { message.success('Challan deleted'); refresh(); },
  });

  const columns = [
    { title: 'Challan No.', dataIndex: 'challanNumber', key: 'cn', render: (v: string) => <Text strong style={{ color: '#1677ff' }}>{v}</Text> },
    { title: 'Customer', key: 'cust', render: (_: any, r: any) => r.customer?.name ?? '—' },
    { title: 'Type', dataIndex: 'challanType', key: 'type', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Date', dataIndex: 'challanDate', key: 'date', render: (v: string) => dayjs(v).format('DD MMM YYYY') },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string, row: any) => (
        <Space>
          <Tag color={STATUS_COLOR[s]}>{s}</Tag>
          {s === 'DRAFT' && (
            <Tooltip title="Confirm Dispatch">
              <Button size="small" type="primary" icon={<SendOutlined />} onClick={() => dispatchMut.mutate(row.id)} />
            </Tooltip>
          )}
          {s === 'DISPATCHED' && (
            <Tooltip title="Mark Delivered">
              <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => deliverMut.mutate(row.id)} />
            </Tooltip>
          )}
          {s === 'DELIVERED' && (
            <Tooltip title="Close Challan">
              <Button size="small" icon={<CheckCircleOutlined />} onClick={() => statusMut.mutate({ id: row.id, status: 'CLOSED' })} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Transport', key: 'transport',
      render: (_: any, r: any) => r.vehicleNumber ? <Text type="secondary">{r.vehicleNumber}</Text> : '—',
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: any, row: any) => (
        <Space>
          <Tooltip title="View Details">
            <Button size="small" icon={<EyeOutlined />} onClick={() => setViewing(row)} />
          </Tooltip>
          {['DRAFT', 'CANCELLED'].includes(row.status) && (
            <Popconfirm title="Delete this challan?" onConfirm={() => deleteMut.mutate(row.id)} okType="danger">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
          {['DRAFT', 'DISPATCHED'].includes(row.status) && (
            <Popconfirm title="Cancel this challan?" onConfirm={() => statusMut.mutate({ id: row.id, status: 'CANCELLED' })}>
              <Button size="small" danger icon={<CloseCircleOutlined />} />
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
          <Title level={3} style={{ margin: 0 }}><CarOutlined /> Delivery Challans</Title>
          <Text type="secondary">Track goods dispatched to customers</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>New Delivery Challan</Button>
      </div>

      {stats && (
        <Row gutter={16}>
          <Col span={6}><Card><Statistic title="Total" value={stats.total} /></Card></Col>
          <Col span={6}><Card><Statistic title="Draft" value={stats.draft} valueStyle={{ color: '#888' }} /></Card></Col>
          <Col span={6}><Card><Statistic title="Dispatched" value={stats.dispatched} valueStyle={{ color: '#1677ff' }} /></Card></Col>
          <Col span={6}><Card><Statistic title="Delivered" value={stats.delivered} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        </Row>
      )}

      <Card>
        <Table rowKey="id" loading={isLoading} dataSource={challans as any[]} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>

      {/* Create Modal */}
      <Modal
        title={<Space><CarOutlined />New Delivery Challan</Space>}
        open={open}
        onCancel={() => { setOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={createMut.isPending}
        okText="Create Challan"
        width={820}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(v) => createMut.mutate(v)}
          initialValues={{ challanType: 'SALE', lineItems: [{ description: '', quantity: 1 }] }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customerId" label="Customer" rules={[{ required: true }]}>
                <Select
                  showSearch placeholder="Select customer" optionFilterProp="label"
                  options={(customers as any[]).map((c: any) => ({ value: c.id, label: `${c.code} — ${c.name}` }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="challanType" label="Challan Type">
                <Select options={[
                  { value: 'SALE', label: 'Sale' },
                  { value: 'JOB_WORK', label: 'Job Work' },
                  { value: 'RETURNABLE', label: 'Returnable' },
                  { value: 'NON_RETURNABLE', label: 'Non-Returnable' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="deliveryAddress" label="Delivery Address">
            <Input.TextArea rows={2} placeholder="Customer delivery / site address" />
          </Form.Item>

          <Divider>Items Being Dispatched</Divider>
          <Form.List name="lineItems">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name }) => (
                  <Row gutter={8} key={key} style={{ marginBottom: 6 }}>
                    <Col span={14}>
                      <Form.Item name={[name, 'description']} rules={[{ required: true, message: '' }]} style={{ margin: 0 }}>
                        <Input placeholder="Item / product description" />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item name={[name, 'quantity']} rules={[{ required: true }]} style={{ margin: 0 }}>
                        <InputNumber min={0} placeholder="Qty" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item name={[name, 'unit']} style={{ margin: 0 }}>
                        <Input placeholder="Unit" />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Button danger icon={<DeleteOutlined />} size="small" onClick={() => remove(name)} disabled={fields.length === 1} />
                    </Col>
                  </Row>
                ))}
                <Button type="dashed" onClick={() => add({ description: '', quantity: 1 })} block icon={<PlusOutlined />}>
                  Add Item
                </Button>
              </>
            )}
          </Form.List>

          <Divider>Logistics Details</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="transportMode" label="Transport Mode">
                <Select placeholder="Select mode" options={[
                  { value: 'Road', label: 'Road' }, { value: 'Rail', label: 'Rail' },
                  { value: 'Air', label: 'Air' }, { value: 'Courier', label: 'Courier' },
                  { value: 'Hand Delivery', label: 'Hand Delivery' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="transporterName" label="Transporter Name">
                <Input placeholder="Transporter / courier name" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="vehicleNumber" label="Vehicle Number">
                <Input placeholder="e.g. MH 12 AB 1234" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="lrNumber" label="LR Number">
                <Input placeholder="Lorry Receipt number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="eWayBillNumber" label="E-Way Bill Number">
                <Input placeholder="E-Way Bill (if applicable)" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="driverName" label="Driver Name">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="driverMobile" label="Driver Mobile">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="numberOfPackages" label="No. of Packages">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="weightKg" label="Weight (kg)">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expectedDelivery" label="Expected Delivery Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* View Drawer */}
      <Drawer title={`Delivery Challan — ${viewing?.challanNumber}`} open={!!viewing} onClose={() => setViewing(null)} width={620}>
        {viewing && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Steps
              current={STATUS_STEP[viewing.status] ?? 0}
              items={[{ title: 'Draft' }, { title: 'Dispatched' }, { title: 'Delivered' }, { title: 'Closed' }]}
              size="small"
            />
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Challan No." span={2}>{viewing.challanNumber}</Descriptions.Item>
              <Descriptions.Item label="Customer">{viewing.customer?.name}</Descriptions.Item>
              <Descriptions.Item label="Type"><Tag>{viewing.challanType}</Tag></Descriptions.Item>
              <Descriptions.Item label="Date">{dayjs(viewing.challanDate).format('DD MMM YYYY')}</Descriptions.Item>
              <Descriptions.Item label="Expected Delivery">
                {viewing.expectedDelivery ? dayjs(viewing.expectedDelivery).format('DD MMM YYYY') : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Delivery Address" span={2}>{viewing.deliveryAddress ?? '—'}</Descriptions.Item>
            </Descriptions>
            <div>
              <Text strong>Items</Text>
              <Table
                size="small" style={{ marginTop: 8 }} pagination={false}
                dataSource={(viewing.lineItems ?? []).map((item: any, i: number) => ({ ...item, key: i }))}
                columns={[
                  { title: 'Description', dataIndex: 'description', key: 'd' },
                  { title: 'Qty', dataIndex: 'quantity', key: 'q' },
                  { title: 'Unit', dataIndex: 'unit', key: 'u', render: (v: string) => v ?? '—' },
                ]}
              />
            </div>
            {(viewing.transportMode || viewing.vehicleNumber || viewing.lrNumber) && (
              <Descriptions bordered column={2} size="small" title="Logistics">
                <Descriptions.Item label="Mode">{viewing.transportMode ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Transporter">{viewing.transporterName ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Vehicle">{viewing.vehicleNumber ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="LR Number">{viewing.lrNumber ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="E-Way Bill">{viewing.eWayBillNumber ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Packages">{viewing.numberOfPackages ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Driver">{viewing.driverName ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Driver Mobile">{viewing.driverMobile ?? '—'}</Descriptions.Item>
              </Descriptions>
            )}
            {viewing.remarks && <Card size="small" title="Remarks"><Text>{viewing.remarks}</Text></Card>}
          </Space>
        )}
      </Drawer>
    </Space>
  );
}

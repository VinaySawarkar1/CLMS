import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Space, Table, Tag, Typography, DatePicker,
} from 'antd';
import { PlusOutlined, ToolOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { createInstrument, getCustomers, getInstruments } from '../api';

const { Title, Text } = Typography;

export default function Instruments() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const { data = [], isLoading } = useQuery({ queryKey: ['instruments'], queryFn: () => getInstruments() });
  const { data: customers = [] } = useQuery({ queryKey: ['customers', ''], queryFn: () => getCustomers() });

  const mut = useMutation({
    mutationFn: () => {
      const v = form.getFieldsValue();
      return createInstrument({ ...v, lastCalibrationDate: v.lastCalibrationDate ? v.lastCalibrationDate.toISOString() : undefined });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instruments'] });
      setOpen(false);
      form.resetFields();
    },
  });

  const columns = [
    {
      title: 'ID Number',
      dataIndex: 'idNumber',
      key: 'idNumber',
      width: 120,
      render: (v: string) => v ? <Tag color="geekblue">{v}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Instrument Name',
      dataIndex: 'name',
      key: 'name',
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: 'Make',
      dataIndex: 'make',
      key: 'make',
      render: (v: string) => v || <Text type="secondary">—</Text>,
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
      render: (v: string) => v || <Text type="secondary">—</Text>,
    },
    {
      title: 'Serial No.',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      render: (v: string) => v ? <Tag>{v}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Range',
      dataIndex: 'range',
      key: 'range',
      render: (v: string) => v || <Text type="secondary">—</Text>,
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      render: (v: string) => v ? <Tag color="cyan">{v}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Least Count',
      dataIndex: 'leastCount',
      key: 'leastCount',
      render: (v: string) => v || <Text type="secondary">—</Text>,
    },
    {
      title: 'Next Due',
      dataIndex: 'nextDueDate',
      key: 'nextDueDate',
      render: (v: string) => {
        if (!v) return <Text type="secondary">—</Text>;
        const d = dayjs(v);
        const overdue = d.isBefore(dayjs());
        const soon = !overdue && d.isBefore(dayjs().add(30, 'day'));
        return (
          <Space direction="vertical" size={0}>
            <Text>{d.format('DD MMM YYYY')}</Text>
            {overdue ? <Tag color="red">OVERDUE</Tag> : soon ? <Tag color="orange">Due Soon</Tag> : null}
          </Space>
        );
      },
    },
    {
      title: 'Customer',
      dataIndex: ['customer', 'name'],
      key: 'customer',
      render: (v: string) => v ? <Tag color="purple">{v}</Tag> : <Text type="secondary">—</Text>,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <Space>
                <ToolOutlined style={{ color: '#1677ff' }} />
                Instrument Entry
              </Space>
            </Title>
            <Text type="secondary">Receive and manage calibration instruments</Text>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)} size="large">
              Receive Instrument
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
          pagination={{ pageSize: 15, showTotal: (t) => `Total ${t} instruments` }}
          size="middle"
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={<Space><ToolOutlined /><span>Receive Instrument</span></Space>}
        open={open}
        onCancel={() => { setOpen(false); form.resetFields(); }}
        onOk={() => form.validateFields().then(() => mut.mutate())}
        okText="Save Instrument"
        confirmLoading={mut.isPending}
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="customerId" label="Customer" rules={[{ required: true }]}>
            <Select
              placeholder="Select customer"
              options={customers.map((c: any) => ({ value: c.id, label: c.name }))}
              showSearch
              filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="Instrument Name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Vernier Caliper" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="idNumber" label="ID Number">
                <Input placeholder="LAB-001" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="make" label="Make">
                <Input placeholder="Mitutoyo, Fluke..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="model" label="Model">
                <Input placeholder="Model number" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="serialNumber" label="Serial Number">
                <Input placeholder="SN-12345" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unit" label="Unit of Measurement">
                <Input placeholder="mm, bar, °C, kN..." />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="range" label="Range">
                <Input placeholder="0–150 mm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="leastCount" label="Least Count">
                <Input placeholder="0.01 mm" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="calibrationIntervalMonths" label="Calibration Interval (months)" tooltip="Used to auto-calculate the next due date">
                <InputNumber min={1} max={120} style={{ width: '100%' }} placeholder="12" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="lastCalibrationDate" label="Last Calibration Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}

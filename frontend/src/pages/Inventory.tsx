import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Space, Table, Tag, Typography,
} from 'antd';
import { PlusOutlined, DatabaseOutlined, PlusCircleOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { adjustStock, getInventory, upsertInventory } from '../api';

const { Title, Text } = Typography;

const CATEGORIES = ['STANDARD', 'FIXTURE', 'ACCESSORY', 'CONSUMABLE'];
const CAT_COLORS: Record<string, string> = {
  STANDARD: 'blue', FIXTURE: 'purple', ACCESSORY: 'cyan', CONSUMABLE: 'orange',
};

export default function Inventory() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const { data = [], isLoading } = useQuery({ queryKey: ['inventory'], queryFn: () => getInventory() });
  const refresh = () => qc.invalidateQueries({ queryKey: ['inventory'] });
  const mut = useMutation({
    mutationFn: () => {
      const v = form.getFieldsValue();
      return upsertInventory({ ...v, quantity: Number(v.quantity || 0) });
    },
    onSuccess: () => { refresh(); setOpen(false); form.resetFields(); },
  });
  const stockMut = useMutation({
    mutationFn: (v: { id: string; delta: number }) => adjustStock(v.id, v.delta),
    onSuccess: refresh,
  });

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (v: string) => <Tag color={CAT_COLORS[v] || 'default'}>{v}</Tag>,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (v: number) => (
        <Tag color={v > 0 ? 'green' : 'red'} style={{ fontWeight: 600, fontSize: 14 }}>{v}</Tag>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      render: (v: string) => v || <Text type="secondary">—</Text>,
    },
    {
      title: 'Stock Adjust',
      key: 'adjust',
      width: 130,
      render: (_: any, row: any) => (
        <Space>
          <Button
            size="small"
            icon={<PlusCircleOutlined />}
            type="default"
            onClick={() => stockMut.mutate({ id: row.id, delta: 1 })}
          />
          <Button
            size="small"
            icon={<MinusCircleOutlined />}
            danger
            onClick={() => stockMut.mutate({ id: row.id, delta: -1 })}
          />
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
              <Space>
                <DatabaseOutlined style={{ color: '#722ed1' }} />
                Inventory
              </Space>
            </Title>
            <Text type="secondary">Manage laboratory standards, fixtures, and consumables</Text>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)} size="large">
              New Item
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
          pagination={{ pageSize: 15, showTotal: (t) => `Total ${t} items` }}
          size="middle"
        />
      </Card>

      <Modal
        title={<Space><DatabaseOutlined /><span>New Inventory Item</span></Space>}
        open={open}
        onCancel={() => { setOpen(false); form.resetFields(); }}
        onOk={() => form.validateFields().then(() => mut.mutate())}
        okText="Save Item"
        confirmLoading={mut.isPending}
        width={480}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} initialValues={{ category: 'STANDARD', quantity: 0 }}>
          <Form.Item name="name" label="Item Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Gauge Block Set Grade 1" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="Category">
                <Select options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="quantity" label="Initial Quantity">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="location" label="Location">
            <Input placeholder="Lab shelf, cabinet number..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

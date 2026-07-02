import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button, Card, Col, Form, Input, InputNumber, Modal, Popconfirm, Row, Select,
  Space, Table, Tag, Typography, message,
} from 'antd';
import {
  PlusOutlined, DatabaseOutlined, PlusCircleOutlined, MinusCircleOutlined,
  EditOutlined, DeleteOutlined, ImportOutlined,
} from '@ant-design/icons';
import { adjustStock, deleteInventoryItem, getInventory, importInventory, upsertInventory } from '../api';
import ImportModal from '../components/ImportModal';

const { Title, Text } = Typography;

const CATEGORIES = ['STANDARD', 'FIXTURE', 'ACCESSORY', 'CONSUMABLE'];
const CAT_COLORS: Record<string, string> = {
  STANDARD: 'blue', FIXTURE: 'purple', ACCESSORY: 'cyan', CONSUMABLE: 'orange',
};

const IMPORT_COLS = [
  { key: 'name', label: 'Item Name', required: true },
  { key: 'category', label: 'Category (STANDARD/FIXTURE/ACCESSORY/CONSUMABLE)', required: true },
  { key: 'quantity', label: 'Quantity' },
  { key: 'location', label: 'Location' },
];

export default function Inventory() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [form] = Form.useForm();

  const { data = [], isLoading } = useQuery({ queryKey: ['inventory'], queryFn: () => getInventory() });
  const refresh = () => qc.invalidateQueries({ queryKey: ['inventory'] });

  const saveMut = useMutation({
    mutationFn: () => {
      const v = form.getFieldsValue();
      const payload = { ...v, quantity: Number(v.quantity || 0) };
      if (editing) payload.id = editing.id;
      return upsertInventory(payload);
    },
    onSuccess: () => {
      refresh(); setOpen(false); setEditing(null); form.resetFields();
      message.success(editing ? 'Item updated' : 'Item created');
    },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Save failed'),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteInventoryItem(id),
    onSuccess: () => { refresh(); message.success('Item deleted'); },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Delete failed'),
  });

  const stockMut = useMutation({
    mutationFn: (v: { id: string; delta: number }) => adjustStock(v.id, v.delta),
    onSuccess: refresh,
  });

  const openNew = () => { setEditing(null); form.resetFields(); setOpen(true); };
  const openEdit = (row: any) => { setEditing(row); form.setFieldsValue(row); setOpen(true); };

  const columns = [
    {
      title: 'Name', dataIndex: 'name', key: 'name',
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: 'Category', dataIndex: 'category', key: 'category',
      render: (v: string) => <Tag color={CAT_COLORS[v] || 'default'}>{v}</Tag>,
    },
    {
      title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 100,
      render: (v: number) => (
        <Tag color={v > 0 ? 'green' : 'red'} style={{ fontWeight: 600, fontSize: 14 }}>{v}</Tag>
      ),
    },
    {
      title: 'Location', dataIndex: 'location', key: 'location',
      render: (v: string) => v || <Text type="secondary">—</Text>,
    },
    {
      title: 'Stock Adjust', key: 'adjust', width: 130,
      render: (_: any, row: any) => (
        <Space>
          <Button size="small" icon={<PlusCircleOutlined />} onClick={() => stockMut.mutate({ id: row.id, delta: 1 })} />
          <Button size="small" icon={<MinusCircleOutlined />} danger onClick={() => stockMut.mutate({ id: row.id, delta: -1 })} />
        </Space>
      ),
    },
    {
      title: 'Actions', key: 'actions', width: 100,
      render: (_: any, row: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
          <Popconfirm title="Delete this item?" onConfirm={() => delMut.mutate(row.id)}>
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
              <Space><DatabaseOutlined style={{ color: '#722ed1' }} />Inventory</Space>
            </Title>
            <Text type="secondary">Manage laboratory standards, fixtures, and consumables</Text>
          </Col>
          <Col>
            <Space>
              <Button icon={<ImportOutlined />} onClick={() => setImportOpen(true)}>Import CSV</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={openNew} size="large">
                New Item
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
          pagination={{ pageSize: 15, showTotal: (t) => `Total ${t} items` }}
          size="middle"
        />
      </Card>

      <Modal
        title={<Space><DatabaseOutlined /><span>{editing ? 'Edit Inventory Item' : 'New Inventory Item'}</span></Space>}
        open={open}
        onCancel={() => { setOpen(false); setEditing(null); form.resetFields(); }}
        onOk={() => form.validateFields().then(() => saveMut.mutate())}
        okText={editing ? 'Update' : 'Save Item'}
        confirmLoading={saveMut.isPending}
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
              <Form.Item name="quantity" label="Quantity">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="location" label="Location">
            <Input placeholder="Lab shelf, cabinet number..." />
          </Form.Item>
        </Form>
      </Modal>

      <ImportModal
        open={importOpen}
        onClose={() => { setImportOpen(false); refresh(); }}
        title="Inventory Items"
        columns={IMPORT_COLS}
        onImport={(records) => importInventory(records)}
        templateFilename="inventory-import-template.csv"
      />
    </div>
  );
}

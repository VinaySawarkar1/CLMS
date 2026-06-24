import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge, Button, Card, Col, DatePicker, Form, Input, Modal, Row, Select,
  Space, Table, Tag, Typography,
} from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getDocuments, createDocument, updateDocument, deleteDocument,
} from '../api';

const { Title, Text } = Typography;

const CATEGORIES = ['SOP', 'WI', 'Form', 'Policy', 'External'];
const CAT_COLORS: Record<string, string> = {
  SOP: 'blue', WI: 'green', Form: 'orange', Policy: 'purple', External: 'default',
};

export default function Documents() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: getDocuments,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['documents'] });

  const saveMut = useMutation({
    mutationFn: (vals: any) => {
      const payload = {
        ...vals,
        approvedAt: vals.approvedAt ? vals.approvedAt.toISOString() : undefined,
        reviewDueAt: vals.reviewDueAt ? vals.reviewDueAt.toISOString() : undefined,
      };
      return editing ? updateDocument(editing.id, payload) : createDocument(payload);
    },
    onSuccess: () => { invalidate(); setModalOpen(false); form.resetFields(); setEditing(null); },
  });

  const obsoleteMut = useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: invalidate,
  });

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (doc: any) => {
    setEditing(doc);
    form.setFieldsValue({
      ...doc,
      approvedAt: doc.approvedAt ? dayjs(doc.approvedAt) : undefined,
      reviewDueAt: doc.reviewDueAt ? dayjs(doc.reviewDueAt) : undefined,
    });
    setModalOpen(true);
  };

  const active = docs.filter((d: any) => d.status !== 'OBSOLETE');
  const sops = active.filter((d: any) => d.category === 'SOP').length;
  const wis = active.filter((d: any) => d.category === 'WI').length;
  const now = new Date();
  const overdue = active.filter((d: any) => d.reviewDueAt && new Date(d.reviewDueAt) < now).length;

  const columns = [
    { title: 'Doc Number', dataIndex: 'docNumber', key: 'docNumber', width: 120 },
    { title: 'Title', dataIndex: 'title', key: 'title' },
    {
      title: 'Category', dataIndex: 'category', key: 'category', width: 100,
      render: (c: string) => <Tag color={CAT_COLORS[c] ?? 'default'}>{c}</Tag>,
    },
    { title: 'Revision', dataIndex: 'revision', key: 'revision', width: 80 },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 100,
      render: (s: string) => (
        <Tag color={s === 'ACTIVE' ? 'green' : s === 'DRAFT' ? 'gold' : 'default'}>{s}</Tag>
      ),
    },
    {
      title: 'Review Due', dataIndex: 'reviewDueAt', key: 'reviewDueAt', width: 120,
      render: (d: string) => {
        if (!d) return '—';
        const overdue = new Date(d) < now;
        return <Text type={overdue ? 'danger' : undefined}>{dayjs(d).format('DD MMM YYYY')}</Text>;
      },
    },
    {
      title: 'Actions', key: 'actions', width: 120,
      render: (_: any, row: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)}>Edit</Button>
          {row.status !== 'OBSOLETE' && (
            <Button
              size="small"
              danger
              icon={<StopOutlined />}
              onClick={() => obsoleteMut.mutate(row.id)}
            >
              Obsolete
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Document Control</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>New Document</Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#1677ff' }}>{sops}</div>
            <Text type="secondary">Total SOPs</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#52c41a' }}>{wis}</div>
            <Text type="secondary">Work Instructions</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#fa541c' }}>{overdue}</div>
            <Text type="secondary">Overdue Reviews</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#722ed1' }}>{active.length}</div>
            <Text type="secondary">Active Documents</Text>
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={docs}
          rowKey="id"
          loading={isLoading}
          size="small"
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        open={modalOpen}
        title={editing ? 'Edit Document' : 'New Document'}
        onCancel={() => { setModalOpen(false); setEditing(null); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={saveMut.isPending}
        width={600}
      >
        {editing && (
          <div style={{ marginBottom: 12, padding: '8px 12px', background: '#f5f5f5', borderRadius: 6 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Current revision: <strong>{editing.revision}</strong> — bump the revision field to record a new version.
            </Text>
          </div>
        )}
        <Form form={form} layout="vertical" onFinish={(vals) => saveMut.mutate(vals)}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="docNumber" label="Doc Number" rules={[{ required: true }]}>
                <Input placeholder="SOP-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="revision" label="Revision" initialValue="00">
                <Input placeholder="00" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                <Select options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
              </Form.Item>
            </Col>
            {editing && (
              <Col span={12}>
                <Form.Item name="status" label="Status">
                  <Select options={['ACTIVE', 'DRAFT', 'OBSOLETE'].map((s) => ({ value: s, label: s }))} />
                </Form.Item>
              </Col>
            )}
          </Row>
          <Form.Item name="content" label="Content">
            <Input.TextArea rows={4} placeholder="Document content (markdown supported)" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="approvedBy" label="Approved By">
                <Input placeholder="Name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="approvedAt" label="Approved At">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="reviewDueAt" label="Review Due At">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

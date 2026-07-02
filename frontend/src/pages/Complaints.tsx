import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, Table, Tag, Button, Space, Typography, Modal, Form, Input, Select, message, Popconfirm,
} from 'antd';
import {
  AlertOutlined, PlusOutlined, DeleteOutlined, EditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getComplaints, createComplaint, updateComplaint, deleteComplaint, getCustomers } from '../api';

const { Title, Text } = Typography;

const STATUS_OPTIONS = ['OPEN', 'INVESTIGATING', 'CAPA_PENDING', 'CLOSED'];
const STATUS_COLORS: Record<string, string> = {
  OPEN: 'red',
  INVESTIGATING: 'orange',
  CAPA_PENDING: 'blue',
  CLOSED: 'green',
};

export default function Complaints() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();

  const { data: complaints = [], isLoading } = useQuery({ queryKey: ['complaints'], queryFn: getComplaints });
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: () => getCustomers() });

  const customerName = (id?: string) => (customers as any[]).find((c) => c.id === id)?.name ?? '—';

  const saveMut = useMutation({
    mutationFn: (vals: any) => (editing ? updateComplaint(editing.id, vals) : createComplaint(vals)),
    onSuccess: () => {
      message.success(editing ? 'Complaint updated' : 'Complaint raised');
      setOpen(false); setEditing(null); form.resetFields();
      qc.invalidateQueries({ queryKey: ['complaints'] });
    },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Save failed'),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteComplaint(id),
    onSuccess: () => { message.success('Deleted'); qc.invalidateQueries({ queryKey: ['complaints'] }); },
  });

  const openNew = () => { setEditing(null); form.resetFields(); setOpen(true); };
  const openEdit = (row: any) => {
    setEditing(row);
    form.setFieldsValue({ ...row });
    setOpen(true);
  };

  const columns = [
    { title: 'Complaint No', dataIndex: 'complaintNo', key: 'complaintNo', render: (v: string) => <Text strong>{v}</Text> },
    { title: 'Customer', key: 'customer', render: (_: any, r: any) => customerName(r.customerId) },
    { title: 'Subject', dataIndex: 'subject', key: 'subject', render: (v: string) => v || '—' },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (v: string) => <Tag color={STATUS_COLORS[v] ?? 'default'}>{v}</Tag>,
    },
    {
      title: 'Created', dataIndex: 'createdAt', key: 'createdAt',
      render: (v: string) => (v ? dayjs(v).format('DD MMM YYYY') : '—'),
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: any, row: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
          <Popconfirm title="Delete this complaint?" onConfirm={() => delMut.mutate(row.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}><AlertOutlined /> Complaints</Title>
          <Text type="secondary">Customer complaints with root cause, investigation, CAPA and closure</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openNew}>New Complaint</Button>
      </div>

      <Card>
        <Table rowKey="id" loading={isLoading} dataSource={complaints as any[]} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title={editing ? `Edit ${editing.complaintNo}` : 'New Complaint'}
        open={open}
        onCancel={() => { setOpen(false); setEditing(null); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={saveMut.isPending}
        okText={editing ? 'Update' : 'Raise'}
        width={680}
      >
        <Form form={form} layout="vertical" onFinish={(v) => saveMut.mutate(v)}>
          <Form.Item name="customerId" label="Customer">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Select customer"
              options={(customers as any[]).map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item name="certificateId" label="Certificate ID (optional)">
            <Input placeholder="Linked certificate id / reference" />
          </Form.Item>
          <Form.Item name="subject" label="Subject">
            <Input placeholder="Short summary of the complaint" />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="Describe the complaint" />
          </Form.Item>
          {editing && (
            <>
              <Form.Item name="status" label="Status">
                <Select options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} />
              </Form.Item>
              <Form.Item name="rootCause" label="Root Cause">
                <Input.TextArea rows={2} placeholder="Identified root cause" />
              </Form.Item>
              <Form.Item name="investigation" label="Investigation">
                <Input.TextArea rows={2} placeholder="Investigation details" />
              </Form.Item>
              <Form.Item name="capa" label="Corrective / Preventive Action (CAPA)">
                <Input.TextArea rows={2} placeholder="CAPA details" />
              </Form.Item>
              <Form.Item name="closureRemarks" label="Closure Remarks">
                <Input.TextArea rows={2} placeholder="Remarks on closure" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </Space>
  );
}

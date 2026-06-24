import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, Table, Tag, Button, Space, Typography, Modal, Form, Input, DatePicker, message, Popconfirm, Statistic, Row, Col,
} from 'antd';
import {
  ExperimentOutlined, PlusOutlined, WarningOutlined, CheckCircleOutlined, DeleteOutlined, EditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getMasters, createMaster, updateMaster, deleteMaster } from '../api';

const { Title, Text } = Typography;

export default function ReferenceStandards() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();

  const { data: masters = [], isLoading } = useQuery({ queryKey: ['masters'], queryFn: getMasters });

  const saveMut = useMutation({
    mutationFn: (vals: any) => {
      const payload = {
        ...vals,
        calibratedDate: vals.calibratedDate ? vals.calibratedDate.toISOString() : undefined,
        calibrationDue: vals.calibrationDue ? vals.calibrationDue.toISOString() : undefined,
      };
      return editing ? updateMaster(editing.id, payload) : createMaster(payload);
    },
    onSuccess: () => {
      message.success(editing ? 'Reference standard updated' : 'Reference standard added');
      setOpen(false); setEditing(null); form.resetFields();
      qc.invalidateQueries({ queryKey: ['masters'] });
    },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Save failed'),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteMaster(id),
    onSuccess: () => { message.success('Deleted'); qc.invalidateQueries({ queryKey: ['masters'] }); },
  });

  const openEdit = (row: any) => {
    setEditing(row);
    form.setFieldsValue({
      ...row,
      calibratedDate: row.calibratedDate ? dayjs(row.calibratedDate) : null,
      calibrationDue: row.calibrationDue ? dayjs(row.calibrationDue) : null,
    });
    setOpen(true);
  };

  const openNew = () => { setEditing(null); form.resetFields(); setOpen(true); };

  const now = dayjs();
  const dueStatus = (due?: string) => {
    if (!due) return { label: 'No due date', color: 'default' };
    const d = dayjs(due);
    if (d.isBefore(now)) return { label: 'OVERDUE', color: 'red' };
    if (d.isBefore(now.add(30, 'day'))) return { label: 'Due Soon', color: 'orange' };
    return { label: 'Valid', color: 'green' };
  };

  const overdue = (masters as any[]).filter((m) => m.calibrationDue && dayjs(m.calibrationDue).isBefore(now)).length;
  const dueSoon = (masters as any[]).filter((m) => m.calibrationDue && dayjs(m.calibrationDue).isAfter(now) && dayjs(m.calibrationDue).isBefore(now.add(30, 'day'))).length;

  const columns = [
    {
      title: 'Standard', dataIndex: 'name', key: 'name',
      render: (n: string, row: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{n}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>ID: {row.idNumber}{row.serialNumber ? ` · SN: ${row.serialNumber}` : ''}</Text>
        </Space>
      ),
    },
    { title: 'Make / Model', key: 'mm', render: (_: any, r: any) => [r.make, r.model].filter(Boolean).join(' / ') || '—' },
    { title: 'Traceability', dataIndex: 'traceability', key: 'trace', render: (v: string) => v || '—' },
    { title: 'Cert. No.', dataIndex: 'certificateNumber', key: 'cert', render: (v: string) => v || '—' },
    { title: 'Uncertainty', dataIndex: 'uncertainty', key: 'unc', render: (v: string) => v || '—' },
    {
      title: 'Calibration Due', dataIndex: 'calibrationDue', key: 'due',
      render: (v: string) => {
        const s = dueStatus(v);
        return (
          <Space direction="vertical" size={0}>
            <Text>{v ? dayjs(v).format('DD MMM YYYY') : '—'}</Text>
            <Tag color={s.color}>{s.label}</Tag>
          </Space>
        );
      },
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: any, row: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
          <Popconfirm title="Delete this reference standard?" onConfirm={() => delMut.mutate(row.id)}>
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
          <Title level={3} style={{ margin: 0 }}><ExperimentOutlined /> Reference Standards</Title>
          <Text type="secondary">Master instruments with traceability and calibration validity (NABL)</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openNew}>Add Standard</Button>
      </div>

      <Row gutter={16}>
        <Col span={8}><Card><Statistic title="Total Standards" value={(masters as any[]).length} prefix={<ExperimentOutlined />} /></Card></Col>
        <Col span={8}><Card><Statistic title="Due Soon (30d)" value={dueSoon} prefix={<WarningOutlined />} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col span={8}><Card><Statistic title="Overdue" value={overdue} prefix={<WarningOutlined />} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
      </Row>

      <Card>
        <Table rowKey="id" loading={isLoading} dataSource={masters as any[]} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title={editing ? 'Edit Reference Standard' : 'Add Reference Standard'}
        open={open}
        onCancel={() => { setOpen(false); setEditing(null); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={saveMut.isPending}
        okText={editing ? 'Update' : 'Add'}
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={(v) => saveMut.mutate(v)}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="name" label="Standard Name" rules={[{ required: true }]}><Input placeholder="e.g. Gauge Block Set" /></Form.Item></Col>
            <Col span={12}><Form.Item name="idNumber" label="ID Number" rules={[{ required: true }]}><Input placeholder="STD-001" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="make" label="Make"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="model" label="Model"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="serialNumber" label="Serial No."><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="traceability" label="Traceability (e.g. NPL / NABL Lab)"><Input placeholder="Traceable to NPL India" /></Form.Item></Col>
            <Col span={12}><Form.Item name="certificateNumber" label="Calibration Cert. No."><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="uncertainty" label="Uncertainty"><Input placeholder="±0.002 mm" /></Form.Item></Col>
            <Col span={8}><Form.Item name="calibratedDate" label="Calibrated On"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="calibrationDue" label="Calibration Due"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Form.Item name="location" label="Location"><Input placeholder="Lab room / cabinet" /></Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

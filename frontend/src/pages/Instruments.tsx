import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AutoComplete, Button, Card, Col, Form, Input, InputNumber, Modal, Popconfirm, Row, Select,
  Space, Table, Tag, Typography, DatePicker, message,
} from 'antd';
import { PlusOutlined, ToolOutlined, EditOutlined, DeleteOutlined, ImportOutlined, ExportOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  createInstrument, getCustomers, getInstruments, updateInstrument, deleteInstrument, importInstruments,
} from '../api';
import { exportToCsv } from '../utils/export';
import ImportModal from '../components/ImportModal';
import { PROCEDURES } from '../procedures';

const { Title, Text } = Typography;

const IMPORT_COLS = [
  { key: 'name', label: 'Instrument Name', required: true },
  { key: 'idNumber', label: 'Customer ID Number' },
  { key: 'make', label: 'Make' },
  { key: 'model', label: 'Model' },
  { key: 'serialNumber', label: 'Serial Number' },
  { key: 'range', label: 'Range' },
  { key: 'unit', label: 'Unit' },
  { key: 'leastCount', label: 'Least Count' },
  { key: 'calibrationIntervalMonths', label: 'Calibration Interval (months)' },
  { key: 'lastCalibrationDate', label: 'Last Calibration Date (YYYY-MM-DD)' },
];

export default function Instruments() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [form] = Form.useForm();

  const [customerFilter, setCustomerFilter] = useState<string | undefined>(undefined);
  const { data = [], isLoading } = useQuery({
    queryKey: ['instruments', customerFilter ?? ''],
    queryFn: () => getInstruments(customerFilter),
  });
  const { data: customers = [] } = useQuery({ queryKey: ['customers', ''], queryFn: () => getCustomers() });

  const refresh = () => qc.invalidateQueries({ queryKey: ['instruments'] });

  const saveMut = useMutation({
    mutationFn: () => {
      const v = form.getFieldsValue();
      const payload = {
        ...v,
        lastCalibrationDate: v.lastCalibrationDate ? v.lastCalibrationDate.toISOString() : undefined,
        calibrationIntervalMonths: v.calibrationIntervalMonths ? Number(v.calibrationIntervalMonths) : undefined,
      };
      return editing ? updateInstrument(editing.id, payload) : createInstrument(payload);
    },
    onSuccess: () => {
      refresh(); setOpen(false); setEditing(null); form.resetFields();
      message.success(editing ? 'Instrument updated' : 'Instrument saved');
    },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Save failed'),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteInstrument(id),
    onSuccess: () => { refresh(); message.success('Instrument deleted'); },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Delete failed'),
  });

  const openNew = () => { setEditing(null); form.resetFields(); setOpen(true); };
  const openEdit = (row: any) => {
    setEditing(row);
    form.setFieldsValue({
      ...row,
      lastCalibrationDate: row.lastCalibrationDate ? dayjs(row.lastCalibrationDate) : null,
    });
    setOpen(true);
  };

  const columns = [
    {
      title: 'ID Number', dataIndex: 'idNumber', key: 'idNumber', width: 120,
      render: (v: string) => v ? <Tag color="geekblue">{v}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Instrument Name', dataIndex: 'name', key: 'name',
      render: (v: string) => <Text strong>{v}</Text>,
    },
    { title: 'Make', dataIndex: 'make', key: 'make', render: (v: string) => v || <Text type="secondary">—</Text> },
    { title: 'Model', dataIndex: 'model', key: 'model', render: (v: string) => v || <Text type="secondary">—</Text> },
    {
      title: 'Serial No.', dataIndex: 'serialNumber', key: 'serialNumber',
      render: (v: string) => v ? <Tag>{v}</Tag> : <Text type="secondary">—</Text>,
    },
    { title: 'Range', dataIndex: 'range', key: 'range', render: (v: string) => v || <Text type="secondary">—</Text> },
    {
      title: 'Unit', dataIndex: 'unit', key: 'unit',
      render: (v: string) => v ? <Tag color="cyan">{v}</Tag> : <Text type="secondary">—</Text>,
    },
    { title: 'Least Count', dataIndex: 'leastCount', key: 'leastCount', render: (v: string) => v || <Text type="secondary">—</Text> },
    {
      title: 'Next Due', dataIndex: 'nextDueDate', key: 'nextDueDate',
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
      title: 'Customer', dataIndex: ['customer', 'name'], key: 'customer',
      render: (v: string) => v ? <Tag color="purple">{v}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Actions', key: 'actions', width: 100,
      render: (_: any, row: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
          <Popconfirm title="Delete this instrument?" onConfirm={() => delMut.mutate(row.id)}>
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
              <Space><ToolOutlined style={{ color: '#1677ff' }} />Instrument Entry</Space>
            </Title>
            <Text type="secondary">Receive and manage calibration instruments</Text>
          </Col>
          <Col>
            <Space>
              <Select
                allowClear
                showSearch
                placeholder="Filter by customer"
                style={{ width: 220 }}
                value={customerFilter}
                onChange={(v) => setCustomerFilter(v)}
                options={(customers as any[]).map((c: any) => ({ value: c.id, label: c.name }))}
                filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
              />
              <Button
                icon={<ExportOutlined />}
                onClick={() => exportToCsv('instruments.csv', data as any[], [
                  { key: 'idNumber', label: 'Customer ID Number' },
                  { key: 'name', label: 'Instrument Name' },
                  { key: 'make', label: 'Make' },
                  { key: 'model', label: 'Model' },
                  { key: 'serialNumber', label: 'Serial Number' },
                  { key: 'range', label: 'Range' },
                  { key: 'unit', label: 'Unit' },
                  { key: 'leastCount', label: 'Least Count' },
                  { key: 'nextDueDate', label: 'Next Due Date' },
                ])}
              >
                Export CSV
              </Button>
              <Button icon={<ImportOutlined />} onClick={() => setImportOpen(true)}>Import CSV</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={openNew} size="large">
                Receive Instrument
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
          pagination={{ pageSize: 15, showTotal: (t) => `Total ${t} instruments` }}
          size="middle"
          scroll={{ x: 1100 }}
        />
      </Card>

      <Modal
        title={<Space><ToolOutlined /><span>{editing ? 'Edit Instrument' : 'Receive Instrument'}</span></Space>}
        open={open}
        onCancel={() => { setOpen(false); setEditing(null); form.resetFields(); }}
        onOk={() => form.validateFields().then(() => saveMut.mutate())}
        okText={editing ? 'Update' : 'Save Instrument'}
        confirmLoading={saveMut.isPending}
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="customerId" label="Customer" rules={editing ? [] : [{ required: true }]}>
            <Select
              placeholder="Select customer"
              options={customers.map((c: any) => ({ value: c.id, label: c.name }))}
              showSearch
              filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
              disabled={!!editing}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="Instrument Name" rules={[{ required: true }]}>
                <AutoComplete
                  placeholder="e.g. Vernier Caliper"
                  options={PROCEDURES.map((p) => ({ value: p.label, label: p.label }))}
                  filterOption={(input, option) =>
                    String(option?.value ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="idNumber" label="Customer ID Number">
                <Input placeholder="Customer-assigned ID" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="make" label="Make"><Input placeholder="Mitutoyo, Fluke..." /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="model" label="Model"><Input placeholder="Model number" /></Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="serialNumber" label="Serial Number"><Input placeholder="SN-12345" /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="labIdNo" label="Lab ID No."><Input placeholder="OM-CAL/01" /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="unit" label="Unit of Measurement"><Input placeholder="mm, bar, °C..." /></Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="range" label="Range"><Input placeholder="0–150 mm" /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="leastCount" label="Least Count"><Input placeholder="0.01 mm" /></Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="calibrationIntervalMonths" label="Calibration Interval (months)">
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

      <ImportModal
        open={importOpen}
        onClose={() => { setImportOpen(false); refresh(); }}
        title="Instruments"
        columns={IMPORT_COLS}
        onImport={(records) => importInstruments(records)}
        templateFilename="instruments-import-template.csv"
      />
    </div>
  );
}

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert, Button, Card, Col, Form, Input, InputNumber, Popconfirm, Row, Space, Table, Tag, Typography, message,
} from 'antd';
import {
  CloudOutlined, ThunderboltOutlined, DeleteOutlined, ImportOutlined,
} from '@ant-design/icons';
import { getEnvironmental, recordEnvironmental, deleteEnvironmental, importEnvironmental } from '../api';
import ImportModal from '../components/ImportModal';

const { Title, Text } = Typography;

const IMPORT_COLS = [
  { key: 'location', label: 'Location', required: true },
  { key: 'temperature', label: 'Temperature (°C)' },
  { key: 'humidity', label: 'Humidity (%RH)' },
  { key: 'pressure', label: 'Pressure (kPa)' },
  { key: 'operator', label: 'Operator' },
];

export default function Environmental() {
  const qc = useQueryClient();
  const [form] = Form.useForm();
  const [alerts, setAlerts] = useState<string[]>([]);
  const [importOpen, setImportOpen] = useState(false);

  const { data = [], isLoading } = useQuery({ queryKey: ['environmental'], queryFn: getEnvironmental });
  const refresh = () => qc.invalidateQueries({ queryKey: ['environmental'] });

  const mut = useMutation({
    mutationFn: () => {
      const v = form.getFieldsValue();
      return recordEnvironmental({
        location: v.location || 'Lab-1',
        operator: v.operator,
        temperature: v.temperature ?? undefined,
        humidity: v.humidity ?? undefined,
        pressure: v.pressure ?? undefined,
      });
    },
    onSuccess: (res: any) => {
      setAlerts(res.alerts || []);
      refresh();
    },
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteEnvironmental(id),
    onSuccess: () => { refresh(); message.success('Record deleted'); },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Delete failed'),
  });

  const columns = [
    {
      title: 'Time', dataIndex: 'recordedAt', key: 'time',
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: 'Location', dataIndex: 'location', key: 'location',
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Temperature (°C)', dataIndex: 'temperature', key: 'temp',
      render: (v: number) => v != null ? (
        <Tag color={v >= 18 && v <= 28 ? 'green' : 'red'}>{v} °C</Tag>
      ) : <Text type="secondary">—</Text>,
    },
    {
      title: 'Humidity (%RH)', dataIndex: 'humidity', key: 'humidity',
      render: (v: number) => v != null ? (
        <Tag color={v >= 30 && v <= 70 ? 'green' : 'orange'}>{v} %</Tag>
      ) : <Text type="secondary">—</Text>,
    },
    {
      title: 'Pressure (kPa)', dataIndex: 'pressure', key: 'pressure',
      render: (v: number) => v != null ? `${v} kPa` : <Text type="secondary">—</Text>,
    },
    {
      title: 'Operator', dataIndex: 'operator', key: 'operator',
      render: (v: string) => v || <Text type="secondary">—</Text>,
    },
    {
      title: 'Actions', key: 'actions', width: 80,
      render: (_: any, row: any) => (
        <Popconfirm title="Delete this record?" onConfirm={() => delMut.mutate(row.id)}>
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <Space><CloudOutlined style={{ color: '#13c2c2' }} />Environmental Monitoring</Space>
            </Title>
            <Text type="secondary">Record and monitor laboratory environmental conditions</Text>
          </Col>
          <Col>
            <Space>
              <Button icon={<ImportOutlined />} onClick={() => setImportOpen(true)}>Import CSV</Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Card
        title="Record New Reading"
        style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 16 }}
      >
        <Form form={form} layout="vertical" initialValues={{ location: 'Lab-1' }}>
          <Row gutter={16}>
            <Col xs={12} md={4}>
              <Form.Item name="location" label="Location">
                <Input placeholder="Lab-1" />
              </Form.Item>
            </Col>
            <Col xs={12} md={4}>
              <Form.Item name="temperature" label="Temperature (°C)">
                <InputNumber style={{ width: '100%' }} placeholder="23.0" step={0.1} />
              </Form.Item>
            </Col>
            <Col xs={12} md={4}>
              <Form.Item name="humidity" label="Humidity (%RH)">
                <InputNumber style={{ width: '100%' }} placeholder="50.0" step={0.1} />
              </Form.Item>
            </Col>
            <Col xs={12} md={4}>
              <Form.Item name="pressure" label="Pressure (kPa)">
                <InputNumber style={{ width: '100%' }} placeholder="101.3" step={0.1} />
              </Form.Item>
            </Col>
            <Col xs={12} md={4}>
              <Form.Item name="operator" label="Operator">
                <Input placeholder="Name" />
              </Form.Item>
            </Col>
            <Col xs={12} md={4}>
              <Form.Item label=" " style={{ marginBottom: 0 }}>
                <Button type="primary" icon={<ThunderboltOutlined />} loading={mut.isPending} onClick={() => mut.mutate()} block>
                  Record
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
        {alerts.map((a, i) => (
          <Alert type="warning" message={a} showIcon key={i} style={{ marginTop: 8 }} />
        ))}
      </Card>

      <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 15, showTotal: (t) => `Total ${t} records` }}
          size="middle"
        />
      </Card>

      <ImportModal
        open={importOpen}
        onClose={() => { setImportOpen(false); refresh(); }}
        title="Environmental Records"
        columns={IMPORT_COLS}
        onImport={(records) => importEnvironmental(records)}
        templateFilename="environmental-import-template.csv"
      />
    </div>
  );
}

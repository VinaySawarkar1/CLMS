import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, Table, Button, Space, Typography, Modal, Form, Input, Select, Rate, message, Statistic, Row, Col,
} from 'antd';
import { StarOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getFeedback, getFeedbackSummary, createFeedback, getCustomers } from '../api';

const { Title, Text } = Typography;
const { TextArea } = Input;

const fmt = (v: number) => (v ?? 0).toFixed(2);

export default function Feedback() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: feedback = [], isLoading } = useQuery({ queryKey: ['feedback'], queryFn: getFeedback });
  const { data: summary } = useQuery({ queryKey: ['feedback-summary'], queryFn: getFeedbackSummary });
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: () => getCustomers() });

  const saveMut = useMutation({
    mutationFn: (vals: any) => createFeedback(vals),
    onSuccess: () => {
      message.success('Feedback recorded');
      setOpen(false); form.resetFields();
      qc.invalidateQueries({ queryKey: ['feedback'] });
      qc.invalidateQueries({ queryKey: ['feedback-summary'] });
    },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Save failed'),
  });

  const customerName = (id?: string) => (customers as any[]).find((c) => c.id === id)?.name ?? '—';

  const columns = [
    { title: 'Customer', dataIndex: 'customerId', key: 'customer', render: (v: string) => customerName(v) },
    { title: 'Service', dataIndex: 'serviceRating', key: 'service', render: (v: number) => <Rate disabled value={v} style={{ fontSize: 12 }} /> },
    { title: 'Quality', dataIndex: 'qualityRating', key: 'quality', render: (v: number) => <Rate disabled value={v} style={{ fontSize: 12 }} /> },
    { title: 'TAT', dataIndex: 'tatRating', key: 'tat', render: (v: number) => <Rate disabled value={v} style={{ fontSize: 12 }} /> },
    { title: 'Support', dataIndex: 'supportRating', key: 'support', render: (v: number) => <Rate disabled value={v} style={{ fontSize: 12 }} /> },
    { title: 'Comments', dataIndex: 'comments', key: 'comments', render: (v: string) => v || '—' },
    { title: 'Date', dataIndex: 'createdAt', key: 'date', render: (v: string) => (v ? dayjs(v).format('DD MMM YYYY') : '—') },
  ];

  const avgCard = (title: string, value: number) => (
    <Col span={8}>
      <Card>
        <Statistic title={title} value={fmt(value)} prefix={<StarOutlined />} />
        <Rate disabled allowHalf value={value ?? 0} style={{ fontSize: 14 }} />
      </Card>
    </Col>
  );

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}><StarOutlined /> Customer Feedback</Title>
          <Text type="secondary">Service, quality, turnaround and support ratings from customers</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setOpen(true); }}>Record Feedback</Button>
      </div>

      <Row gutter={16}>
        {avgCard('Overall', summary?.avgOverall ?? 0)}
        {avgCard('Service', summary?.avgService ?? 0)}
        {avgCard('Quality', summary?.avgQuality ?? 0)}
      </Row>
      <Row gutter={16}>
        {avgCard('Turnaround (TAT)', summary?.avgTat ?? 0)}
        {avgCard('Support', summary?.avgSupport ?? 0)}
        <Col span={8}><Card><Statistic title="Total Responses" value={summary?.total ?? 0} /></Card></Col>
      </Row>

      <Card>
        <Table rowKey="id" loading={isLoading} dataSource={feedback as any[]} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title="Record Customer Feedback"
        open={open}
        onCancel={() => { setOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={saveMut.isPending}
        okText="Save"
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={(v) => saveMut.mutate(v)}>
          <Form.Item name="customerId" label="Customer">
            <Select
              showSearch
              allowClear
              placeholder="Select customer"
              optionFilterProp="label"
              options={(customers as any[]).map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="serviceRating" label="Service" rules={[{ required: true, message: 'Rate service' }]}><Rate /></Form.Item></Col>
            <Col span={12}><Form.Item name="qualityRating" label="Quality" rules={[{ required: true, message: 'Rate quality' }]}><Rate /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="tatRating" label="Turnaround (TAT)" rules={[{ required: true, message: 'Rate TAT' }]}><Rate /></Form.Item></Col>
            <Col span={12}><Form.Item name="supportRating" label="Support" rules={[{ required: true, message: 'Rate support' }]}><Rate /></Form.Item></Col>
          </Row>
          <Form.Item name="comments" label="Comments"><TextArea rows={3} placeholder="Optional remarks" /></Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

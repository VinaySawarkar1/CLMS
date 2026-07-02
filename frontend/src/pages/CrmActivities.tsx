import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, Button, Tag, Typography, Modal, Form, Input, Select, DatePicker,
  message, Space, Row, Col, Statistic, Table, Tooltip, Popconfirm, Badge, Tabs,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, CheckCircleOutlined, PhoneOutlined,
  MailOutlined, CalendarOutlined, FileTextOutlined, TeamOutlined,
  WhatsAppOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getCrmActivities, createCrmActivity, completeCrmActivity, deleteCrmActivity,
  getCrmActivityStats, getCustomers, getLeads,
} from '../api';

const { Title, Text } = Typography;

const ACTIVITY_TYPES = ['CALL', 'EMAIL', 'MEETING', 'TASK', 'NOTE', 'WHATSAPP'];

const TYPE_ICON: Record<string, any> = {
  CALL: <PhoneOutlined />,
  EMAIL: <MailOutlined />,
  MEETING: <TeamOutlined />,
  TASK: <CheckCircleOutlined />,
  NOTE: <FileTextOutlined />,
  WHATSAPP: <WhatsAppOutlined />,
};

const TYPE_COLOR: Record<string, string> = {
  CALL: '#52c41a', EMAIL: '#1677ff', MEETING: '#722ed1',
  TASK: '#fa8c16', NOTE: '#13c2c2', WHATSAPP: '#25D366',
};

export default function CrmActivities() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [outcomeModal, setOutcomeModal] = useState<string | null>(null);
  const [outcome, setOutcome] = useState('');
  const [form] = Form.useForm();

  const isDone = activeTab === 'done' ? 'true' : activeTab === 'pending' ? 'false' : undefined;

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['crmActivities', isDone],
    queryFn: () => getCrmActivities({ isDone }),
  });
  const { data: stats } = useQuery({ queryKey: ['crmActivityStats'], queryFn: getCrmActivityStats });
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: () => getCustomers() });
  const { data: leads = [] } = useQuery({ queryKey: ['leads'], queryFn: () => getLeads() });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['crmActivities'] });
    qc.invalidateQueries({ queryKey: ['crmActivityStats'] });
  };

  const createMut = useMutation({
    mutationFn: (v: any) => createCrmActivity({ ...v, dueDate: v.dueDate?.toISOString() }),
    onSuccess: () => { message.success('Activity logged'); setOpen(false); form.resetFields(); refresh(); },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Failed'),
  });

  const completeMut = useMutation({
    mutationFn: ({ id, outcome }: { id: string; outcome?: string }) => completeCrmActivity(id, outcome),
    onSuccess: () => { message.success('Activity completed'); refresh(); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteCrmActivity(id),
    onSuccess: () => { message.success('Deleted'); refresh(); },
  });

  const columns = [
    {
      title: 'Type', dataIndex: 'type', key: 'type', width: 90,
      render: (t: string) => (
        <Tag color={TYPE_COLOR[t]} icon={TYPE_ICON[t]} style={{ color: '#fff' }}>{t}</Tag>
      ),
    },
    {
      title: 'Title', dataIndex: 'title', key: 'title',
      render: (t: string, r: any) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>{t}</Text>
          {r.description && <div><Text type="secondary" style={{ fontSize: 11 }}>{r.description}</Text></div>}
        </div>
      ),
    },
    {
      title: 'Linked To', key: 'link',
      render: (_: any, r: any) => (
        <Space direction="vertical" size={0}>
          {r.customer && <Tag icon={<TeamOutlined />} color="blue">{r.customer.name}</Tag>}
          {r.lead && <Tag icon={<ThunderboltOutlined />} color="purple">{r.lead.title}</Tag>}
        </Space>
      ),
    },
    {
      title: 'Due / Done', key: 'date',
      render: (_: any, r: any) => {
        if (r.isDone && r.completedAt) return <Tag color="green">Done {dayjs(r.completedAt).format('DD MMM')}</Tag>;
        if (r.dueDate) {
          const overdue = !r.isDone && new Date(r.dueDate) < new Date();
          return <Tag color={overdue ? 'red' : 'default'}>{dayjs(r.dueDate).format('DD MMM YYYY')}</Tag>;
        }
        return '—';
      },
    },
    {
      title: 'By', dataIndex: 'createdBy', key: 'by',
      render: (v: string) => <Text type="secondary" style={{ fontSize: 11 }}>{v ?? '—'}</Text>,
    },
    {
      title: 'Status', key: 'status',
      render: (_: any, r: any) => r.isDone
        ? <Badge status="success" text="Done" />
        : <Badge status="processing" text="Pending" />,
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: any, r: any) => (
        <Space>
          {!r.isDone && (
            <Tooltip title="Mark Complete">
              <Button
                size="small" type="primary" icon={<CheckCircleOutlined />}
                onClick={() => { setOutcomeModal(r.id); setOutcome(''); }}
              />
            </Tooltip>
          )}
          <Popconfirm title="Delete activity?" onConfirm={() => deleteMut.mutate(r.id)}>
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
          <Title level={3} style={{ margin: 0 }}><CalendarOutlined /> CRM Activities</Title>
          <Text type="secondary">Log calls, emails, meetings, tasks & notes</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>Log Activity</Button>
      </div>

      {stats && (
        <Row gutter={16}>
          <Col span={6}><Card><Statistic title="Total" value={(stats as any).total} /></Card></Col>
          <Col span={6}><Card><Statistic title="Pending" value={(stats as any).pending} valueStyle={{ color: '#fa8c16' }} /></Card></Col>
          <Col span={6}><Card><Statistic title="Overdue" value={(stats as any).overdue} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
          <Col span={6}><Card><Statistic title="Completed" value={(stats as any).done} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        </Row>
      )}

      <Card
        title={
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'done', label: 'Completed' },
            ]}
            style={{ marginBottom: -1 }}
          />
        }
        styles={{ header: { padding: '0 16px' } }}
      >
        <Table
          rowKey="id"
          loading={isLoading}
          dataSource={activities as any[]}
          columns={columns}
          pagination={{ pageSize: 15 }}
          size="small"
        />
      </Card>

      {/* Log Activity Modal */}
      <Modal
        title={<Space><CalendarOutlined />Log Activity</Space>}
        open={open}
        onCancel={() => { setOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={createMut.isPending}
        okText="Log"
        width={620}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={(v) => createMut.mutate(v)} initialValues={{ type: 'CALL' }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                <Select options={ACTIVITY_TYPES.map((t) => ({
                  value: t,
                  label: <Space>{TYPE_ICON[t]}{t}</Space>,
                }))} />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="title" label="Title / Subject" rules={[{ required: true }]}>
                <Input placeholder="e.g. Follow-up call with Ravi Sharma" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Notes / Details">
            <Input.TextArea rows={2} placeholder="What was discussed?" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customerId" label="Link to Customer">
                <Select
                  allowClear showSearch placeholder="Select customer" optionFilterProp="label"
                  options={(customers as any[]).map((c: any) => ({ value: c.id, label: `${c.code} — ${c.name}` }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="leadId" label="Link to Lead">
                <Select
                  allowClear showSearch placeholder="Select lead" optionFilterProp="label"
                  options={(leads as any[]).map((l: any) => ({ value: l.id, label: l.title }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="dueDate" label="Due Date">
            <DatePicker showTime style={{ width: '100%' }} placeholder="When (optional)" />
          </Form.Item>
          <Form.Item name="outcome" label="Outcome (if already completed)">
            <Input placeholder="Result / next steps" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Complete with outcome modal */}
      <Modal
        title="Mark Activity Complete"
        open={!!outcomeModal}
        onCancel={() => { setOutcomeModal(null); setOutcome(''); }}
        onOk={() => {
          if (outcomeModal) {
            completeMut.mutate({ id: outcomeModal, outcome });
            setOutcomeModal(null);
            setOutcome('');
          }
        }}
      >
        <Form layout="vertical">
          <Form.Item label="Outcome / Result">
            <Input.TextArea
              rows={3}
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              placeholder="What was the outcome? Next steps?"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Badge, Button, Card, Col, Divider, Row, Space, Statistic, Table, Tag, Typography,
} from 'antd';
import { BellOutlined, ClockCircleOutlined, ReloadOutlined, WarningOutlined } from '@ant-design/icons';
import { getNotifications, getRecallDue, api } from '../api';

const { Title, Text } = Typography;

function dueDateColor(date: string | null | undefined): string {
  if (!date) return 'inherit';
  const diff = (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return '#ff4d4f';
  if (diff <= 15) return '#fa8c16';
  return '#faad14';
}

export default function Notifications() {
  const { data = [], isLoading } = useQuery({ queryKey: ['notifications'], queryFn: getNotifications });
  const { data: dueSoon = [], isLoading: dueLoading } = useQuery({
    queryKey: ['recall-due-30'],
    queryFn: () => getRecallDue(30),
  });

  const [recallLoading, setRecallLoading] = useState(false);
  const [lastTrigger, setLastTrigger] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState<number | null>(null);

  const triggerRecall = async () => {
    setRecallLoading(true);
    try {
      const result = await api.post('/notifications/trigger-recall').then((r) => r.data);
      setLastTrigger(result.triggeredAt);
      setLastSent(result.sent);
    } catch {
      // ignore
    } finally {
      setRecallLoading(false);
    }
  };

  const CHANNEL_COLORS: Record<string, string> = {
    EMAIL: 'blue', SMS: 'green', WHATSAPP: 'cyan', IN_APP: 'purple', WEBHOOK: 'orange',
  };

  const notifColumns = [
    {
      title: 'Time',
      dataIndex: 'createdAt',
      key: 'time',
      width: 180,
      render: (v: string) => <Text style={{ fontSize: 12 }}>{new Date(v).toLocaleString()}</Text>,
    },
    {
      title: 'Channel',
      dataIndex: 'channel',
      key: 'channel',
      width: 120,
      render: (v: string) => <Tag color={CHANNEL_COLORS[v] || 'default'}>{v}</Tag>,
    },
    {
      title: 'Event',
      dataIndex: 'event',
      key: 'event',
      render: (v: string) => <Text>{v}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'isRead',
      key: 'isRead',
      width: 100,
      render: (v: boolean) => (
        <Badge status={v ? 'default' : 'processing'} text={v ? 'Read' : 'Unread'} />
      ),
    },
  ];

  const dueColumns = [
    { title: 'Instrument', dataIndex: 'name', key: 'name' },
    {
      title: 'Serial No.',
      dataIndex: 'serialNumber',
      key: 'serial',
      render: (v: any) => v ?? '—',
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_: any, row: any) => row.customer?.name ?? '—',
    },
    {
      title: 'Next Due Date',
      dataIndex: 'nextDueDate',
      key: 'dueDate',
      render: (v: string) => (
        <Text strong style={{ color: dueDateColor(v) }}>
          {v ? new Date(v).toLocaleDateString() : '—'}
        </Text>
      ),
    },
    {
      title: 'Days Left',
      dataIndex: 'nextDueDate',
      key: 'daysLeft',
      render: (v: string) => {
        if (!v) return '—';
        const diff = Math.ceil((new Date(v).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (diff < 0) return <Tag color="error">Overdue {Math.abs(diff)}d</Tag>;
        if (diff <= 7) return <Tag color="error">{diff}d</Tag>;
        if (diff <= 15) return <Tag color="warning">{diff}d</Tag>;
        return <Tag color="gold">{diff}d</Tag>;
      },
    },
  ];

  const unreadCount = (data as any[]).filter((n: any) => !n.isRead).length;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <Space>
            <Badge count={unreadCount} size="small">
              <BellOutlined style={{ color: '#1677ff' }} />
            </Badge>
            Notifications
          </Space>
        </Title>
        <Text type="secondary">System notifications, alerts, and calibration recall reminders</Text>
      </div>

      {/* Recall section */}
      <Card
        style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20 }}
        title={
          <Space>
            <WarningOutlined style={{ color: '#fa8c16' }} />
            <span>Calibration Recall Checker</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            loading={recallLoading}
            onClick={triggerRecall}
            style={{ background: '#fa8c16', borderColor: '#fa8c16' }}
          >
            Trigger Recall Check
          </Button>
        }
      >
        <Row gutter={24}>
          <Col span={8}>
            <Statistic
              title="Instruments Due in 30 Days"
              value={(dueSoon as any[]).length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Col>
          <Col span={8}>
            {lastTrigger && (
              <Statistic
                title="Last Trigger"
                value={new Date(lastTrigger).toLocaleString()}
                valueStyle={{ fontSize: 14 }}
              />
            )}
          </Col>
          <Col span={8}>
            {lastSent !== null && (
              <Statistic
                title="Emails Sent (Last Run)"
                value={lastSent}
                valueStyle={{ color: lastSent > 0 ? '#52c41a' : '#8c8c8c' }}
              />
            )}
          </Col>
        </Row>

        <Divider style={{ margin: '16px 0' }} />

        <Title level={5} style={{ marginBottom: 12 }}>
          Instruments Due in Next 30 Days
        </Title>
        <Table
          columns={dueColumns}
          dataSource={dueSoon as any[]}
          rowKey="id"
          loading={dueLoading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>

      {/* Notifications log */}
      <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <Title level={5} style={{ marginBottom: 16 }}>Notification Log</Title>
        <Table
          columns={notifColumns}
          dataSource={data as any[]}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 20, showTotal: (t) => `Total ${t} notifications` }}
          size="small"
          rowClassName={(row: any) => !row.isRead ? 'ant-table-row-selected' : ''}
        />
      </Card>
    </div>
  );
}

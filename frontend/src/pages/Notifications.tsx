import { useQuery } from '@tanstack/react-query';
import { Badge, Card, Space, Table, Tag, Typography } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { getNotifications } from '../api';

const { Title, Text } = Typography;

export default function Notifications() {
  const { data = [], isLoading } = useQuery({ queryKey: ['notifications'], queryFn: getNotifications });

  const CHANNEL_COLORS: Record<string, string> = {
    EMAIL: 'blue', SMS: 'green', WHATSAPP: 'cyan', IN_APP: 'purple', WEBHOOK: 'orange',
  };

  const columns = [
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

  const unreadCount = data.filter((n: any) => !n.isRead).length;

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
        <Text type="secondary">System notifications and alerts</Text>
      </div>

      <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <Table
          columns={columns}
          dataSource={data}
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

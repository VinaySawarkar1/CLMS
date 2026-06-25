import { useQuery } from '@tanstack/react-query';
import { Card, Space, Table, Tag, Typography } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import { getAudit } from '../api';

const { Title, Text } = Typography;

export default function Audit() {
  const { data = [], isLoading } = useQuery({ queryKey: ['audit'], queryFn: getAudit });

  const columns = [
    {
      title: 'Time',
      dataIndex: 'createdAt',
      key: 'time',
      width: 180,
      render: (v: string) => <Text style={{ fontSize: 12 }}>{new Date(v).toLocaleString()}</Text>,
    },
    {
      title: 'User',
      key: 'user',
      width: 160,
      render: (_: any, row: any) => (
        <Text>{row.user?.fullName || row.user?.email || '—'}</Text>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 140,
      render: (v: string) => {
        const colorMap: Record<string, string> = {
          CREATE: 'blue', UPDATE: 'orange', DELETE: 'red', LOGIN: 'green',
          SIGN: 'purple', GENERATE: 'cyan',
        };
        const key = Object.keys(colorMap).find((k) => v?.toUpperCase().includes(k)) || '';
        return <Tag color={colorMap[key] || 'default'}>{v}</Tag>;
      },
    },
    {
      title: 'Entity',
      dataIndex: 'entity',
      key: 'entity',
      render: (v: string) => v || <Text type="secondary">—</Text>,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <Space>
            <HistoryOutlined style={{ color: '#1677ff' }} />
            Audit Trail
          </Space>
        </Title>
        <Text type="secondary">Complete log of all system actions for ISO 17025 compliance</Text>
      </div>

      <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 20, showTotal: (t) => `Total ${t} entries` }}
          size="small"
        />
      </Card>
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import {
  Alert, Card, Col, Row, Space, Table, Tag, Typography,
} from 'antd';
import { InfoCircleOutlined, UserOutlined } from '@ant-design/icons';
import { getEngineers } from '../api';

const { Title, Text } = Typography;

export default function Engineers() {
  const { data = [], isLoading } = useQuery({ queryKey: ['engineers'], queryFn: getEngineers });

  const columns = [
    {
      title: 'Employee Code',
      dataIndex: 'employeeCode',
      key: 'employeeCode',
      width: 140,
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Name',
      dataIndex: ['user', 'fullName'],
      key: 'name',
      render: (v: string) => <Text strong>{v || '—'}</Text>,
    },
    {
      title: 'Email',
      dataIndex: ['user', 'email'],
      key: 'email',
      render: (v: string) => v || <Text type="secondary">—</Text>,
    },
    {
      title: 'Skills',
      dataIndex: 'skills',
      key: 'skills',
      render: (skills: string[]) => (
        <Space size={4} wrap>
          {(skills || []).map((s) => <Tag key={s} color="geekblue">{s}</Tag>)}
          {(!skills || skills.length === 0) && <Text type="secondary">—</Text>}
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
              <Space>
                <UserOutlined style={{ color: '#1677ff' }} />
                Engineers
              </Space>
            </Title>
            <Text type="secondary">All calibration and service engineers in your lab</Text>
          </Col>
        </Row>
      </div>

      <Alert
        icon={<InfoCircleOutlined />}
        showIcon
        type="info"
        message="To add an engineer, go to Team Members and create a user with the Calibration Engineer or Service Engineer role."
        style={{ marginBottom: 16, borderRadius: 8 }}
      />

      <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 15, showTotal: (t) => `Total ${t} engineers` }}
          size="middle"
        />
      </Card>
    </div>
  );
}

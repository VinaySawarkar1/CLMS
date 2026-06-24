import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card, Table, Tag, Space, Typography, Tabs, Statistic, Row, Col, Select, Empty,
} from 'antd';
import {
  BarChartOutlined, BellOutlined, FileTextOutlined, DollarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getRecallDue, getJobs, getInvoices } from '../api';

const { Title, Text } = Typography;

function RecallReport() {
  const [days, setDays] = useState(30);
  const { data: due = [], isLoading } = useQuery({
    queryKey: ['recall', days],
    queryFn: () => getRecallDue(days),
  });

  const now = dayjs();
  const columns = [
    { title: 'Instrument', dataIndex: 'name', key: 'name', render: (n: string, r: any) => (
      <Space direction="vertical" size={0}>
        <Text strong>{n}</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>{[r.make, r.model].filter(Boolean).join(' ')} {r.serialNumber ? `· SN ${r.serialNumber}` : ''}</Text>
      </Space>
    ) },
    { title: 'Customer', key: 'cust', render: (_: any, r: any) => (
      <Space direction="vertical" size={0}>
        <Text>{r.customer?.name ?? '—'}</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>{r.customer?.email ?? ''}</Text>
      </Space>
    ) },
    { title: 'Next Due', dataIndex: 'nextDueDate', key: 'due', render: (v: string) => {
      const d = dayjs(v);
      const overdue = d.isBefore(now);
      return (
        <Space direction="vertical" size={0}>
          <Text>{d.format('DD MMM YYYY')}</Text>
          <Tag color={overdue ? 'red' : 'orange'}>{overdue ? 'OVERDUE' : `in ${d.diff(now, 'day')}d`}</Tag>
        </Space>
      );
    } },
    { title: 'Interval', dataIndex: 'calibrationIntervalMonths', key: 'int', render: (v: number) => v ? `${v} months` : '—' },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space>
        <Text>Show instruments due within:</Text>
        <Select
          value={days}
          onChange={setDays}
          options={[
            { value: 7, label: '7 days' },
            { value: 30, label: '30 days' },
            { value: 60, label: '60 days' },
            { value: 90, label: '90 days' },
          ]}
        />
      </Space>
      <Table rowKey="id" loading={isLoading} dataSource={due as any[]} columns={columns} pagination={{ pageSize: 10 }}
        locale={{ emptyText: <Empty description="No instruments due in this window" /> }} />
    </Space>
  );
}

function JobRegister() {
  const { data: jobs = [], isLoading } = useQuery({ queryKey: ['jobs'], queryFn: () => getJobs() });
  const columns = [
    { title: 'Job No.', dataIndex: 'jobNumber', key: 'j', render: (v: string) => <Text strong>{v}</Text> },
    { title: 'Received', dataIndex: 'receivedAt', key: 'r', render: (v: string) => dayjs(v).format('DD MMM YYYY') },
    { title: 'Customer', key: 'c', render: (_: any, r: any) => r.customer?.name ?? '—' },
    { title: 'Instrument', key: 'i', render: (_: any, r: any) => r.instrument?.name ?? '—' },
    { title: 'Type', key: 't', render: (_: any, r: any) => r.isOnsite ? <Tag color="geekblue">Onsite</Tag> : <Tag>In-lab</Tag> },
    { title: 'Status', dataIndex: 'status', key: 's', render: (s: string) => <Tag>{s?.replace(/_/g, ' ')}</Tag> },
  ];
  return <Table rowKey="id" loading={isLoading} dataSource={jobs as any[]} columns={columns} pagination={{ pageSize: 15 }} />;
}

function RevenueReport() {
  const { data: invoices = [], isLoading } = useQuery({ queryKey: ['invoices'], queryFn: getInvoices });
  const list = invoices as any[];
  const total = list.reduce((s, i) => s + (i.totalAmount ?? 0), 0);
  const paid = list.filter((i) => i.status === 'PAID').reduce((s, i) => s + (i.totalAmount ?? 0), 0);
  const outstanding = total - paid;

  // group by month
  const byMonth: Record<string, number> = {};
  for (const inv of list) {
    const key = dayjs(inv.issueDate ?? inv.createdAt).format('MMM YYYY');
    byMonth[key] = (byMonth[key] ?? 0) + (inv.totalAmount ?? 0);
  }
  const monthRows = Object.entries(byMonth).map(([month, amount]) => ({ month, amount }));

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={16}>
        <Col span={8}><Card><Statistic title="Total Invoiced" value={total} precision={2} prefix="₹" /></Card></Col>
        <Col span={8}><Card><Statistic title="Collected" value={paid} precision={2} prefix="₹" valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={8}><Card><Statistic title="Outstanding" value={outstanding} precision={2} prefix="₹" valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
      </Row>
      <Card title="Revenue by Month" loading={isLoading}>
        <Table
          rowKey="month"
          dataSource={monthRows}
          pagination={false}
          columns={[
            { title: 'Month', dataIndex: 'month', key: 'm' },
            { title: 'Invoiced', dataIndex: 'amount', key: 'a', render: (v: number) => `₹${v.toFixed(2)}` },
          ]}
          locale={{ emptyText: <Empty description="No invoices yet" /> }}
        />
      </Card>
    </Space>
  );
}

export default function Reports() {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3} style={{ margin: 0 }}><BarChartOutlined /> Reports</Title>
        <Text type="secondary">Calibration recall, job register and revenue analytics</Text>
      </div>
      <Card>
        <Tabs
          items={[
            { key: 'recall', label: <Space><BellOutlined />Calibration Recall</Space>, children: <RecallReport /> },
            { key: 'register', label: <Space><FileTextOutlined />Job Register</Space>, children: <JobRegister /> },
            { key: 'revenue', label: <Space><DollarOutlined />Revenue</Space>, children: <RevenueReport /> },
          ]}
        />
      </Card>
    </Space>
  );
}

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Button, Card, Col, Progress, Row, Statistic, Table, Tag, Space, Typography, Tabs, Select, Empty,
} from 'antd';
import {
  BarChartOutlined, BellOutlined, FileTextOutlined, TeamOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getRecallDue, getJobs } from '../api';

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


function EngineerPerformance() {
  const { data: jobs = [], isLoading } = useQuery({ queryKey: ['jobs'], queryFn: () => getJobs() });

  const stats = useMemo(() => {
    const byEng: Record<string, { name: string; total: number; completed: number; turnaroundDays: number[] }> = {};
    (jobs as any[]).forEach((j: any) => {
      const eng = j.engineer;
      if (!eng) return;
      const name = eng.user?.fullName || eng.employeeCode || eng.id;
      if (!byEng[eng.id]) byEng[eng.id] = { name, total: 0, completed: 0, turnaroundDays: [] };
      byEng[eng.id].total++;
      if (['APPROVED', 'CERTIFICATE_GENERATED', 'DELIVERED', 'CLOSED'].includes(j.status)) {
        byEng[eng.id].completed++;
        if (j.receivedAt) {
          const days = dayjs().diff(dayjs(j.receivedAt), 'day');
          byEng[eng.id].turnaroundDays.push(days);
        }
      }
    });
    return Object.values(byEng).map((e) => ({
      name: e.name,
      total: e.total,
      completed: e.completed,
      avgTurnaround: e.turnaroundDays.length
        ? Math.round(e.turnaroundDays.reduce((a, b) => a + b, 0) / e.turnaroundDays.length)
        : null,
      completionRate: e.total ? Math.round((e.completed / e.total) * 100) : 0,
    }));
  }, [jobs]);

  const total = (jobs as any[]).length;
  const assigned = (jobs as any[]).filter((j: any) => j.engineer).length;
  const completed = (jobs as any[]).filter((j: any) => ['APPROVED', 'CERTIFICATE_GENERATED', 'DELIVERED', 'CLOSED'].includes(j.status)).length;

  const columns = [
    { title: 'Engineer', dataIndex: 'name', key: 'name', render: (v: string) => <Text strong>{v}</Text> },
    { title: 'Total Jobs', dataIndex: 'total', key: 'total', sorter: (a: any, b: any) => b.total - a.total },
    { title: 'Completed', dataIndex: 'completed', key: 'completed', sorter: (a: any, b: any) => b.completed - a.completed },
    {
      title: 'Completion Rate', key: 'rate',
      render: (_: any, r: any) => (
        <Space>
          <Progress percent={r.completionRate} size="small" style={{ width: 100 }} status={r.completionRate === 100 ? 'success' : 'normal'} />
          <Text>{r.completionRate}%</Text>
        </Space>
      ),
      sorter: (a: any, b: any) => b.completionRate - a.completionRate,
    },
    {
      title: 'Avg. Turnaround', key: 'avg',
      render: (_: any, r: any) => r.avgTurnaround != null ? (
        <Tag color={r.avgTurnaround > 7 ? 'orange' : 'green'}>{r.avgTurnaround} days</Tag>
      ) : '—',
      sorter: (a: any, b: any) => (a.avgTurnaround ?? 99) - (b.avgTurnaround ?? 99),
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Row gutter={16}>
        <Col span={6}><Card><Statistic title="Total Jobs" value={total} /></Card></Col>
        <Col span={6}><Card><Statistic title="Assigned to Engineers" value={assigned} /></Card></Col>
        <Col span={6}><Card><Statistic title="Completed" value={completed} /></Card></Col>
        <Col span={6}><Card><Statistic title="Engineers Active" value={stats.length} /></Card></Col>
      </Row>
      <Table
        rowKey="name"
        loading={isLoading}
        dataSource={stats}
        columns={columns}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: <Empty description="No engineer job data available" /> }}
      />
    </Space>
  );
}

export default function Reports() {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3} style={{ margin: 0 }}><BarChartOutlined /> Reports</Title>
        <Text type="secondary">Calibration recall, job register and engineer performance</Text>
      </div>
      <Card>
        <Tabs
          items={[
            { key: 'recall', label: <Space><BellOutlined />Calibration Recall</Space>, children: <RecallReport /> },
            { key: 'register', label: <Space><FileTextOutlined />Job Register</Space>, children: <JobRegister /> },
            { key: 'engineers', label: <Space><TeamOutlined />Engineer Performance</Space>, children: <EngineerPerformance /> },
          ]}
        />
      </Card>
    </Space>
  );
}

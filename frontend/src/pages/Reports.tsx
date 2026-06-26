import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Button, Card, Col, Progress, Row, Statistic, Table, Tag, Space, Typography, Tabs, Select, Empty,
} from 'antd';
import {
  BarChartOutlined, BellOutlined, FileTextOutlined, ExportOutlined, DatabaseOutlined, TeamOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getRecallDue, getJobs, getEnvironmental, getCustomers } from '../api';
import { exportToCsv } from '../utils/export';

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

function LabDataExport() {
  const [period, setPeriod] = useState<1 | 2>(1);

  const cutoff = () => Date.now() - period * 365 * 24 * 60 * 60 * 1000;

  const { data: allJobs = [] } = useQuery({ queryKey: ['jobs'], queryFn: () => getJobs() });
  const { data: allEnv = [] } = useQuery({ queryKey: ['environmental'], queryFn: getEnvironmental });
  const { data: allCustomers = [] } = useQuery({ queryKey: ['customers', ''], queryFn: () => getCustomers() });

  const filterByPeriod = (items: any[]) =>
    items.filter((i) => i.createdAt && new Date(i.createdAt).getTime() >= cutoff());

  const handleExportJobs = () => {
    exportToCsv(`jobs-${period}yr.csv`, filterByPeriod(allJobs as any[]), [
      { key: 'jobNumber', label: 'Job No' },
      { key: 'customer.name', label: 'Customer' },
      { key: 'instrument.name', label: 'Instrument' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Created At' },
    ]);
  };

  const handleExportCertificates = () => {
    exportToCsv(`certificates-${period}yr.csv`, filterByPeriod(allJobs as any[]).filter((j: any) => j.certificate), [
      { key: 'jobNumber', label: 'Job No' },
      { key: 'certificate.certificateNumber', label: 'Cert Number' },
      { key: 'customer.name', label: 'Customer' },
      { key: 'instrument.name', label: 'Instrument' },
      { key: 'status', label: 'Status' },
    ]);
  };

  const handleExportEnv = () => {
    exportToCsv(`environmental-${period}yr.csv`, filterByPeriod(allEnv as any[]), [
      { key: 'temperature', label: 'Temperature (°C)' },
      { key: 'humidity', label: 'Humidity (%RH)' },
      { key: 'pressure', label: 'Pressure (kPa)' },
      { key: 'recordedAt', label: 'Recorded At' },
      { key: 'notes', label: 'Notes' },
    ]);
  };

  const handleExportFull = () => {
    const jobs = filterByPeriod(allJobs as any[]);
    const customers = allCustomers as any[];
    const makeSection = (title: string, rows: any[], cols: { key: string; label: string }[]) => {
      const header = cols.map(c => c.label).join(',');
      const lines = rows.map(row =>
        cols.map(c => {
          const val = c.key.split('.').reduce((o: any, k: string) => o?.[k], row) ?? '';
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',')
      );
      return [`=== ${title} ===`, header, ...lines].join('\n');
    };
    const csv = [
      makeSection('JOBS', jobs, [
        { key: 'jobNumber', label: 'Job No' },
        { key: 'customer.name', label: 'Customer' },
        { key: 'instrument.name', label: 'Instrument' },
        { key: 'status', label: 'Status' },
        { key: 'createdAt', label: 'Created At' },
      ]),
      '',
      makeSection('CUSTOMERS', customers, [
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'address', label: 'Address' },
      ]),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `full-lab-report-${period}yr.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space>
        <Text>Export period:</Text>
        <Select
          value={period}
          onChange={(v) => setPeriod(v)}
          options={[
            { value: 1, label: 'Last 1 Year' },
            { value: 2, label: 'Last 2 Years' },
          ]}
        />
      </Space>
      <Space wrap>
        <Button icon={<ExportOutlined />} onClick={handleExportJobs}>Export Jobs</Button>
        <Button icon={<ExportOutlined />} onClick={handleExportCertificates}>Export Certificates</Button>
        <Button icon={<ExportOutlined />} onClick={handleExportEnv}>Export Environmental Records</Button>
        <Button icon={<ExportOutlined />} type="primary" onClick={handleExportFull}>Export Full Lab Report</Button>
      </Space>
    </Space>
  );
}

function EngineerPerformance() {
  const { data: jobs = [], isLoading } = useQuery({ queryKey: ['jobs'], queryFn: () => getJobs() });

  const stats = useMemo(() => {
    const byEng: Record<string, { name: string; total: number; completed: number; turnaroundDays: number[]; }> = {};
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
        <Text type="secondary">Calibration recall, job register and lab data export</Text>
      </div>
      <Card>
        <Tabs
          items={[
            { key: 'recall', label: <Space><BellOutlined />Calibration Recall</Space>, children: <RecallReport /> },
            { key: 'register', label: <Space><FileTextOutlined />Job Register</Space>, children: <JobRegister /> },
            { key: 'export', label: <Space><DatabaseOutlined />Lab Data Export</Space>, children: <LabDataExport /> },
            { key: 'engineers', label: <Space><TeamOutlined />Engineer Performance</Space>, children: <EngineerPerformance /> },
          ]}
        />
      </Card>
    </Space>
  );
}

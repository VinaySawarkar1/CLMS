import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Button, Card, Table, Tag, Space, Typography, Tabs, Statistic, Row, Col, Select, Empty,
} from 'antd';
import {
  BarChartOutlined, BellOutlined, FileTextOutlined, DollarOutlined, ExportOutlined, DatabaseOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getRecallDue, getJobs, getInvoices, getEnvironmental, getCustomers } from '../api';
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

function LabDataExport() {
  const [period, setPeriod] = useState<1 | 2>(1);

  const cutoff = () => Date.now() - period * 365 * 24 * 60 * 60 * 1000;

  const { data: allJobs = [] } = useQuery({ queryKey: ['jobs'], queryFn: () => getJobs() });
  const { data: allInvoices = [] } = useQuery({ queryKey: ['invoices'], queryFn: getInvoices });
  const { data: allEnv = [] } = useQuery({ queryKey: ['environmental'], queryFn: getEnvironmental });
  const { data: allCustomers = [] } = useQuery({ queryKey: ['customers', ''], queryFn: () => getCustomers() });

  const filterByPeriod = (items: any[]) =>
    items.filter((i) => i.createdAt && new Date(i.createdAt).getTime() >= cutoff());

  const handleExportJobs = () => {
    const rows = filterByPeriod(allJobs as any[]);
    exportToCsv(`jobs-${period}yr.csv`, rows, [
      { key: 'jobNumber', label: 'Job No' },
      { key: 'customer.name', label: 'Customer' },
      { key: 'instrument.name', label: 'Instrument' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Created At' },
    ]);
  };

  const handleExportCertificates = () => {
    const rows = filterByPeriod(allJobs as any[]).filter((j: any) => j.certificate);
    exportToCsv(`certificates-${period}yr.csv`, rows, [
      { key: 'jobNumber', label: 'Job No' },
      { key: 'certificate.certificateNumber', label: 'Cert Number' },
      { key: 'customer.name', label: 'Customer' },
      { key: 'instrument.name', label: 'Instrument' },
      { key: 'status', label: 'Status' },
    ]);
  };

  const handleExportInvoices = () => {
    const rows = filterByPeriod(allInvoices as any[]);
    exportToCsv(`invoices-${period}yr.csv`, rows, [
      { key: 'invoiceNumber', label: 'Invoice No' },
      { key: 'customer.name', label: 'Customer' },
      { key: 'amount', label: 'Amount' },
      { key: 'totalAmount', label: 'Total' },
      { key: 'status', label: 'Status' },
    ]);
  };

  const handleExportEnv = () => {
    const rows = filterByPeriod(allEnv as any[]);
    exportToCsv(`environmental-${period}yr.csv`, rows, [
      { key: 'temperature', label: 'Temperature' },
      { key: 'humidity', label: 'Humidity' },
      { key: 'recordedAt', label: 'Recorded At' },
      { key: 'notes', label: 'Notes' },
    ]);
  };

  const handleExportFull = () => {
    const jobs = filterByPeriod(allJobs as any[]);
    const invoices = filterByPeriod(allInvoices as any[]);
    const customers = allCustomers as any[];

    const jobCols = [
      { key: 'jobNumber', label: 'Job No' },
      { key: 'customer.name', label: 'Customer' },
      { key: 'instrument.name', label: 'Instrument' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Created At' },
    ];
    const invCols = [
      { key: 'invoiceNumber', label: 'Invoice No' },
      { key: 'customer.name', label: 'Customer' },
      { key: 'amount', label: 'Amount' },
      { key: 'status', label: 'Status' },
    ];
    const custCols = [
      { key: 'name', label: 'Name' },
      { key: 'code', label: 'Code' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
    ];

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
      makeSection('JOBS', jobs, jobCols),
      '',
      makeSection('INVOICES', invoices, invCols),
      '',
      makeSection('CUSTOMERS', customers, custCols),
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
        <Button icon={<ExportOutlined />} onClick={handleExportInvoices}>Export Invoices</Button>
        <Button icon={<ExportOutlined />} onClick={handleExportEnv}>Export Environmental Records</Button>
        <Button icon={<ExportOutlined />} type="primary" onClick={handleExportFull}>Export Full Lab Report</Button>
      </Space>
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
            { key: 'export', label: <Space><DatabaseOutlined />Lab Data Export</Space>, children: <LabDataExport /> },
          ]}
        />
      </Card>
    </Space>
  );
}

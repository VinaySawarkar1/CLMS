import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert, Button, Card, Col, Divider, Form, Input, InputNumber, Row, Select,
  Space, Spin, Steps, Table, Tabs, Tag, Typography,
} from 'antd';
import {
  ArrowLeftOutlined, FileTextOutlined, ExperimentOutlined, SafetyCertificateOutlined,
  CheckCircleOutlined, ClockCircleOutlined, PrinterOutlined, ThunderboltOutlined,
  PlusOutlined, LockOutlined, SaveOutlined, CalculatorOutlined,
} from '@ant-design/icons';
import {
  computeDatasheet, computeUncertainty, createDatasheet, generateCertificate,
  getDatasheet, getJob, openCertificateReport, signCertificate,
} from '../api';
import { findProcedure, groupedProcedures, Procedure } from '../procedures';

const { Title, Text } = Typography;

const SIG_STAGES = ['ENGINEER', 'REVIEWER', 'TECHNICAL_MANAGER', 'QUALITY_MANAGER', 'FINAL_LOCK'];
const STAGE_LABELS: Record<string, string> = {
  ENGINEER: 'Engineer', REVIEWER: 'Reviewer', TECHNICAL_MANAGER: 'Tech Manager',
  QUALITY_MANAGER: 'QA Manager', FINAL_LOCK: 'Final Lock',
};
const DISTRIBUTIONS = ['normal', 'rectangular', 'triangular', 'u-shaped'];
const NREAD = 5;

const JOB_STATUS_COLORS: Record<string, string> = {
  IN_CALIBRATION: 'processing', PENDING_REVIEW: 'gold', APPROVED: 'green',
  CERTIFICATE_GENERATED: 'cyan', DELIVERED: 'purple', CLOSED: 'default',
};

type Row = { pointLabel: string; unit: string; nominal: string; standardValue: string; readings: string[] };
const emptyRow = (unit = ''): Row => ({ pointLabel: '', unit, nominal: '', standardValue: '', readings: Array(NREAD).fill('') });

export default function JobWorkspace() {
  const { id } = useParams();
  const jobId = id!;
  const nav = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('datasheet');

  const { data: job } = useQuery({ queryKey: ['job-detail', jobId], queryFn: () => getJob(jobId) });
  const datasheetId: string | undefined = job?.datasheets?.[job.datasheets.length - 1]?.id;
  const { data: datasheet } = useQuery({
    queryKey: ['datasheet', datasheetId],
    queryFn: () => getDatasheet(datasheetId!),
    enabled: !!datasheetId,
  });

  if (!job) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <Spin size="large" tip="Loading job workspace..." />
    </div>
  );

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['job-detail', jobId] });
    qc.invalidateQueries({ queryKey: ['datasheet', datasheetId] });
  };

  const tabItems = [
    {
      key: 'datasheet',
      label: (
        <Space>
          <ExperimentOutlined />
          Datasheet
        </Space>
      ),
      children: <DatasheetTab job={job} datasheet={datasheet} onChanged={invalidate} />,
    },
    {
      key: 'uncertainty',
      label: (
        <Space>
          <CalculatorOutlined />
          Uncertainty
        </Space>
      ),
      children: <UncertaintyTab datasheet={datasheet} onChanged={invalidate} />,
    },
    {
      key: 'certificate',
      label: (
        <Space>
          <SafetyCertificateOutlined />
          Certificate
        </Space>
      ),
      children: <CertificateTab job={job} onChanged={() => qc.invalidateQueries({ queryKey: ['job-detail', jobId] })} />,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => nav('/jobs')}
          style={{ marginBottom: 16 }}
        >
          Back to Jobs
        </Button>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <Space>
                <FileTextOutlined style={{ color: '#1677ff' }} />
                {job.jobNumber}
              </Space>
            </Title>
            <Space style={{ marginTop: 4 }}>
              <Text type="secondary">{job.instrument?.name}</Text>
              <Text type="secondary">·</Text>
              <Text type="secondary">{job.customer?.name}</Text>
              <Tag color={JOB_STATUS_COLORS[job.status] || 'default'}>{job.status?.replace(/_/g, ' ')}</Tag>
            </Space>
          </Col>
        </Row>
      </div>

      <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Card>
    </div>
  );
}

function DatasheetTab({ job, datasheet, onChanged }: any) {
  const [procId, setProcId] = useState('');
  const [unit, setUnit] = useState('');
  const [env, setEnv] = useState({ temperature: '23', humidity: '50', pressure: '101.3' });
  const [rows, setRows] = useState<Row[]>([emptyRow()]);

  const applyProcedure = (id: string) => {
    setProcId(id);
    const p = findProcedure(id);
    if (!p) return;
    setUnit(p.unit);
    setRows(p.points.map((pt) => ({
      pointLabel: pt.label,
      unit: p.unit,
      nominal: String(pt.nominal),
      standardValue: String(pt.nominal),
      readings: Array(NREAD).fill(''),
    })));
  };

  const createMut = useMutation({
    mutationFn: () => createDatasheet({
      jobId: job.id,
      templateName: findProcedure(procId)?.label || `${job.instrument?.name || 'Instrument'} Calibration`,
      environmental: { temperature: Number(env.temperature), humidity: Number(env.humidity), pressure: Number(env.pressure) },
      observations: rows.filter((r) => r.standardValue !== '').map((r) => ({
        pointLabel: r.pointLabel,
        unit: r.unit || unit,
        nominal: r.nominal ? Number(r.nominal) : undefined,
        standardValue: Number(r.standardValue),
        data: { readings: r.readings.map(Number).filter((n) => !Number.isNaN(n)) },
      })),
    }),
    onSuccess: onChanged,
  });
  const computeMut = useMutation({ mutationFn: () => computeDatasheet(datasheet.id), onSuccess: onChanged });

  const setRow = (i: number, patch: Partial<Row>) => setRows(rows.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  const setReading = (i: number, j: number, v: string) => setRows(rows.map((r, idx) => idx === i ? { ...r, readings: r.readings.map((x, k) => k === j ? v : x) } : r));

  if (datasheet) {
    const obsColumns = [
      { title: 'Point', dataIndex: 'pointLabel', key: 'point', render: (v: string) => v || '—' },
      { title: 'Unit', dataIndex: 'unit', key: 'unit', render: (v: string) => v ? <Tag color="cyan">{v}</Tag> : '—' },
      { title: 'Nominal', dataIndex: 'nominal', key: 'nominal', render: (v: number) => v ?? '—' },
      { title: 'Standard', dataIndex: 'standardValue', key: 'standard', render: (v: number) => v ?? '—' },
      { title: 'Observed (mean)', dataIndex: 'observedValue', key: 'observed', render: (v: number) => v?.toFixed(4) ?? '—' },
      { title: 'Correction', dataIndex: 'correction', key: 'correction', render: (v: number) => v?.toFixed(4) ?? '—' },
      { title: 'Error', dataIndex: 'error', key: 'error', render: (v: number) => v?.toFixed(4) ?? '—' },
      {
        title: 'uA', key: 'uA',
        render: (_: any, row: any) => row.data?.uA != null ? Number(row.data.uA).toExponential(2) : '—',
      },
    ];

    return (
      <div>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col>
            <Text strong>{datasheet.templateName}</Text>
            <Text type="secondary" style={{ marginLeft: 8 }}>v{datasheet.version}</Text>
          </Col>
          <Col>
            <Space size={4} style={{ marginLeft: 16 }}>
              <Tag icon={<ThunderboltOutlined />} color="blue">{datasheet.environmental?.temperature ?? '—'} °C</Tag>
              <Tag color="cyan">{datasheet.environmental?.humidity ?? '—'} %RH</Tag>
              <Tag color="purple">{datasheet.environmental?.pressure ?? '—'} kPa</Tag>
            </Space>
          </Col>
        </Row>
        <Table
          columns={obsColumns}
          dataSource={datasheet.observations}
          rowKey="id"
          size="small"
          pagination={false}
          style={{ marginBottom: 16 }}
        />
        <Space>
          <Button
            type="primary"
            icon={<CalculatorOutlined />}
            loading={computeMut.isPending}
            onClick={() => computeMut.mutate()}
          >
            Calculate (mean · correction · error · repeatability)
          </Button>
        </Space>
        <Alert
          type="info"
          message="Datasheet saved. Click Calculate to compute results, then proceed to Uncertainty tab."
          showIcon
          style={{ marginTop: 16 }}
        />
      </div>
    );
  }

  const procedureOptions = Object.entries(groupedProcedures()).flatMap(([discipline, subs]) =>
    Object.entries(subs as any).flatMap(([sub, procs]: [string, any]) =>
      (procs as Procedure[]).map((p) => ({
        value: p.id,
        label: `${p.label} (${p.unit})`,
        group: `${discipline} › ${sub}`,
      }))
    )
  );

  const groupedOptions = Object.entries(groupedProcedures()).map(([discipline, subs]) => ({
    label: discipline,
    options: Object.entries(subs as any).flatMap(([sub, procs]: [string, any]) =>
      (procs as Procedure[]).map((p) => ({
        value: p.id,
        label: `${sub} › ${p.label} (${p.unit})`,
      }))
    ),
  }));

  const inputCols = [
    {
      title: 'Point Label', key: 'label', width: 110,
      render: (_: any, _row: any, i: number) => (
        <Input size="small" value={rows[i].pointLabel} onChange={(e) => setRow(i, { pointLabel: e.target.value })} />
      ),
    },
    {
      title: 'Unit', key: 'unit', width: 70,
      render: (_: any, _row: any, i: number) => (
        <Input size="small" value={rows[i].unit} onChange={(e) => setRow(i, { unit: e.target.value })} />
      ),
    },
    {
      title: 'Nominal', key: 'nominal', width: 90,
      render: (_: any, _row: any, i: number) => (
        <Input size="small" value={rows[i].nominal} onChange={(e) => setRow(i, { nominal: e.target.value })} />
      ),
    },
    {
      title: 'Standard', key: 'std', width: 90,
      render: (_: any, _row: any, i: number) => (
        <Input size="small" value={rows[i].standardValue} onChange={(e) => setRow(i, { standardValue: e.target.value })} />
      ),
    },
    ...Array.from({ length: NREAD }).map((_, j) => ({
      title: `R${j + 1}`, key: `r${j}`, width: 80,
      render: (_: any, _row: any, i: number) => (
        <Input size="small" value={rows[i].readings[j]} onChange={(e) => setReading(i, j, e.target.value)} />
      ),
    })),
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col flex="400px">
          <Form.Item label="Instrument Procedure" style={{ marginBottom: 0 }}>
            <Select
              placeholder="Select discipline / instrument..."
              value={procId || undefined}
              onChange={applyProcedure}
              options={groupedOptions}
              showSearch
              filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col flex="160px">
          <Form.Item label="Unit of Measurement" style={{ marginBottom: 0 }}>
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="mm, bar, °C..." />
          </Form.Item>
        </Col>
      </Row>

      <Card
        size="small"
        title="Environmental Conditions"
        style={{ marginBottom: 20, borderRadius: 8 }}
      >
        <Row gutter={16}>
          {[
            { label: 'Temperature (°C)', key: 'temperature' },
            { label: 'Humidity (%RH)', key: 'humidity' },
            { label: 'Pressure (kPa)', key: 'pressure' },
          ].map(({ label, key }) => (
            <Col key={key} span={8}>
              <Form.Item label={label} style={{ marginBottom: 0 }}>
                <Input
                  value={env[key as keyof typeof env]}
                  onChange={(e) => setEnv({ ...env, [key]: e.target.value })}
                  placeholder="—"
                />
              </Form.Item>
            </Col>
          ))}
        </Row>
      </Card>

      <Text strong style={{ display: 'block', marginBottom: 12 }}>
        Measurement Points & Readings {unit && <Tag color="cyan">{unit}</Tag>}
      </Text>
      <div style={{ overflowX: 'auto' }}>
        <Table
          columns={inputCols}
          dataSource={rows}
          rowKey={(_, i) => String(i)}
          size="small"
          pagination={false}
          style={{ marginBottom: 12 }}
        />
      </div>
      <Space>
        <Button icon={<PlusOutlined />} onClick={() => setRows([...rows, emptyRow(unit)])}>
          Add Point
        </Button>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={createMut.isPending}
          disabled={!rows.some((r) => r.standardValue !== '')}
          onClick={() => createMut.mutate()}
        >
          Save Datasheet
        </Button>
      </Space>
    </div>
  );
}

function UncertaintyTab({ datasheet, onChanged }: any) {
  const [contributors, setContributors] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const procedure = useMemo(() => findProcedure(datasheet?.templateName), [datasheet?.templateName]);
  const unit = datasheet?.observations?.[0]?.unit || procedure?.unit || '';

  useEffect(() => {
    if (datasheet?.uncertainty) {
      setResult({
        combinedUncertainty: datasheet.uncertainty.combinedUncertainty,
        coverageFactor: datasheet.uncertainty.coverageFactor,
        expandedUncertainty: datasheet.uncertainty.expandedUncertainty,
      });
    }
  }, [datasheet?.id]);

  const maxUA = useMemo(() => {
    const us = (datasheet?.observations || []).map((o: any) => Number(o.data?.uA || 0));
    return us.length ? Math.max(...us) : 0;
  }, [datasheet]);

  const computeMut = useMutation({
    mutationFn: () => computeUncertainty(datasheet.id, contributors.map((c) => ({
      source: c.source, type: c.type, value: Number(c.value),
      distribution: c.distribution || undefined, divisor: c.divisor ? Number(c.divisor) : undefined,
      sensitivity: c.sensitivity ? Number(c.sensitivity) : 1, unit: c.unit,
    }))),
    onSuccess: (res: any) => { setResult(res.result); onChanged(); },
  });

  if (!datasheet) return (
    <Alert
      type="warning"
      message="No datasheet found"
      description="Create and calculate a datasheet first (Datasheet tab)."
      showIcon
    />
  );

  const add = (c: any) => setContributors((cs) => [...cs, c]);
  const setC = (i: number, patch: any) => setContributors(contributors.map((c, idx) => idx === i ? { ...c, ...patch } : c));
  const removeC = (i: number) => setContributors(contributors.filter((_, idx) => idx !== i));

  const loadDefaults = () => {
    const list: any[] = [{ source: 'Repeatability', type: 'A', value: maxUA.toExponential(4), divisor: 1, sensitivity: 1, unit }];
    if (procedure) procedure.typeB.forEach((b) => list.push({ ...b, type: 'B', value: String(b.value) }));
    setContributors(list);
  };

  const contribColumns = [
    {
      title: 'Source', key: 'source', width: 160,
      render: (_: any, _row: any, i: number) => (
        <Input size="small" value={contributors[i].source} onChange={(e) => setC(i, { source: e.target.value })} />
      ),
    },
    {
      title: 'Type', dataIndex: 'type', key: 'type', width: 70,
      render: (v: string) => <Tag color={v === 'A' ? 'blue' : 'orange'}>{v}</Tag>,
    },
    {
      title: 'Value', key: 'value', width: 110,
      render: (_: any, _row: any, i: number) => (
        <Input size="small" value={contributors[i].value} onChange={(e) => setC(i, { value: e.target.value })} />
      ),
    },
    {
      title: 'Unit', key: 'unit', width: 70,
      render: (_: any, _row: any, i: number) => (
        <Input size="small" value={contributors[i].unit || ''} onChange={(e) => setC(i, { unit: e.target.value })} />
      ),
    },
    {
      title: 'Distribution', key: 'dist', width: 130,
      render: (_: any, _row: any, i: number) => (
        <Select
          size="small"
          style={{ width: '100%' }}
          value={contributors[i].distribution || undefined}
          onChange={(v) => setC(i, { distribution: v })}
          options={DISTRIBUTIONS.map((d) => ({ value: d, label: d }))}
          placeholder="—"
          allowClear
        />
      ),
    },
    {
      title: 'Divisor', key: 'divisor', width: 80,
      render: (_: any, _row: any, i: number) => (
        <Input size="small" value={contributors[i].divisor ?? ''} onChange={(e) => setC(i, { divisor: e.target.value })} />
      ),
    },
    {
      title: 'ci', key: 'sensitivity', width: 70,
      render: (_: any, _row: any, i: number) => (
        <Input size="small" value={contributors[i].sensitivity ?? 1} onChange={(e) => setC(i, { sensitivity: e.target.value })} />
      ),
    },
    {
      title: '', key: 'del', width: 50,
      render: (_: any, _row: any, i: number) => (
        <Button size="small" danger type="text" onClick={() => removeC(i)}>✕</Button>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Text strong>Uncertainty Budget (GUM) </Text>
          {unit && <Tag color="cyan">{unit}</Tag>}
        </Col>
      </Row>
      <Space style={{ marginBottom: 16 }} wrap>
        <Button
          type="primary"
          ghost
          onClick={loadDefaults}
        >
          Load {procedure ? procedure.label : 'default'} contributors
        </Button>
        <Button
          icon={<PlusOutlined />}
          onClick={() => add({ source: 'Repeatability', type: 'A', value: maxUA.toExponential(4), divisor: 1, sensitivity: 1, unit })}
        >
          + Type A
        </Button>
        <Button
          icon={<PlusOutlined />}
          onClick={() => add({ source: '', type: 'B', value: '', distribution: 'normal', divisor: 2, sensitivity: 1, unit })}
        >
          + Type B
        </Button>
      </Space>

      {contributors.length === 0 ? (
        <Alert
          type="info"
          message="No contributors yet"
          description='Click "Load contributors" to auto-populate from the instrument procedure, or add them manually.'
          showIcon
          style={{ marginBottom: 16 }}
        />
      ) : (
        <div style={{ overflowX: 'auto', marginBottom: 16 }}>
          <Table
            columns={contribColumns}
            dataSource={contributors}
            rowKey={(_, i) => String(i)}
            size="small"
            pagination={false}
          />
        </div>
      )}

      <Button
        type="primary"
        icon={<CalculatorOutlined />}
        loading={computeMut.isPending}
        disabled={!contributors.length}
        onClick={() => computeMut.mutate()}
      >
        Compute Combined & Expanded Uncertainty
      </Button>

      {result && (
        <Card
          style={{ marginTop: 20, borderRadius: 8, background: '#f6ffed', border: '1px solid #b7eb8f' }}
          size="small"
        >
          <Title level={5} style={{ color: '#389e0d', marginBottom: 12 }}>GUM Uncertainty Results</Title>
          <Row gutter={32}>
            <Col>
              <Text type="secondary" style={{ fontSize: 12 }}>Combined Standard Uncertainty</Text>
              <div><Text strong>u_c = {Number(result.combinedUncertainty).toExponential(3)} {unit}</Text></div>
            </Col>
            <Col>
              <Text type="secondary" style={{ fontSize: 12 }}>Coverage Factor</Text>
              <div><Text strong>k = {Number(result.coverageFactor).toFixed(2)}</Text></div>
            </Col>
            <Col>
              <Text type="secondary" style={{ fontSize: 12 }}>Expanded Uncertainty (≈95%)</Text>
              <div>
                <Tag color="green" style={{ fontSize: 14, padding: '4px 12px' }}>
                  U = ±{Number(result.expandedUncertainty).toExponential(3)} {unit}
                </Tag>
              </div>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
}

function CertificateTab({ job, onChanged }: any) {
  const cert = job.certificate;
  const genMut = useMutation({ mutationFn: () => generateCertificate({ jobId: job.id, type: 'NABL' }), onSuccess: onChanged });
  const signMut = useMutation({ mutationFn: (stage: string) => signCertificate(cert.id, stage), onSuccess: onChanged });

  if (!cert) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        {job.status === 'APPROVED' ? (
          <Space direction="vertical" size={16}>
            <SafetyCertificateOutlined style={{ fontSize: 48, color: '#1677ff' }} />
            <Text>Ready to generate the calibration certificate</Text>
            <Button
              type="primary"
              size="large"
              icon={<SafetyCertificateOutlined />}
              loading={genMut.isPending}
              onClick={() => genMut.mutate()}
            >
              Generate Certificate
            </Button>
          </Space>
        ) : (
          <Alert
            type="info"
            message="Certificate not yet available"
            description={
              <>
                Advance the job to <Tag color="green">APPROVED</Tag> status (Jobs page → actions menu) to generate the certificate.
                Current status: <Tag color="orange">{job.status?.replace(/_/g, ' ')}</Tag>
              </>
            }
            showIcon
          />
        )}
      </div>
    );
  }

  const signed: string[] = (cert.signatures || []).map((s: any) => s.stage);
  const next = SIG_STAGES[signed.length];

  const stepItems = SIG_STAGES.map((st) => {
    const sig = (cert.signatures || []).find((s: any) => s.stage === st);
    return {
      title: STAGE_LABELS[st],
      description: sig ? <Text type="success" style={{ fontSize: 11 }}>by {sig.signedByName}</Text> : undefined,
      icon: sig
        ? <CheckCircleOutlined style={{ color: '#52c41a' }} />
        : (SIG_STAGES.indexOf(st) === signed.length ? <ClockCircleOutlined style={{ color: '#1677ff' }} /> : undefined),
      status: sig ? 'finish' as const : (SIG_STAGES.indexOf(st) === signed.length ? 'process' as const : 'wait' as const),
    };
  });

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card size="small" style={{ borderRadius: 8, background: '#f0f5ff' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>Certificate No.</Text>
            <div><Text strong style={{ color: '#1677ff' }}>{cert.certificateNumber}</Text></div>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ borderRadius: 8, background: '#f0f5ff' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>Type</Text>
            <div><Tag color="blue">{cert.type}</Tag></div>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ borderRadius: 8, background: cert.isLocked ? '#f6ffed' : '#fffbe6' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>Status</Text>
            <div>
              {cert.isLocked
                ? <Tag color="green" icon={<LockOutlined />}>Finalised & Locked</Tag>
                : <Tag color="orange">Pending Signatures</Tag>}
            </div>
          </Card>
        </Col>
      </Row>

      <Text strong style={{ display: 'block', marginBottom: 16 }}>Signature Workflow</Text>
      <Steps
        items={stepItems}
        current={signed.length}
        style={{ marginBottom: 24 }}
        size="small"
      />

      <Divider />
      <Space>
        {!cert.isLocked && next && (
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={signMut.isPending}
            onClick={() => signMut.mutate(next)}
          >
            Sign as {STAGE_LABELS[next] || next}
          </Button>
        )}
        <Button
          icon={<PrinterOutlined />}
          onClick={() => openCertificateReport(cert.id)}
        >
          Open Printable Certificate
        </Button>
      </Space>

      {cert.isLocked && (
        <Alert
          type="success"
          message="Certificate is finalised and immutable"
          description="This certificate has completed all signature stages and is now permanently locked."
          showIcon
          icon={<LockOutlined />}
          style={{ marginTop: 16 }}
        />
      )}
    </div>
  );
}

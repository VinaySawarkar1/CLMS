import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert, Button, Card, Col, Divider, Form, Input, InputNumber, Row, Select,
  Space, Spin, Steps, Table, Tabs, Tag, Timeline, Typography,
} from 'antd';
import {
  ArrowLeftOutlined, FileTextOutlined, ExperimentOutlined, SafetyCertificateOutlined,
  CheckCircleOutlined, ClockCircleOutlined, PrinterOutlined, ThunderboltOutlined,
  PlusOutlined, LockOutlined, SaveOutlined, CalculatorOutlined, FilePdfOutlined,
  HistoryOutlined, WarningOutlined, CommentOutlined,
} from '@ant-design/icons';
import {
  autoUncertainty, computeDatasheet, computeUncertainty, createDatasheet, generateCertificate,
  getDatasheet, getJob, getJobs, openCertificateReport, openDatasheetReport, signCertificate,
} from '../api';
import { checkMpe, findProcedure, getNabl129, groupedProcedures, Procedure, PROCEDURES } from '../procedures';

const { Title, Text } = Typography;

const SIG_STAGES = ['ENGINEER', 'REVIEWER', 'TECHNICAL_MANAGER', 'QUALITY_MANAGER', 'FINAL_LOCK'];
const STAGE_LABELS: Record<string, string> = {
  ENGINEER: 'Engineer', REVIEWER: 'Reviewer', TECHNICAL_MANAGER: 'Tech Manager',
  QUALITY_MANAGER: 'QA Manager', FINAL_LOCK: 'Final Lock',
};
const DISTRIBUTIONS = ['normal', 'rectangular', 'triangular', 'u-shaped'];
const JOB_STATUS_COLORS: Record<string, string> = {
  IN_CALIBRATION: 'processing', PENDING_REVIEW: 'gold', APPROVED: 'green',
  CERTIFICATE_GENERATED: 'cyan', DELIVERED: 'purple', CLOSED: 'default',
};

type Row = { pointLabel: string; unit: string; nominal: string; standardValue: string; readings: string[] };
const emptyRow = (unit = '', nread = 5): Row => ({ pointLabel: '', unit, nominal: '', standardValue: '', readings: Array(nread).fill('') });

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
      children: <DatasheetTab job={job} datasheet={datasheet} allDatasheets={job.datasheets ?? []} onChanged={invalidate} />,
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
    {
      key: 'history',
      label: (
        <Space>
          <HistoryOutlined />
          Cal. History
        </Space>
      ),
      children: <CalibrationHistoryTab job={job} />,
    },
    {
      key: 'remarks',
      label: (
        <Space>
          <CommentOutlined />
          Remarks
        </Space>
      ),
      children: <RemarksTab job={job} onChanged={invalidate} />,
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
            <Space style={{ marginTop: 4 }} wrap>
              <Text type="secondary">{job.instrument?.name}</Text>
              <Text type="secondary">·</Text>
              <Text type="secondary">{job.customer?.name}</Text>
              <Tag color={JOB_STATUS_COLORS[job.status] || 'default'}>{job.status?.replace(/_/g, ' ')}</Tag>
              {job.procedureId && (() => {
                const p = findProcedure(job.procedureId);
                return p ? (
                  <>
                    <Tag color="geekblue" icon={<LockOutlined />}>{p.discipline}</Tag>
                    <Tag color="blue">{p.subDiscipline}</Tag>
                    {job.unitOfMeasurement && <Tag color="cyan">{job.unitOfMeasurement}</Tag>}
                  </>
                ) : null;
              })()}
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

function DatasheetTab({ job, datasheet, allDatasheets, onChanged }: any) {
  // If a procedure was locked at job creation, use it; otherwise allow selection.
  const lockedProcId: string = job?.procedureId ?? '';
  const lockedRangeIdx: number = job?.procedureRangeIndex ?? 0;
  const lockedUnit: string = job?.unitOfMeasurement ?? '';

  const [procId, setProcId] = useState(lockedProcId || '');
  const [unit, setUnit] = useState(lockedUnit || '');
  const [env, setEnv] = useState({ temperature: '23', humidity: '50', pressure: '101.3' });
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [selectedAccClass, setSelectedAccClass] = useState<string | null>(null);

  // NABL 129 criteria for selected procedure
  const nc = useMemo(() => getNabl129(procId), [procId]);
  const nread = nc?.minReadings ?? 5;

  // Effective MPE considering selected accuracy class
  const effectiveMpe = useMemo(() => {
    if (!nc) return null;
    if (selectedAccClass && nc.accuracyClasses) {
      const cls = nc.accuracyClasses.find((c) => c.class === selectedAccClass);
      if (cls) return { value: cls.mpeNumeric ?? nc.mpeNumeric, isPercent: cls.mpeIsPercent ?? nc.mpeIsPercent };
    }
    return { value: nc.mpeNumeric, isPercent: nc.mpeIsPercent };
  }, [nc, selectedAccClass]);
  // Version history: which datasheet id to view (null = latest)
  const [viewDsId, setViewDsId] = useState<string | null>(null);

  const { data: viewedDatasheet } = useQuery({
    queryKey: ['datasheet', viewDsId],
    queryFn: () => getDatasheet(viewDsId!),
    enabled: !!viewDsId,
  });

  // Currently displayed datasheet — either a selected older version or the latest
  const displayedDatasheet = viewDsId ? (viewedDatasheet ?? datasheet) : datasheet;

  // Apply the locked procedure (from job creation) on first load
  useEffect(() => {
    if (lockedProcId) {
      applyProcedure(lockedProcId, lockedRangeIdx, lockedUnit);
    } else if (!datasheet && !procId && job?.instrument?.discipline) {
      // Fallback: auto-select by instrument discipline if no procedure was locked
      const match = PROCEDURES.find(
        (p) => p.discipline.toLowerCase() === (job.instrument.discipline as string).toLowerCase(),
      );
      if (match) applyProcedure(match.id, 0, '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockedProcId]);

  const [rangeIdx, setRangeIdx] = useState(0);

  const loadPoints = (u: string, points: { label: string; nominal: number }[], readCount = nread) => {
    setUnit(u);
    setRows(points.map((pt) => ({
      pointLabel: pt.label,
      unit: u,
      nominal: String(pt.nominal),
      standardValue: String(pt.nominal),
      readings: Array(readCount).fill(''),
    })));
  };

  const applyProcedure = (id: string, rangeIndex = 0, overrideUnit = '') => {
    setProcId(id);
    setRangeIdx(rangeIndex);
    setSelectedAccClass(null);
    const p = findProcedure(id);
    const crit = getNabl129(id);
    const rc = crit?.minReadings ?? 5;
    if (!p) return;
    if (p.ranges && p.ranges.length) {
      const r = p.ranges[rangeIndex] ?? p.ranges[0];
      loadPoints(overrideUnit || r.unit, r.points, rc);
    } else {
      loadPoints(overrideUnit || p.unit, p.points, rc);
    }
  };

  const applyRange = (idx: number) => {
    setRangeIdx(idx);
    const p = findProcedure(procId);
    const r = p?.ranges?.[idx];
    if (r) loadPoints(r.unit, r.points, nread);
  };

  const selectedProc = findProcedure(procId);

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

  if (displayedDatasheet) {
    const hasMultiple = (allDatasheets as any[]).length > 1;
    const versionOptions = (allDatasheets as any[]).map((ds: any) => ({
      value: ds.id,
      label: `v${ds.version}${ds.id === (datasheet?.id) ? ' (latest)' : ''}`,
    }));

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
        {lockedProcId && selectedProc && (
          <Alert
            type="warning"
            showIcon
            icon={<LockOutlined />}
            style={{ marginBottom: 16 }}
            message={
              <Space size={8} wrap>
                <Text strong>Locked Procedure:</Text>
                <Tag color="geekblue">{selectedProc.discipline}</Tag>
                <Tag color="blue">{selectedProc.subDiscipline}</Tag>
                <Tag color="cyan">{selectedProc.label}</Tag>
                {lockedUnit && <Tag color="purple">Unit: {lockedUnit}</Tag>}
                {selectedProc.ranges && selectedProc.ranges.length > 1 && (
                  <Tag color="green">Range: {selectedProc.ranges[lockedRangeIdx]?.parameter ?? selectedProc.ranges[0]?.parameter}</Tag>
                )}
                {selectedProc.nablReference && <Tag>{selectedProc.nablReference}</Tag>}
              </Space>
            }
          />
        )}
        <Row gutter={16} style={{ marginBottom: 16 }} align="middle">
          <Col>
            <Text strong>{displayedDatasheet.templateName}</Text>
            <Text type="secondary" style={{ marginLeft: 8 }}>v{displayedDatasheet.version}</Text>
          </Col>
          {hasMultiple && (
            <Col>
              <Select
                size="small"
                style={{ width: 130, marginLeft: 8 }}
                value={viewDsId ?? datasheet?.id}
                onChange={(v: string) => setViewDsId(v === datasheet?.id ? null : v)}
                options={versionOptions}
              />
            </Col>
          )}
          <Col>
            <Space size={4} style={{ marginLeft: 8 }}>
              <Tag icon={<ThunderboltOutlined />} color="blue">{displayedDatasheet.environmental?.temperature ?? '—'} °C</Tag>
              <Tag color="cyan">{displayedDatasheet.environmental?.humidity ?? '—'} %RH</Tag>
              <Tag color="purple">{displayedDatasheet.environmental?.pressure ?? '—'} kPa</Tag>
            </Space>
          </Col>
        </Row>
        <Table
          columns={obsColumns}
          dataSource={displayedDatasheet.observations}
          rowKey="id"
          size="small"
          pagination={false}
          style={{ marginBottom: 16 }}
        />
        <Space wrap>
          <Button
            type="primary"
            icon={<CalculatorOutlined />}
            loading={computeMut.isPending}
            onClick={() => computeMut.mutate()}
            disabled={!!viewDsId && viewDsId !== datasheet?.id}
          >
            Calculate Results
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            onClick={() => openDatasheetReport(displayedDatasheet.id)}
          >
            Print Datasheet Report
          </Button>
        </Space>
        <Alert
          type="info"
          message="Datasheet saved. Click Calculate to compute results, then proceed to the Uncertainty tab."
          showIcon
          style={{ marginTop: 16 }}
        />
      </div>
    );
  }

  const isProcedureLocked = !!lockedProcId;

  const groupedOptions = Object.entries(groupedProcedures()).map(([discipline, subs]) => ({
    label: discipline,
    options: Object.entries(subs as any).flatMap(([sub, procs]: [string, any]) =>
      (procs as Procedure[]).map((p) => ({
        value: p.id,
        label: `${sub} › ${p.label} (${p.unit})`,
      }))
    ),
  }));

  // Live result: mean, error, pass/fail
  const liveResult = (row: Row) => {
    const nums = row.readings.map(Number).filter((n) => !Number.isNaN(n) && n !== 0);
    const std = Number(row.standardValue);
    if (!nums.length || Number.isNaN(std) || row.standardValue === '') return null;
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    const error = mean - std;
    let pass: 'pass' | 'fail' | null = null;
    if (nc && effectiveMpe?.value != null) {
      const absErr = Math.abs(error);
      const limit = effectiveMpe.isPercent ? (effectiveMpe.value / 100) * Math.abs(std) : effectiveMpe.value;
      pass = absErr <= limit ? 'pass' : 'fail';
    }
    return { mean: mean.toFixed(4), error: error.toFixed(4), count: nums.length, pass };
  };

  // Environmental deviation check vs NABL 129 lab conditions
  const envAlerts: string[] = [];
  const temp = Number(env.temperature);
  const hum = Number(env.humidity);
  if (!Number.isNaN(temp) && (temp < 21 || temp > 25)) envAlerts.push(`Temperature ${temp}°C is outside NABL 129 limit (23±2°C)`);
  if (!Number.isNaN(hum) && (hum < 35 || hum > 65)) envAlerts.push(`Humidity ${hum}%RH is outside NABL 129 limit (50±15%RH)`);

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
    ...Array.from({ length: nread }).map((_, j) => ({
      title: `R${j + 1}`, key: `r${j}`, width: 80,
      render: (_: any, _row: any, i: number) => (
        <Input
          size="small"
          value={rows[i].readings[j] ?? ''}
          onChange={(e) => setReading(i, j, e.target.value)}
          style={rows[i].readings[j] ? { background: '#f0f9ff' } : {}}
        />
      ),
    })),
    {
      title: 'Mean', key: 'mean_preview', width: 90,
      render: (_: any, _row: any, i: number) => {
        const r = liveResult(rows[i]);
        return r ? <Tag color="blue">{r.mean}</Tag> : <Tag>—</Tag>;
      },
    },
    {
      title: 'Error / Pass-Fail', key: 'error_preview', width: 140,
      render: (_: any, _row: any, i: number) => {
        const r = liveResult(rows[i]);
        if (!r) return <Tag>—</Tag>;
        const filled = rows[i].readings.filter((x) => x !== '').length;
        return (
          <Space direction="vertical" size={2}>
            <Space size={4}>
              {r.pass === 'pass' && <Tag color="green">✓ PASS</Tag>}
              {r.pass === 'fail' && <Tag color="red">✗ FAIL</Tag>}
              {!r.pass && <Tag color={Number(r.error) === 0 ? 'green' : Math.abs(Number(r.error)) < 0.01 ? 'orange' : 'red'}>{r.error}</Tag>}
              {r.pass && <Tag>{r.error}</Tag>}
            </Space>
            <span style={{ fontSize: 10, color: '#888' }}>{filled}/{nread} readings</span>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      {isProcedureLocked && (
        <Alert
          type="warning"
          showIcon
          icon={<LockOutlined />}
          style={{ marginBottom: 16 }}
          message="Calibration procedure locked"
          description="The instrument procedure, parameter/range, and unit were fixed at job creation and cannot be changed."
        />
      )}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col flex="400px">
          <Form.Item
            label={
              <Space size={4}>
                Instrument Procedure
                {isProcedureLocked && <Tag icon={<LockOutlined />} color="orange">Locked</Tag>}
              </Space>
            }
            style={{ marginBottom: 0 }}
          >
            <Select
              placeholder="Select discipline / instrument..."
              value={procId || undefined}
              onChange={isProcedureLocked ? undefined : (id: string) => applyProcedure(id)}
              disabled={isProcedureLocked}
              options={groupedOptions}
              showSearch
              filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        {selectedProc?.ranges && selectedProc.ranges.length > 1 && (
          <Col flex="240px">
            <Form.Item
              label={
                <Space size={4}>
                  Parameter / Range
                  {isProcedureLocked && <Tag icon={<LockOutlined />} color="orange">Locked</Tag>}
                </Space>
              }
              style={{ marginBottom: 0 }}
            >
              <Select
                value={rangeIdx}
                onChange={isProcedureLocked ? undefined : applyRange}
                disabled={isProcedureLocked}
                style={{ width: '100%' }}
                options={selectedProc.ranges.map((r, i) => ({
                  value: i,
                  label: `${r.parameter}${r.rangeText ? ` (${r.rangeText})` : ` (${r.unit})`}`,
                }))}
              />
            </Form.Item>
          </Col>
        )}
        <Col flex="160px">
          <Form.Item
            label={
              <Space size={4}>
                Unit of Measurement
                {isProcedureLocked && <Tag icon={<LockOutlined />} color="orange">Locked</Tag>}
              </Space>
            }
            style={{ marginBottom: 0 }}
          >
            <Input
              value={unit}
              onChange={(e) => !isProcedureLocked && setUnit(e.target.value)}
              readOnly={isProcedureLocked}
              placeholder="mm, bar, °C..."
              style={isProcedureLocked ? { background: '#fafafa', cursor: 'not-allowed' } : {}}
            />
          </Form.Item>
        </Col>
      </Row>

      {selectedProc && (selectedProc.procedureText || selectedProc.nablReference) && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={
            <Space size={8} wrap>
              <Text strong>Calibration Procedure</Text>
              {selectedProc.nablReference && <Tag color="blue">{selectedProc.nablReference}</Tag>}
              {selectedProc.referenceStandard && <Tag color="geekblue">Std: {selectedProc.referenceStandard}</Tag>}
              {selectedProc.units && selectedProc.units.length > 1 && (
                <Tag color="cyan">Units: {selectedProc.units.join(', ')}</Tag>
              )}
            </Space>
          }
          description={selectedProc.procedureText}
        />
      )}

      <Card
        size="small"
        title="Environmental Conditions"
        style={{ marginBottom: envAlerts.length ? 8 : 20, borderRadius: 8 }}
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
                  status={
                    (key === 'temperature' && !Number.isNaN(Number(env.temperature)) && (Number(env.temperature) < 21 || Number(env.temperature) > 25)) ? 'error' :
                    (key === 'humidity' && !Number.isNaN(Number(env.humidity)) && (Number(env.humidity) < 35 || Number(env.humidity) > 65)) ? 'error' : ''
                  }
                />
              </Form.Item>
            </Col>
          ))}
        </Row>
      </Card>

      {envAlerts.length > 0 && (
        <Alert
          type="error"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 20 }}
          message="Environmental Condition Deviation — NABL 129"
          description={
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {envAlerts.map((msg, i) => <li key={i}>{msg}</li>)}
            </ul>
          }
        />
      )}

      {nc?.accuracyClasses && nc.accuracyClasses.length > 0 && (
        <Card size="small" style={{ marginBottom: 16, background: '#fffbe6', borderColor: '#ffe58f' }}>
          <Row align="middle" gutter={16}>
            <Col>
              <Text strong>NABL 129 Accuracy Class:</Text>
            </Col>
            <Col>
              <Select
                style={{ width: 200 }}
                placeholder="Select accuracy class"
                value={selectedAccClass ?? undefined}
                allowClear
                onChange={(v) => setSelectedAccClass(v ?? null)}
                options={nc.accuracyClasses.map((c) => ({ value: c.class, label: `${c.class} (MPE: ${c.mpe})` }))}
              />
            </Col>
            {selectedAccClass && (
              <Col>
                <Tag color="orange">MPE: {nc.accuracyClasses.find((c) => c.class === selectedAccClass)?.mpe}</Tag>
              </Col>
            )}
          </Row>
        </Card>
      )}

      {nc && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message={
            <Space size={8} wrap>
              <Text strong>NABL 129 — {nc.nablChapter}</Text>
              <Tag color="purple">Min Readings: {nc.minReadings}</Tag>
              <Tag color="orange">MPE: {selectedAccClass && nc.accuracyClasses ? (nc.accuracyClasses.find((c) => c.class === selectedAccClass)?.mpe ?? nc.mpe) : nc.mpe}</Tag>
              <Tag color="cyan">Cal. Interval: {nc.calibrationIntervalMonths}M</Tag>
            </Space>
          }
        />
      )}

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
        <Button icon={<PlusOutlined />} onClick={() => setRows([...rows, emptyRow(unit, nread)])}>
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

  const autoMut = useMutation({
    mutationFn: () => autoUncertainty(datasheet.id),
    onSuccess: (res: any) => { setResult(res.result); setContributors([]); onChanged(); },
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
          icon={<ThunderboltOutlined />}
          loading={autoMut.isPending}
          onClick={() => autoMut.mutate()}
          title="Automatically builds uncertainty budget from reference standard certificates and instrument resolution"
        >
          Auto-Calculate from Reference Standards
        </Button>
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

function CalibrationHistoryTab({ job }: any) {
  const instrumentId = job?.instrument?.id;
  const instrumentName = job?.instrument?.name ?? 'this instrument';

  const { data: allJobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => getJobs(),
  });

  const history = useMemo(() => {
    return (allJobs as any[])
      .filter((j: any) => j.instrument?.id === instrumentId && j.id !== job.id)
      .sort((a: any, b: any) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
  }, [allJobs, instrumentId, job.id]);

  if (isLoading) return <Spin />;
  if (!history.length) {
    return (
      <Alert
        type="info"
        showIcon
        icon={<HistoryOutlined />}
        message={`No previous calibration records found for ${instrumentName}`}
      />
    );
  }

  const columns = [
    { title: 'Job No.', dataIndex: 'jobNumber', key: 'j', render: (v: string) => <Text strong>{v}</Text> },
    { title: 'Received', dataIndex: 'receivedAt', key: 'r', render: (v: string) => new Date(v).toLocaleDateString('en-IN') },
    { title: 'Status', dataIndex: 'status', key: 's', render: (s: string) => <Tag>{s?.replace(/_/g, ' ')}</Tag> },
    {
      title: 'Certificate',
      key: 'cert',
      render: (_: any, r: any) => r.certificate?.certificateNumber
        ? <Tag color="green">{r.certificate.certificateNumber}</Tag>
        : <Tag color="default">—</Tag>,
    },
    {
      title: 'Engineer',
      key: 'eng',
      render: (_: any, r: any) => r.engineer?.name ?? '—',
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        icon={<HistoryOutlined />}
        message={`Found ${history.length} previous calibration(s) for ${instrumentName}`}
      />
      <Table
        rowKey="id"
        dataSource={history}
        columns={columns}
        size="small"
        pagination={{ pageSize: 10 }}
      />
    </Space>
  );
}

function RemarksTab({ job, onChanged }: any) {
  const [text, setText] = useState('');
  const [remarks, setRemarks] = useState<{ ts: string; note: string }[]>(() => {
    try { return JSON.parse(job?.remarks || '[]'); } catch { return job?.remarks ? [{ ts: new Date().toISOString(), note: job.remarks }] : []; }
  });
  const qc = useQueryClient();

  const saveMut = useMutation({
    mutationFn: async (note: string) => {
      const updated = [...remarks, { ts: new Date().toISOString(), note }];
      const { api } = await import('../api');
      await api.patch(`/jobs/${job.id}`, { remarks: JSON.stringify(updated) });
      return updated;
    },
    onSuccess: (updated) => {
      setRemarks(updated);
      setText('');
      qc.invalidateQueries({ queryKey: ['job-detail', job.id] });
      onChanged?.();
    },
  });

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text type="secondary">Deviation notes, calibration remarks, and observations for this job.</Text>
      {remarks.length > 0 ? (
        <Timeline
          items={remarks.map((r) => ({
            color: 'blue',
            children: (
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>{new Date(r.ts).toLocaleString('en-IN')}</Text>
                <div>{r.note}</div>
              </div>
            ),
          }))}
        />
      ) : (
        <Alert type="info" message="No remarks recorded yet." showIcon />
      )}
      <Row gutter={8}>
        <Col flex="auto">
          <Input.TextArea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a remark, deviation note, or observation..."
          />
        </Col>
      </Row>
      <Button
        type="primary"
        icon={<SaveOutlined />}
        disabled={!text.trim()}
        loading={saveMut.isPending}
        onClick={() => saveMut.mutate(text.trim())}
      >
        Add Remark
      </Button>
    </Space>
  );
}

function CertificateTab({ job, onChanged }: any) {
  const cert = job.certificate;
  const [finalLockEmail, setFinalLockEmail] = useState<string | null>(null);
  const genMut = useMutation({ mutationFn: () => generateCertificate({ jobId: job.id, type: 'NABL' }), onSuccess: onChanged });
  const signMut = useMutation({
    mutationFn: (stage: string) => signCertificate(cert.id, stage),
    onSuccess: (_data, stage) => {
      if (stage === 'FINAL_LOCK' && job.customer?.email) {
        setFinalLockEmail(job.customer.email);
      }
      onChanged();
    },
  });

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

      {finalLockEmail && (
        <Alert
          type="success"
          message={`Certificate finalised and emailed to ${finalLockEmail}`}
          showIcon
          closable
          onClose={() => setFinalLockEmail(null)}
          style={{ marginTop: 12 }}
        />
      )}
    </div>
  );
}

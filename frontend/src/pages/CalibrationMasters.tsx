import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert, Button, Card, Col, DatePicker, Form, Input, InputNumber, message, Modal, Popconfirm,
  Row, Space, Switch, Table, Tabs, Tag, Typography,
} from 'antd';
import {
  ApartmentOutlined, DeleteOutlined, EditOutlined, ExportOutlined, PlusOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getCmcScopes, createCmcScope, updateCmcScope, deleteCmcScope,
  getMpeRules, createMpeRule, updateMpeRule, deleteMpeRule, lookupMpe,
  getFormulas, createFormula, deleteFormula, evaluateFormula, convertUnit,
} from '../api';
import { exportToCsv } from '../utils/export';

const { Title, Text } = Typography;

// ─────────────────────────── CMC / Scope tab ────────────────────────────────

function CmcScopeTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();

  const { data: rows = [], isLoading } = useQuery({ queryKey: ['cmc-scopes'], queryFn: getCmcScopes });

  const saveMut = useMutation({
    mutationFn: (vals: any) => {
      const payload = { ...vals, effectiveDate: vals.effectiveDate ? vals.effectiveDate.toISOString() : undefined };
      return editing ? updateCmcScope(editing.id, payload) : createCmcScope(payload);
    },
    onSuccess: () => {
      message.success(editing ? 'CMC scope updated' : 'CMC scope added');
      setOpen(false); setEditing(null); form.resetFields();
      qc.invalidateQueries({ queryKey: ['cmc-scopes'] });
    },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Save failed'),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => deleteCmcScope(id),
    onSuccess: () => { message.success('Removed'); qc.invalidateQueries({ queryKey: ['cmc-scopes'] }); },
  });

  const openEdit = (row: any) => {
    setEditing(row);
    form.setFieldsValue({ ...row, effectiveDate: row.effectiveDate ? dayjs(row.effectiveDate) : null });
    setOpen(true);
  };
  const openNew = () => { setEditing(null); form.resetFields(); setOpen(true); };

  const columns = [
    { title: 'Discipline', dataIndex: 'discipline', key: 'discipline', render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: 'Parameter', dataIndex: 'parameter', key: 'parameter' },
    {
      title: 'Range', key: 'range',
      render: (_: any, r: any) => r.rangeText || (r.rangeMin != null || r.rangeMax != null ? `${r.rangeMin ?? '−∞'} … ${r.rangeMax ?? '∞'} ${r.unit ?? ''}` : '—'),
    },
    { title: 'Best CMC', dataIndex: 'cmc', key: 'cmc', render: (v: string) => v ? <Tag color="geekblue" style={{ fontFamily: 'monospace' }}>{v}</Tag> : '—' },
    { title: 'Method', dataIndex: 'method', key: 'method', render: (v: string) => v || '—' },
    { title: 'Scope', dataIndex: 'scope', key: 'scope', render: (v: string) => v || '—' },
    { title: 'Rev', dataIndex: 'revision', key: 'revision', render: (v: string) => v || '—' },
    { title: 'Effective', dataIndex: 'effectiveDate', key: 'effectiveDate', render: (v: string) => v ? dayjs(v).format('DD MMM YYYY') : '—' },
    {
      title: 'Actions', key: 'actions', width: 110,
      render: (_: any, r: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm title="Remove this scope entry?" onConfirm={() => delMut.mutate(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <Text type="secondary">NABL scope &amp; best CMC per discipline / parameter / range — fetched automatically during calibration.</Text>
        <Space>
          <Button icon={<ExportOutlined />} onClick={() => exportToCsv('cmc-scope.csv', rows as any[], [
            { key: 'discipline', label: 'Discipline' }, { key: 'parameter', label: 'Parameter' },
            { key: 'rangeText', label: 'Range' }, { key: 'cmc', label: 'Best CMC' },
            { key: 'method', label: 'Method' }, { key: 'scope', label: 'Scope' }, { key: 'revision', label: 'Revision' },
          ])}>Export CSV</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openNew}>Add CMC / Scope</Button>
        </Space>
      </div>
      <Table rowKey="id" size="small" loading={isLoading} dataSource={rows as any[]} columns={columns} pagination={{ pageSize: 10 }} />

      <Modal
        title={editing ? 'Edit CMC / Scope' : 'Add CMC / Scope'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saveMut.isPending}
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={(v) => saveMut.mutate(v)}>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="discipline" label="Discipline" rules={[{ required: true }]}><Input placeholder="e.g. Mechanical" /></Form.Item></Col>
            <Col span={12}><Form.Item name="parameter" label="Parameter" rules={[{ required: true }]}><Input placeholder="e.g. Length / Dimension" /></Form.Item></Col>
            <Col span={8}><Form.Item name="rangeMin" label="Range Min"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="rangeMax" label="Range Max"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="unit" label="Unit"><Input placeholder="mm" /></Form.Item></Col>
            <Col span={12}><Form.Item name="rangeText" label="Range (display text)"><Input placeholder="0 to 25 mm" /></Form.Item></Col>
            <Col span={12}><Form.Item name="cmc" label="Best CMC (as printed)"><Input placeholder="±(0.5 + 0.3L) µm" /></Form.Item></Col>
            <Col span={8}><Form.Item name="cmcValue" label="CMC (numeric)"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="method" label="Method"><Input placeholder="e.g. IS 2921" /></Form.Item></Col>
            <Col span={8}><Form.Item name="revision" label="Revision"><Input placeholder="00" /></Form.Item></Col>
            <Col span={12}><Form.Item name="scope" label="Scope reference"><Input placeholder="NABL scope doc no." /></Form.Item></Col>
            <Col span={12}><Form.Item name="effectiveDate" label="Effective Date"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
}

// ─────────────────────────────── MPE tab ────────────────────────────────────

function MpeTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();

  const { data: rows = [], isLoading } = useQuery({ queryKey: ['mpe-rules'], queryFn: getMpeRules });

  const saveMut = useMutation({
    mutationFn: (vals: any) => (editing ? updateMpeRule(editing.id, vals) : createMpeRule(vals)),
    onSuccess: () => {
      message.success(editing ? 'MPE rule updated' : 'MPE rule added');
      setOpen(false); setEditing(null); form.resetFields();
      qc.invalidateQueries({ queryKey: ['mpe-rules'] });
    },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Save failed'),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => deleteMpeRule(id),
    onSuccess: () => { message.success('Removed'); qc.invalidateQueries({ queryKey: ['mpe-rules'] }); },
  });

  const openEdit = (row: any) => { setEditing(row); form.setFieldsValue(row); setOpen(true); };
  const openNew = () => { setEditing(null); form.resetFields(); form.setFieldsValue({ mpeIsPercent: false }); setOpen(true); };

  // Auto-fetch tester
  const [test, setTest] = useState<{ discipline: string; parameter: string; value?: number; accuracyClass?: string }>({ discipline: '', parameter: '' });
  const [testResult, setTestResult] = useState<any>(null);
  const testMut = useMutation({
    mutationFn: () => lookupMpe(test),
    onSuccess: (r) => setTestResult(r ?? { none: true }),
    onError: () => setTestResult({ none: true }),
  });

  const columns = [
    { title: 'Discipline', dataIndex: 'discipline', key: 'discipline', render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: 'Parameter', dataIndex: 'parameter', key: 'parameter' },
    { title: 'Accuracy Class', dataIndex: 'accuracyClass', key: 'accuracyClass', render: (v: string) => v || '—' },
    { title: 'Standard', dataIndex: 'standard', key: 'standard', render: (v: string) => v || '—' },
    {
      title: 'Range', key: 'range',
      render: (_: any, r: any) => (r.rangeMin != null || r.rangeMax != null ? `${r.rangeMin ?? '−∞'} … ${r.rangeMax ?? '∞'} ${r.unit ?? ''}` : '—'),
    },
    {
      title: 'MPE', key: 'mpe',
      render: (_: any, r: any) => <Tag color="orange" style={{ fontFamily: 'monospace' }}>{r.mpeIsPercent ? `${r.mpeValue}%` : `${r.mpeValue} ${r.unit ?? ''}`}</Tag>,
    },
    {
      title: 'Actions', key: 'actions', width: 110,
      render: (_: any, r: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm title="Remove this MPE rule?" onConfirm={() => delMut.mutate(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <Text type="secondary">Maximum-permissible-error rules — auto-loaded by discipline / parameter / range during calibration.</Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={openNew}>Add MPE Rule</Button>
      </div>

      <Card size="small" style={{ marginBottom: 12, background: '#fafcff' }}>
        <Space wrap align="end">
          <ThunderboltOutlined style={{ color: '#1677ff', fontSize: 18 }} />
          <Text strong>Auto-fetch tester:</Text>
          <Input placeholder="Discipline" style={{ width: 130 }} value={test.discipline} onChange={(e) => setTest({ ...test, discipline: e.target.value })} />
          <Input placeholder="Parameter" style={{ width: 130 }} value={test.parameter} onChange={(e) => setTest({ ...test, parameter: e.target.value })} />
          <InputNumber placeholder="Value" style={{ width: 100 }} value={test.value} onChange={(v) => setTest({ ...test, value: v ?? undefined })} />
          <Input placeholder="Accuracy class" style={{ width: 120 }} value={test.accuracyClass} onChange={(e) => setTest({ ...test, accuracyClass: e.target.value || undefined })} />
          <Button onClick={() => testMut.mutate()} loading={testMut.isPending} disabled={!test.discipline || !test.parameter}>Resolve MPE</Button>
          {testResult && (testResult.none
            ? <Tag color="red">No matching rule</Tag>
            : <Tag color="green" style={{ fontFamily: 'monospace' }}>MPE ≈ ±{Number(testResult.mpeAbsolute).toPrecision(4)} {testResult.unit ?? ''}{testResult.mpeIsPercent ? ` (${testResult.mpeValue}%)` : ''}</Tag>)}
        </Space>
      </Card>

      <Table rowKey="id" size="small" loading={isLoading} dataSource={rows as any[]} columns={columns} pagination={{ pageSize: 10 }} />

      <Modal
        title={editing ? 'Edit MPE Rule' : 'Add MPE Rule'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saveMut.isPending}
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={(v) => saveMut.mutate(v)}>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="discipline" label="Discipline" rules={[{ required: true }]}><Input placeholder="e.g. Electro-Technical" /></Form.Item></Col>
            <Col span={12}><Form.Item name="parameter" label="Parameter" rules={[{ required: true }]}><Input placeholder="e.g. DC Voltage" /></Form.Item></Col>
            <Col span={8}><Form.Item name="instrumentType" label="Instrument Type"><Input placeholder="optional" /></Form.Item></Col>
            <Col span={8}><Form.Item name="accuracyClass" label="Accuracy Class"><Input placeholder="e.g. Class 1" /></Form.Item></Col>
            <Col span={8}><Form.Item name="standard" label="Reference Standard"><Input placeholder="optional" /></Form.Item></Col>
            <Col span={8}><Form.Item name="rangeMin" label="Range Min"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="rangeMax" label="Range Max"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="unit" label="Unit"><Input placeholder="V" /></Form.Item></Col>
            <Col span={8}><Form.Item name="mpeValue" label="MPE Value" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="mpeIsPercent" label="MPE is % of value" valuePropName="checked"><Switch /></Form.Item></Col>
            <Col span={8}><Form.Item name="resolution" label="Resolution"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
}

export default function CalibrationMasters() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <Space><ApartmentOutlined style={{ color: '#1677ff' }} />Calibration Masters</Space>
        </Title>
        <Text type="secondary">CMC / NABL scope and MPE rules used for automatic CMC fetch and Pass/Fail evaluation.</Text>
      </div>
      <Alert
        type="info" showIcon style={{ marginBottom: 16, borderRadius: 8 }}
        message="Configuration-driven masters"
        description="These tables drive automatic CMC fetch (Module 4.3/4.4) and automatic MPE selection (Module 4.2). Entries are scoped to your lab and soft-deleted to preserve history."
      />
      <Card style={{ borderRadius: 12 }}>
        <Tabs
          items={[
            { key: 'cmc', label: 'CMC / NABL Scope', children: <CmcScopeTab /> },
            { key: 'mpe', label: 'MPE Rules', children: <MpeTab /> },
            { key: 'formulas', label: 'Formulas & Units', children: <FormulasTab /> },
          ]}
        />
      </Card>
    </div>
  );
}

// ── Module 13: Reusable formulas + unit conversion ──────────────────────────
function FormulasTab() {
  const qc = useQueryClient();
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [testVars, setTestVars] = useState('');
  const [testExpr, setTestExpr] = useState('');
  const [testResult, setTestResult] = useState<string>('');
  const [conv, setConv] = useState<{ value?: number; from: string; to: string; result?: number }>({ from: 'mm', to: 'inch' });

  const { data: formulas = [], isLoading } = useQuery({ queryKey: ['formulas'], queryFn: getFormulas });

  const saveMut = useMutation({
    mutationFn: (v: any) => createFormula({
      ...v,
      variables: (v.variables ? String(v.variables).split(',').map((s: string) => s.trim()).filter(Boolean) : []),
      constants: v.constants ? JSON.parse(v.constants) : undefined,
    }),
    onSuccess: () => { message.success('Formula saved'); setOpen(false); form.resetFields(); qc.invalidateQueries({ queryKey: ['formulas'] }); },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Save failed (check expression / constants JSON)'),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => deleteFormula(id),
    onSuccess: () => { message.success('Removed'); qc.invalidateQueries({ queryKey: ['formulas'] }); },
  });

  const runTest = async () => {
    try {
      const variables = testVars ? JSON.parse(testVars) : {};
      const r = await evaluateFormula({ expression: testExpr, variables });
      setTestResult(String(r.result));
    } catch (e: any) {
      setTestResult(e?.response?.data?.message ?? 'Error');
    }
  };

  const runConvert = async () => {
    if (conv.value == null) return;
    try {
      const r = await convertUnit({ value: conv.value, from: conv.from, to: conv.to });
      setConv((c) => ({ ...c, result: r.result }));
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? 'Conversion failed');
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (v: string) => <Text strong>{v}</Text> },
    { title: 'Expression', dataIndex: 'expression', key: 'expression', render: (v: string) => <Tag style={{ fontFamily: 'monospace' }}>{v}</Tag> },
    { title: 'Variables', dataIndex: 'variables', key: 'variables', render: (v: string[]) => (v ?? []).join(', ') || '—' },
    { title: 'Unit', dataIndex: 'unit', key: 'unit', render: (v: string) => v || '—' },
    {
      title: '', key: 'actions', width: 60,
      render: (_: any, r: any) => (
        <Popconfirm title="Remove this formula?" onConfirm={() => delMut.mutate(r.id)}>
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <Row gutter={16}>
        <Col xs={24} md={14}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text type="secondary">Reusable formulas (functions: SQRT, ABS, ROUND, IF, AVERAGE, SUM, MAX, MIN, LOG, SIN, COS, TAN).</Text>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setOpen(true); }}>Add Formula</Button>
          </div>
          <Table rowKey="id" size="small" loading={isLoading} dataSource={formulas as any[]} columns={columns} pagination={{ pageSize: 8 }} />
        </Col>
        <Col xs={24} md={10}>
          <Card size="small" title="Formula Tester" style={{ marginBottom: 16 }}>
            <Input placeholder="Expression e.g. ROUND((a+b)/2 - std, 3)" value={testExpr} onChange={(e) => setTestExpr(e.target.value)} style={{ marginBottom: 8 }} />
            <Input placeholder='Variables JSON e.g. {"a":10.1,"b":10.3,"std":10}' value={testVars} onChange={(e) => setTestVars(e.target.value)} style={{ marginBottom: 8 }} />
            <Space>
              <Button onClick={runTest} icon={<ThunderboltOutlined />}>Evaluate</Button>
              {testResult !== '' && <Tag color="green" style={{ fontFamily: 'monospace' }}>= {testResult}</Tag>}
            </Space>
          </Card>
          <Card size="small" title="Unit Converter">
            <Space wrap>
              <InputNumber placeholder="Value" value={conv.value} onChange={(v) => setConv((c) => ({ ...c, value: v ?? undefined }))} />
              <Input placeholder="from (mm)" style={{ width: 90 }} value={conv.from} onChange={(e) => setConv((c) => ({ ...c, from: e.target.value }))} />
              <Input placeholder="to (inch)" style={{ width: 90 }} value={conv.to} onChange={(e) => setConv((c) => ({ ...c, to: e.target.value }))} />
              <Button onClick={runConvert}>Convert</Button>
              {conv.result != null && <Tag color="blue" style={{ fontFamily: 'monospace' }}>= {Number(conv.result).toPrecision(6)}</Tag>}
            </Space>
            <div style={{ marginTop: 8 }}><Text type="secondary" style={{ fontSize: 11 }}>Supports length, mass, pressure, time and temperature (C/F/K).</Text></div>
          </Card>
        </Col>
      </Row>

      <Modal title="Add Formula" open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} confirmLoading={saveMut.isPending}>
        <Form form={form} layout="vertical" onFinish={(v) => saveMut.mutate(v)}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input placeholder="e.g. Mean Correction" /></Form.Item>
          <Form.Item name="expression" label="Expression" rules={[{ required: true }]}><Input placeholder="ROUND(AVERAGE(r1,r2,r3) - std, 3)" /></Form.Item>
          <Form.Item name="variables" label="Variables (comma-separated)"><Input placeholder="r1, r2, r3, std" /></Form.Item>
          <Form.Item name="constants" label="Constants (JSON, optional)"><Input placeholder='{"k": 2}' /></Form.Item>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="unit" label="Unit"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="description" label="Description"><Input /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
}

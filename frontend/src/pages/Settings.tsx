import { useState, useRef } from 'react';
import {
  Card, Col, Row, Typography, Space, Tag, Button, Divider, Alert, Spin, message,
  Form, Input, Upload, Tabs, Select, Table, Popconfirm,
} from 'antd';
import {
  SettingOutlined, CheckCircleFilled, SafetyCertificateOutlined,
  FileTextOutlined, CompressOutlined, ApartmentOutlined, UserOutlined,
  DatabaseOutlined, UploadOutlined, PlusOutlined, DeleteOutlined, SaveOutlined,
  BankOutlined, CalculatorOutlined, ExportOutlined, DownloadOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLabSettings, updateLabSettings, loadSampleData, getUser, getLab, updateLabDetails, downloadBackup,
  getJobs, getCustomers, getInstruments, getEngineers, getEnvironmental,
  getInvoices, getQuotations, getPurchaseOrders, getDeliveryChallans, getLeads, getCrmActivities,
} from '../api';
import { exportToCsv } from '../utils/export';

const { Title, Text, Paragraph } = Typography;

const TEMPLATES = [
  {
    id: 'nabl', name: 'NABL Accredited',
    description: 'Full NABL format with accreditation number, ULR, and complete traceability chain.',
    badge: 'NABL', badgeColor: '#1677ff',
    icon: <SafetyCertificateOutlined style={{ fontSize: 28, color: '#1677ff' }} />, borderColor: '#1677ff',
  },
  {
    id: 'iso17025', name: 'ISO/IEC 17025 Formal',
    description: 'Formal ISO report with uncertainty budget prominently displayed.',
    badge: 'ISO', badgeColor: '#13c2c2',
    icon: <FileTextOutlined style={{ fontSize: 28, color: '#13c2c2' }} />, borderColor: '#13c2c2',
  },
  {
    id: 'compact', name: 'Compact Single-Page',
    description: 'Condensed one-page format for simple instruments.',
    badge: 'Compact', badgeColor: '#52c41a',
    icon: <CompressOutlined style={{ fontSize: 28, color: '#52c41a' }} />, borderColor: '#52c41a',
  },
  {
    id: 'traceability', name: 'Detailed Traceability',
    description: 'Extended format with full reference standard chain and uncertainty breakdown.',
    badge: 'Detailed', badgeColor: '#722ed1',
    icon: <ApartmentOutlined style={{ fontSize: 28, color: '#722ed1' }} />, borderColor: '#722ed1',
  },
  {
    id: 'customer-branded', name: 'Customer-Branded',
    description: 'Simplified format with customer logo space and minimal lab branding.',
    badge: 'Custom', badgeColor: '#fa8c16',
    icon: <UserOutlined style={{ fontSize: 28, color: '#fa8c16' }} />, borderColor: '#fa8c16',
  },
];

const DISTRIBUTION_OPTIONS = [
  { value: 'normal', label: 'Normal (÷2)' },
  { value: 'rectangular', label: 'Rectangular (÷√3)' },
  { value: 'triangular', label: 'Triangular (÷√6)' },
  { value: 'u-shaped', label: 'U-shaped (÷√2)' },
];

const DEFAULT_UNCERTAINTY_TYPES = [
  { key: 'uA', name: 'Type A (Statistical)', distribution: 'normal', formula: 'σ/√n', description: 'Computed from repeated readings' },
  { key: 'uRef', name: 'Reference Standard', distribution: 'normal', formula: 'U/k', description: 'From reference certificate' },
  { key: 'uRes', name: 'Resolution', distribution: 'rectangular', formula: 'LC/(2√3)', description: 'Instrument least count / 2√3' },
  { key: 'uCal', name: 'Calibration Uncertainty', distribution: 'normal', formula: 'U/2', description: 'From calibration certificate at k=2' },
  { key: 'uRepeat', name: 'Repeatability', distribution: 'rectangular', formula: 'Range/2√3', description: 'From repeatability study' },
];

// ── Lab Details Section ─────────────────────────────────────────────────────

function LabDetailsSection() {
  const user = getUser();
  const labId = user?.labId ?? '';
  const qc = useQueryClient();
  const [form] = Form.useForm();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: lab, isLoading } = useQuery({
    queryKey: ['lab', labId],
    queryFn: () => getLab(labId),
    enabled: !!labId,
    onSuccess: (d: any) => {
      form.setFieldsValue({
        name: d.name, accreditationNumber: d.accreditationNumber, address: d.address,
        contactEmail: d.contactEmail, phone: d.phone, website: d.website,
        city: d.city, state: d.state, pinCode: d.pinCode,
        gstin: d.gstin, pan: d.pan,
        bankName: d.bankName, bankAccountNumber: d.bankAccountNumber,
        bankIfsc: d.bankIfsc, bankBranch: d.bankBranch,
      });
      if (d.logoUrl) setLogoPreview(d.logoUrl);
    },
  } as any);

  useQuery({
    queryKey: ['lab-settings', labId],
    queryFn: () => getLabSettings(labId),
    enabled: !!labId,
    onSuccess: (d: any) => {
      form.setFieldsValue({
        signatoryName: d.signatoryName ?? '',
        signatoryDesignation: d.signatoryDesignation ?? '',
      });
    },
  } as any);

  const saveMut = useMutation({
    mutationFn: async (vals: any) => {
      const { signatoryName, signatoryDesignation, ...labVals } = vals;
      await Promise.all([
        updateLabDetails(labId, { ...labVals, logoUrl: logoPreview }),
        updateLabSettings(labId, { signatoryName, signatoryDesignation }),
      ]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lab', labId] });
      qc.invalidateQueries({ queryKey: ['lab-settings', labId] });
      message.success('Lab details saved');
    },
    onError: () => message.error('Failed to save lab details'),
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) { message.error('Logo must be under 500 KB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  if (isLoading) return <Spin />;

  return (
    <Form form={form} layout="vertical" onFinish={(vals) => saveMut.mutate(vals)}>
      <Row gutter={24}>
        <Col xs={24} md={6} style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 160, height: 160, border: '2px dashed #d9d9d9', borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px', overflow: 'hidden', background: '#fafafa', cursor: 'pointer',
            }}
            onClick={() => fileRef.current?.click()}
          >
            {logoPreview
              ? <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              : <Space direction="vertical" size={4} style={{ color: '#999' }}>
                  <UploadOutlined style={{ fontSize: 32 }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>Click to upload logo</Text>
                </Space>
            }
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
          {logoPreview && (
            <Button size="small" danger onClick={() => { setLogoPreview(null); }}>Remove Logo</Button>
          )}
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 11 }}>PNG/JPG, max 500 KB</Text>
          </div>
        </Col>
        <Col xs={24} md={18}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="name" label="Lab / Company Name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Precision Calibration Lab" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="accreditationNumber" label="Accreditation No.">
                <Input placeholder="e.g. CC-1234" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contactEmail" label="Contact Email">
                <Input placeholder="lab@example.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Phone">
                <Input placeholder="+91 99999 00000" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="address" label="Address">
                <Input.TextArea rows={2} placeholder="Street address" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="city" label="City">
                <Input placeholder="Mumbai" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="state" label="State">
                <Input placeholder="Maharashtra" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="pinCode" label="PIN Code">
                <Input placeholder="400001" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="website" label="Website">
                <Input placeholder="https://example.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="gstin" label="GSTIN">
                <Input placeholder="22AAAAA0000A1Z5" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="pan" label="PAN">
                <Input placeholder="AAAAA0000A" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Divider orientation="left" style={{ fontSize: 12, color: '#888', margin: '4px 0 12px' }}>
                Bank Details (for invoices & quotations)
              </Divider>
            </Col>
            <Col span={12}>
              <Form.Item name="bankName" label="Bank Name">
                <Input placeholder="e.g. HDFC Bank" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="bankBranch" label="Branch">
                <Input placeholder="e.g. Andheri West" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="bankAccountNumber" label="Account Number">
                <Input placeholder="Account number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="bankIfsc" label="IFSC Code">
                <Input placeholder="e.g. HDFC0001234" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Divider orientation="left" style={{ fontSize: 12, color: '#888', margin: '4px 0 12px' }}>
                Certificate Signature Block
              </Divider>
            </Col>
            <Col span={12}>
              <Form.Item name="signatoryName" label="Authorized Signatory Name" help="Appears on all certificates">
                <Input placeholder="e.g. Dr. A. Kumar" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="signatoryDesignation" label="Signatory Designation">
                <Input placeholder="e.g. Technical Manager" />
              </Form.Item>
            </Col>
          </Row>
        </Col>
      </Row>
      <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saveMut.isPending}>
        Save Lab Details
      </Button>
    </Form>
  );
}

// ── Uncertainty Types Section ───────────────────────────────────────────────

function UncertaintyTypesSection() {
  const user = getUser();
  const labId = user?.labId ?? '';
  const qc = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['lab-settings', labId],
    queryFn: () => getLabSettings(labId),
    enabled: !!labId,
  });

  const storedTypes: any[] = (settings as any)?.uncertaintyTypes ?? DEFAULT_UNCERTAINTY_TYPES;
  const [types, setTypes] = useState<any[]>(storedTypes);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editForm] = Form.useForm();

  const saveMut = useMutation({
    mutationFn: (updated: any[]) => updateLabSettings(labId, { uncertaintyTypes: updated }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lab-settings', labId] });
      message.success('Uncertainty types saved');
    },
  });

  const addRow = () => {
    const newType = { key: `u_${Date.now()}`, name: '', distribution: 'normal', formula: '', description: '' };
    const updated = [...types, newType];
    setTypes(updated);
    setEditIdx(updated.length - 1);
    editForm.setFieldsValue(newType);
  };

  const saveRow = () => {
    editForm.validateFields().then((vals) => {
      const updated = types.map((t, i) => i === editIdx ? { ...t, ...vals } : t);
      setTypes(updated);
      setEditIdx(null);
      saveMut.mutate(updated);
    });
  };

  const deleteRow = (idx: number) => {
    const updated = types.filter((_, i) => i !== idx);
    setTypes(updated);
    saveMut.mutate(updated);
  };

  const cols = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (v: string) => <Text strong>{v}</Text> },
    { title: 'Formula', dataIndex: 'formula', key: 'formula', render: (v: string) => <Tag color="blue">{v || '—'}</Tag> },
    {
      title: 'Distribution', dataIndex: 'distribution', key: 'dist',
      render: (v: string) => <Tag color="purple">{DISTRIBUTION_OPTIONS.find(d => d.value === v)?.label ?? v}</Tag>,
    },
    { title: 'Description', dataIndex: 'description', key: 'desc', render: (v: string) => <Text type="secondary">{v}</Text> },
    {
      title: '', key: 'actions', width: 80,
      render: (_: any, __: any, idx: number) => (
        <Space>
          <Button size="small" onClick={() => { setEditIdx(idx); editForm.setFieldsValue(types[idx]); }}>Edit</Button>
          <Popconfirm title="Delete this type?" onConfirm={() => deleteRow(idx)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Paragraph type="secondary" style={{ marginBottom: 16 }}>
        Define the uncertainty source types available during calibration. These appear as contributor options
        in the Uncertainty tab. Each type has a distribution (for divisor calculation) and an optional formula hint.
      </Paragraph>
      <Table columns={cols} dataSource={types} rowKey="key" size="small" pagination={false} style={{ marginBottom: 16 }} />
      <Space>
        <Button icon={<PlusOutlined />} onClick={addRow}>Add Type</Button>
        <Button type="primary" icon={<SaveOutlined />} loading={saveMut.isPending} onClick={() => saveMut.mutate(types)}>
          Save All
        </Button>
        <Button onClick={() => { setTypes(DEFAULT_UNCERTAINTY_TYPES); saveMut.mutate(DEFAULT_UNCERTAINTY_TYPES); }}>
          Reset to Defaults
        </Button>
      </Space>

      {editIdx !== null && (
        <Card size="small" style={{ marginTop: 20, borderRadius: 10, background: '#f6f8ff' }}
          title={<Text strong>Edit Uncertainty Type</Text>}
          extra={<Space><Button type="primary" size="small" onClick={saveRow}>Save</Button><Button size="small" onClick={() => setEditIdx(null)}>Cancel</Button></Space>}
        >
          <Form form={editForm} layout="vertical">
            <Row gutter={16}>
              <Col span={12}><Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="formula" label="Formula (hint)"><Input placeholder="e.g. U/k" /></Form.Item></Col>
              <Col span={12}>
                <Form.Item name="distribution" label="Distribution" rules={[{ required: true }]}>
                  <Select options={DISTRIBUTION_OPTIONS} />
                </Form.Item>
              </Col>
              <Col span={12}><Form.Item name="description" label="Description"><Input /></Form.Item></Col>
            </Row>
          </Form>
        </Card>
      )}
    </div>
  );
}

// ── Main Settings Page ──────────────────────────────────────────────────────

function DataExportSection() {
  const [period, setPeriod] = useState<0 | 1 | 2>(1);
  const cutoff = () => period === 0 ? 0 : Date.now() - period * 365 * 24 * 60 * 60 * 1000;
  const filter = (items: any[]) =>
    period === 0 ? items : items.filter((i) => i.createdAt && new Date(i.createdAt).getTime() >= cutoff());

  const { data: jobs = [] } = useQuery({ queryKey: ['jobs'], queryFn: () => getJobs() });
  const { data: customers = [] } = useQuery({ queryKey: ['customers', ''], queryFn: () => getCustomers() });
  const { data: instruments = [] } = useQuery({ queryKey: ['instruments'], queryFn: () => getInstruments() });
  const { data: engineers = [] } = useQuery({ queryKey: ['engineers'], queryFn: getEngineers });
  const { data: environmental = [] } = useQuery({ queryKey: ['environmental'], queryFn: getEnvironmental });
  const { data: invoices = [] } = useQuery({ queryKey: ['invoices'], queryFn: () => getInvoices() });
  const { data: quotations = [] } = useQuery({ queryKey: ['quotations'], queryFn: () => getQuotations() });
  const { data: purchaseOrders = [] } = useQuery({ queryKey: ['purchaseOrders'], queryFn: () => getPurchaseOrders() });
  const { data: challans = [] } = useQuery({ queryKey: ['deliveryChallans'], queryFn: () => getDeliveryChallans() });
  const { data: leads = [] } = useQuery({ queryKey: ['leads'], queryFn: () => getLeads() });
  const { data: activities = [] } = useQuery({ queryKey: ['crm-activities'], queryFn: () => getCrmActivities() });

  const modules = [
    {
      group: 'Calibration',
      items: [
        {
          label: 'Jobs', filename: 'jobs', data: () => filter(jobs as any[]),
          cols: [
            { key: 'jobNumber', label: 'Job No' }, { key: 'customer.name', label: 'Customer' },
            { key: 'instrument.name', label: 'Instrument' }, { key: 'status', label: 'Status' },
            { key: 'certificateType', label: 'Cert Type' }, { key: 'createdAt', label: 'Created At' },
          ],
        },
        {
          label: 'Certificates', filename: 'certificates', data: () => filter(jobs as any[]).filter((j: any) => j.certificate),
          cols: [
            { key: 'jobNumber', label: 'Job No' }, { key: 'certificate.certificateNumber', label: 'Cert Number' },
            { key: 'customer.name', label: 'Customer' }, { key: 'instrument.name', label: 'Instrument' },
            { key: 'certificate.type', label: 'Type' }, { key: 'certificate.isLocked', label: 'Finalised' },
          ],
        },
        {
          label: 'Instruments', filename: 'instruments', data: () => filter(instruments as any[]),
          cols: [
            { key: 'serialNumber', label: 'Serial No' }, { key: 'name', label: 'Name' },
            { key: 'make', label: 'Make' }, { key: 'model', label: 'Model' },
            { key: 'customer.name', label: 'Customer' }, { key: 'nextCalibrationDue', label: 'Next Cal Due' },
          ],
        },
        {
          label: 'Environmental Records', filename: 'environmental', data: () => filter(environmental as any[]),
          cols: [
            { key: 'temperature', label: 'Temperature (°C)' }, { key: 'humidity', label: 'Humidity (%RH)' },
            { key: 'pressure', label: 'Pressure (kPa)' }, { key: 'recordedAt', label: 'Recorded At' },
            { key: 'notes', label: 'Notes' },
          ],
        },
        {
          label: 'Engineers', filename: 'engineers', data: () => engineers as any[],
          cols: [
            { key: 'employeeCode', label: 'Employee Code' }, { key: 'user.fullName', label: 'Name' },
            { key: 'user.email', label: 'Email' }, { key: 'skills', label: 'Skills' },
          ],
        },
      ],
    },
    {
      group: 'CRM & Sales',
      items: [
        {
          label: 'Customers', filename: 'customers', data: () => filter(customers as any[]),
          cols: [
            { key: 'code', label: 'Code' }, { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' },
            { key: 'address', label: 'Address' }, { key: 'customerStatus', label: 'Status' },
          ],
        },
        {
          label: 'Quotations', filename: 'quotations', data: () => filter(quotations as any[]),
          cols: [
            { key: 'quoteNumber', label: 'Quote No' }, { key: 'customer.name', label: 'Customer' },
            { key: 'subject', label: 'Subject' }, { key: 'totalAmount', label: 'Total (₹)' },
            { key: 'status', label: 'Status' }, { key: 'createdAt', label: 'Created At' },
          ],
        },
        {
          label: 'Invoices', filename: 'invoices', data: () => filter(invoices as any[]),
          cols: [
            { key: 'invoiceNumber', label: 'Invoice No' }, { key: 'customer.name', label: 'Customer' },
            { key: 'totalAmount', label: 'Total (₹)' }, { key: 'paidAmount', label: 'Paid (₹)' },
            { key: 'status', label: 'Status' }, { key: 'createdAt', label: 'Created At' },
          ],
        },
        {
          label: 'Purchase Orders', filename: 'purchase-orders', data: () => filter(purchaseOrders as any[]),
          cols: [
            { key: 'poNumber', label: 'PO No' }, { key: 'supplier.name', label: 'Supplier' },
            { key: 'totalAmount', label: 'Total (₹)' }, { key: 'status', label: 'Status' },
            { key: 'createdAt', label: 'Created At' },
          ],
        },
        {
          label: 'Delivery Challans', filename: 'delivery-challans', data: () => filter(challans as any[]),
          cols: [
            { key: 'challanNumber', label: 'Challan No' }, { key: 'customer.name', label: 'Customer' },
            { key: 'challanType', label: 'Type' }, { key: 'status', label: 'Status' },
            { key: 'vehicleNumber', label: 'Vehicle' }, { key: 'createdAt', label: 'Created At' },
          ],
        },
        {
          label: 'Leads / Pipeline', filename: 'leads', data: () => filter(leads as any[]),
          cols: [
            { key: 'title', label: 'Title' }, { key: 'companyName', label: 'Company' },
            { key: 'contactName', label: 'Contact' }, { key: 'stage', label: 'Stage' },
            { key: 'value', label: 'Value (₹)' }, { key: 'source', label: 'Source' },
            { key: 'createdAt', label: 'Created At' },
          ],
        },
        {
          label: 'CRM Activities', filename: 'crm-activities', data: () => filter(activities as any[]),
          cols: [
            { key: 'type', label: 'Type' }, { key: 'title', label: 'Title' },
            { key: 'customer.name', label: 'Customer' }, { key: 'lead.title', label: 'Lead' },
            { key: 'isDone', label: 'Done' }, { key: 'dueDate', label: 'Due Date' },
            { key: 'createdBy', label: 'Created By' },
          ],
        },
      ],
    },
  ];

  const doExport = (filename: string, data: any[], cols: { key: string; label: string }[]) => {
    exportToCsv(`${filename}-${period === 0 ? 'all' : period + 'yr'}.csv`, data, cols);
  };

  const exportAll = () => {
    const getVal = (row: any, key: string) =>
      key.split('.').reduce((o: any, k: string) => o?.[k], row) ?? '';
    const makeSection = (title: string, rows: any[], cols: { key: string; label: string }[]) => {
      const header = cols.map(c => c.label).join(',');
      const lines = rows.map(row =>
        cols.map(c => `"${String(getVal(row, c.key)).replace(/"/g, '""')}"`).join(',')
      );
      return [`=== ${title} ===`, header, ...lines, ''].join('\n');
    };
    const csv = modules.flatMap(g => g.items.map(m => makeSection(m.label, m.data(), m.cols))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `full-export-${period === 0 ? 'all' : period + 'yr'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <Space>
          <Select
            value={period}
            onChange={(v) => setPeriod(v)}
            style={{ width: 160 }}
            options={[
              { value: 0, label: 'All Time' },
              { value: 1, label: 'Last 1 Year' },
              { value: 2, label: 'Last 2 Years' },
            ]}
          />
        </Space>
        <Button type="primary" icon={<DownloadOutlined />} onClick={exportAll}>
          Export All Modules
        </Button>
      </div>

      {modules.map((group) => (
        <div key={group.group}>
          <Divider orientation="left" style={{ fontWeight: 600, color: '#1677ff' }}>{group.group}</Divider>
          <Row gutter={[12, 12]}>
            {group.items.map((m) => {
              const count = m.data().length;
              return (
                <Col xs={24} sm={12} md={8} key={m.filename}>
                  <Card
                    size="small"
                    style={{ borderRadius: 10, border: '1px solid #e8e8e8' }}
                    styles={{ body: { padding: '14px 16px' } }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{m.label}</div>
                        <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>{count} records</div>
                      </div>
                      <Button
                        icon={<ExportOutlined />}
                        size="small"
                        onClick={() => doExport(m.filename, m.data(), m.cols)}
                        disabled={count === 0}
                      >
                        CSV
                      </Button>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>
      ))}
    </Space>
  );
}

export default function Settings() {
  const user = getUser();
  const labId = user?.labId ?? '';
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['lab-settings', labId],
    queryFn: () => getLabSettings(labId),
    enabled: !!labId,
  });

  const selectedTemplate: string = (settings as any)?.certTemplate ?? 'nabl';

  const templateMut = useMutation({
    mutationFn: (templateId: string) => updateLabSettings(labId, { certTemplate: templateId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lab-settings', labId] }); message.success('Template saved'); },
  });

  const [seedLoading, setSeedLoading] = useState(false);
  const [seedResult, setSeedResult] = useState<{ type: 'success' | 'info'; msg: string } | null>(null);

  const handleLoadSampleData = async () => {
    setSeedLoading(true); setSeedResult(null);
    try {
      const res: any = await loadSampleData();
      if (res?.message?.includes('already')) {
        setSeedResult({ type: 'info', msg: res.message });
      } else {
        const counts = res?.counts ? Object.entries(res.counts).map(([k, v]) => `${v} ${k}`).join(', ') : '';
        setSeedResult({ type: 'success', msg: `${res?.message ?? 'Done'}${counts ? `: ${counts}` : ''}` });
        qc.invalidateQueries();
      }
    } catch (e: any) {
      setSeedResult({ type: 'info', msg: e?.response?.data?.message ?? 'Error loading sample data' });
    } finally { setSeedLoading(false); }
  };

  const tabItems = [
    {
      key: 'lab',
      label: <Space><BankOutlined />Lab / Company Details</Space>,
      children: <LabDetailsSection />,
    },
    {
      key: 'uncertainty',
      label: <Space><CalculatorOutlined />Uncertainty Types</Space>,
      children: <UncertaintyTypesSection />,
    },
    {
      key: 'templates',
      label: <Space><FileTextOutlined />Certificate Templates</Space>,
      children: isLoading ? <Spin /> : (
        <Row gutter={[16, 16]}>
          {TEMPLATES.map((t) => {
            const isSelected = selectedTemplate === t.id;
            return (
              <Col xs={24} sm={12} md={8} key={t.id}>
                <Card
                  hoverable
                  onClick={() => templateMut.mutate(t.id)}
                  style={{
                    borderRadius: 14,
                    border: `2px solid ${isSelected ? t.borderColor : '#f0f0f0'}`,
                    cursor: 'pointer', transition: 'all 0.2s',
                    background: isSelected ? t.borderColor + '08' : '#fff',
                    boxShadow: isSelected ? `0 4px 16px ${t.borderColor}30` : '0 2px 8px rgba(0,0,0,0.04)',
                    position: 'relative',
                  }}
                  styles={{ body: { padding: '20px 16px' } }}
                >
                  {isSelected && <CheckCircleFilled style={{ position: 'absolute', top: 12, right: 12, color: t.borderColor, fontSize: 20 }} />}
                  <Space direction="vertical" size={10} style={{ width: '100%' }}>
                    <div>{t.icon}</div>
                    <div>
                      <Text strong style={{ fontSize: 14 }}>{t.name}</Text>
                      <div style={{ marginTop: 4 }}>
                        <Tag style={{ background: t.badgeColor + '15', color: t.badgeColor, border: `1px solid ${t.badgeColor}40`, borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{t.badge}</Tag>
                      </div>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.5 }}>{t.description}</Text>
                    {isSelected && <Tag icon={<CheckCircleFilled />} color="success" style={{ marginTop: 4, borderRadius: 8, fontWeight: 600 }}>Selected</Tag>}
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>
      ),
    },
    {
      key: 'seed',
      label: <Space><DatabaseOutlined />Sample Data</Space>,
      children: (
        <div>
          <Paragraph type="secondary" style={{ marginBottom: 16 }}>
            Load realistic sample data to explore the system — customers, instruments, jobs, certificates, documents, and more.
            This is a one-time operation; running it again will do nothing if data already exists.
          </Paragraph>
          {seedResult && (
            <Alert type={seedResult.type} message={seedResult.msg} style={{ marginBottom: 16, borderRadius: 10 }}
              showIcon closable onClose={() => setSeedResult(null)} />
          )}
          <Button type="primary" icon={<DatabaseOutlined />} loading={seedLoading} onClick={handleLoadSampleData}
            style={{ borderRadius: 10, height: 42, fontWeight: 600 }}>
            Load Sample Data
          </Button>
        </div>
      ),
    },
    {
      key: 'dataexport',
      label: <Space><ExportOutlined />Data Export</Space>,
      children: <DataExportSection />,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <Space><SettingOutlined style={{ color: '#1677ff' }} />Lab Settings</Space>
        </Title>
        <Text type="secondary">Configure lab details, certificate templates, and calibration preferences</Text>
      </div>
      <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <Tabs items={tabItems} size="large" />
      </Card>

      <Card
        title={<Space><DatabaseOutlined />Data Backup</Space>}
        style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginTop: 20 }}
      >
        <Space direction="vertical">
          <Text type="secondary">
            Download a JSON snapshot of this lab's data (customers, instruments, standards, jobs,
            certificates, invoices, complaints &amp; feedback). Admin only.
          </Text>
          <Button
            type="primary"
            icon={<DatabaseOutlined />}
            onClick={async () => {
              try { await downloadBackup(); message.success('Backup downloaded'); }
              catch (e: any) { message.error(e?.response?.data?.message ?? 'Backup failed (admin only)'); }
            }}
          >
            Download Backup
          </Button>
        </Space>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert, Card, Table, Tag, Button, Space, Typography, Modal, Form, Input, DatePicker, message, Popconfirm, Statistic, Row, Col,
  Drawer, Descriptions, Tabs, Timeline, Upload, Empty, Select,
} from 'antd';
import {
  ExperimentOutlined, PlusOutlined, WarningOutlined, CheckCircleOutlined, DeleteOutlined, EditOutlined, ImportOutlined, BellOutlined,
  ProfileOutlined, UploadOutlined, FileTextOutlined, ToolOutlined, EyeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getMasters, createMaster, updateMaster, deleteMaster, importMasters,
  getMasterUtilization, getMasterCertificates, uploadMasterCertificate, openMasterCertificateFile,
  getMasterMaintenance, addMasterMaintenance,
} from '../api';
import ImportModal from '../components/ImportModal';

const { Title, Text } = Typography;

export default function ReferenceStandards() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();

  const { data: masters = [], isLoading } = useQuery({ queryKey: ['masters'], queryFn: getMasters });

  const saveMut = useMutation({
    mutationFn: (vals: any) => {
      const payload = {
        ...vals,
        calibratedDate: vals.calibratedDate ? vals.calibratedDate.toISOString() : undefined,
        calibrationDue: vals.calibrationDue ? vals.calibrationDue.toISOString() : undefined,
      };
      return editing ? updateMaster(editing.id, payload) : createMaster(payload);
    },
    onSuccess: () => {
      message.success(editing ? 'Reference standard updated' : 'Reference standard added');
      setOpen(false); setEditing(null); form.resetFields();
      qc.invalidateQueries({ queryKey: ['masters'] });
    },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Save failed'),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteMaster(id),
    onSuccess: () => { message.success('Deleted'); qc.invalidateQueries({ queryKey: ['masters'] }); },
  });

  const openEdit = (row: any) => {
    setEditing(row);
    form.setFieldsValue({
      ...row,
      calibratedDate: row.calibratedDate ? dayjs(row.calibratedDate) : null,
      calibrationDue: row.calibrationDue ? dayjs(row.calibrationDue) : null,
    });
    setOpen(true);
  };

  const [importOpen, setImportOpen] = useState(false);
  const [detailMaster, setDetailMaster] = useState<any>(null);
  const openNew = () => { setEditing(null); form.resetFields(); setOpen(true); };

  const now = dayjs();
  const dueStatus = (due?: string) => {
    if (!due) return { label: 'No due date', color: 'default' };
    const d = dayjs(due);
    if (d.isBefore(now)) return { label: 'OVERDUE', color: 'red' };
    if (d.isBefore(now.add(30, 'day'))) return { label: 'Due Soon', color: 'orange' };
    return { label: 'Valid', color: 'green' };
  };

  const overdue = (masters as any[]).filter((m) => m.calibrationDue && dayjs(m.calibrationDue).isBefore(now)).length;
  const dueSoon = (masters as any[]).filter((m) => m.calibrationDue && dayjs(m.calibrationDue).isAfter(now) && dayjs(m.calibrationDue).isBefore(now.add(30, 'day'))).length;

  const columns = [
    {
      title: 'Standard', dataIndex: 'name', key: 'name',
      render: (n: string, row: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{n}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>ID: {row.idNumber}{row.serialNumber ? ` · SN: ${row.serialNumber}` : ''}</Text>
        </Space>
      ),
    },
    { title: 'Make / Model', key: 'mm', render: (_: any, r: any) => [r.make, r.model].filter(Boolean).join(' / ') || '—' },
    { title: 'Traceability', dataIndex: 'traceability', key: 'trace', render: (v: string) => v || '—' },
    { title: 'Cert. No.', dataIndex: 'certificateNumber', key: 'cert', render: (v: string) => v || '—' },
    { title: 'Uncertainty', dataIndex: 'uncertainty', key: 'unc', render: (v: string) => v || '—' },
    {
      title: 'Calibration Due', dataIndex: 'calibrationDue', key: 'due',
      render: (v: string) => {
        const s = dueStatus(v);
        return (
          <Space direction="vertical" size={0}>
            <Text>{v ? dayjs(v).format('DD MMM YYYY') : '—'}</Text>
            <Tag color={s.color}>{s.label}</Tag>
          </Space>
        );
      },
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: any, row: any) => (
        <Space>
          <Button size="small" icon={<ProfileOutlined />} onClick={() => setDetailMaster(row)}>Details</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
          <Popconfirm title="Delete this reference standard?" onConfirm={() => delMut.mutate(row.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}><ExperimentOutlined /> Reference Standards</Title>
          <Text type="secondary">Master instruments with traceability and calibration validity (NABL)</Text>
        </div>
        <Space>
          <Button icon={<ImportOutlined />} onClick={() => setImportOpen(true)}>Import CSV</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openNew}>Add Standard</Button>
        </Space>
      </div>

      <Row gutter={16}>
        <Col span={8}><Card><Statistic title="Total Standards" value={(masters as any[]).length} prefix={<ExperimentOutlined />} /></Card></Col>
        <Col span={8}><Card><Statistic title="Due Soon (30d)" value={dueSoon} prefix={<WarningOutlined />} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col span={8}><Card><Statistic title="Overdue" value={overdue} prefix={<WarningOutlined />} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
      </Row>

      {overdue > 0 && (
        <Alert
          type="error"
          showIcon
          icon={<BellOutlined />}
          message={`${overdue} reference standard(s) are OVERDUE for calibration`}
          description="Overdue reference standards must not be used for calibration. Schedule immediate recalibration to maintain NABL accreditation."
        />
      )}
      {!overdue && dueSoon > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<BellOutlined />}
          message={`${dueSoon} reference standard(s) are due for calibration within 30 days`}
          description="Schedule calibration soon to avoid expiry and maintain traceability chain."
        />
      )}

      <Card>
        <Table rowKey="id" loading={isLoading} dataSource={masters as any[]} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title={editing ? 'Edit Reference Standard' : 'Add Reference Standard'}
        open={open}
        onCancel={() => { setOpen(false); setEditing(null); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={saveMut.isPending}
        okText={editing ? 'Update' : 'Add'}
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={(v) => saveMut.mutate(v)}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="name" label="Standard Name" rules={[{ required: true }]}><Input placeholder="e.g. Gauge Block Set" /></Form.Item></Col>
            <Col span={12}><Form.Item name="idNumber" label="ID Number" rules={[{ required: true }]}><Input placeholder="STD-001" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="make" label="Make"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="model" label="Model"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="serialNumber" label="Serial No."><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="traceability" label="Traceability (e.g. NPL / NABL Lab)"><Input placeholder="Traceable to NPL India" /></Form.Item></Col>
            <Col span={12}><Form.Item name="certificateNumber" label="Calibration Cert. No."><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="uncertainty" label="Uncertainty"><Input placeholder="±0.002 mm" /></Form.Item></Col>
            <Col span={8}><Form.Item name="calibratedDate" label="Calibrated On"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="calibrationDue" label="Calibration Due"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Form.Item name="location" label="Location"><Input placeholder="Lab room / cabinet" /></Form.Item>
        </Form>
      </Modal>

      <ImportModal
        open={importOpen}
        onClose={() => { setImportOpen(false); qc.invalidateQueries({ queryKey: ['masters'] }); }}
        title="Reference Standards"
        columns={[
          { key: 'name', label: 'Standard Name', required: true },
          { key: 'idNumber', label: 'ID Number', required: true },
          { key: 'make', label: 'Make' },
          { key: 'model', label: 'Model' },
          { key: 'serialNumber', label: 'Serial No.' },
          { key: 'traceability', label: 'Traceability' },
          { key: 'certificateNumber', label: 'Calibration Cert No.' },
          { key: 'uncertainty', label: 'Uncertainty' },
          { key: 'calibratedDate', label: 'Calibrated On (YYYY-MM-DD)' },
          { key: 'calibrationDue', label: 'Calibration Due (YYYY-MM-DD)' },
          { key: 'location', label: 'Location' },
        ]}
        onImport={(records) => importMasters(records)}
        templateFilename="reference-standards-import-template.csv"
      />

      <StandardDetailDrawer master={detailMaster} onClose={() => setDetailMaster(null)} />
    </Space>
  );
}

// ── Reference standard details: utilization, certificate versions, maintenance ──
function StandardDetailDrawer({ master, onClose }: { master: any; onClose: () => void }) {
  const qc = useQueryClient();
  const id = master?.id;
  const [uploadForm] = Form.useForm();
  const [maintForm] = Form.useForm();
  const [pendingFile, setPendingFile] = useState<{ name: string; type: string; base64: string } | null>(null);

  const { data: util } = useQuery({ queryKey: ['master-util', id], queryFn: () => getMasterUtilization(id), enabled: !!id });
  const { data: certs = [] } = useQuery({ queryKey: ['master-certs', id], queryFn: () => getMasterCertificates(id), enabled: !!id });
  const { data: maint = [] } = useQuery({ queryKey: ['master-maint', id], queryFn: () => getMasterMaintenance(id), enabled: !!id });

  const uploadMut = useMutation({
    mutationFn: (vals: any) => uploadMasterCertificate(id, {
      fileName: pendingFile!.name,
      fileType: pendingFile!.type,
      fileBase64: pendingFile!.base64,
      certificateNumber: vals.certificateNumber,
      calibratedDate: vals.calibratedDate ? vals.calibratedDate.toISOString() : undefined,
      calibrationDue: vals.calibrationDue ? vals.calibrationDue.toISOString() : undefined,
      traceability: vals.traceability,
      uncertainty: vals.uncertainty,
      remarks: vals.remarks,
    }),
    onSuccess: () => {
      message.success('Certificate version uploaded');
      setPendingFile(null); uploadForm.resetFields();
      qc.invalidateQueries({ queryKey: ['master-certs', id] });
      qc.invalidateQueries({ queryKey: ['master-util', id] });
      qc.invalidateQueries({ queryKey: ['masters'] });
    },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Upload failed'),
  });

  const maintMut = useMutation({
    mutationFn: (vals: any) => addMasterMaintenance(id, {
      date: vals.date ? vals.date.toISOString() : new Date().toISOString(),
      type: vals.type, description: vals.description, performedBy: vals.performedBy,
    }),
    onSuccess: () => {
      message.success('Maintenance recorded');
      maintForm.resetFields();
      qc.invalidateQueries({ queryKey: ['master-maint', id] });
      qc.invalidateQueries({ queryKey: ['master-util', id] });
    },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Failed to record'),
  });

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      const base64 = result.slice(result.indexOf(',') + 1);
      setPendingFile({ name: file.name, type: file.type || 'application/octet-stream', base64 });
    };
    reader.readAsDataURL(file);
    return false; // prevent antd auto-upload
  };

  const dueColor = (s?: string) => s === 'OVERDUE' ? 'red' : s === 'DUE_SOON' ? 'orange' : s === 'VALID' ? 'green' : 'default';

  return (
    <Drawer
      title={master ? <Space><ProfileOutlined />{master.name} <Text type="secondary">({master.idNumber})</Text></Space> : ''}
      open={!!master}
      onClose={onClose}
      width={680}
    >
      {master && (
        <Tabs
          items={[
            {
              key: 'util', label: <span><EyeOutlined /> Utilization</span>,
              children: (
                <>
                  <Row gutter={12} style={{ marginBottom: 16 }}>
                    <Col span={8}><Card size="small"><Statistic title="Usage Count" value={util?.usageCount ?? 0} /></Card></Col>
                    <Col span={8}><Card size="small"><Statistic title="Cert. Versions" value={util?.certificateVersions ?? 0} /></Card></Col>
                    <Col span={8}><Card size="small"><Statistic title="Maintenance" value={util?.maintenanceRecords ?? 0} /></Card></Col>
                  </Row>
                  <Descriptions column={1} bordered size="small">
                    <Descriptions.Item label="Last Used">
                      {util?.lastUsed ? `${dayjs(util.lastUsed).format('DD MMM YYYY')} · ${util.lastUsedJob ?? ''}` : 'Never used'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Next Due">
                      <Space>
                        {util?.nextDue ? dayjs(util.nextDue).format('DD MMM YYYY') : '—'}
                        {util?.dueStatus && util.dueStatus !== 'NONE' && <Tag color={dueColor(util.dueStatus)}>{util.dueStatus.replace('_', ' ')}</Tag>}
                      </Space>
                    </Descriptions.Item>
                  </Descriptions>
                  <Title level={5} style={{ marginTop: 16 }}>Recent Calibration Jobs Using This Standard</Title>
                  {(util?.recentJobs?.length ?? 0) === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No usage yet" /> : (
                    <Table
                      size="small" rowKey="id" pagination={false}
                      dataSource={util.recentJobs}
                      columns={[
                        { title: 'Job No', dataIndex: 'jobNumber', key: 'jobNumber' },
                        { title: 'Date', dataIndex: 'receivedAt', key: 'receivedAt', render: (v: string) => dayjs(v).format('DD MMM YYYY') },
                        { title: 'Status', dataIndex: 'status', key: 'status', render: (v: string) => <Tag>{v?.replace(/_/g, ' ')}</Tag> },
                      ]}
                    />
                  )}
                </>
              ),
            },
            {
              key: 'certs', label: <span><FileTextOutlined /> Certificates</span>,
              children: (
                <>
                  <Card size="small" title="Upload New Certificate Version" style={{ marginBottom: 16 }}>
                    <Form form={uploadForm} layout="vertical" onFinish={(v) => uploadMut.mutate(v)}>
                      <Upload beforeUpload={readFile} maxCount={1} accept=".pdf,image/*" fileList={pendingFile ? [{ uid: '1', name: pendingFile.name } as any] : []} onRemove={() => setPendingFile(null)}>
                        <Button icon={<UploadOutlined />}>Select PDF / Image</Button>
                      </Upload>
                      <Row gutter={12} style={{ marginTop: 12 }}>
                        <Col span={12}><Form.Item name="certificateNumber" label="Certificate No."><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="uncertainty" label="Uncertainty"><Input placeholder="±0.002 mm" /></Form.Item></Col>
                        <Col span={12}><Form.Item name="calibratedDate" label="Calibrated On"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="calibrationDue" label="Calibration Due"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={24}><Form.Item name="traceability" label="Traceability"><Input /></Form.Item></Col>
                      </Row>
                      <Button type="primary" htmlType="submit" loading={uploadMut.isPending} disabled={!pendingFile}>Upload Version</Button>
                    </Form>
                  </Card>
                  {(certs as any[]).length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No certificates uploaded" /> : (
                    <Table
                      size="small" rowKey="id" pagination={false}
                      dataSource={certs as any[]}
                      columns={[
                        { title: 'Ver', dataIndex: 'version', key: 'version', width: 60, render: (v: number, r: any, i: number) => <Tag color={i === 0 ? 'green' : 'default'}>v{v}{i === 0 ? ' (latest)' : ''}</Tag> },
                        { title: 'File', dataIndex: 'fileName', key: 'fileName' },
                        { title: 'Cert No', dataIndex: 'certificateNumber', key: 'certificateNumber', render: (v: string) => v || '—' },
                        { title: 'Due', dataIndex: 'calibrationDue', key: 'calibrationDue', render: (v: string) => v ? dayjs(v).format('DD MMM YYYY') : '—' },
                        { title: '', key: 'open', render: (_: any, r: any) => <Button size="small" icon={<EyeOutlined />} onClick={() => openMasterCertificateFile(id, r.id)}>Open</Button> },
                      ]}
                    />
                  )}
                </>
              ),
            },
            {
              key: 'maint', label: <span><ToolOutlined /> Maintenance</span>,
              children: (
                <>
                  <Card size="small" title="Record Maintenance" style={{ marginBottom: 16 }}>
                    <Form form={maintForm} layout="vertical" onFinish={(v) => maintMut.mutate(v)}>
                      <Row gutter={12}>
                        <Col span={12}><Form.Item name="date" label="Date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={12}>
                          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                            <Select options={['Service', 'Repair', 'Verification', 'Cleaning', 'Adjustment', 'Other'].map((t) => ({ value: t, label: t }))} placeholder="Select type" />
                          </Form.Item>
                        </Col>
                        <Col span={12}><Form.Item name="performedBy" label="Performed By"><Input /></Form.Item></Col>
                        <Col span={24}><Form.Item name="description" label="Description"><Input.TextArea rows={2} /></Form.Item></Col>
                      </Row>
                      <Button type="primary" htmlType="submit" loading={maintMut.isPending}>Add Record</Button>
                    </Form>
                  </Card>
                  {(maint as any[]).length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No maintenance records" /> : (
                    <Timeline
                      items={(maint as any[]).map((m: any) => ({
                        color: 'blue',
                        children: (
                          <div>
                            <Space><Text strong>{m.type}</Text><Tag>{dayjs(m.date).format('DD MMM YYYY')}</Tag>{m.performedBy && <Text type="secondary">by {m.performedBy}</Text>}</Space>
                            {m.description && <div><Text style={{ fontSize: 13 }}>{m.description}</Text></div>}
                          </div>
                        ),
                      }))}
                    />
                  )}
                </>
              ),
            },
          ]}
        />
      )}
    </Drawer>
  );
}

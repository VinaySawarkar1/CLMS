import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge, Button, Card, Col, DatePicker, Form, Input, Modal, Row, Select,
  Space, Table, Tabs, Tag, Typography, Upload, message,
} from 'antd';
import {
  PlusOutlined, EditOutlined, StopOutlined, EyeOutlined, DownloadOutlined,
  PaperClipOutlined, FilePdfOutlined, FileWordOutlined, FileExcelOutlined,
  FileOutlined, ExportOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getDocuments, createDocument, updateDocument, deleteDocument, api,
} from '../api';
import { exportToCsv } from '../utils/export';

const { Title, Text } = Typography;

const CATEGORIES = ['SOP', 'WI', 'Form', 'Policy', 'NABL', 'Calibration', 'External'];
const CAT_COLORS: Record<string, string> = {
  SOP: 'blue', WI: 'green', Form: 'orange', Policy: 'purple',
  NABL: 'cyan', Calibration: 'geekblue', External: 'default',
};

function fileIcon(mime: string) {
  if (mime?.includes('pdf')) return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
  if (mime?.includes('word') || mime?.includes('doc')) return <FileWordOutlined style={{ color: '#1677ff' }} />;
  if (mime?.includes('excel') || mime?.includes('sheet') || mime?.includes('xls')) return <FileExcelOutlined style={{ color: '#52c41a' }} />;
  return <FileOutlined />;
}

function parseMime(content: string): string {
  return content?.match(/data:([^;]+)/)?.[1] ?? '';
}

function parseFileName(content: string): string {
  return content?.match(/filename=([^;,]+)/)?.[1] ?? 'document';
}

async function openDocFile(id: string, download = false) {
  try {
    const res = await api.get(`/documents/${id}/file`, { responseType: 'arraybuffer' });
    const contentType = String(res.headers['content-type'] ?? 'application/octet-stream');
    const blob = new Blob([res.data], { type: contentType });
    const url = URL.createObjectURL(blob);
    if (download) {
      const a = document.createElement('a');
      a.href = url;
      const disp = res.headers['content-disposition'] ?? '';
      const match = disp.match(/filename="?([^"]+)"?/);
      a.download = match ? match[1] : 'document';
      a.click();
    } else {
      window.open(url, '_blank');
    }
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch {
    message.error('Failed to load file');
  }
}

export default function Documents() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();
  const [fileState, setFileState] = useState<{ name: string; base64: string; mime: string } | null>(null);
  const [activeTab, setActiveTab] = useState('All');

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: getDocuments,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['documents'] });

  const saveMut = useMutation({
    mutationFn: (vals: any) => {
      const payload: any = {
        ...vals,
        approvedAt: vals.approvedAt ? vals.approvedAt.toISOString() : undefined,
        reviewDueAt: vals.reviewDueAt ? vals.reviewDueAt.toISOString() : undefined,
      };
      if (fileState) {
        payload.fileName = fileState.name;
        payload.fileBase64 = fileState.base64;
        payload.fileMimeType = fileState.mime;
        delete payload.content;
      }
      return editing ? updateDocument(editing.id, payload) : createDocument(payload);
    },
    onSuccess: () => {
      invalidate();
      setModalOpen(false);
      form.resetFields();
      setEditing(null);
      setFileState(null);
    },
  });

  const obsoleteMut = useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: invalidate,
  });

  const openCreate = () => { setEditing(null); setFileState(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (doc: any) => {
    setEditing(doc);
    setFileState(null);
    form.setFieldsValue({
      ...doc,
      approvedAt: doc.approvedAt ? dayjs(doc.approvedAt) : undefined,
      reviewDueAt: doc.reviewDueAt ? dayjs(doc.reviewDueAt) : undefined,
    });
    setModalOpen(true);
  };

  const handleBeforeUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // result is data:mime;base64,xxx — extract just the base64 part
      const b64 = result.split(',')[1];
      setFileState({ name: file.name, base64: b64, mime: file.type });
    };
    reader.readAsDataURL(file);
    return false; // prevent auto-upload
  };

  const allDocs = docs as any[];
  const active = allDocs.filter((d: any) => d.status !== 'OBSOLETE');
  const sops = active.filter((d: any) => d.category === 'SOP').length;
  const wis = active.filter((d: any) => d.category === 'WI').length;
  const now = new Date();
  const overdue = active.filter((d: any) => d.reviewDueAt && new Date(d.reviewDueAt) < now).length;

  const filtered = activeTab === 'All' ? allDocs : allDocs.filter((d: any) => d.category === activeTab);

  const handleExport = () => {
    exportToCsv('documents.csv', filtered, [
      { key: 'docNumber', label: 'Doc Number' },
      { key: 'title', label: 'Title' },
      { key: 'category', label: 'Category' },
      { key: 'revision', label: 'Revision' },
      { key: 'status', label: 'Status' },
      { key: 'reviewDueAt', label: 'Review Due' },
    ]);
  };

  const columns = [
    { title: 'Doc Number', dataIndex: 'docNumber', key: 'docNumber', width: 120 },
    {
      title: 'Title', dataIndex: 'title', key: 'title',
      render: (t: string, row: any) => (
        <Space>
          {row.content?.startsWith('data:') && <PaperClipOutlined style={{ color: '#888' }} />}
          {t}
        </Space>
      ),
    },
    {
      title: 'Category', dataIndex: 'category', key: 'category', width: 110,
      render: (c: string) => <Tag color={CAT_COLORS[c] ?? 'default'}>{c}</Tag>,
    },
    { title: 'Revision', dataIndex: 'revision', key: 'revision', width: 80 },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 100,
      render: (s: string) => (
        <Tag color={s === 'ACTIVE' ? 'green' : s === 'DRAFT' ? 'gold' : 'default'}>{s}</Tag>
      ),
    },
    {
      title: 'Review Due', dataIndex: 'reviewDueAt', key: 'reviewDueAt', width: 120,
      render: (d: string) => {
        if (!d) return '—';
        const od = new Date(d) < now;
        return <Text type={od ? 'danger' : undefined}>{dayjs(d).format('DD MMM YYYY')}</Text>;
      },
    },
    {
      title: 'File', key: 'file', width: 60,
      render: (_: any, row: any) => {
        if (!row.content?.startsWith('data:')) return null;
        const mime = parseMime(row.content);
        return fileIcon(mime);
      },
    },
    {
      title: 'Actions', key: 'actions', width: 200,
      render: (_: any, row: any) => {
        const hasFile = row.content?.startsWith('data:');
        return (
          <Space>
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)}>Edit</Button>
            {hasFile && (
              <Button size="small" icon={<EyeOutlined />} onClick={() => openDocFile(row.id, false)} />
            )}
            {hasFile && (
              <Button size="small" icon={<DownloadOutlined />} onClick={() => openDocFile(row.id, true)} />
            )}
            {row.status !== 'OBSOLETE' && (
              <Button
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={() => obsoleteMut.mutate(row.id)}
              >
                Obsolete
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  const tabItems = ['All', ...CATEGORIES].map((cat) => ({
    key: cat,
    label: cat,
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Document Control</Title>
        <Space>
          <Button icon={<ExportOutlined />} onClick={handleExport}>Export CSV</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>New Document</Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#1677ff' }}>{sops}</div>
            <Text type="secondary">Total SOPs</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#52c41a' }}>{wis}</div>
            <Text type="secondary">Work Instructions</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#fa541c' }}>{overdue}</div>
            <Text type="secondary">Overdue Reviews</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#722ed1' }}>{active.length}</div>
            <Text type="secondary">Active Documents</Text>
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          style={{ marginBottom: 16 }}
        />
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={isLoading}
          size="small"
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        open={modalOpen}
        title={editing ? 'Edit Document' : 'New Document'}
        onCancel={() => { setModalOpen(false); setEditing(null); form.resetFields(); setFileState(null); }}
        onOk={() => form.submit()}
        confirmLoading={saveMut.isPending}
        width={600}
      >
        {editing && (
          <div style={{ marginBottom: 12, padding: '8px 12px', background: '#f5f5f5', borderRadius: 6 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Current revision: <strong>{editing.revision}</strong> — bump the revision field to record a new version.
            </Text>
          </div>
        )}
        <Form form={form} layout="vertical" onFinish={(vals) => saveMut.mutate(vals)}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="docNumber" label="Doc Number" rules={[{ required: true }]}>
                <Input placeholder="SOP-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="revision" label="Revision" initialValue="00">
                <Input placeholder="00" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                <Select options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
              </Form.Item>
            </Col>
            {editing && (
              <Col span={12}>
                <Form.Item name="status" label="Status">
                  <Select options={['ACTIVE', 'DRAFT', 'OBSOLETE'].map((s) => ({ value: s, label: s }))} />
                </Form.Item>
              </Col>
            )}
          </Row>
          <Form.Item label="Attach File">
            <Upload
              beforeUpload={handleBeforeUpload}
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              maxCount={1}
              showUploadList={false}
            >
              <Button icon={<PaperClipOutlined />}>Select File</Button>
            </Upload>
            {fileState && (
              <div style={{ marginTop: 8 }}>
                <Space>
                  {fileIcon(fileState.mime)}
                  <Text type="secondary">{fileState.name}</Text>
                </Space>
              </div>
            )}
            {editing?.content?.startsWith('data:') && !fileState && (
              <div style={{ marginTop: 8 }}>
                <Space>
                  {fileIcon(parseMime(editing.content))}
                  <Text type="secondary">{parseFileName(editing.content)} (current)</Text>
                </Space>
              </div>
            )}
          </Form.Item>
          <Form.Item name="content" label="Content (text)">
            <Input.TextArea rows={3} placeholder="Document content (markdown supported)" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="approvedBy" label="Approved By">
                <Input placeholder="Name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="approvedAt" label="Approved At">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="reviewDueAt" label="Review Due At">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

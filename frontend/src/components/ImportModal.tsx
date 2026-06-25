import { useState } from 'react';
import { Modal, Upload, Button, Table, Alert, Space, Typography, Steps, message } from 'antd';
import { UploadOutlined, DownloadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';

const { Text } = Typography;

export interface ImportColumn {
  key: string;
  label: string;
  required?: boolean;
}

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  columns: ImportColumn[];
  onImport: (records: any[]) => Promise<{ imported: number; errors: any[] }>;
  templateFilename?: string;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map((line) => {
    const values = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|(?<=,)$|^(?=,))/g) ?? line.split(',');
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] ?? '').trim().replace(/^"|"$/g, '');
    });
    return row;
  });
}

export default function ImportModal({ open, onClose, title, columns, onImport, templateFilename }: ImportModalProps) {
  const [step, setStep] = useState(0);
  const [parsed, setParsed] = useState<any[]>([]);
  const [result, setResult] = useState<{ imported: number; errors: any[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setStep(0); setParsed([]); setResult(null);
    onClose();
  };

  const downloadTemplate = () => {
    const header = columns.map((c) => c.label).join(',');
    const example = columns.map((c) => c.required ? `Sample ${c.label}` : '').join(',');
    const csv = [header, example].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = templateFilename ?? 'import-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCsv(text);
      if (!rows.length) { message.error('No data rows found in CSV'); return; }
      // Map CSV header labels → column keys
      const labelToKey: Record<string, string> = {};
      columns.forEach((c) => { labelToKey[c.label] = c.key; });
      const mapped = rows.map((row) => {
        const out: Record<string, any> = {};
        Object.entries(row).forEach(([label, val]) => {
          const key = labelToKey[label] ?? label;
          out[key] = val || undefined;
        });
        return out;
      });
      setParsed(mapped);
      setStep(1);
    };
    reader.readAsText(file);
    return false; // prevent antd auto-upload
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      const res = await onImport(parsed);
      setResult(res);
      setStep(2);
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const previewCols = columns.slice(0, 5).map((c) => ({
    title: c.label, dataIndex: c.key, key: c.key,
    render: (v: any) => v ?? <Text type="secondary">—</Text>,
  }));

  return (
    <Modal
      title={`Import ${title}`}
      open={open}
      onCancel={handleClose}
      footer={
        step === 0 ? null :
        step === 1 ? (
          <Space>
            <Button onClick={() => setStep(0)}>Back</Button>
            <Button type="primary" onClick={handleImport} loading={loading}>
              Import {parsed.length} Records
            </Button>
          </Space>
        ) : (
          <Button type="primary" onClick={handleClose}>Done</Button>
        )
      }
      width={700}
    >
      <Steps
        current={step}
        size="small"
        style={{ marginBottom: 24 }}
        items={[
          { title: 'Upload CSV' },
          { title: 'Preview' },
          { title: 'Result' },
        ]}
      />

      {step === 0 && (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Alert
            message="CSV Import Instructions"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>Download the template CSV below to see the required column headers</li>
                <li>Required fields: {columns.filter((c) => c.required).map((c) => c.label).join(', ') || 'none'}</li>
                <li>Save as UTF-8 CSV and upload here</li>
              </ul>
            }
            type="info"
            showIcon
          />
          <Button icon={<DownloadOutlined />} onClick={downloadTemplate}>
            Download Template CSV
          </Button>
          <Upload.Dragger
            accept=".csv"
            showUploadList={false}
            beforeUpload={(file: UploadFile) => handleFileUpload(file as unknown as File)}
          >
            <p><UploadOutlined style={{ fontSize: 32, color: '#1677ff' }} /></p>
            <p>Click or drag a CSV file here to upload</p>
          </Upload.Dragger>
        </Space>
      )}

      {step === 1 && (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Alert message={`${parsed.length} records ready to import`} type="success" showIcon />
          <Table
            dataSource={parsed.slice(0, 5)}
            columns={previewCols}
            rowKey={(_, i) => String(i)}
            pagination={false}
            size="small"
            scroll={{ x: true }}
          />
          {parsed.length > 5 && <Text type="secondary">... and {parsed.length - 5} more rows</Text>}
        </Space>
      )}

      {step === 2 && result && (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Alert
            message={`Import complete: ${result.imported} records imported`}
            type={result.errors.length ? 'warning' : 'success'}
            icon={<CheckCircleOutlined />}
            showIcon
          />
          {result.errors.length > 0 && (
            <Alert
              message={`${result.errors.length} rows failed`}
              description={result.errors.slice(0, 3).map((e: any, i) => (
                <div key={i}><Text type="danger">Row {i + 1}: {e.error}</Text></div>
              ))}
              type="error"
              showIcon
            />
          )}
        </Space>
      )}
    </Modal>
  );
}

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge, Button, Card, Col, DatePicker, Drawer, Form, Input, Modal, Row,
  Select, Space, Table, Tag, Typography,
} from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getAuditPlans, createAuditPlan, updateAuditPlan, addAuditFinding, updateAuditFinding,
} from '../api';

const { Title, Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
  PLANNED: 'default', IN_PROGRESS: 'processing', COMPLETED: 'green', CLOSED: 'default',
};
const FINDING_COLORS: Record<string, string> = {
  MAJOR: 'red', MINOR: 'orange', OBSERVATION: 'blue',
};
const FINDING_STATUS_NEXT: Record<string, string> = {
  OPEN: 'CLOSED', CLOSED: 'VERIFIED', VERIFIED: 'VERIFIED',
};
const FINDING_STATUS_COLOR: Record<string, string> = {
  OPEN: 'red', CLOSED: 'gold', VERIFIED: 'green',
};

export default function InternalAudit() {
  const qc = useQueryClient();
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [findingModalOpen, setFindingModalOpen] = useState(false);
  const [drawerAudit, setDrawerAudit] = useState<any>(null);
  const [auditForm] = Form.useForm();
  const [findingForm] = Form.useForm();

  const { data: audits = [], isLoading } = useQuery({
    queryKey: ['audit-plans'],
    queryFn: getAuditPlans,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['audit-plans'] });
    // Refresh drawer data from cache
    if (drawerAudit) {
      const updated = (audits as any[]).find((a: any) => a.id === drawerAudit.id);
      if (updated) setDrawerAudit(updated);
    }
  };

  const createMut = useMutation({
    mutationFn: (vals: any) => createAuditPlan({ ...vals, plannedDate: vals.plannedDate.toISOString() }),
    onSuccess: () => { invalidate(); setAuditModalOpen(false); auditForm.resetFields(); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateAuditPlan(id, data),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['audit-plans'] });
    },
  });

  const addFindingMut = useMutation({
    mutationFn: (vals: any) => addAuditFinding(drawerAudit.id, {
      ...vals,
      dueDate: vals.dueDate ? vals.dueDate.toISOString() : undefined,
    }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['audit-plans'] });
      setFindingModalOpen(false);
      findingForm.resetFields();
      // Update drawer with fresh data
      const fresh = await qc.fetchQuery({ queryKey: ['audit-plans'], queryFn: getAuditPlans });
      const updated = (fresh as any[]).find((a: any) => a.id === drawerAudit?.id);
      if (updated) setDrawerAudit(updated);
    },
  });

  const updateFindingMut = useMutation({
    mutationFn: ({ fid, status }: { fid: string; status: string }) =>
      updateAuditFinding(drawerAudit.id, fid, {
        status,
        closedAt: status === 'CLOSED' ? new Date().toISOString() : undefined,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['audit-plans'] });
      const fresh = await qc.fetchQuery({ queryKey: ['audit-plans'], queryFn: getAuditPlans });
      const updated = (fresh as any[]).find((a: any) => a.id === drawerAudit?.id);
      if (updated) setDrawerAudit(updated);
    },
  });

  const allFindings = (audits as any[]).flatMap((a: any) => a.findings || []);
  const openFindings = allFindings.filter((f: any) => f.status === 'OPEN').length;
  const planned = (audits as any[]).filter((a: any) => a.status === 'PLANNED').length;
  const inProgress = (audits as any[]).filter((a: any) => a.status === 'IN_PROGRESS').length;
  const completed = (audits as any[]).filter((a: any) => a.status === 'COMPLETED').length;

  const columns = [
    { title: 'Audit No.', dataIndex: 'auditNumber', key: 'auditNumber', width: 130 },
    { title: 'Auditor', dataIndex: 'auditor', key: 'auditor' },
    { title: 'Scope', dataIndex: 'scope', key: 'scope' },
    {
      title: 'Planned Date', dataIndex: 'plannedDate', key: 'plannedDate', width: 130,
      render: (d: string) => dayjs(d).format('DD MMM YYYY'),
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 120,
      render: (s: string) => <Tag color={STATUS_COLORS[s]}>{s.replace('_', ' ')}</Tag>,
    },
    {
      title: 'Findings', key: 'findings', width: 80,
      render: (_: any, row: any) => {
        const open = (row.findings || []).filter((f: any) => f.status === 'OPEN').length;
        return open > 0 ? <Badge count={open} color="red" /> : <Tag color="green">0 open</Tag>;
      },
    },
    {
      title: 'Actions', key: 'actions', width: 160,
      render: (_: any, row: any) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              const fresh = (audits as any[]).find((a: any) => a.id === row.id) || row;
              setDrawerAudit(fresh);
            }}
          >
            View
          </Button>
          {row.status === 'PLANNED' && (
            <Button
              size="small"
              onClick={() => updateMut.mutate({ id: row.id, data: { status: 'IN_PROGRESS', conductedDate: new Date().toISOString() } })}
            >
              Start
            </Button>
          )}
          {row.status === 'IN_PROGRESS' && (
            <Button
              size="small"
              type="primary"
              onClick={() => updateMut.mutate({ id: row.id, data: { status: 'COMPLETED' } })}
            >
              Complete
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const findingColumns = [
    { title: 'Clause', dataIndex: 'clause', key: 'clause', width: 80 },
    {
      title: 'Category', dataIndex: 'category', key: 'category', width: 110,
      render: (c: string) => <Tag color={FINDING_COLORS[c] ?? 'default'}>{c}</Tag>,
    },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Due', dataIndex: 'dueDate', key: 'dueDate', width: 110,
      render: (d: string) => d ? dayjs(d).format('DD MMM YYYY') : '—',
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 100,
      render: (s: string, row: any) => (
        <Tag
          color={FINDING_STATUS_COLOR[s] ?? 'default'}
          style={{ cursor: s !== 'VERIFIED' ? 'pointer' : 'default' }}
          onClick={() => {
            if (s !== 'VERIFIED') {
              updateFindingMut.mutate({ fid: row.id, status: FINDING_STATUS_NEXT[s] });
            }
          }}
          title={s !== 'VERIFIED' ? `Click to mark as ${FINDING_STATUS_NEXT[s]}` : ''}
        >
          {s}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Internal Audit</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAuditModalOpen(true)}>
          New Audit
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#595959' }}>{planned}</div>
            <Text type="secondary">Planned</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#1677ff' }}>{inProgress}</div>
            <Text type="secondary">In Progress</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#52c41a' }}>{completed}</div>
            <Text type="secondary">Completed</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#fa541c' }}>{openFindings}</div>
            <Text type="secondary">Open Findings</Text>
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={audits as any[]}
          rowKey="id"
          loading={isLoading}
          size="small"
          pagination={{ pageSize: 20 }}
        />
      </Card>

      {/* Audit drawer */}
      <Drawer
        open={!!drawerAudit}
        onClose={() => setDrawerAudit(null)}
        title={drawerAudit ? `Audit: ${drawerAudit.auditNumber}` : ''}
        width={700}
      >
        {drawerAudit && (
          <>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}><Text type="secondary">Auditor</Text><br /><Text strong>{drawerAudit.auditor}</Text></Col>
              <Col span={12}><Text type="secondary">Status</Text><br /><Tag color={STATUS_COLORS[drawerAudit.status]}>{drawerAudit.status}</Tag></Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}><Text type="secondary">Planned Date</Text><br /><Text>{dayjs(drawerAudit.plannedDate).format('DD MMM YYYY')}</Text></Col>
              <Col span={12}><Text type="secondary">Scope</Text><br /><Text>{drawerAudit.scope}</Text></Col>
            </Row>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text strong>Findings ({(drawerAudit.findings || []).length})</Text>
              <Button size="small" icon={<PlusOutlined />} onClick={() => setFindingModalOpen(true)}>
                Add Finding
              </Button>
            </div>
            <Table
              columns={findingColumns}
              dataSource={drawerAudit.findings || []}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </>
        )}
      </Drawer>

      {/* New Audit Modal */}
      <Modal
        open={auditModalOpen}
        title="New Internal Audit"
        onCancel={() => { setAuditModalOpen(false); auditForm.resetFields(); }}
        onOk={() => auditForm.submit()}
        confirmLoading={createMut.isPending}
      >
        <Form form={auditForm} layout="vertical" onFinish={(vals) => createMut.mutate(vals)}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="auditNumber" label="Audit Number" rules={[{ required: true }]}>
                <Input placeholder="IA-2026-01" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="plannedDate" label="Planned Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="auditor" label="Auditor" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="scope" label="Scope" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Finding Modal */}
      <Modal
        open={findingModalOpen}
        title="Add Finding"
        onCancel={() => { setFindingModalOpen(false); findingForm.resetFields(); }}
        onOk={() => findingForm.submit()}
        confirmLoading={addFindingMut.isPending}
      >
        <Form form={findingForm} layout="vertical" onFinish={(vals) => addFindingMut.mutate(vals)}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="clause" label="Clause" rules={[{ required: true }]}>
                <Input placeholder="6.4.3" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'MAJOR', label: 'Major' },
                    { value: 'MINOR', label: 'Minor' },
                    { value: 'OBSERVATION', label: 'Observation' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="rootCause" label="Root Cause">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="dueDate" label="Due Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

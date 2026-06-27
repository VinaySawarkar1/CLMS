import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, Button, Tag, Typography, Modal, Form, Input, InputNumber, Select,
  DatePicker, message, Space, Row, Col, Statistic, Drawer, Descriptions,
  Popconfirm, Progress, Badge, Tooltip, Divider,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, UserSwitchOutlined,
  FunnelPlotOutlined, DollarOutlined, TrophyOutlined, FireOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getLeads, createLead, updateLead, setLeadStage, convertLead, deleteLead, getLeadStats,
} from '../api';

const { Title, Text } = Typography;

const STAGES = [
  { key: 'NEW', label: 'New', color: '#8c8c8c' },
  { key: 'CONTACTED', label: 'Contacted', color: '#1677ff' },
  { key: 'QUALIFIED', label: 'Qualified', color: '#722ed1' },
  { key: 'PROPOSAL', label: 'Proposal', color: '#fa8c16' },
  { key: 'NEGOTIATION', label: 'Negotiation', color: '#eb2f96' },
  { key: 'WON', label: 'Won', color: '#52c41a' },
  { key: 'LOST', label: 'Lost', color: '#ff4d4f' },
];

const SOURCES = ['WEBSITE', 'REFERRAL', 'COLD_CALL', 'EXHIBITION', 'SOCIAL_MEDIA', 'EMAIL_CAMPAIGN', 'WALK_IN', 'OTHER'];
const SOURCE_LABEL: Record<string, string> = {
  WEBSITE: 'Website', REFERRAL: 'Referral', COLD_CALL: 'Cold Call',
  EXHIBITION: 'Exhibition', SOCIAL_MEDIA: 'Social Media',
  EMAIL_CAMPAIGN: 'Email Campaign', WALK_IN: 'Walk-in', OTHER: 'Other',
};

const STAGE_COLOR: Record<string, string> = Object.fromEntries(STAGES.map((s) => [s.key, s.color]));

export default function Leads() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewing, setViewing] = useState<any>(null);
  const [lostModal, setLostModal] = useState<{ id: string } | null>(null);
  const [lostReason, setLostReason] = useState('');
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const { data: leads = [], isLoading } = useQuery({ queryKey: ['leads'], queryFn: () => getLeads() });
  const { data: stats } = useQuery({ queryKey: ['leadStats'], queryFn: getLeadStats });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['leads'] });
    qc.invalidateQueries({ queryKey: ['leadStats'] });
  };

  const createMut = useMutation({
    mutationFn: (v: any) => createLead({ ...v, expectedCloseDate: v.expectedCloseDate?.toISOString() }),
    onSuccess: () => { message.success('Lead created'); setOpen(false); form.resetFields(); refresh(); },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Failed'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateLead(id, { ...data, expectedCloseDate: data.expectedCloseDate?.toISOString() }),
    onSuccess: () => { message.success('Lead updated'); setEditing(null); refresh(); },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Failed'),
  });

  const stageMut = useMutation({
    mutationFn: ({ id, stage, reason }: { id: string; stage: string; reason?: string }) =>
      setLeadStage(id, stage, reason),
    onSuccess: () => { message.success('Stage updated'); refresh(); },
  });

  const convertMut = useMutation({
    mutationFn: (id: string) => convertLead(id),
    onSuccess: (data: any) => {
      message.success(`Converted to customer: ${data?.customer?.name}`);
      refresh();
    },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Failed'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteLead(id),
    onSuccess: () => { message.success('Lead deleted'); refresh(); },
  });

  const byStage = (key: string) => (leads as any[]).filter((l) => l.stage === key);

  const openEdit = (lead: any) => {
    setEditing(lead);
    editForm.setFieldsValue({
      ...lead,
      expectedCloseDate: lead.expectedCloseDate ? dayjs(lead.expectedCloseDate) : undefined,
    });
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}><FunnelPlotOutlined /> Sales Pipeline</Title>
          <Text type="secondary">Manage leads and track your pipeline</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>Add Lead</Button>
      </div>

      {/* Stats */}
      {stats && (
        <Row gutter={16}>
          <Col span={6}>
            <Card><Statistic title="Total Leads" value={(stats as any).total} prefix={<FunnelPlotOutlined />} /></Card>
          </Col>
          <Col span={6}>
            <Card><Statistic title="Pipeline Value" value={(stats as any).pipelineValue} prefix="₹" precision={0} valueStyle={{ color: '#1677ff' }} /></Card>
          </Col>
          <Col span={6}>
            <Card><Statistic title="Won" value={(stats as any).won} prefix={<TrophyOutlined />} valueStyle={{ color: '#52c41a' }} /></Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="Win Rate" value={(stats as any).winRate} suffix="%" prefix={<FireOutlined />} valueStyle={{ color: (stats as any).winRate >= 50 ? '#52c41a' : '#fa8c16' }} />
            </Card>
          </Col>
        </Row>
      )}

      {/* Kanban board */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Loading pipeline...</div>
      ) : (
        <div style={{ overflowX: 'auto', paddingBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, minWidth: STAGES.length * 240 }}>
            {STAGES.map((stage) => {
              const cards = byStage(stage.key);
              const colValue = cards.reduce((s: number, l: any) => s + (l.value ?? 0), 0);
              return (
                <div key={stage.key} style={{ width: 240, flexShrink: 0 }}>
                  {/* Column header */}
                  <div style={{
                    background: stage.color, borderRadius: '10px 10px 0 0',
                    padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <Text strong style={{ color: '#fff', fontSize: 13 }}>{stage.label}</Text>
                    <Badge count={cards.length} style={{ backgroundColor: 'rgba(255,255,255,0.3)', color: '#fff' }} />
                  </div>
                  <div style={{
                    background: `${stage.color}11`, border: `1px solid ${stage.color}33`,
                    borderTop: 'none', borderRadius: '0 0 10px 10px',
                    padding: '8px 8px 4px', minHeight: 120,
                  }}>
                    {colValue > 0 && (
                      <div style={{ textAlign: 'right', fontSize: 11, color: stage.color, marginBottom: 6, fontWeight: 600 }}>
                        ₹{colValue.toLocaleString()}
                      </div>
                    )}
                    {cards.map((lead: any) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        stageColor={stage.color}
                        stages={STAGES}
                        onView={() => setViewing(lead)}
                        onEdit={() => openEdit(lead)}
                        onStage={(s) => {
                          if (s === 'LOST') { setLostModal({ id: lead.id }); }
                          else stageMut.mutate({ id: lead.id, stage: s });
                        }}
                        onConvert={() => convertMut.mutate(lead.id)}
                        onDelete={() => deleteMut.mutate(lead.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        title={<Space><FunnelPlotOutlined />New Lead</Space>}
        open={open}
        onCancel={() => { setOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={createMut.isPending}
        okText="Create Lead"
        width={680}
        destroyOnClose
      >
        <LeadForm form={form} onFinish={(v) => createMut.mutate(v)} />
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Edit Lead"
        open={!!editing}
        onCancel={() => setEditing(null)}
        onOk={() => editForm.submit()}
        confirmLoading={updateMut.isPending}
        okText="Save"
        width={680}
        destroyOnClose
      >
        <LeadForm form={editForm} onFinish={(v) => updateMut.mutate({ id: editing.id, data: v })} />
      </Modal>

      {/* Lost reason modal */}
      <Modal
        title="Mark Lead as Lost"
        open={!!lostModal}
        onCancel={() => { setLostModal(null); setLostReason(''); }}
        onOk={() => {
          if (lostModal) {
            stageMut.mutate({ id: lostModal.id, stage: 'LOST', reason: lostReason });
            setLostModal(null);
            setLostReason('');
          }
        }}
      >
        <Form layout="vertical">
          <Form.Item label="Reason for loss (optional)">
            <Input.TextArea rows={3} value={lostReason} onChange={(e) => setLostReason(e.target.value)} placeholder="Why was this lead lost?" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Drawer */}
      {viewing && (
        <LeadDetailDrawer
          lead={viewing}
          stages={STAGES}
          onClose={() => setViewing(null)}
          onEdit={() => { openEdit(viewing); setViewing(null); }}
          onStage={(s) => {
            if (s === 'LOST') { setLostModal({ id: viewing.id }); setViewing(null); }
            else stageMut.mutate({ id: viewing.id, stage: s });
          }}
          onConvert={() => { convertMut.mutate(viewing.id); setViewing(null); }}
        />
      )}
    </Space>
  );
}

function LeadCard({ lead, stageColor, stages, onView, onEdit, onStage, onConvert, onDelete }: any) {
  return (
    <div
      style={{
        background: '#fff', borderRadius: 8, padding: '10px 12px', marginBottom: 8,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)', cursor: 'pointer', border: `1px solid ${stageColor}22`,
      }}
      onClick={onView}
    >
      <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 3 }}>{lead.title}</Text>
      {lead.companyName && <Text type="secondary" style={{ fontSize: 11 }}>{lead.companyName}</Text>}
      <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {lead.value ? (
          <Text style={{ fontSize: 11, color: '#1677ff', fontWeight: 600 }}>₹{Number(lead.value).toLocaleString()}</Text>
        ) : <span />}
        <Text style={{ fontSize: 10, color: '#aaa' }}>
          {lead.probability != null ? `${lead.probability}%` : ''}
        </Text>
      </div>
      {lead.probability != null && (
        <Progress percent={lead.probability} size="small" showInfo={false} style={{ margin: '4px 0 0' }} strokeColor={stageColor} />
      )}
      <div style={{ marginTop: 6, display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
        <Tooltip title="Edit">
          <Button size="small" icon={<EditOutlined />} style={{ fontSize: 10 }} onClick={onEdit} />
        </Tooltip>
        <Select
          size="small" value={lead.stage} style={{ fontSize: 10, width: 100 }}
          onChange={onStage}
          options={stages.map((s: any) => ({ value: s.key, label: s.label }))}
          onClick={(e) => e.stopPropagation()}
        />
        {lead.stage === 'WON' && !lead.convertedCustomerId && (
          <Tooltip title="Convert to Customer">
            <Button size="small" type="primary" icon={<UserSwitchOutlined />} onClick={onConvert} />
          </Tooltip>
        )}
        <Popconfirm title="Delete lead?" onConfirm={onDelete} onClick={(e: any) => e.stopPropagation()}>
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </div>
    </div>
  );
}

function LeadDetailDrawer({ lead, stages, onClose, onEdit, onStage, onConvert }: any) {
  return (
    <Drawer
      title={lead.title}
      open
      onClose={onClose}
      width={560}
      extra={
        <Space>
          <Button icon={<EditOutlined />} onClick={onEdit}>Edit</Button>
          {lead.stage === 'WON' && !lead.convertedCustomerId && (
            <Button type="primary" icon={<UserSwitchOutlined />} onClick={onConvert}>Convert to Customer</Button>
          )}
        </Space>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Tag color={STAGE_COLOR[lead.stage]}>{lead.stage}</Tag>
          {lead.source && <Tag>{SOURCE_LABEL[lead.source] ?? lead.source}</Tag>}
          {lead.industry && <Tag color="blue">{lead.industry}</Tag>}
          {lead.convertedCustomerId && <Tag color="green">Converted</Tag>}
        </div>

        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="Company" span={2}>{lead.companyName ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Contact">{lead.contactName ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Email">{lead.contactEmail ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Phone">{lead.contactPhone ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Assigned To">{lead.assignedTo ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Value">
            {lead.value ? `₹${Number(lead.value).toLocaleString()}` : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Probability">{lead.probability != null ? `${lead.probability}%` : '—'}</Descriptions.Item>
          <Descriptions.Item label="Expected Close">
            {lead.expectedCloseDate ? dayjs(lead.expectedCloseDate).format('DD MMM YYYY') : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Created">{dayjs(lead.createdAt).format('DD MMM YYYY')}</Descriptions.Item>
        </Descriptions>

        {lead.description && (
          <Card size="small" title="Description">
            <Text>{lead.description}</Text>
          </Card>
        )}
        {lead.lostReason && (
          <Card size="small" title="Lost Reason" style={{ borderColor: '#ff4d4f' }}>
            <Text type="danger">{lead.lostReason}</Text>
          </Card>
        )}

        <Divider>Move Stage</Divider>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {stages.map((s: any) => (
            <Button
              key={s.key}
              size="small"
              type={lead.stage === s.key ? 'primary' : 'default'}
              style={lead.stage !== s.key ? { borderColor: s.color, color: s.color } : { background: s.color, borderColor: s.color }}
              onClick={() => onStage(s.key)}
            >
              {s.label}
            </Button>
          ))}
        </div>

        {(lead.activities ?? []).length > 0 && (
          <>
            <Divider>Recent Activities</Divider>
            {lead.activities.slice(0, 5).map((a: any) => (
              <Card key={a.id} size="small" style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Space>
                    <Tag color="blue">{a.type}</Tag>
                    <Text strong style={{ fontSize: 12 }}>{a.title}</Text>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(a.createdAt).format('DD MMM')}</Text>
                </div>
                {a.description && <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>{a.description}</Text>}
              </Card>
            ))}
          </>
        )}
      </Space>
    </Drawer>
  );
}

function LeadForm({ form, onFinish }: { form: any; onFinish: (v: any) => void }) {
  return (
    <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ stage: 'NEW', probability: 20 }}>
      <Row gutter={16}>
        <Col span={16}>
          <Form.Item name="title" label="Lead Title" rules={[{ required: true }]}>
            <Input placeholder="e.g. Annual calibration contract for ABC Ltd" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="stage" label="Stage">
            <Select options={[
              { value: 'NEW', label: 'New' }, { value: 'CONTACTED', label: 'Contacted' },
              { value: 'QUALIFIED', label: 'Qualified' }, { value: 'PROPOSAL', label: 'Proposal' },
              { value: 'NEGOTIATION', label: 'Negotiation' },
            ]} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="companyName" label="Company Name">
            <Input placeholder="Organization" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="industry" label="Industry">
            <Input placeholder="e.g. Manufacturing, Pharma" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="contactName" label="Contact Person">
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="contactEmail" label="Email">
            <Input type="email" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="contactPhone" label="Phone">
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="source" label="Lead Source">
            <Select options={SOURCES.map((s) => ({ value: s, label: SOURCE_LABEL[s] }))} placeholder="Select source" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="value" label="Deal Value (₹)">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="probability" label="Win Probability (%)">
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="expectedCloseDate" label="Expected Close">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="assignedTo" label="Assigned To">
        <Input placeholder="Team member name" />
      </Form.Item>
      <Form.Item name="description" label="Notes / Description">
        <Input.TextArea rows={2} />
      </Form.Item>
    </Form>
  );
}

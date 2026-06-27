import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Avatar, Badge, Button, Card, Col, DatePicker, Form, Input, Modal,
  Popconfirm, Row, Select, Space, Tag, Tooltip, Typography,
} from 'antd';
import {
  ArrowRightOutlined, CheckSquareOutlined, DeleteOutlined,
  EditOutlined, PlusOutlined, UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { createTask, deleteTask, getEngineers, getTaskBoard, getUser, setTaskStatus, updateTask } from '../api';

const { Title, Text } = Typography;

const COLUMNS = ['PENDING', 'ASSIGNED', 'RUNNING', 'REVIEW', 'COMPLETED'];
const COL_COLORS: Record<string, string> = {
  PENDING: '#f0f2f5', ASSIGNED: '#e6f0ff', RUNNING: '#fffbe6', REVIEW: '#fff7e6', COMPLETED: '#f6ffed',
};
const COL_BADGE: Record<string, string> = {
  PENDING: 'default', ASSIGNED: 'blue', RUNNING: 'processing', REVIEW: 'warning', COMPLETED: 'success',
};
const COL_LABELS: Record<string, string> = {
  PENDING: 'Pending', ASSIGNED: 'Assigned', RUNNING: 'In Progress', REVIEW: 'Review', COMPLETED: 'Completed',
};
const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'green', MEDIUM: 'orange', HIGH: 'red', CRITICAL: 'purple',
};

export default function Tasks() {
  const qc = useQueryClient();
  const me = getUser();
  const isAdmin = ['LAB_ADMIN', 'TECHNICAL_MANAGER', 'QUALITY_MANAGER'].includes(me?.role ?? '');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();

  const { data = {} } = useQuery({ queryKey: ['task-board'], queryFn: getTaskBoard });
  const { data: engineers = [] } = useQuery({ queryKey: ['engineers'], queryFn: getEngineers, enabled: isAdmin });

  const refresh = () => qc.invalidateQueries({ queryKey: ['task-board'] });

  const openCreate = () => { form.resetFields(); setEditing(null); setOpen(true); };
  const openEdit = (t: any) => {
    form.setFieldsValue({
      title: t.title,
      description: t.description,
      engineerId: t.engineerId,
      dueDate: t.dueDate ? dayjs(t.dueDate) : undefined,
      priority: t.priority,
    });
    setEditing(t);
    setOpen(true);
  };

  const saveMut = useMutation({
    mutationFn: (vals: any) => {
      const body = { ...vals, dueDate: vals.dueDate?.toISOString() };
      return editing ? updateTask(editing.id, body) : createTask(body);
    },
    onSuccess: () => { refresh(); setOpen(false); form.resetFields(); setEditing(null); },
  });

  const moveMut = useMutation({
    mutationFn: (v: { id: string; status: string }) => setTaskStatus(v.id, v.status),
    onSuccess: refresh,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: refresh,
  });

  const nextOf = (s: string) => COLUMNS[Math.min(COLUMNS.indexOf(s) + 1, COLUMNS.length - 1)];

  const engineerMap: Record<string, string> = {};
  (engineers as any[]).forEach((e: any) => { engineerMap[e.id] = e.name; });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <Space><CheckSquareOutlined style={{ color: '#1677ff' }} />Task Board</Space>
            </Title>
            <Text type="secondary">
              {isAdmin ? 'Manage and assign laboratory tasks to team members' : 'Your assigned tasks'}
            </Text>
          </Col>
          <Col>
            {isAdmin && (
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} size="large">
                New Task
              </Button>
            )}
          </Col>
        </Row>
      </div>

      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
        {COLUMNS.map((col) => {
          const tasks: any[] = (data as any)[col] ?? [];
          return (
            <div key={col} style={{ minWidth: 260, flex: '0 0 260px' }}>
              <div style={{
                background: COL_COLORS[col],
                borderRadius: 12,
                padding: '12px 14px',
                minHeight: 400,
                border: '1px solid #e8e8e8',
              }}>
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge status={COL_BADGE[col] as any} />
                  <Text strong style={{ fontSize: 13 }}>{COL_LABELS[col]}</Text>
                  <Tag style={{ marginLeft: 'auto', borderRadius: 10 }}>{tasks.length}</Tag>
                </div>
                <Space direction="vertical" style={{ width: '100%' }} size={8}>
                  {tasks.map((t: any) => (
                    <Card
                      key={t.id}
                      size="small"
                      style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: 'none' }}
                      styles={{ body: { padding: '10px 12px' } }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
                        <Text style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{t.title}</Text>
                        {isAdmin && (
                          <Space size={2}>
                            <Tooltip title="Edit">
                              <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(t)} style={{ padding: 2 }} />
                            </Tooltip>
                            <Popconfirm title="Delete this task?" onConfirm={() => deleteMut.mutate(t.id)} okType="danger">
                              <Tooltip title="Delete">
                                <Button size="small" type="text" danger icon={<DeleteOutlined />} style={{ padding: 2 }} />
                              </Tooltip>
                            </Popconfirm>
                          </Space>
                        )}
                      </div>

                      {t.description && (
                        <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                          {t.description}
                        </Text>
                      )}

                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                        {t.priority && (
                          <Tag color={PRIORITY_COLORS[t.priority] ?? 'default'} style={{ fontSize: 10, margin: 0 }}>
                            {t.priority}
                          </Tag>
                        )}
                        {t.engineer && (
                          <Tag icon={<UserOutlined />} style={{ fontSize: 10, margin: 0 }}>
                            {t.engineer.name}
                          </Tag>
                        )}
                        {t.dueDate && (
                          <Tag
                            color={dayjs(t.dueDate).isBefore(dayjs(), 'day') && col !== 'COMPLETED' ? 'red' : 'default'}
                            style={{ fontSize: 10, margin: 0 }}
                          >
                            {dayjs(t.dueDate).format('DD MMM')}
                          </Tag>
                        )}
                      </div>

                      {col !== 'COMPLETED' && (
                        <div style={{ marginTop: 8 }}>
                          <Button
                            size="small"
                            type="link"
                            icon={<ArrowRightOutlined />}
                            style={{ padding: 0, height: 'auto', fontSize: 11 }}
                            onClick={() => moveMut.mutate({ id: t.id, status: nextOf(col) })}
                          >
                            Move to {COL_LABELS[nextOf(col)]}
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
                  {tasks.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>No tasks</Text>
                    </div>
                  )}
                </Space>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        title={<Space>{editing ? <EditOutlined /> : <PlusOutlined />}<span>{editing ? 'Edit Task' : 'New Task'}</span></Space>}
        open={open}
        onCancel={() => { setOpen(false); form.resetFields(); setEditing(null); }}
        onOk={() => form.validateFields().then((v) => saveMut.mutate(v))}
        okText={editing ? 'Save Changes' : 'Create Task'}
        confirmLoading={saveMut.isPending}
        width={500}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Task Title" rules={[{ required: true }]}>
            <Input placeholder="Describe the task..." />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Additional details..." />
          </Form.Item>
          <Row gutter={16}>
            {isAdmin && (
              <Col span={12}>
                <Form.Item name="engineerId" label="Assign To">
                  <Select
                    showSearch
                    allowClear
                    placeholder="Select team member"
                    optionFilterProp="label"
                    options={(engineers as any[]).map((e: any) => ({
                      value: e.id,
                      label: e.name,
                    }))}
                  />
                </Form.Item>
              </Col>
            )}
            <Col span={isAdmin ? 12 : 24}>
              <Form.Item name="priority" label="Priority">
                <Select allowClear placeholder="Select priority" options={[
                  { value: 'LOW', label: 'Low' },
                  { value: 'MEDIUM', label: 'Medium' },
                  { value: 'HIGH', label: 'High' },
                  { value: 'CRITICAL', label: 'Critical' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="dueDate" label="Due Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

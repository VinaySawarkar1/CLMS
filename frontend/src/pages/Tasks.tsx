import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Button, Card, Col, Form, Input, Modal, Row, Space, Tag, Typography, Badge,
} from 'antd';
import {
  PlusOutlined, CheckSquareOutlined, ArrowRightOutlined,
} from '@ant-design/icons';
import { createTask, getTaskBoard, setTaskStatus } from '../api';

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

export default function Tasks() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const { data = {} } = useQuery({ queryKey: ['task-board'], queryFn: getTaskBoard });
  const refresh = () => qc.invalidateQueries({ queryKey: ['task-board'] });
  const createMut = useMutation({
    mutationFn: () => createTask(form.getFieldsValue()),
    onSuccess: () => { refresh(); setOpen(false); form.resetFields(); },
  });
  const moveMut = useMutation({
    mutationFn: (v: { id: string; status: string }) => setTaskStatus(v.id, v.status),
    onSuccess: refresh,
  });

  const nextOf = (s: string) => COLUMNS[Math.min(COLUMNS.indexOf(s) + 1, COLUMNS.length - 1)];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <Space>
                <CheckSquareOutlined style={{ color: '#1677ff' }} />
                Task Board
              </Space>
            </Title>
            <Text type="secondary">Kanban view of all laboratory tasks</Text>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)} size="large">
              New Task
            </Button>
          </Col>
        </Row>
      </div>

      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
        {COLUMNS.map((col) => {
          const tasks: any[] = data[col] ?? [];
          return (
            <div key={col} style={{ minWidth: 240, flex: '0 0 240px' }}>
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
                      <Text style={{ fontSize: 13 }}>{t.title}</Text>
                      {col !== 'COMPLETED' && (
                        <div style={{ marginTop: 8 }}>
                          <Button
                            size="small"
                            type="link"
                            icon={<ArrowRightOutlined />}
                            style={{ padding: 0, height: 'auto', fontSize: 12 }}
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
        title={<Space><PlusOutlined /><span>New Task</span></Space>}
        open={open}
        onCancel={() => { setOpen(false); form.resetFields(); }}
        onOk={() => form.validateFields().then(() => createMut.mutate())}
        okText="Create Task"
        confirmLoading={createMut.isPending}
        width={440}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Task Title" rules={[{ required: true }]}>
            <Input placeholder="Describe the task..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

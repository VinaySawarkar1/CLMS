import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button, Card, Col, Form, Input, Modal, Row, Space, Table, Tag, Typography,
} from 'antd';
import { PlusOutlined, AlertOutlined, CheckOutlined, ToolOutlined } from '@ant-design/icons';
import { addCapa, closeNcr, getNcrs, raiseNcr } from '../api';

const { Title, Text } = Typography;

export default function Quality() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [capaFor, setCapaFor] = useState<any>(null);
  const [raiseForm] = Form.useForm();
  const [capaForm] = Form.useForm();

  const { data = [], isLoading } = useQuery({ queryKey: ['ncrs'], queryFn: getNcrs });
  const refresh = () => qc.invalidateQueries({ queryKey: ['ncrs'] });

  const raiseMut = useMutation({
    mutationFn: () => raiseNcr({ description: raiseForm.getFieldValue('description') }),
    onSuccess: () => { refresh(); setOpen(false); raiseForm.resetFields(); },
  });
  const capaMut = useMutation({
    mutationFn: () => addCapa(capaFor.id, capaForm.getFieldsValue()),
    onSuccess: () => { refresh(); setCapaFor(null); capaForm.resetFields(); },
  });
  const closeMut = useMutation({ mutationFn: (id: string) => closeNcr(id), onSuccess: refresh });

  const columns = [
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
      width: 130,
      render: (v: string) => <Tag color="red">{v}</Tag>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'CAPA',
      dataIndex: 'capa',
      key: 'capa',
      width: 80,
      render: (v: any) => v ? <Tag color="green">Done</Tag> : <Tag color="orange">Pending</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (v: string) => <Tag color={v === 'CLOSED' ? 'green' : 'red'}>{v}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_: any, row: any) => (
        <Space>
          <Button size="small" icon={<ToolOutlined />} onClick={() => { setCapaFor(row); capaForm.setFieldsValue(row.capa || {}); }}>
            CAPA
          </Button>
          {row.status !== 'CLOSED' && (
            <Button size="small" icon={<CheckOutlined />} onClick={() => closeMut.mutate(row.id)}>
              Close
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <Space>
                <AlertOutlined style={{ color: '#f5222d' }} />
                NCR / CAPA
              </Space>
            </Title>
            <Text type="secondary">Non-Conformance Reports and Corrective/Preventive Actions</Text>
          </Col>
          <Col>
            <Button type="primary" danger icon={<PlusOutlined />} onClick={() => setOpen(true)} size="large">
              Raise NCR
            </Button>
          </Col>
        </Row>
      </div>

      <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 15, showTotal: (t) => `Total ${t} NCRs` }}
          size="middle"
        />
      </Card>

      <Modal
        title={<Space><AlertOutlined /><span>Raise Non-Conformance Report</span></Space>}
        open={open}
        onCancel={() => { setOpen(false); raiseForm.resetFields(); }}
        onOk={() => raiseForm.validateFields().then(() => raiseMut.mutate())}
        okText="Raise NCR"
        okButtonProps={{ danger: true }}
        confirmLoading={raiseMut.isPending}
        width={480}
      >
        <Form form={raiseForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="Describe the non-conformance in detail..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<Space><ToolOutlined /><span>CAPA — {capaFor?.reference}</span></Space>}
        open={!!capaFor}
        onCancel={() => { setCapaFor(null); capaForm.resetFields(); }}
        onOk={() => capaForm.validateFields().then(() => capaMut.mutate())}
        okText="Save CAPA"
        confirmLoading={capaMut.isPending}
        width={540}
      >
        <Form form={capaForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="rootCause" label="Root Cause Analysis">
            <Input.TextArea rows={3} placeholder="Identify the root cause of the non-conformance..." />
          </Form.Item>
          <Form.Item name="correctiveAction" label="Corrective Action">
            <Input.TextArea rows={3} placeholder="Immediate corrective actions taken..." />
          </Form.Item>
          <Form.Item name="preventiveAction" label="Preventive Action">
            <Input.TextArea rows={3} placeholder="Actions to prevent recurrence..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

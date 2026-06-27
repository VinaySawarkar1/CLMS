import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, Table, Switch, Button, Space, Typography, message, Tag } from 'antd';
import { KeyOutlined, SaveOutlined } from '@ant-design/icons';
import { getUser, getLabPermissions, saveLabPermissions } from '../api';

const { Title, Text } = Typography;

// Roles that can have their access configured by the LAB_ADMIN.
const ROLES = [
  { key: 'TECHNICAL_MANAGER', label: 'Technical Mgr' },
  { key: 'QUALITY_MANAGER', label: 'Quality Mgr' },
  { key: 'CALIBRATION_ENGINEER', label: 'Calib. Engineer' },
  { key: 'SERVICE_ENGINEER', label: 'Service Engineer' },
  { key: 'DATA_ENTRY_OPERATOR', label: 'Data Entry' },
];

const MODULES = [
  // Calibration
  { key: 'jobs', label: 'Jobs' },
  { key: 'certificates', label: 'Certificates' },
  { key: 'instruments', label: 'Instruments' },
  { key: 'reference-standards', label: 'Reference Standards' },
  { key: 'calibration-masters', label: 'Calibration Masters' },
  { key: 'environmental', label: 'Environmental' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'engineers', label: 'Engineers' },
  // CRM & Sales
  { key: 'customers', label: 'Customers' },
  { key: 'quotations', label: 'Quotations' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'purchase-orders', label: 'Purchase Orders' },
  { key: 'delivery-challans', label: 'Delivery Challans' },
  { key: 'leads', label: 'Leads / Pipeline' },
  { key: 'crm-activities', label: 'CRM Activities' },
  // Quality
  { key: 'quality', label: 'NCR / CAPA' },
  { key: 'complaints', label: 'Complaints & Feedback' },
  { key: 'documents', label: 'Lab Documents' },
  { key: 'internal-audit', label: 'Internal Audit' },
  { key: 'reports', label: 'Reports' },
  // Operations
  { key: 'inventory', label: 'Inventory' },
  { key: 'notifications', label: 'Notifications' },
];

type Matrix = Record<string, Record<string, boolean>>;

export default function Permissions() {
  const me = getUser();
  const labId = me?.labId ?? '';
  const [matrix, setMatrix] = useState<Matrix>({});

  const { data, isLoading } = useQuery({
    queryKey: ['lab-permissions', labId],
    queryFn: () => getLabPermissions(labId),
    enabled: Boolean(labId),
  });

  useEffect(() => {
    if (data) setMatrix(data as Matrix);
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () => {
      const payload: { role: string; permissionKey: string; granted: boolean }[] = [];
      for (const role of ROLES) {
        for (const mod of MODULES) {
          payload.push({
            role: role.key,
            permissionKey: mod.key,
            granted: matrix[role.key]?.[mod.key] ?? false,
          });
        }
      }
      return saveLabPermissions(labId, payload);
    },
    onSuccess: () => message.success('Permissions saved'),
    onError: () => message.error('Failed to save permissions'),
  });

  const toggle = (role: string, mod: string, val: boolean) => {
    setMatrix((prev) => ({
      ...prev,
      [role]: { ...(prev[role] ?? {}), [mod]: val },
    }));
  };

  const columns = [
    {
      title: 'Module', dataIndex: 'label', key: 'label', fixed: 'left' as const, width: 180,
      render: (label: string) => <Text strong>{label}</Text>,
    },
    ...ROLES.map((role) => ({
      title: role.label,
      key: role.key,
      align: 'center' as const,
      render: (_: any, row: { key: string }) => (
        <Switch
          checked={matrix[role.key]?.[row.key] ?? false}
          onChange={(val) => toggle(role.key, row.key, val)}
        />
      ),
    })),
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}><KeyOutlined /> Role Permissions</Title>
          <Text type="secondary">Control which modules each role can access in {me?.lab?.name ?? 'your lab'}</Text>
        </div>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saveMut.isPending}
          onClick={() => saveMut.mutate()}
        >
          Save Changes
        </Button>
      </div>

      <Card>
        <Space style={{ marginBottom: 12 }}>
          <Tag color="purple">Lab Admin</Tag>
          <Text type="secondary">always has full access and is not shown below.</Text>
        </Space>
        <Table
          rowKey="key"
          loading={isLoading}
          dataSource={MODULES}
          columns={columns}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </Space>
  );
}

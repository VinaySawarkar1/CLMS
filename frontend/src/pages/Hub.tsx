import { useNavigate } from 'react-router-dom';
import { Card, Col, Row, Space, Tag, Typography } from 'antd';
import {
  DashboardOutlined, ExperimentOutlined, ToolOutlined, SafetyOutlined, SettingOutlined,
  TeamOutlined, GoldOutlined, ApartmentOutlined, FileTextOutlined, SafetyCertificateOutlined,
  CheckSquareOutlined, UserOutlined, DatabaseOutlined, CloudOutlined, AlertOutlined,
  StarOutlined, BarChartOutlined, FileSyncOutlined, BellOutlined, UsergroupAddOutlined,
  KeyOutlined, RightOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import { getUser, hasPermission } from '../api';

const { Title, Text } = Typography;

type Tool = { to: string; label: string; icon: ReactNode; perm?: string };
type Section = { key: string; title: string; description: string; icon: ReactNode; color: string; tools: Tool[]; adminOnly?: boolean };

const SECTIONS: Section[] = [
  {
    key: 'dashboard', title: 'Dashboard', description: 'KPIs, workload & lab overview at a glance.',
    icon: <DashboardOutlined />, color: '#1677ff',
    tools: [{ to: '/dashboard', label: 'Open Dashboard', icon: <DashboardOutlined /> }],
  },
  {
    key: 'calibration', title: 'Calibration', description: 'Customers, instruments, standards, jobs & certificates.',
    icon: <ExperimentOutlined />, color: '#52c41a',
    tools: [
      { to: '/customers', label: 'Customers', icon: <TeamOutlined />, perm: 'customers' },
      { to: '/instruments', label: 'Instrument Entry', icon: <ToolOutlined />, perm: 'instruments' },
      { to: '/reference-standards', label: 'Reference Standards', icon: <GoldOutlined />, perm: 'instruments' },
      { to: '/calibration-masters', label: 'Calibration Masters', icon: <ApartmentOutlined />, perm: 'instruments' },
      { to: '/jobs', label: 'Jobs', icon: <FileTextOutlined />, perm: 'jobs' },
      { to: '/certificates', label: 'Certificates', icon: <SafetyCertificateOutlined />, perm: 'certificates' },
    ],
  },
  {
    key: 'operations', title: 'Operations', description: 'Task board, engineers, inventory & environment.',
    icon: <ToolOutlined />, color: '#fa8c16',
    tools: [
      { to: '/tasks', label: 'Task Board', icon: <CheckSquareOutlined />, perm: 'tasks' },
      { to: '/engineers', label: 'Engineers', icon: <UserOutlined />, perm: 'engineers' },
      { to: '/inventory', label: 'Inventory', icon: <DatabaseOutlined />, perm: 'inventory' },
      { to: '/environmental', label: 'Environmental', icon: <CloudOutlined />, perm: 'environmental' },
    ],
  },
  {
    key: 'quality', title: 'Quality & Compliance', description: 'NCR/CAPA, complaints, feedback, reports & audit.',
    icon: <SafetyOutlined />, color: '#eb2f96',
    tools: [
      { to: '/quality', label: 'NCR / CAPA', icon: <AlertOutlined />, perm: 'quality' },
      { to: '/complaints', label: 'Complaints', icon: <AlertOutlined />, perm: 'quality' },
      { to: '/feedback', label: 'Customer Feedback', icon: <StarOutlined />, perm: 'quality' },
      { to: '/reports', label: 'Reports', icon: <BarChartOutlined />, perm: 'jobs' },
      { to: '/documents', label: 'Documents', icon: <FileSyncOutlined />, perm: 'quality' },
      { to: '/internal-audit', label: 'Internal Audit', icon: <SafetyOutlined />, perm: 'audit' },
      { to: '/notifications', label: 'Notifications', icon: <BellOutlined />, perm: 'notifications' },
    ],
  },
  {
    key: 'admin', title: 'Administration', description: 'Users, role permissions & lab settings.',
    icon: <SettingOutlined />, color: '#722ed1', adminOnly: true,
    tools: [
      { to: '/users', label: 'Users', icon: <UsergroupAddOutlined /> },
      { to: '/permissions', label: 'Role Permissions', icon: <KeyOutlined /> },
      { to: '/settings', label: 'Lab Settings', icon: <SettingOutlined /> },
    ],
  },
];

export default function Hub() {
  const nav = useNavigate();
  const user = getUser();
  const isAdmin = user?.role === 'LAB_ADMIN';

  const sections = SECTIONS
    .filter((s) => !s.adminOnly || isAdmin)
    .map((s) => ({ ...s, tools: s.tools.filter((t) => !t.perm || hasPermission(t.perm)) }))
    .filter((s) => s.tools.length > 0);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Welcome{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''} 👋</Title>
        <Text type="secondary">{user?.lab?.name ?? 'CLMS'} — pick a section to get started.</Text>
      </div>

      <Row gutter={[20, 20]}>
        {sections.map((s) => (
          <Col xs={24} sm={12} lg={8} key={s.key}>
            <Card
              hoverable
              style={{ borderRadius: 16, height: '100%', borderTop: `4px solid ${s.color}` }}
              styles={{ body: { padding: 20 } }}
              onClick={() => nav(s.tools[0].to)}
            >
              <Space align="start" style={{ marginBottom: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 24, color: '#fff', background: s.color,
                }}>
                  {s.icon}
                </div>
                <div>
                  <Text strong style={{ fontSize: 16 }}>{s.title}</Text>
                  <div><Text type="secondary" style={{ fontSize: 12 }}>{s.description}</Text></div>
                </div>
              </Space>

              <div style={{ marginTop: 8 }}>
                {s.tools.map((t) => (
                  <div
                    key={t.to}
                    onClick={(e) => { e.stopPropagation(); nav(t.to); }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '7px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f7fa')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Space size={8}>
                      <span style={{ color: s.color }}>{t.icon}</span>
                      <Text style={{ fontSize: 13 }}>{t.label}</Text>
                    </Space>
                    <RightOutlined style={{ fontSize: 11, color: '#bbb' }} />
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 8 }}>
                <Tag color={s.color} style={{ borderRadius: 12 }}>{s.tools.length} tool{s.tools.length === 1 ? '' : 's'}</Tag>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}

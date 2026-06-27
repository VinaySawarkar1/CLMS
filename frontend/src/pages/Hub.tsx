import { useNavigate } from 'react-router-dom';
import { Avatar, Badge, Button, Col, Dropdown, Row, Space, Tag, Typography } from 'antd';
import {
  DashboardOutlined, ExperimentOutlined, ToolOutlined, SafetyOutlined, SettingOutlined,
  TeamOutlined, GoldOutlined, ApartmentOutlined, FileTextOutlined, SafetyCertificateOutlined,
  CheckSquareOutlined, UserOutlined, DatabaseOutlined, CloudOutlined, AlertOutlined,
  StarOutlined, BarChartOutlined, FileSyncOutlined, BellOutlined, UsergroupAddOutlined,
  KeyOutlined, RightOutlined, LogoutOutlined, BankOutlined, ExperimentFilled,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import { getUser, hasPermission, logout } from '../api';

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

const SECTION_COLORS: Record<string, string> = {
  dashboard: '#e6f0ff',
  calibration: '#f0fff4',
  operations: '#fff7e6',
  quality: '#fff0f6',
  admin: '#f5f0ff',
};

export default function Hub({ onLogout }: { onLogout: () => void }) {
  const nav = useNavigate();
  const user = getUser();
  const isAdmin = user?.role === 'LAB_ADMIN';

  const sections = SECTIONS
    .filter((s) => !s.adminOnly || isAdmin)
    .map((s) => ({ ...s, tools: s.tools.filter((t) => !t.perm || hasPermission(t.perm)) }))
    .filter((s) => s.tools.length > 0);

  const userMenu = {
    items: [
      { key: 'settings', label: 'Settings', icon: <SettingOutlined /> },
      { type: 'divider' as const },
      { key: 'logout', label: 'Sign Out', icon: <LogoutOutlined />, danger: true },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'logout') { logout(); onLogout(); }
      else if (key === 'settings') nav('/settings');
    },
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{
        height: 60, background: '#fff', borderBottom: '1px solid #e8e8e8',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 4px rgba(0,21,41,.06)',
      }}>
        {/* Logo */}
        <Space size={12}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: '#1677ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ExperimentFilled style={{ color: '#fff', fontSize: 18 }} />
          </div>
          <div style={{ lineHeight: '18px' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e' }}>CLMS</div>
            <div style={{ fontSize: 11, color: '#8c9db5' }}>Calibration Lab Management</div>
          </div>
          {user?.lab?.name && (
            <Tag icon={<BankOutlined />} color="blue" style={{ marginLeft: 8 }}>{user.lab.name}</Tag>
          )}
        </Space>

        {/* Right: bell + user */}
        <Space size="middle">
          <Badge count={0} size="small">
            <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} shape="circle" />
          </Badge>
          <Dropdown menu={userMenu} trigger={['click']}>
            <Space style={{ cursor: 'pointer' }}>
              <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />} size={32} />
              <div style={{ lineHeight: '16px' }}>
                <div style={{ color: '#333', fontWeight: 500, fontSize: 13 }}>{user?.fullName ?? 'User'}</div>
                <div style={{ color: '#8c8c8c', fontSize: 11 }}>{user?.role?.replace(/_/g, ' ')}</div>
              </div>
            </Space>
          </Dropdown>
        </Space>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '40px 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Greeting */}
          <div style={{ marginBottom: 36, textAlign: 'center' }}>
            <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#1a1a2e' }}>
              Welcome{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''} 👋
            </Title>
            <Text type="secondary" style={{ fontSize: 15 }}>
              {user?.lab?.name ?? 'CLMS'} — Select a module to get started
            </Text>
          </div>

          {/* App tiles grid */}
          <Row gutter={[24, 24]}>
            {sections.map((s) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={s.key}>
                <div
                  onClick={() => nav(s.tools[0].to)}
                  style={{
                    background: '#fff',
                    borderRadius: 16,
                    padding: 0,
                    cursor: 'pointer',
                    border: '1px solid #e8e8e8',
                    overflow: 'hidden',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                  }}
                >
                  {/* Card header */}
                  <div style={{
                    padding: '20px 20px 16px',
                    background: SECTION_COLORS[s.key] ?? '#f9f9f9',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex', alignItems: 'center', gap: 14,
                  }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 14,
                      background: s.color, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 26, color: '#fff', flexShrink: 0,
                      boxShadow: `0 4px 12px ${s.color}55`,
                    }}>
                      {s.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e' }}>{s.title}</div>
                      <div style={{ fontSize: 11, color: '#888', marginTop: 2, lineHeight: '14px' }}>{s.description}</div>
                    </div>
                  </div>

                  {/* Tool links */}
                  <div style={{ padding: '10px 12px 12px' }}>
                    {s.tools.map((t) => (
                      <div
                        key={t.to}
                        onClick={(e) => { e.stopPropagation(); nav(t.to); }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '7px 8px', borderRadius: 8, cursor: 'pointer',
                          marginBottom: 2, transition: 'background 0.1s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f7fa')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Space size={8}>
                          <span style={{ color: s.color, fontSize: 14 }}>{t.icon}</span>
                          <Text style={{ fontSize: 13, color: '#333' }}>{t.label}</Text>
                        </Space>
                        <RightOutlined style={{ fontSize: 10, color: '#ccc' }} />
                      </div>
                    ))}
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '16px 0', color: '#bbb', fontSize: 12 }}>
        CLMS — Calibration Laboratory Management System
      </div>
    </div>
  );
}

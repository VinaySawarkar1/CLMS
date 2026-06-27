import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout as AntLayout, Avatar, Typography, Space, Dropdown, Badge, Tag } from 'antd';
import {
  DashboardOutlined, TeamOutlined, ToolOutlined, FileTextOutlined,
  SafetyCertificateOutlined, CheckSquareOutlined, UserOutlined,
  DatabaseOutlined, CloudOutlined, AlertOutlined,
  BellOutlined, LogoutOutlined, ExperimentFilled,
  SettingOutlined, BankOutlined, UsergroupAddOutlined, KeyOutlined,
  GoldOutlined, BarChartOutlined, FileSyncOutlined, SafetyOutlined,
  ApartmentOutlined, StarOutlined,
  ShoppingCartOutlined, CarOutlined, DollarOutlined, FileDoneOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { logout, getUser, hasPermission } from './api';

const { Header, Content } = AntLayout;
const { Text } = Typography;

type NavLeaf = { key: string; label: string; icon: ReactNode; perm?: string };
type NavGroup = { key: string; label: string; children: NavLeaf[] };

const NAV_GROUPS: NavGroup[] = [
  {
    key: 'crm', label: 'CRM & Sales',
    children: [
      { key: '/customers', label: 'Customers', icon: <TeamOutlined />, perm: 'customers' },
      { key: '/quotations', label: 'Quotations', icon: <FileDoneOutlined />, perm: 'billing' },
      { key: '/purchase-orders', label: 'Purchase Orders', icon: <ShoppingCartOutlined />, perm: 'billing' },
      { key: '/delivery-challans', label: 'Delivery Challans', icon: <CarOutlined />, perm: 'billing' },
      { key: '/invoices', label: 'Invoices', icon: <DollarOutlined />, perm: 'billing' },
    ],
  },
  {
    key: 'calibration', label: 'Calibration',
    children: [
      { key: '/instruments', label: 'Instrument Entry', icon: <ToolOutlined />, perm: 'instruments' },
      { key: '/reference-standards', label: 'Reference Standards', icon: <GoldOutlined />, perm: 'instruments' },
      { key: '/calibration-masters', label: 'Calibration Masters', icon: <ApartmentOutlined />, perm: 'instruments' },
      { key: '/jobs', label: 'Jobs', icon: <FileTextOutlined />, perm: 'jobs' },
      { key: '/certificates', label: 'Certificates', icon: <SafetyCertificateOutlined />, perm: 'certificates' },
    ],
  },
  {
    key: 'operations', label: 'Operations',
    children: [
      { key: '/tasks', label: 'Task Board', icon: <CheckSquareOutlined />, perm: 'tasks' },
      { key: '/engineers', label: 'Engineers', icon: <UserOutlined />, perm: 'engineers' },
      { key: '/inventory', label: 'Inventory', icon: <DatabaseOutlined />, perm: 'inventory' },
      { key: '/environmental', label: 'Environmental', icon: <CloudOutlined />, perm: 'environmental' },
    ],
  },
  {
    key: 'quality', label: 'Quality & Compliance',
    children: [
      { key: '/quality', label: 'NCR / CAPA', icon: <AlertOutlined />, perm: 'quality' },
      { key: '/complaints', label: 'Complaints', icon: <AlertOutlined />, perm: 'quality' },
      { key: '/feedback', label: 'Customer Feedback', icon: <StarOutlined />, perm: 'quality' },
      { key: '/reports', label: 'Reports', icon: <BarChartOutlined />, perm: 'jobs' },
      { key: '/documents', label: 'Documents', icon: <FileSyncOutlined />, perm: 'quality' },
      { key: '/internal-audit', label: 'Internal Audit', icon: <SafetyOutlined />, perm: 'audit' },
      { key: '/notifications', label: 'Notifications', icon: <BellOutlined />, perm: 'notifications' },
    ],
  },
  {
    key: 'admin', label: 'Administration',
    children: [
      { key: '/users', label: 'Users', icon: <UsergroupAddOutlined /> },
      { key: '/permissions', label: 'Role Permissions', icon: <KeyOutlined /> },
      { key: '/settings', label: 'Lab Settings', icon: <SettingOutlined /> },
    ],
  },
];

const SUPER_ADMIN_TABS: NavLeaf[] = [
  { key: '/dashboard', label: 'Dashboard', icon: <DashboardOutlined /> },
  { key: '/labs', label: 'Labs', icon: <BankOutlined /> },
];

const SECTION_COLORS: Record<string, string> = {
  crm: '#13c2c2', calibration: '#52c41a', operations: '#fa8c16',
  quality: '#eb2f96', admin: '#722ed1',
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Platform Admin', LAB_ADMIN: 'Lab Admin',
  TECHNICAL_MANAGER: 'Technical Manager', CALIBRATION_ENGINEER: 'Calibration Engineer',
  SERVICE_ENGINEER: 'Service Engineer', DATA_ENTRY_OPERATOR: 'Data Entry Operator',
};

export default function Layout({ children, onLogout }: { children: ReactNode; onLogout: () => void }) {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const user = getUser();
  const role = user?.role ?? '';

  const activeSection = localStorage.getItem('activeSection');
  const accentColor = SECTION_COLORS[activeSection ?? ''] ?? '#1677ff';

  const goToHub = () => {
    localStorage.removeItem('activeSection');
    nav('/');
  };

  // Build tabs for the current section
  let tabs: NavLeaf[] = [];
  if (role === 'SUPER_ADMIN') {
    tabs = SUPER_ADMIN_TABS;
  } else if (activeSection) {
    const group = NAV_GROUPS.find((g) => g.key === activeSection);
    if (group) {
      tabs = group.children.filter((c) => !c.perm || hasPermission(c.perm));
    }
  } else {
    // fallback: derive section from current path
    const matched = NAV_GROUPS.find((g) =>
      g.children.some((c) => c.key === '/' + pathname.split('/')[1])
    );
    tabs = matched ? matched.children.filter((c) => !c.perm || hasPermission(c.perm)) : [];
  }

  const selectedKey = pathname === '/' ? '/' : ('/' + pathname.split('/')[1]);

  const userMenuItems = [
    { key: 'settings', label: 'Settings', icon: <SettingOutlined /> },
    { type: 'divider' as const },
    { key: 'logout', label: 'Sign Out', icon: <LogoutOutlined />, danger: true },
  ];

  const handleUserMenu = ({ key }: { key: string }) => {
    if (key === 'logout') { logout(); onLogout(); }
    else if (key === 'settings') { localStorage.setItem('activeSection', 'admin'); nav('/settings'); }
  };

  return (
    <AntLayout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* ── Top header bar ── */}
      <Header style={{
        position: 'sticky', top: 0, zIndex: 100, background: '#fff', padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(0,21,41,.08)', height: 56,
      }}>
        {/* Left: logo + back to hub */}
        <Space size={16}>
          <div
            onClick={goToHub}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              cursor: 'pointer', padding: '6px 12px 6px 0',
              borderRight: '1px solid #f0f0f0',
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: '#1677ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ExperimentFilled style={{ color: '#fff', fontSize: 16 }} />
            </div>
            <div style={{ lineHeight: '16px' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a2e' }}>CLMS</div>
              <div style={{ fontSize: 10, color: '#8c9db5' }}>
                {role === 'SUPER_ADMIN' ? 'Platform Console' : (user?.lab?.name ?? 'Lab')}
              </div>
            </div>
            <HomeOutlined style={{ fontSize: 12, color: '#aaa', marginLeft: 4 }} />
          </div>

          {/* Active module label */}
          {activeSection && (
            <Tag color={accentColor} style={{ fontWeight: 600, fontSize: 12 }}>
              {NAV_GROUPS.find((g) => g.key === activeSection)?.label ?? activeSection}
            </Tag>
          )}
          {user?.lab?.name && role !== 'SUPER_ADMIN' && !activeSection && (
            <Tag color="blue" icon={<BankOutlined />}>{user.lab.name}</Tag>
          )}
        </Space>

        {/* Right: bell + user */}
        <Space size="middle">
          <Badge count={0} size="small">
            <BellOutlined style={{ fontSize: 18, color: '#666', cursor: 'pointer' }} />
          </Badge>
          <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenu }} trigger={['click']}>
            <Space style={{ cursor: 'pointer' }}>
              <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />} size={30} />
              <div style={{ lineHeight: '16px' }}>
                <div style={{ color: '#333', fontWeight: 500, fontSize: 13 }}>{user?.fullName ?? 'User'}</div>
                <div style={{ color: '#8c8c8c', fontSize: 11 }}>{ROLE_LABELS[role] ?? role}</div>
              </div>
            </Space>
          </Dropdown>
        </Space>
      </Header>

      {/* ── Module tab bar ── */}
      {tabs.length > 0 && (
        <div style={{
          position: 'sticky', top: 56, zIndex: 99,
          background: '#fff', borderBottom: `2px solid ${accentColor}22`,
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
          padding: '0 24px', display: 'flex', alignItems: 'stretch', gap: 4,
          overflowX: 'auto', whiteSpace: 'nowrap',
        }}>
          {tabs.map((tab) => {
            const active = selectedKey === tab.key;
            return (
              <div
                key={tab.key}
                onClick={() => nav(tab.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '10px 16px', cursor: 'pointer', fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? accentColor : '#555',
                  borderBottom: active ? `2px solid ${accentColor}` : '2px solid transparent',
                  marginBottom: -2,
                  transition: 'color 0.15s, border-color 0.15s',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = accentColor; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = '#555'; }}
              >
                <span style={{ fontSize: 14 }}>{tab.icon}</span>
                <span>{tab.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Page content ── */}
      <Content style={{ padding: '24px', minHeight: 'calc(100vh - 108px)' }}>
        {children}
      </Content>
    </AntLayout>
  );
}

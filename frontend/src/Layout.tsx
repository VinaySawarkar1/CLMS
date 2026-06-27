import type { ReactNode } from 'react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout as AntLayout, Menu, Button, Avatar, Typography, Space, Dropdown, Badge, Tag } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined, TeamOutlined, ToolOutlined, FileTextOutlined,
  SafetyCertificateOutlined, CheckSquareOutlined, UserOutlined,
  DatabaseOutlined, CloudOutlined, AlertOutlined,
  BellOutlined, LogoutOutlined, ExperimentOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, SettingOutlined,
  BankOutlined, UsergroupAddOutlined, KeyOutlined,
  GoldOutlined, BarChartOutlined, FileSyncOutlined, SafetyOutlined,
  ApartmentOutlined, StarOutlined, AppstoreOutlined,
  ShoppingCartOutlined, CarOutlined, DollarOutlined, FileDoneOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { logout, getUser, hasPermission } from './api';

const { Header, Sider, Content } = AntLayout;
const { Text } = Typography;

type NavLeaf = { key: string; label: string; icon: ReactNode; perm?: string };
type NavGroup = { key: string; label: string; children: NavLeaf[] };

// Each leaf carries an optional `perm` key. Items without a perm are always shown.
const NAV_GROUPS: NavGroup[] = [
  {
    key: 'overview', label: 'Overview',
    children: [
      { key: '/', label: 'Home', icon: <AppstoreOutlined /> },
      { key: '/dashboard', label: 'Dashboard', icon: <DashboardOutlined /> },
    ],
  },
  // Note: '/' navigates back to the Hub launcher (full-screen, no sidebar)
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
];

const ADMIN_NAV_GROUP = {
  key: 'admin', label: 'Administration',
  children: [
    { key: '/users', label: 'Users', icon: <UsergroupAddOutlined /> },
    { key: '/permissions', label: 'Role Permissions', icon: <KeyOutlined /> },
    { key: '/settings', label: 'Lab Settings', icon: <SettingOutlined /> },
  ],
};

function buildMenu(role: string, activeSection: string | null): MenuProps['items'] {
  const items: MenuProps['items'] = [];

  // SUPER_ADMIN: platform administration only
  if (role === 'SUPER_ADMIN') {
    items.push({
      key: 'platform', label: 'Platform', type: 'group',
      children: [
        { key: '/', label: 'Dashboard', icon: <DashboardOutlined /> },
        { key: '/labs', label: 'Labs', icon: <BankOutlined /> },
      ],
    });
    return items;
  }

  // Determine which groups to show
  const groupsToShow = activeSection
    ? NAV_GROUPS.filter((g) => g.key === activeSection)
    : NAV_GROUPS;

  for (const group of groupsToShow) {
    const children = group.children.filter((c) => !c.perm || hasPermission(c.perm));
    if (children.length) {
      items.push({ key: group.key, label: group.label, type: 'group', children });
    }
  }

  // LAB_ADMIN admin section — show when in admin section or no active section
  if (role === 'LAB_ADMIN' && (!activeSection || activeSection === 'admin')) {
    items.push({ ...ADMIN_NAV_GROUP, type: 'group' });
  }

  return items;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Platform Admin',
  LAB_ADMIN: 'Lab Admin',
  TECHNICAL_MANAGER: 'Technical Manager',
  CALIBRATION_ENGINEER: 'Calibration Engineer',
  SERVICE_ENGINEER: 'Service Engineer',
  DATA_ENTRY_OPERATOR: 'Data Entry Operator',
};

export default function Layout({ children, onLogout }: { children: ReactNode; onLogout: () => void }) {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const user = getUser();
  const role = user?.role ?? '';

  const activeSection = localStorage.getItem('activeSection');

  const goToHub = () => {
    localStorage.removeItem('activeSection');
    nav('/');
  };

  const selectedKey = pathname === '/' ? '/' : ('/' + pathname.split('/')[1]);
  const menuItems = buildMenu(role, activeSection);

  const userMenuItems = [
    { key: 'settings', label: 'Settings', icon: <SettingOutlined /> },
    { type: 'divider' as const },
    { key: 'logout', label: 'Sign Out', icon: <LogoutOutlined />, danger: true },
  ];

  const handleUserMenu = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
      onLogout();
    } else if (key === 'settings') {
      localStorage.setItem('activeSection', 'admin');
      nav('/settings');
    }
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={240}
        style={{
          background: '#001529', position: 'fixed', height: '100vh',
          left: 0, top: 0, bottom: 0, zIndex: 100, overflowY: 'auto', overflowX: 'hidden',
        }}
      >
        <div style={{
          height: 64, display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '0' : '0 20px', background: '#002140',
          borderBottom: '1px solid #0d3a6e', flexShrink: 0,
        }}>
          <ExperimentOutlined style={{ fontSize: 22, color: '#1677ff', flexShrink: 0 }} />
          {!collapsed && (
            <div style={{ marginLeft: 12, overflow: 'hidden' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: '18px', whiteSpace: 'nowrap' }}>CLMS</div>
              <div style={{ color: '#8c9db5', fontSize: 10, whiteSpace: 'nowrap' }}>
                {role === 'SUPER_ADMIN' ? 'Platform Console' : (user?.lab?.name ?? 'Calibration Lab')}
              </div>
            </div>
          )}
        </div>

        {/* Back to Hub button */}
        <div
          onClick={goToHub}
          style={{
            display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10,
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '10px 0' : '10px 20px',
            cursor: 'pointer', borderBottom: '1px solid #0d3a6e',
            color: '#8c9db5', fontSize: 12, transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#8c9db5')}
        >
          <HomeOutlined style={{ fontSize: 14, flexShrink: 0 }} />
          {!collapsed && <span>Back to Hub</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => nav(key)}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>

      <AntLayout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s' }}>
        <Header style={{
          position: 'sticky', top: 0, zIndex: 99, background: '#fff', padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)', height: 64,
        }}>
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16, width: 40, height: 40 }}
            />
            {user?.lab?.name && role !== 'SUPER_ADMIN' && (
              <Tag color="blue" icon={<BankOutlined />}>{user.lab.name}</Tag>
            )}
          </Space>
          <Space size="middle">
            <Badge count={0} size="small">
              <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} shape="circle" />
            </Badge>
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenu }} trigger={['click']}>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />} size={32} />
                <div style={{ lineHeight: '16px' }}>
                  <div style={{ color: '#333', fontWeight: 500, fontSize: 13 }}>{user?.fullName ?? 'User'}</div>
                  <div style={{ color: '#8c8c8c', fontSize: 11 }}>{ROLE_LABELS[role] ?? role}</div>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ margin: '24px', minHeight: 'calc(100vh - 112px)' }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
}

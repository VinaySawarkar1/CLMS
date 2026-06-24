import type { ReactNode } from 'react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout as AntLayout, Menu, Button, Avatar, Typography, Space, Dropdown, Badge } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined, TeamOutlined, ToolOutlined, FileTextOutlined,
  SafetyCertificateOutlined, CheckSquareOutlined, UserOutlined,
  DatabaseOutlined, CloudOutlined, AlertOutlined, DollarOutlined,
  HistoryOutlined, BellOutlined, LogoutOutlined, ExperimentOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, SettingOutlined,
} from '@ant-design/icons';
import { logout } from './api';

const { Header, Sider, Content } = AntLayout;
const { Text } = Typography;

const NAV_ITEMS: MenuProps['items'] = [
  {
    key: 'overview',
    label: 'Overview',
    type: 'group',
    children: [
      { key: '/', label: 'Dashboard', icon: <DashboardOutlined /> },
    ],
  },
  {
    key: 'calibration',
    label: 'Calibration',
    type: 'group',
    children: [
      { key: '/customers', label: 'Customers', icon: <TeamOutlined /> },
      { key: '/instruments', label: 'Instrument Entry', icon: <ToolOutlined /> },
      { key: '/jobs', label: 'Jobs', icon: <FileTextOutlined /> },
      { key: '/certificates', label: 'Certificates', icon: <SafetyCertificateOutlined /> },
    ],
  },
  {
    key: 'operations',
    label: 'Operations',
    type: 'group',
    children: [
      { key: '/tasks', label: 'Task Board', icon: <CheckSquareOutlined /> },
      { key: '/engineers', label: 'Engineers', icon: <UserOutlined /> },
      { key: '/inventory', label: 'Inventory', icon: <DatabaseOutlined /> },
      { key: '/environmental', label: 'Environmental', icon: <CloudOutlined /> },
    ],
  },
  {
    key: 'quality',
    label: 'Quality & Finance',
    type: 'group',
    children: [
      { key: '/quality', label: 'NCR / CAPA', icon: <AlertOutlined /> },
      { key: '/billing', label: 'Billing', icon: <DollarOutlined /> },
      { key: '/audit', label: 'Audit Trail', icon: <HistoryOutlined /> },
      { key: '/notifications', label: 'Notifications', icon: <BellOutlined /> },
    ],
  },
];

export default function Layout({ children, onLogout }: { children: ReactNode; onLogout: () => void }) {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const selectedKey = pathname === '/' ? '/' : ('/' + pathname.split('/')[1]);

  const userMenuItems = [
    { key: 'settings', label: 'Settings', icon: <SettingOutlined /> },
    { type: 'divider' as const },
    {
      key: 'logout',
      label: 'Sign Out',
      icon: <LogoutOutlined />,
      danger: true,
    },
  ];

  const handleUserMenu = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
      onLogout();
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
          background: '#001529',
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '0' : '0 20px',
          background: '#002140',
          borderBottom: '1px solid #0d3a6e',
          flexShrink: 0,
        }}>
          <ExperimentOutlined style={{ fontSize: 22, color: '#1677ff', flexShrink: 0 }} />
          {!collapsed && (
            <div style={{ marginLeft: 12, overflow: 'hidden' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: '18px', whiteSpace: 'nowrap' }}>CLMS</div>
              <div style={{ color: '#8c9db5', fontSize: 10, whiteSpace: 'nowrap' }}>Calibration Lab Management</div>
            </div>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={NAV_ITEMS}
          onClick={({ key }) => nav(key)}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>

      <AntLayout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s' }}>
        <Header style={{
          position: 'sticky',
          top: 0,
          zIndex: 99,
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          height: 64,
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16, width: 40, height: 40 }}
          />
          <Space>
            <Badge count={0} size="small">
              <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} shape="circle" />
            </Badge>
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenu }} trigger={['click']}>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />} size={32} />
                <Text style={{ color: '#333', fontWeight: 500 }}>Admin</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{
          margin: '24px',
          minHeight: 'calc(100vh - 112px)',
        }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
}

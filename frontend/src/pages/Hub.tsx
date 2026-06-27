import { useNavigate } from 'react-router-dom';
import { Avatar, Badge, Dropdown, Space, Tag, Typography } from 'antd';
import {
  DashboardOutlined, ExperimentOutlined, ToolOutlined, SafetyOutlined, SettingOutlined,
  TeamOutlined, GoldOutlined, ApartmentOutlined, FileTextOutlined, SafetyCertificateOutlined,
  CheckSquareOutlined, UserOutlined, DatabaseOutlined, CloudOutlined, AlertOutlined,
  StarOutlined, BarChartOutlined, FileSyncOutlined, BellOutlined, UsergroupAddOutlined,
  KeyOutlined, RightOutlined, LogoutOutlined, BankOutlined, ExperimentFilled,
  ShoppingCartOutlined, CarOutlined, DollarOutlined, FileDoneOutlined, ArrowRightOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import { getUser, hasPermission, logout } from '../api';

const { Title, Text } = Typography;

type Tool = { to: string; label: string; icon: ReactNode; perm?: string };
type Section = {
  key: string; title: string; description: string;
  icon: ReactNode; color: string; bgColor: string;
  tools: Tool[]; adminOnly?: boolean;
};

const SECTIONS: Section[] = [
  {
    key: 'dashboard', title: 'Dashboard',
    description: 'KPIs, workload & lab overview at a glance.',
    icon: <DashboardOutlined />, color: '#1677ff', bgColor: '#e6f0ff',
    tools: [{ to: '/dashboard', label: 'Open Dashboard', icon: <DashboardOutlined /> }],
  },
  {
    key: 'crm', title: 'CRM & Sales',
    description: 'Customers, quotations, purchase orders, delivery & invoices.',
    icon: <TeamOutlined />, color: '#13c2c2', bgColor: '#e6fffb',
    tools: [
      { to: '/customers', label: 'Customers', icon: <TeamOutlined />, perm: 'customers' },
      { to: '/quotations', label: 'Quotations', icon: <FileDoneOutlined />, perm: 'billing' },
      { to: '/purchase-orders', label: 'Purchase Orders', icon: <ShoppingCartOutlined />, perm: 'billing' },
      { to: '/delivery-challans', label: 'Delivery Challans', icon: <CarOutlined />, perm: 'billing' },
      { to: '/invoices', label: 'Invoices', icon: <DollarOutlined />, perm: 'billing' },
    ],
  },
  {
    key: 'calibration', title: 'Calibration',
    description: 'Instruments, standards, jobs & certificates.',
    icon: <ExperimentOutlined />, color: '#52c41a', bgColor: '#f0fff4',
    tools: [
      { to: '/instruments', label: 'Instrument Entry', icon: <ToolOutlined />, perm: 'instruments' },
      { to: '/reference-standards', label: 'Reference Standards', icon: <GoldOutlined />, perm: 'instruments' },
      { to: '/calibration-masters', label: 'Calibration Masters', icon: <ApartmentOutlined />, perm: 'instruments' },
      { to: '/jobs', label: 'Jobs', icon: <FileTextOutlined />, perm: 'jobs' },
      { to: '/certificates', label: 'Certificates', icon: <SafetyCertificateOutlined />, perm: 'certificates' },
    ],
  },
  {
    key: 'operations', title: 'Operations',
    description: 'Task board, engineers, inventory & environment.',
    icon: <ToolOutlined />, color: '#fa8c16', bgColor: '#fff7e6',
    tools: [
      { to: '/tasks', label: 'Task Board', icon: <CheckSquareOutlined />, perm: 'tasks' },
      { to: '/engineers', label: 'Engineers', icon: <UserOutlined />, perm: 'engineers' },
      { to: '/inventory', label: 'Inventory', icon: <DatabaseOutlined />, perm: 'inventory' },
      { to: '/environmental', label: 'Environmental', icon: <CloudOutlined />, perm: 'environmental' },
    ],
  },
  {
    key: 'quality', title: 'Quality & Compliance',
    description: 'NCR/CAPA, complaints, feedback, reports & audit.',
    icon: <SafetyOutlined />, color: '#eb2f96', bgColor: '#fff0f6',
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
    key: 'admin', title: 'Administration',
    description: 'Users, role permissions & lab settings.',
    icon: <SettingOutlined />, color: '#722ed1', bgColor: '#f5f0ff',
    adminOnly: true,
    tools: [
      { to: '/users', label: 'Users', icon: <UsergroupAddOutlined /> },
      { to: '/permissions', label: 'Role Permissions', icon: <KeyOutlined /> },
      { to: '/settings', label: 'Lab Settings', icon: <SettingOutlined /> },
    ],
  },
];

export default function Hub({ onLogout }: { onLogout: () => void }) {
  const nav = useNavigate();
  const user = getUser();
  const isAdmin = user?.role === 'LAB_ADMIN';

  const sections = SECTIONS
    .filter((s) => !s.adminOnly || isAdmin)
    .map((s) => ({ ...s, tools: s.tools.filter((t) => !t.perm || hasPermission(t.perm)) }))
    .filter((s) => s.tools.length > 0);

  const [dashboard, ...moduleSections] = sections;

  const goTo = (sectionKey: string, path: string) => {
    localStorage.setItem('activeSection', sectionKey);
    nav(path);
  };

  const userMenu = {
    items: [
      { key: 'settings', label: 'Settings', icon: <SettingOutlined /> },
      { type: 'divider' as const },
      { key: 'logout', label: 'Sign Out', icon: <LogoutOutlined />, danger: true },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'logout') { logout(); onLogout(); }
      else if (key === 'settings') { localStorage.setItem('activeSection', 'admin'); nav('/settings'); }
    },
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fb', display: 'flex', flexDirection: 'column' }}>

      {/* ── Top bar ── */}
      <div style={{
        height: 60, background: '#fff', borderBottom: '1px solid #ebebeb',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 4px rgba(0,21,41,.06)',
      }}>
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
        <Space size="middle">
          <Badge count={0} size="small">
            <BellOutlined style={{ fontSize: 18, color: '#666', cursor: 'pointer' }} />
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

      {/* ── Main ── */}
      <div style={{ flex: 1, padding: '32px 32px 40px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>

        {/* Greeting */}
        <div style={{ marginBottom: 28 }}>
          <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#1a1a2e' }}>
            Welcome back, {user?.fullName?.split(' ')[0] ?? 'User'} 👋
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            {user?.lab?.name ?? 'CLMS'} — Select a module to get started
          </Text>
        </div>

        {/* Dashboard hero banner */}
        {dashboard && (
          <div
            onClick={() => goTo(dashboard.key, dashboard.tools[0].to)}
            style={{
              background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
              borderRadius: 16, padding: '24px 32px', marginBottom: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', boxShadow: '0 4px 20px #1677ff33',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 28px #1677ff44';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px #1677ff33';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, color: '#fff',
              }}>
                <DashboardOutlined />
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, lineHeight: '22px' }}>Dashboard</div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4 }}>
                  {dashboard.description}
                </div>
              </div>
            </div>
            <ArrowRightOutlined style={{ color: 'rgba(255,255,255,0.8)', fontSize: 20 }} />
          </div>
        )}

        {/* Module grid — 3 columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
          gap: 20,
        }}>
          {moduleSections.map((s) => (
            <ModuleCard key={s.key} section={s} goTo={goTo} />
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '12px 0', color: '#ccc', fontSize: 11 }}>
        CLMS — Calibration Laboratory Management System
      </div>
    </div>
  );
}

function ModuleCard({ section: s, goTo }: { section: Section; goTo: (key: string, path: string) => void }) {
  return (
    <div
      style={{
        background: '#fff', borderRadius: 14,
        border: '1px solid #ebebeb',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        transition: 'transform 0.15s, box-shadow 0.15s',
        display: 'flex', flexDirection: 'column',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
      }}
    >
      {/* Card header — clickable to enter module at first page */}
      <div
        onClick={() => goTo(s.key, s.tools[0].to)}
        style={{
          padding: '18px 20px 14px', background: s.bgColor,
          borderBottom: `1px solid ${s.color}22`,
          display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
        }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: 13, background: s.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, color: '#fff', flexShrink: 0,
          boxShadow: `0 3px 10px ${s.color}44`,
        }}>
          {s.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e' }}>{s.title}</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2, lineHeight: '15px' }}>{s.description}</div>
        </div>
        <RightOutlined style={{ fontSize: 12, color: s.color, opacity: 0.6, flexShrink: 0 }} />
      </div>

      {/* Tool links */}
      <div style={{ padding: '8px 10px 10px', flex: 1 }}>
        {s.tools.map((t) => (
          <div
            key={t.to}
            onClick={() => goTo(s.key, t.to)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
              marginBottom: 2, transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = `${s.color}0f`)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                color: s.color, fontSize: 15,
                width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {t.icon}
              </span>
              <span style={{ fontSize: 13, color: '#333', fontWeight: 450 }}>{t.label}</span>
            </div>
            <RightOutlined style={{ fontSize: 9, color: '#ccc' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

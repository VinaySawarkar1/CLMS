import type { ReactNode } from 'react';
import {
  AppBar,
  Box,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Toolbar,
  Typography,
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { logout } from './api';

const NAV: Array<{ group: string; items: Array<{ to: string; label: string }> }> = [
  {
    group: 'Overview',
    items: [{ to: '/', label: 'Dashboard' }],
  },
  {
    group: 'Calibration',
    items: [
      { to: '/customers', label: 'Customers' },
      { to: '/instruments', label: 'Instrument Entry' },
      { to: '/jobs', label: 'Jobs' },
      { to: '/certificates', label: 'Certificates' },
    ],
  },
  {
    group: 'Operations',
    items: [
      { to: '/tasks', label: 'Task Board' },
      { to: '/engineers', label: 'Engineers' },
      { to: '/inventory', label: 'Inventory' },
      { to: '/environmental', label: 'Environmental' },
    ],
  },
  {
    group: 'Quality & Finance',
    items: [
      { to: '/quality', label: 'NCR / CAPA' },
      { to: '/billing', label: 'Billing' },
      { to: '/audit', label: 'Audit Trail' },
      { to: '/notifications', label: 'Notifications' },
    ],
  },
];

const DRAWER_WIDTH = 230;

export default function Layout({
  children,
  onLogout,
}: {
  children: ReactNode;
  onLogout: () => void;
}) {
  const { pathname } = useLocation();
  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            CLMS — Calibration Laboratory Management System
          </Typography>
          <Button
            color="inherit"
            onClick={() => {
              logout();
              onLogout();
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          {NAV.map((section) => (
            <List
              key={section.group}
              dense
              subheader={
                <ListSubheader sx={{ bgcolor: 'transparent', lineHeight: '32px' }}>
                  {section.group}
                </ListSubheader>
              }
            >
              {section.items.map((n) => (
                <ListItemButton
                  key={n.to}
                  component={Link}
                  to={n.to}
                  selected={pathname === n.to}
                >
                  <ListItemText primary={n.label} />
                </ListItemButton>
              ))}
            </List>
          ))}
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh', bgcolor: '#fafafa' }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

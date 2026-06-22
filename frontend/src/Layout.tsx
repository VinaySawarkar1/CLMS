import {
  AppBar,
  Box,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { logout } from './api';

const NAV = [
  { to: '/', label: 'Dashboard' },
  { to: '/jobs', label: 'Jobs' },
  { to: '/customers', label: 'Customers' },
  { to: '/tasks', label: 'Tasks' },
];

const DRAWER_WIDTH = 220;

export default function Layout({
  children,
  onLogout,
}: {
  children: React.ReactNode;
  onLogout: () => void;
}) {
  const { pathname } = useLocation();
  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            CLMS
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
        <List>
          {NAV.map((n) => (
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
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

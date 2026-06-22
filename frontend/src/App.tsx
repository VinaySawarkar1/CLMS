import { useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  Container,
  Grid,
  Paper,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import { login, logout } from './api';

const WIDGETS = [
  "Today's Jobs",
  'Pending Jobs',
  'Engineers Working',
  'Revenue',
  'Due Instruments',
  'Master Due',
  'Certificates Issued',
  'Overdue Jobs',
];

function Dashboard({ onLogout }: { onLogout: () => void }) {
  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            CLMS — Calibration Laboratory Management System
          </Typography>
          <Button color="inherit" onClick={onLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Dashboard
        </Typography>
        <Grid container spacing={2}>
          {WIDGETS.map((w) => (
            <Grid item xs={12} sm={6} md={3} key={w}>
              <Paper sx={{ p: 2, height: 100 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {w}
                </Typography>
                <Typography variant="h4">—</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      onSuccess();
    } catch {
      setError('Invalid credentials');
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 12 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          CLMS Sign In
        </Typography>
        <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 2 }}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <Typography color="error">{error}</Typography>}
          <Button type="submit" variant="contained">
            Sign In
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(
    Boolean(localStorage.getItem('clms_access_token')),
  );

  if (!authed) return <LoginForm onSuccess={() => setAuthed(true)} />;
  return (
    <Dashboard
      onLogout={() => {
        logout();
        setAuthed(false);
      }}
    />
  );
}

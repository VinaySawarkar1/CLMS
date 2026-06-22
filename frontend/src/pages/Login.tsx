import { useState } from 'react';
import { Box, Button, Container, Paper, TextField, Typography } from '@mui/material';
import { login } from '../api';

export default function Login({ onSuccess }: { onSuccess: () => void }) {
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

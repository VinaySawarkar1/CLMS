import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert, Box, Button, Paper, Stack, Table, TableBody, TableCell, TableHead,
  TableRow, TextField, Typography,
} from '@mui/material';
import { getEnvironmental, recordEnvironmental } from '../api';

export default function Environmental() {
  const qc = useQueryClient();
  const [form, setForm] = useState<any>({ location: 'Lab-1', temperature: '', humidity: '', pressure: '', operator: '' });
  const [alerts, setAlerts] = useState<string[]>([]);
  const { data = [] } = useQuery({ queryKey: ['environmental'], queryFn: getEnvironmental });
  const mut = useMutation({
    mutationFn: () => recordEnvironmental({
      location: form.location, operator: form.operator,
      temperature: form.temperature ? Number(form.temperature) : undefined,
      humidity: form.humidity ? Number(form.humidity) : undefined,
      pressure: form.pressure ? Number(form.pressure) : undefined,
    }),
    onSuccess: (res: any) => { setAlerts(res.alerts || []); qc.invalidateQueries({ queryKey: ['environmental'] }); },
  });

  return (
    <>
      <Typography variant="h5" sx={{ mb: 2 }}>Environmental Monitoring</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <TextField label="Location" size="small" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <TextField label="Temp °C" size="small" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} />
          <TextField label="Humidity %" size="small" value={form.humidity} onChange={(e) => setForm({ ...form, humidity: e.target.value })} />
          <TextField label="Pressure kPa" size="small" value={form.pressure} onChange={(e) => setForm({ ...form, pressure: e.target.value })} />
          <TextField label="Operator" size="small" value={form.operator} onChange={(e) => setForm({ ...form, operator: e.target.value })} />
          <Button variant="contained" onClick={() => mut.mutate()}>Record</Button>
        </Stack>
        {alerts.map((a, i) => <Alert severity="warning" sx={{ mt: 1 }} key={i}>{a}</Alert>)}
      </Paper>
      <Paper>
        <Table size="small">
          <TableHead><TableRow>
            <TableCell>Time</TableCell><TableCell>Location</TableCell><TableCell>Temp</TableCell>
            <TableCell>Humidity</TableCell><TableCell>Pressure</TableCell><TableCell>Operator</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {data.map((r: any) => (
              <TableRow key={r.id} hover>
                <TableCell>{new Date(r.recordedAt).toLocaleString()}</TableCell>
                <TableCell>{r.location}</TableCell><TableCell>{r.temperature ?? '—'}</TableCell>
                <TableCell>{r.humidity ?? '—'}</TableCell><TableCell>{r.pressure ?? '—'}</TableCell><TableCell>{r.operator || '—'}</TableCell>
              </TableRow>
            ))}
            {data.length === 0 && <TableRow><TableCell colSpan={6}>No records yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>
    </>
  );
}

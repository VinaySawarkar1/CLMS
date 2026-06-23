import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem,
  Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import {
  assignJob, createJob, generateCertificate, getCustomers, getEngineers,
  getInstruments, getJobs, setJobStatus,
} from '../api';

const STATUSES = [
  'RECEIVED', 'WAITING', 'ASSIGNED', 'IN_CALIBRATION', 'PENDING_REVIEW',
  'CORRECTION_REQUIRED', 'APPROVED', 'CERTIFICATE_GENERATED', 'DELIVERED', 'CLOSED',
];
const NEXT: Record<string, string[]> = {
  RECEIVED: ['WAITING', 'ASSIGNED'], WAITING: ['ASSIGNED'], ASSIGNED: ['IN_CALIBRATION'],
  IN_CALIBRATION: ['PENDING_REVIEW'], PENDING_REVIEW: ['CORRECTION_REQUIRED', 'APPROVED'],
  CORRECTION_REQUIRED: ['IN_CALIBRATION'], APPROVED: ['CERTIFICATE_GENERATED'],
  CERTIFICATE_GENERATED: ['DELIVERED'], DELIVERED: ['CLOSED'], CLOSED: [],
};

export default function Jobs() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ customerId: '', instrumentId: '', remarks: '' });

  const { data = [] } = useQuery({ queryKey: ['jobs', status], queryFn: () => getJobs(status || undefined) });
  const { data: customers = [] } = useQuery({ queryKey: ['customers', ''], queryFn: () => getCustomers() });
  const { data: engineers = [] } = useQuery({ queryKey: ['engineers'], queryFn: getEngineers });
  const { data: instruments = [] } = useQuery({
    queryKey: ['instruments', form.customerId],
    queryFn: () => getInstruments(form.customerId || undefined),
    enabled: !!form.customerId,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['jobs'] });
  const createMut = useMutation({ mutationFn: () => createJob(form), onSuccess: () => { refresh(); setOpen(false); setForm({ customerId: '', instrumentId: '', remarks: '' }); } });
  const assignMut = useMutation({ mutationFn: (v: { id: string; engineerId: string }) => assignJob(v.id, v.engineerId), onSuccess: refresh });
  const statusMut = useMutation({ mutationFn: (v: { id: string; s: string }) => setJobStatus(v.id, v.s), onSuccess: refresh });
  const certMut = useMutation({ mutationFn: (jobId: string) => generateCertificate({ jobId, type: 'NABL' }), onSuccess: refresh });

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Jobs</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>+ New Job</Button>
      </Box>
      <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 220, mb: 2 }}>
        <MenuItem value="">All</MenuItem>
        {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
      </TextField>
      <Paper>
        <Table size="small">
          <TableHead><TableRow>
            <TableCell>Job No.</TableCell><TableCell>Customer</TableCell><TableCell>Instrument</TableCell>
            <TableCell>Engineer</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {data.map((j: any) => (
              <TableRow key={j.id} hover>
                <TableCell><RouterLink to={`/jobs/${j.id}`}>{j.jobNumber}</RouterLink></TableCell>
                <TableCell>{j.customer?.name}</TableCell>
                <TableCell>{j.instrument?.name}</TableCell>
                <TableCell>
                  <TextField select size="small" value={j.engineerId || ''} sx={{ minWidth: 130 }}
                    onChange={(e) => assignMut.mutate({ id: j.id, engineerId: e.target.value })}>
                    <MenuItem value="" disabled>Assign…</MenuItem>
                    {engineers.map((en: any) => <MenuItem key={en.id} value={en.id}>{en.user?.fullName || en.employeeCode}</MenuItem>)}
                  </TextField>
                </TableCell>
                <TableCell><Chip size="small" label={j.status} /></TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="contained" component={RouterLink} to={`/jobs/${j.id}`}>Calibrate</Button>
                    {(NEXT[j.status] || []).map((s) => (
                      <Button key={s} size="small" variant="outlined" onClick={() => statusMut.mutate({ id: j.id, s })}>→ {s}</Button>
                    ))}
                    {j.status === 'APPROVED' && (
                      <Button size="small" color="success" variant="contained" onClick={() => certMut.mutate(j.id)}>Generate Certificate</Button>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && <TableRow><TableCell colSpan={6}>No jobs yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Job</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField select label="Customer *" size="small" value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value, instrumentId: '' })} fullWidth>
              {customers.map((c: any) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
            <TextField select label="Instrument *" size="small" value={form.instrumentId} disabled={!form.customerId}
              onChange={(e) => setForm({ ...form, instrumentId: e.target.value })} fullWidth>
              {instruments.map((i: any) => <MenuItem key={i.id} value={i.id}>{i.name} {i.serialNumber ? `(${i.serialNumber})` : ''}</MenuItem>)}
            </TextField>
            <TextField label="Remarks" size="small" value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!form.customerId || !form.instrumentId || createMut.isPending} onClick={() => createMut.mutate()}>Create Job</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

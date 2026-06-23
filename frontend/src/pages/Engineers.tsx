import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { createEngineer, getEngineers } from '../api';

export default function Engineers() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ employeeCode: '', fullName: '', email: '', skills: '' });

  const { data = [] } = useQuery({ queryKey: ['engineers'], queryFn: getEngineers });
  const mut = useMutation({
    mutationFn: () => createEngineer({ ...form, skills: form.skills ? form.skills.split(',').map((s: string) => s.trim()) : [] }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['engineers'] }); setOpen(false); setForm({ employeeCode: '', fullName: '', email: '', skills: '' }); },
  });

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Engineers</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>+ New Engineer</Button>
      </Box>
      <Paper>
        <Table size="small">
          <TableHead><TableRow>
            <TableCell>Employee Code</TableCell><TableCell>Name</TableCell><TableCell>Email</TableCell><TableCell>Skills</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {data.map((e: any) => (
              <TableRow key={e.id} hover>
                <TableCell>{e.employeeCode}</TableCell>
                <TableCell>{e.user?.fullName}</TableCell>
                <TableCell>{e.user?.email}</TableCell>
                <TableCell>{(e.skills || []).join(', ') || '—'}</TableCell>
              </TableRow>
            ))}
            {data.length === 0 && <TableRow><TableCell colSpan={4}>No engineers yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Engineer</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Employee Code *" size="small" value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} />
            <TextField label="Full Name *" size="small" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            <TextField label="Email" size="small" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <TextField label="Skills (comma separated)" size="small" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!form.employeeCode || !form.fullName || mut.isPending} onClick={() => mut.mutate()}>Create</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

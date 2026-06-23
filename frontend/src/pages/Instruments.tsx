import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper,
  Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { createInstrument, getCustomers, getInstruments } from '../api';

export default function Instruments() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ customerId: '', name: '', make: '', model: '', serialNumber: '', range: '', leastCount: '', idNumber: '' });

  const { data = [] } = useQuery({ queryKey: ['instruments'], queryFn: () => getInstruments() });
  const { data: customers = [] } = useQuery({ queryKey: ['customers', ''], queryFn: () => getCustomers() });
  const mut = useMutation({
    mutationFn: () => createInstrument(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['instruments'] }); setOpen(false); },
  });

  const field = (k: string, label: string) => (
    <TextField label={label} size="small" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} fullWidth />
  );

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Instrument Entry</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>+ Receive Instrument</Button>
      </Box>
      <Paper>
        <Table size="small">
          <TableHead><TableRow>
            <TableCell>Name</TableCell><TableCell>Make</TableCell><TableCell>Model</TableCell>
            <TableCell>Serial</TableCell><TableCell>Range</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {data.map((i: any) => (
              <TableRow key={i.id} hover>
                <TableCell>{i.name}</TableCell><TableCell>{i.make || '—'}</TableCell><TableCell>{i.model || '—'}</TableCell>
                <TableCell>{i.serialNumber || '—'}</TableCell><TableCell>{i.range || '—'}</TableCell>
              </TableRow>
            ))}
            {data.length === 0 && <TableRow><TableCell colSpan={5}>No instruments yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Receive Instrument</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField select label="Customer *" size="small" value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })} fullWidth>
              {customers.map((c: any) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
            {field('name', 'Instrument Name *')}
            {field('make', 'Make')}
            {field('model', 'Model')}
            {field('serialNumber', 'Serial Number')}
            {field('range', 'Range')}
            {field('leastCount', 'Least Count')}
            {field('idNumber', 'ID Number')}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!form.customerId || !form.name || mut.isPending} onClick={() => mut.mutate()}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

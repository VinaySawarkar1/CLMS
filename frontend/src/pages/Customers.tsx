import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper,
  Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { createCustomer, getCustomers } from '../api';

export default function Customers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ code: '', name: '', gstin: '', email: '', phone: '', address: '' });

  const { data = [] } = useQuery({ queryKey: ['customers', search], queryFn: () => getCustomers(search || undefined) });
  const mut = useMutation({
    mutationFn: () => createCustomer(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      setOpen(false);
      setForm({ code: '', name: '', gstin: '', email: '', phone: '', address: '' });
    },
  });

  const field = (k: string, label: string) => (
    <TextField label={label} size="small" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} fullWidth />
  );

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Customers</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>+ New Customer</Button>
      </Box>
      <TextField size="small" label="Search" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 280, mb: 2 }} />
      <Paper>
        <Table size="small">
          <TableHead><TableRow>
            <TableCell>Code</TableCell><TableCell>Name</TableCell><TableCell>GSTIN</TableCell>
            <TableCell>Email</TableCell><TableCell>Phone</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {data.map((c: any) => (
              <TableRow key={c.id} hover>
                <TableCell>{c.code}</TableCell><TableCell>{c.name}</TableCell>
                <TableCell>{c.gstin || '—'}</TableCell><TableCell>{c.email || '—'}</TableCell><TableCell>{c.phone || '—'}</TableCell>
              </TableRow>
            ))}
            {data.length === 0 && <TableRow><TableCell colSpan={5}>No customers yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Customer</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {field('code', 'Customer Code *')}
            {field('name', 'Name *')}
            {field('gstin', 'GSTIN')}
            {field('email', 'Email')}
            {field('phone', 'Phone')}
            {field('address', 'Address')}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!form.code || !form.name || mut.isPending} onClick={() => mut.mutate()}>Create</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

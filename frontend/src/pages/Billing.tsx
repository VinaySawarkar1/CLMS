import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper,
  Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { createInvoice, getCustomers, getInvoices, payInvoice } from '../api';

export default function Billing() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ customerId: '', amount: '' });
  const [payFor, setPayFor] = useState<any>(null);
  const [payAmt, setPayAmt] = useState('');

  const { data = [] } = useQuery({ queryKey: ['invoices'], queryFn: getInvoices });
  const { data: customers = [] } = useQuery({ queryKey: ['customers', ''], queryFn: () => getCustomers() });
  const refresh = () => qc.invalidateQueries({ queryKey: ['invoices'] });
  const createMut = useMutation({ mutationFn: () => createInvoice({ customerId: form.customerId, amount: Number(form.amount) }), onSuccess: () => { refresh(); setOpen(false); setForm({ customerId: '', amount: '' }); } });
  const payMut = useMutation({ mutationFn: () => payInvoice(payFor.id, { amount: Number(payAmt) }), onSuccess: () => { refresh(); setPayFor(null); setPayAmt(''); } });

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Billing</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>+ New Invoice</Button>
      </Box>
      <Paper>
        <Table size="small">
          <TableHead><TableRow>
            <TableCell>Invoice No.</TableCell><TableCell>Customer</TableCell><TableCell>Amount</TableCell>
            <TableCell>Tax</TableCell><TableCell>Total</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {data.map((inv: any) => (
              <TableRow key={inv.id} hover>
                <TableCell>{inv.invoiceNumber}</TableCell>
                <TableCell>{inv.customer?.name}</TableCell>
                <TableCell>₹{inv.amount}</TableCell><TableCell>₹{inv.taxAmount}</TableCell><TableCell>₹{inv.totalAmount}</TableCell>
                <TableCell><Chip size="small" label={inv.status} color={inv.status === 'PAID' ? 'success' : 'default'} /></TableCell>
                <TableCell>{inv.status !== 'PAID' && <Button size="small" onClick={() => setPayFor(inv)}>Pay</Button>}</TableCell>
              </TableRow>
            ))}
            {data.length === 0 && <TableRow><TableCell colSpan={7}>No invoices yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Invoice</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField select label="Customer *" size="small" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
              {customers.map((c: any) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
            <TextField label="Amount (before tax) *" type="number" size="small" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!form.customerId || !form.amount || createMut.isPending} onClick={() => createMut.mutate()}>Create (adds 18% GST)</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!payFor} onClose={() => setPayFor(null)} fullWidth maxWidth="xs">
        <DialogTitle>Record Payment — {payFor?.invoiceNumber}</DialogTitle>
        <DialogContent>
          <TextField label="Amount" type="number" size="small" fullWidth sx={{ mt: 1 }} value={payAmt} onChange={(e) => setPayAmt(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayFor(null)}>Cancel</Button>
          <Button variant="contained" disabled={!payAmt || payMut.isPending} onClick={() => payMut.mutate()}>Record</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

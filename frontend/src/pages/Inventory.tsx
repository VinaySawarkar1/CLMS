import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper,
  Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { adjustStock, getInventory, upsertInventory } from '../api';

const CATEGORIES = ['STANDARD', 'FIXTURE', 'ACCESSORY', 'CONSUMABLE'];

export default function Inventory() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ name: '', category: 'STANDARD', quantity: 0, location: '' });
  const { data = [] } = useQuery({ queryKey: ['inventory'], queryFn: () => getInventory() });
  const refresh = () => qc.invalidateQueries({ queryKey: ['inventory'] });
  const mut = useMutation({ mutationFn: () => upsertInventory({ ...form, quantity: Number(form.quantity) }), onSuccess: () => { refresh(); setOpen(false); setForm({ name: '', category: 'STANDARD', quantity: 0, location: '' }); } });
  const stockMut = useMutation({ mutationFn: (v: { id: string; delta: number }) => adjustStock(v.id, v.delta), onSuccess: refresh });

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Inventory</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>+ New Item</Button>
      </Box>
      <Paper>
        <Table size="small">
          <TableHead><TableRow>
            <TableCell>Name</TableCell><TableCell>Category</TableCell><TableCell>Qty</TableCell>
            <TableCell>Location</TableCell><TableCell>Stock</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {data.map((i: any) => (
              <TableRow key={i.id} hover>
                <TableCell>{i.name}</TableCell><TableCell>{i.category}</TableCell><TableCell>{i.quantity}</TableCell>
                <TableCell>{i.location || '—'}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => stockMut.mutate({ id: i.id, delta: 1 })}>+1</Button>
                  <Button size="small" onClick={() => stockMut.mutate({ id: i.id, delta: -1 })}>-1</Button>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && <TableRow><TableCell colSpan={5}>No items yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Inventory Item</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name *" size="small" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField select label="Category" size="small" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
            <TextField label="Quantity" type="number" size="small" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            <TextField label="Location" size="small" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!form.name || mut.isPending} onClick={() => mut.mutate()}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

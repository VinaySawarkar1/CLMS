import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { addCapa, closeNcr, getNcrs, raiseNcr } from '../api';

export default function Quality() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState('');
  const [capaFor, setCapaFor] = useState<any>(null);
  const [capa, setCapa] = useState<any>({ rootCause: '', correctiveAction: '', preventiveAction: '' });

  const { data = [] } = useQuery({ queryKey: ['ncrs'], queryFn: getNcrs });
  const refresh = () => qc.invalidateQueries({ queryKey: ['ncrs'] });
  const raiseMut = useMutation({ mutationFn: () => raiseNcr({ description: desc }), onSuccess: () => { refresh(); setOpen(false); setDesc(''); } });
  const capaMut = useMutation({ mutationFn: () => addCapa(capaFor.id, capa), onSuccess: () => { refresh(); setCapaFor(null); setCapa({ rootCause: '', correctiveAction: '', preventiveAction: '' }); } });
  const closeMut = useMutation({ mutationFn: (id: string) => closeNcr(id), onSuccess: refresh });

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">NCR / CAPA</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>+ Raise NCR</Button>
      </Box>
      <Paper>
        <Table size="small">
          <TableHead><TableRow>
            <TableCell>Reference</TableCell><TableCell>Description</TableCell><TableCell>CAPA</TableCell>
            <TableCell>Status</TableCell><TableCell>Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {data.map((n: any) => (
              <TableRow key={n.id} hover>
                <TableCell>{n.reference}</TableCell>
                <TableCell>{n.description}</TableCell>
                <TableCell>{n.capa ? '✓' : '—'}</TableCell>
                <TableCell><Chip size="small" label={n.status} color={n.status === 'CLOSED' ? 'success' : 'default'} /></TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" onClick={() => setCapaFor(n)}>CAPA</Button>
                    {n.status !== 'CLOSED' && <Button size="small" onClick={() => closeMut.mutate(n.id)}>Close</Button>}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && <TableRow><TableCell colSpan={5}>No NCRs raised.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Raise NCR</DialogTitle>
        <DialogContent>
          <TextField label="Description *" size="small" fullWidth multiline minRows={3} sx={{ mt: 1 }} value={desc} onChange={(e) => setDesc(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!desc || raiseMut.isPending} onClick={() => raiseMut.mutate()}>Raise</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!capaFor} onClose={() => setCapaFor(null)} fullWidth maxWidth="sm">
        <DialogTitle>CAPA — {capaFor?.reference}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Root Cause" size="small" multiline value={capa.rootCause} onChange={(e) => setCapa({ ...capa, rootCause: e.target.value })} />
            <TextField label="Corrective Action" size="small" multiline value={capa.correctiveAction} onChange={(e) => setCapa({ ...capa, correctiveAction: e.target.value })} />
            <TextField label="Preventive Action" size="small" multiline value={capa.preventiveAction} onChange={(e) => setCapa({ ...capa, preventiveAction: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCapaFor(null)}>Cancel</Button>
          <Button variant="contained" disabled={capaMut.isPending} onClick={() => capaMut.mutate()}>Save CAPA</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem, Paper, Stack, TextField, Typography,
} from '@mui/material';
import { createTask, getTaskBoard, setTaskStatus } from '../api';

const COLUMNS = ['PENDING', 'ASSIGNED', 'RUNNING', 'REVIEW', 'COMPLETED'];

export default function Tasks() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const { data = {} } = useQuery({ queryKey: ['task-board'], queryFn: getTaskBoard });
  const refresh = () => qc.invalidateQueries({ queryKey: ['task-board'] });
  const createMut = useMutation({ mutationFn: () => createTask({ title }), onSuccess: () => { refresh(); setOpen(false); setTitle(''); } });
  const moveMut = useMutation({ mutationFn: (v: { id: string; status: string }) => setTaskStatus(v.id, v.status), onSuccess: refresh });

  const nextOf = (s: string) => COLUMNS[Math.min(COLUMNS.indexOf(s) + 1, COLUMNS.length - 1)];

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Task Board</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>+ New Task</Button>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto' }}>
        {COLUMNS.map((col) => (
          <Paper key={col} sx={{ p: 1.5, minWidth: 230, bgcolor: '#f0f2f5' }}>
            <Typography variant="subtitle2" gutterBottom>{col} ({(data[col] ?? []).length})</Typography>
            {(data[col] ?? []).map((t: any) => (
              <Card key={t.id} sx={{ mb: 1 }}>
                <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                  <Typography variant="body2">{t.title}</Typography>
                  {col !== 'COMPLETED' && (
                    <Button size="small" sx={{ mt: 0.5 }} onClick={() => moveMut.mutate({ id: t.id, status: nextOf(col) })}>
                      Move → {nextOf(col)}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </Paper>
        ))}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Task</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Title *" size="small" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!title || createMut.isPending} onClick={() => createMut.mutate()}>Create</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

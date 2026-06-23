import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import { getJob, getJobs, signCertificate } from '../api';

const STAGES = ['ENGINEER', 'REVIEWER', 'TECHNICAL_MANAGER', 'QUALITY_MANAGER', 'FINAL_LOCK'];
const CERT_STATES = ['CERTIFICATE_GENERATED', 'DELIVERED', 'CLOSED'];

export default function Certificates() {
  const qc = useQueryClient();
  const [openJob, setOpenJob] = useState<string | null>(null);

  const { data: jobs = [] } = useQuery({ queryKey: ['jobs', ''], queryFn: () => getJobs() });
  const certJobs = jobs.filter((j: any) => CERT_STATES.includes(j.status));

  const { data: detail } = useQuery({ queryKey: ['job-detail', openJob], queryFn: () => getJob(openJob!), enabled: !!openJob });
  const cert = detail?.certificate;
  const signedStages: string[] = (cert?.signatures || []).map((s: any) => s.stage);
  const nextStage = STAGES[signedStages.length];

  const signMut = useMutation({
    mutationFn: (stage: string) => signCertificate(cert.id, stage),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job-detail', openJob] }); qc.invalidateQueries({ queryKey: ['jobs'] }); },
  });

  return (
    <>
      <Typography variant="h5" sx={{ mb: 2 }}>Certificates</Typography>
      <Paper>
        <Table size="small">
          <TableHead><TableRow>
            <TableCell>Job No.</TableCell><TableCell>Customer</TableCell><TableCell>Instrument</TableCell>
            <TableCell>Status</TableCell><TableCell>Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {certJobs.map((j: any) => (
              <TableRow key={j.id} hover>
                <TableCell>{j.jobNumber}</TableCell><TableCell>{j.customer?.name}</TableCell>
                <TableCell>{j.instrument?.name}</TableCell><TableCell><Chip size="small" label={j.status} /></TableCell>
                <TableCell><Button size="small" onClick={() => setOpenJob(j.id)}>Open Certificate</Button></TableCell>
              </TableRow>
            ))}
            {certJobs.length === 0 && <TableRow><TableCell colSpan={5}>No certificates yet. Generate one from an APPROVED job.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={!!openJob} onClose={() => setOpenJob(null)} fullWidth maxWidth="sm">
        <DialogTitle>Certificate {cert?.certificateNumber}</DialogTitle>
        <DialogContent>
          {cert ? (
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <Typography variant="body2">Type: <b>{cert.type}</b></Typography>
              <Typography variant="body2">Locked (immutable): <b>{cert.isLocked ? 'Yes' : 'No'}</b></Typography>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>Signature workflow</Typography>
              {STAGES.map((st) => {
                const sig = (cert.signatures || []).find((s: any) => s.stage === st);
                return (
                  <Box key={st} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip size="small" color={sig ? 'success' : 'default'} label={st} />
                    {sig ? <Typography variant="caption">signed by {sig.signedByName}</Typography> : <Typography variant="caption" color="text.secondary">pending</Typography>}
                  </Box>
                );
              })}
              {!cert.isLocked && nextStage && (
                <Button variant="contained" sx={{ mt: 1 }} disabled={signMut.isPending} onClick={() => signMut.mutate(nextStage)}>
                  Sign as {nextStage}
                </Button>
              )}
              {cert.isLocked && <Chip color="success" label="Certificate finalised & immutable" sx={{ mt: 1 }} />}
            </Stack>
          ) : <Typography variant="body2">Loading…</Typography>}
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenJob(null)}>Close</Button></DialogActions>
      </Dialog>
    </>
  );
}

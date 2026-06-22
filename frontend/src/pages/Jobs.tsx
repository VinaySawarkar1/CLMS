import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Chip,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { getJobs } from '../api';

const STATUSES = [
  'RECEIVED', 'WAITING', 'ASSIGNED', 'IN_CALIBRATION', 'PENDING_REVIEW',
  'CORRECTION_REQUIRED', 'APPROVED', 'CERTIFICATE_GENERATED', 'DELIVERED', 'CLOSED',
];

export default function Jobs() {
  const [status, setStatus] = useState('');
  const { data = [], isLoading } = useQuery({
    queryKey: ['jobs', status],
    queryFn: () => getJobs(status || undefined),
  });

  return (
    <>
      <Typography variant="h5" gutterBottom>
        Jobs
      </Typography>
      <TextField
        select
        size="small"
        label="Status"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        sx={{ minWidth: 220, mb: 2 }}
      >
        <MenuItem value="">All</MenuItem>
        {STATUSES.map((s) => (
          <MenuItem key={s} value={s}>
            {s}
          </MenuItem>
        ))}
      </TextField>
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Job No.</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Instrument</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Received</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5}>Loading…</TableCell>
              </TableRow>
            )}
            {data.map((j: any) => (
              <TableRow key={j.id} hover>
                <TableCell>{j.jobNumber}</TableCell>
                <TableCell>{j.customer?.name}</TableCell>
                <TableCell>{j.instrument?.name}</TableCell>
                <TableCell>
                  <Chip size="small" label={j.status} />
                </TableCell>
                <TableCell>
                  {new Date(j.receivedAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>No jobs found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </>
  );
}

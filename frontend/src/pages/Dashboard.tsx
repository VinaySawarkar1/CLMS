import { useQuery } from '@tanstack/react-query';
import { Grid, Paper, Typography } from '@mui/material';
import { getDashboard } from '../api';

const WIDGETS: Array<{ key: string; label: string }> = [
  { key: 'todaysJobs', label: "Today's Jobs" },
  { key: 'pendingJobs', label: 'Pending Jobs' },
  { key: 'overdueJobs', label: 'Overdue Jobs' },
  { key: 'certificatesIssued', label: 'Certificates Issued' },
  { key: 'masterDue', label: 'Master Due' },
  { key: 'customers', label: 'Customers' },
];

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  });

  return (
    <>
      <Typography variant="h5" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={2}>
        {WIDGETS.map((w) => (
          <Grid item xs={12} sm={6} md={4} key={w.key}>
            <Paper sx={{ p: 2, height: 110 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {w.label}
              </Typography>
              <Typography variant="h3">
                {isLoading ? '…' : (data?.[w.key] ?? 0)}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </>
  );
}

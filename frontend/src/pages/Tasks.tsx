import { useQuery } from '@tanstack/react-query';
import { Box, Card, CardContent, Paper, Typography } from '@mui/material';
import { getTaskBoard } from '../api';

const COLUMNS = ['PENDING', 'ASSIGNED', 'RUNNING', 'REVIEW', 'COMPLETED'];

export default function Tasks() {
  const { data = {} } = useQuery({
    queryKey: ['task-board'],
    queryFn: getTaskBoard,
  });

  return (
    <>
      <Typography variant="h5" gutterBottom>
        Task Board
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto' }}>
        {COLUMNS.map((col) => (
          <Paper key={col} sx={{ p: 1.5, minWidth: 220, bgcolor: '#f5f5f5' }}>
            <Typography variant="subtitle2" gutterBottom>
              {col} ({(data[col] ?? []).length})
            </Typography>
            {(data[col] ?? []).map((t: any) => (
              <Card key={t.id} sx={{ mb: 1 }}>
                <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                  <Typography variant="body2">{t.title}</Typography>
                </CardContent>
              </Card>
            ))}
          </Paper>
        ))}
      </Box>
    </>
  );
}

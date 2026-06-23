import { useQuery } from '@tanstack/react-query';
import {
  Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import { getNotifications } from '../api';

export default function Notifications() {
  const { data = [] } = useQuery({ queryKey: ['notifications'], queryFn: getNotifications });
  return (
    <>
      <Typography variant="h5" sx={{ mb: 2 }}>Notifications</Typography>
      <Paper>
        <Table size="small">
          <TableHead><TableRow>
            <TableCell>Time</TableCell><TableCell>Channel</TableCell><TableCell>Event</TableCell><TableCell>Read</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {data.map((n: any) => (
              <TableRow key={n.id} hover>
                <TableCell>{new Date(n.createdAt).toLocaleString()}</TableCell>
                <TableCell>{n.channel}</TableCell><TableCell>{n.event}</TableCell>
                <TableCell>{n.isRead ? '✓' : '—'}</TableCell>
              </TableRow>
            ))}
            {data.length === 0 && <TableRow><TableCell colSpan={4}>No notifications.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>
    </>
  );
}

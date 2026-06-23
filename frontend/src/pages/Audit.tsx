import { useQuery } from '@tanstack/react-query';
import {
  Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import { getAudit } from '../api';

export default function Audit() {
  const { data = [] } = useQuery({ queryKey: ['audit'], queryFn: getAudit });
  return (
    <>
      <Typography variant="h5" sx={{ mb: 2 }}>Audit Trail</Typography>
      <Paper>
        <Table size="small">
          <TableHead><TableRow>
            <TableCell>Time</TableCell><TableCell>User</TableCell><TableCell>Action</TableCell>
            <TableCell>Entity</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {data.map((a: any) => (
              <TableRow key={a.id} hover>
                <TableCell>{new Date(a.createdAt).toLocaleString()}</TableCell>
                <TableCell>{a.user?.fullName || a.user?.email || '—'}</TableCell>
                <TableCell>{a.action}</TableCell>
                <TableCell>{a.entity || '—'}</TableCell>
              </TableRow>
            ))}
            {data.length === 0 && <TableRow><TableCell colSpan={4}>No audit entries.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>
    </>
  );
}

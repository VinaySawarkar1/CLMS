import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { getCustomers } from '../api';

export default function Customers() {
  const [search, setSearch] = useState('');
  const { data = [] } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => getCustomers(search || undefined),
  });

  return (
    <>
      <Typography variant="h5" gutterBottom>
        Customers
      </Typography>
      <TextField
        size="small"
        label="Search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ minWidth: 280, mb: 2 }}
      />
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>GSTIN</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((c: any) => (
              <TableRow key={c.id} hover>
                <TableCell>{c.code}</TableCell>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.gstin || '—'}</TableCell>
                <TableCell>{c.email || '—'}</TableCell>
                <TableCell>{c.phone || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </>
  );
}

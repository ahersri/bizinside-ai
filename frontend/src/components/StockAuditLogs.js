import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Chip,
  CircularProgress,
} from '@mui/material';
import { productAPI } from '../services/api';

/**
 * =========================
 * Stock Audit Logs Page
 * =========================
 */
const StockAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await productAPI.getStockLogs();
      setLogs(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" mb={2}>
        Stock Audit Logs
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Product ID</TableCell>
              <TableCell align="right">Before</TableCell>
              <TableCell align="right">After</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Type</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  {new Date(log.created_at).toLocaleString()}
                </TableCell>
                <TableCell>{log.product_id}</TableCell>
                <TableCell align="right">{log.quantity_before}</TableCell>
                <TableCell align="right">{log.quantity_after}</TableCell>
                <TableCell>{log.reason || '-'}</TableCell>
                <TableCell>
                  <Chip size="small" label={log.change_type} />
                </TableCell>
              </TableRow>
            ))}

            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No stock changes found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default StockAuditLogs;

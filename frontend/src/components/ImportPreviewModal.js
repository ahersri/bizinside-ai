import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Table, TableHead, TableRow, TableCell, TableBody,
  Select, MenuItem, Alert
} from '@mui/material';

const SYSTEM_FIELDS = [
  'product_code',
  'product_name',
  'category',
  'selling_price',
  'cost_price',
  'current_stock',
  'min_stock_level',
];

export default function ImportPreviewModal({ open, onClose, data, onConfirm }) {
  const [mapping, setMapping] = useState({});

  const headers = Object.keys(data[0] || {});

  const handleConfirm = () => {
    onConfirm(mapping);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Excel Import Preview</DialogTitle>
      <DialogContent>

        <Alert severity="info" sx={{ mb: 2 }}>
          Map Excel columns to system fields
        </Alert>

        {headers.map((h) => (
          <Select
            key={h}
            fullWidth
            value={mapping[h] || ''}
            onChange={(e) =>
              setMapping({ ...mapping, [h]: e.target.value })
            }
            sx={{ mb: 1 }}
          >
            <MenuItem value="">Ignore</MenuItem>
            {SYSTEM_FIELDS.map((f) => (
              <MenuItem key={f} value={f}>{f}</MenuItem>
            ))}
          </Select>
        ))}

        <Table size="small">
          <TableHead>
            <TableRow>
              {headers.map((h) => (
                <TableCell key={h}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.slice(0, 5).map((row, i) => (
              <TableRow key={i}>
                {headers.map((h) => (
                  <TableCell key={h}>{row[h]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleConfirm}>
          Import
        </Button>
      </DialogActions>
    </Dialog>
  );
}

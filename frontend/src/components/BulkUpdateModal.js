import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField
} from '@mui/material';

export default function BulkUpdateModal({ open, onClose, onSubmit }) {
  const [values, setValues] = React.useState({});

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Bulk Update Products</DialogTitle>
      <DialogContent>
        <TextField
          label="Category"
          fullWidth
          onChange={(e) =>
            setValues({ ...values, category: e.target.value })
          }
          sx={{ mb: 2 }}
        />
        <TextField
          label="Min Stock Level"
          type="number"
          fullWidth
          onChange={(e) =>
            setValues({ ...values, min_stock_level: e.target.value })
          }
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => onSubmit(values)}
        >
          Update
        </Button>
      </DialogActions>
    </Dialog>
  );
}

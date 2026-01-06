import React, { useEffect, useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  Button,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import { Undo } from '@mui/icons-material';
import { productAPI } from '../services/api';
import { toast } from 'react-hot-toast';

export default function StockAuditDrawer({
  open,
  onClose,
  product, // 👈 REQUIRED
  onUndoSuccess,
}) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // =========================
  // FETCH LOGS (PER PRODUCT)
  // =========================
  const fetchLogs = async () => {
    if (!product?.id) return;

    setLoading(true);
    try {
      const res = await productAPI.getStockLogs({
        product_id: product.id,
      });
      setLogs(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load stock logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchLogs();
  }, [open, product]);

  // =========================
  // UNDO STOCK
  // =========================
  const undoStock = async (log) => {
    if (!window.confirm('Undo this stock change?')) return;

    try {
      await productAPI.adjustStock({
        product_id: product.id,
        new_stock: log.quantity_before,
        reason: `Undo of log #${log.id}`,
      });

      toast.success('Stock reverted');
      fetchLogs();
      onUndoSuccess?.();
    } catch {
      toast.error('Undo failed');
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 420 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">
            Stock History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {product?.product_name}
          </Typography>
        </Box>

        <Divider />

        <List>
          {logs.length === 0 && !loading && (
            <Typography sx={{ p: 2 }} color="text.secondary">
              No stock changes found
            </Typography>
          )}

          {logs.map((log) => (
            <ListItem key={log.id} divider alignItems="flex-start">
              <ListItemText
                primary={`${log.quantity_before} → ${log.quantity_after}`}
                secondary={
                  <>
                    <Typography variant="caption">
                      {log.reason || '—'}
                    </Typography>
                    <br />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(log.created_at).toLocaleString()}
                    </Typography>
                  </>
                }
              />

              {log.change_type === 'ADJUST' && (
                <Button
                  size="small"
                  startIcon={<Undo />}
                  onClick={() => undoStock(log)}
                >
                  Undo
                </Button>
              )}
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}

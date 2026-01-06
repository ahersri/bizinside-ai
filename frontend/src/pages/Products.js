import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Pagination,
  Tooltip,
  Alert,
  MenuItem,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Upload,
  Download,
  Undo,
  History,
  Tune,
} from '@mui/icons-material';
import { productAPI } from '../services/api';
import { toast } from 'react-hot-toast';

import ProductDetailDrawer from '../components/ProductDetailDrawer';
import StockLogsDialog from '../components/StockAuditDrawer';

/* =========================
   Role Helpers
========================= */
const getUserRole = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user?.role || 'Viewer';
};

const can = (roles) => roles.includes(getUserRole());

/* =========================
   Component
========================= */
const Products = () => {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);

  // dialogs
  const [openForm, setOpenForm] = useState(false);
  const [openStock, setOpenStock] = useState(false);
  const [openBulk, setOpenBulk] = useState(false);
  const [openImportPreview, setOpenImportPreview] = useState(false);
  const [openLogs, setOpenLogs] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);

  const [editing, setEditing] = useState(null);
  const [stockTarget, setStockTarget] = useState(null);
  const [drawerProduct, setDrawerProduct] = useState(null);

  const [importPreview, setImportPreview] = useState([]);
  const [importFile, setImportFile] = useState(null);
  const [importErrors, setImportErrors] = useState([]);

  /* =========================
     Forms
  ========================= */
  const [form, setForm] = useState({
    product_name: '',
    product_code: '',
    category: '',
    unit: 'PCS',
    selling_price: '',
    cost_price: '',
    current_stock: '',
    min_stock_level: '',
    description: '',
  });

  const [stockForm, setStockForm] = useState({
    new_stock: '',
    reason: '',
  });

  const [bulkForm, setBulkForm] = useState({
    category: '',
    min_stock_level: '',
  });

  /* =========================
     Fetch Products
  ========================= */
  const fetchProducts = async () => {
    const res = await productAPI.getProducts({ page });
    setProducts(res.data?.data?.products || []);
  };

  useEffect(() => {
    fetchProducts();
  }, [page]);

  /* =========================
     CRUD
  ========================= */
  const saveProduct = async () => {
    try {
      editing
        ? await productAPI.updateProduct(editing.id, form)
        : await productAPI.createProduct(form);

      toast.success(editing ? 'Product updated' : 'Product created');
      setOpenForm(false);
      setEditing(null);
      fetchProducts();
    } catch {
      toast.error('Save failed');
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await productAPI.deleteProduct(id);
    toast.success('Product deleted');
    fetchProducts();
  };

  /* =========================
     Bulk Update
  ========================= */
  const applyBulkUpdate = async () => {
    await productAPI.bulkUpdate(selected, bulkForm);
    toast.success('Bulk update applied');
    setSelected([]);
    setOpenBulk(false);
    fetchProducts();
  };

  /* =========================
     Stock Adjust
  ========================= */
  const adjustStock = async () => {
    await productAPI.adjustStock({
      product_id: stockTarget.id,
      new_stock: Number(stockForm.new_stock),
      reason: stockForm.reason,
    });
    toast.success('Stock adjusted');
    setOpenStock(false);
    fetchProducts();
  };

  /* =========================
     Import Preview
  ========================= */
  const previewImport = async (file) => {
    const text = await file.text();
    const rows = text.split('\n').slice(0, 6);
    setImportPreview(rows.map((r) => r.split(',')));
    setImportFile(file);
    setOpenImportPreview(true);
  };

  const confirmImport = async () => {
    try {
      const res = await productAPI.importProducts(importFile);
      setImportErrors(res.data?.failedRows || []);
      toast.success('Import completed');
      fetchProducts();
    } catch {
      toast.error('Import failed');
    }
  };

  /* =========================
     Render
  ========================= */
  return (
    <Box>
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Products</Typography>

        <Box display="flex" gap={1}>
          {can(['Owner', 'Admin']) && selected.length > 0 && (
            <Button startIcon={<Tune />} onClick={() => setOpenBulk(true)}>
              Bulk Update
            </Button>
          )}

          {can(['Owner', 'Admin']) && (
            <Button component="label" startIcon={<Upload />}>
              Import
              <input hidden type="file" onChange={(e) => previewImport(e.target.files[0])} />
            </Button>
          )}

          <Button startIcon={<Download />} onClick={() => productAPI.exportProducts()}>
            Export
          </Button>

          {can(['Owner', 'Admin', 'Manager']) && (
            <Button startIcon={<Add />} variant="contained" onClick={() => setOpenForm(true)}>
              Add Product
            </Button>
          )}
        </Box>
      </Box>

      {/* TABLE */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell>Name</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.includes(p.id)}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [...selected, p.id]
                          : selected.filter((x) => x !== p.id)
                      )
                    }
                  />
                </TableCell>

                <TableCell
                  sx={{ cursor: 'pointer', fontWeight: 500 }}
                  onClick={() => {
                    setDrawerProduct(p);
                    setOpenDrawer(true);
                  }}
                >
                  {p.product_name}
                </TableCell>

                <TableCell>{p.current_stock}</TableCell>

                <TableCell>
                  <Chip
                    size="small"
                    label={p.current_stock <= p.min_stock_level ? 'Low' : 'OK'}
                    color={p.current_stock <= p.min_stock_level ? 'warning' : 'success'}
                  />
                </TableCell>

                <TableCell align="right">
                  <Tooltip title="Adjust Stock">
                    <IconButton onClick={() => { setStockTarget(p); setOpenStock(true); }}>
                      <Undo />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Stock Logs">
                    <IconButton onClick={() => setOpenLogs(true)}>
                      <History />
                    </IconButton>
                  </Tooltip>

                  {can(['Owner', 'Admin', 'Manager']) && (
                    <Tooltip title="Edit">
                      <IconButton onClick={() => { setEditing(p); setForm(p); setOpenForm(true); }}>
                        <Edit />
                      </IconButton>
                    </Tooltip>
                  )}

                  {can(['Owner', 'Admin']) && (
                    <Tooltip title="Delete">
                      <IconButton onClick={() => deleteProduct(p.id)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* PAGINATION */}
      <Box display="flex" justifyContent="center" mt={3}>
        <Pagination page={page} count={1} onChange={(_, v) => setPage(v)} />
      </Box>

      {/* ADD / EDIT PRODUCT */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="md">
        <DialogTitle>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent>
          {[
            ['Product Name', 'product_name'],
            ['SKU / Code', 'product_code'],
            ['Category', 'category'],
            ['Unit', 'unit'],
            ['Selling Price', 'selling_price'],
            ['Cost Price', 'cost_price'],
            ['Current Stock', 'current_stock'],
            ['Min Stock Level', 'min_stock_level'],
          ].map(([label, key]) => (
            <TextField
              key={key}
              fullWidth
              margin="dense"
              label={label}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          ))}
          <TextField
            fullWidth
            margin="dense"
            label="Description"
            multiline
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveProduct}>
            {editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* STOCK ADJUST */}
      <Dialog open={openStock} onClose={() => setOpenStock(false)}>
        <DialogTitle>Adjust Stock</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="New Stock" type="number"
            onChange={(e) => setStockForm({ ...stockForm, new_stock: e.target.value })}
          />
          <TextField fullWidth label="Reason" margin="dense"
            onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStock(false)}>Cancel</Button>
          <Button variant="contained" onClick={adjustStock}>Apply</Button>
        </DialogActions>
      </Dialog>

      {/* BULK UPDATE */}
      <Dialog open={openBulk} onClose={() => setOpenBulk(false)}>
        <DialogTitle>Bulk Update</DialogTitle>
        <DialogContent>
          <TextField label="Category" fullWidth
            onChange={(e) => setBulkForm({ ...bulkForm, category: e.target.value })}
          />
          <TextField label="Min Stock Level" fullWidth type="number" margin="dense"
            onChange={(e) => setBulkForm({ ...bulkForm, min_stock_level: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBulk(false)}>Cancel</Button>
          <Button variant="contained" onClick={applyBulkUpdate}>Apply</Button>
        </DialogActions>
      </Dialog>

      {/* IMPORT PREVIEW */}
      <Dialog open={openImportPreview} onClose={() => setOpenImportPreview(false)} maxWidth="md" fullWidth>
        <DialogTitle>Import Preview</DialogTitle>
        <DialogContent>
          {importPreview.map((row, i) => (
            <Typography key={i} variant="body2">{row.join(' | ')}</Typography>
          ))}
          {importErrors.length > 0 && (
            <Alert severity="error">Failed rows: {importErrors.length}</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImportPreview(false)}>Cancel</Button>
          <Button variant="contained" onClick={confirmImport}>Confirm Import</Button>
        </DialogActions>
      </Dialog>

      {/* DRAWER + LOGS */}
      <ProductDetailDrawer open={openDrawer} product={drawerProduct} onClose={() => setOpenDrawer(false)} />
      <StockLogsDialog open={openLogs} onClose={() => setOpenLogs(false)} />
    </Box>
  );
};

export default Products;

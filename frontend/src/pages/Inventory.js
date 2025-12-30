/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Warning,
  CheckCircle,
  FilterList,
  Download,
  Upload,
  AttachMoney,
  Receipt,
  TrendingUp,
  TrendingDown,
  Warehouse,
  LocalShipping,
  Reorder,
  Inventory as InventoryIcon,
  Visibility
} from '@mui/icons-material';
import { inventoryAPI, productAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { useFormik } from 'formik';
import * as yup from 'yup';

const validationSchema = yup.object({
  product_id: yup.number().required('Product is required'),
  transaction_type: yup.string().oneOf(['IN', 'OUT', 'ADJUST']).required('Transaction type is required'),
  quantity: yup.number().min(1, 'Quantity must be at least 1').required('Quantity is required'),
  unit_price: yup.number().min(0, 'Price must be positive'),
  notes: yup.string()
});

const InventoryPage = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [view, setView] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      const [overviewResponse, productsResponse, transactionsResponse] = await Promise.all([
        inventoryAPI.getOverview(),
        productAPI.getProducts(),
        inventoryAPI.getTransactions()
      ]);
      setInventoryData(overviewResponse.data.data);
      setProducts(productsResponse.data.data);
      setTransactions(transactionsResponse.data.data);
      
      // Calculate stats
      if (overviewResponse.data.data) {
        const totalValue = overviewResponse.data.data.reduce((sum, item) => 
          sum + (item.current_stock * item.cost_price), 0
        );
        const lowStockItems = overviewResponse.data.data.filter(item => 
          item.current_stock <= item.min_stock_level
        ).length;
        
        setStats({
          totalValue,
          totalItems: overviewResponse.data.data.length,
          lowStockItems,
          outOfStock: overviewResponse.data.data.filter(item => item.current_stock === 0).length
        });
      }
    } catch (error) {
      toast.error('Failed to fetch inventory data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      product_id: '',
      transaction_type: 'IN',
      quantity: 1,
      unit_price: 0,
      notes: ''
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        await inventoryAPI.createTransaction(values);
        toast.success('Transaction recorded successfully');
        formik.resetForm();
        fetchInventoryData();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Transaction failed');
      }
    }
  });

  const getStockStatus = (current, min) => {
    if (current === 0) return { label: 'Out of Stock', color: 'error', icon: <Warning /> };
    if (current <= min) return { label: 'Low Stock', color: 'warning', icon: <Warning /> };
    return { label: 'In Stock', color: 'success', icon: <CheckCircle /> };
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  const filteredInventory = inventoryData.filter(item => {
    const matchesSearch = item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'low' && item.current_stock <= item.min_stock_level) ||
                         (filterStatus === 'out' && item.current_stock === 0);
    return matchesSearch && matchesStatus;
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">
          Inventory Management
        </Typography>
        <Box display="flex" gap={2}>
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(e, newView) => setView(newView)}
            size="small"
          >
            <ToggleButton value="overview">
              <InventoryIcon sx={{ mr: 1 }} />
              Overview
            </ToggleButton>
            <ToggleButton value="transactions">
              <Receipt sx={{ mr: 1 }} />
              Transactions
            </ToggleButton>
            <ToggleButton value="reorder">
              <Reorder sx={{ mr: 1 }} />
              Reorder
            </ToggleButton>
          </ToggleButtonGroup>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => formik.handleSubmit()}
          >
            New Transaction
          </Button>
        </Box>
      </Box>

      {/* Inventory Stats */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Total Inventory Value
                    </Typography>
                    <Typography variant="h4">
                      {formatCurrency(stats.totalValue)}
                    </Typography>
                    <Box display="flex" alignItems="center" sx={{ mt: 1 }}>
                      <TrendingUp color="success" fontSize="small" />
                      <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                        Good
                      </Typography>
                    </Box>
                  </Box>
                  <AttachMoney color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Total Items
                    </Typography>
                    <Typography variant="h4">
                      {stats.totalItems}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Unique products
                    </Typography>
                  </Box>
                  <Warehouse color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Low Stock Items
                    </Typography>
                    <Typography variant="h4">
                      {stats.lowStockItems}
                    </Typography>
                    <Box display="flex" alignItems="center" sx={{ mt: 1 }}>
                      {stats.lowStockItems > 0 ? (
                        <TrendingDown color="error" fontSize="small" />
                      ) : (
                        <TrendingUp color="success" fontSize="small" />
                      )}
                      <Typography 
                        variant="body2" 
                        color={stats.lowStockItems > 0 ? 'error.main' : 'success.main'}
                        sx={{ ml: 0.5 }}
                      >
                        {stats.lowStockItems > 0 ? 'Need attention' : 'All good'}
                      </Typography>
                    </Box>
                  </Box>
                  <Warning color="warning" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Out of Stock
                    </Typography>
                    <Typography variant="h4">
                      {stats.outOfStock}
                    </Typography>
                    <Chip
                      label={stats.outOfStock > 0 ? 'Critical' : 'None'}
                      size="small"
                      color={stats.outOfStock > 0 ? 'error' : 'success'}
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  <LocalShipping color="error" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Stock Status</InputLabel>
              <Select
                value={filterStatus}
                label="Stock Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">All Items</MenuItem>
                <MenuItem value="low">Low Stock</MenuItem>
                <MenuItem value="out">Out of Stock</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button fullWidth variant="outlined" startIcon={<Download />}>
              Export Inventory
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Inventory Table */}
      {view === 'overview' && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell align="right">Current Stock</TableCell>
                <TableCell align="right">Min Stock</TableCell>
                <TableCell align="right">Unit Cost</TableCell>
                <TableCell align="right">Total Value</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInventory.map((item) => {
                const stockStatus = getStockStatus(item.current_stock, item.min_stock_level);
                const totalValue = item.current_stock * (item.cost_price || 0);
                
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Typography fontWeight="bold">{item.product_name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.category}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={item.sku} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" justifyContent="flex-end">
                        <InventoryIcon sx={{ mr: 1, fontSize: 16 }} />
                        {item.current_stock} {item.unit_of_measure || 'units'}
                      </Box>
                    </TableCell>
                    <TableCell align="right">{item.min_stock_level}</TableCell>
                    <TableCell align="right">{formatCurrency(item.cost_price)}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold">
                        {formatCurrency(totalValue)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={stockStatus.icon}
                        label={stockStatus.label}
                        color={stockStatus.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton size="small">
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small">
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small">
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredInventory.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Alert severity="info" sx={{ my: 2 }}>
                      No inventory items found
                    </Alert>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Transaction Form Dialog */}
      <Dialog open={false} onClose={() => {}} maxWidth="sm" fullWidth>
        <DialogTitle>Record Inventory Transaction</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Product *</InputLabel>
                  <Select
                    name="product_id"
                    value={formik.values.product_id}
                    label="Product *"
                    onChange={formik.handleChange}
                    error={formik.touched.product_id && Boolean(formik.errors.product_id)}
                  >
                    <MenuItem value="">Select Product</MenuItem>
                    {products.map(product => (
                      <MenuItem key={product.id} value={product.id}>
                        {product.product_name} (Stock: {product.current_stock})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Transaction Type *</InputLabel>
                  <Select
                    name="transaction_type"
                    value={formik.values.transaction_type}
                    label="Transaction Type *"
                    onChange={formik.handleChange}
                  >
                    <MenuItem value="IN">Stock In (+)</MenuItem>
                    <MenuItem value="OUT">Stock Out (-)</MenuItem>
                    <MenuItem value="ADJUST">Adjustment</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="quantity"
                  label="Quantity *"
                  type="number"
                  value={formik.values.quantity}
                  onChange={formik.handleChange}
                  error={formik.touched.quantity && Boolean(formik.errors.quantity)}
                  helperText={formik.touched.quantity && formik.errors.quantity}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="unit_price"
                  label="Unit Price"
                  type="number"
                  value={formik.values.unit_price}
                  onChange={formik.handleChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="notes"
                  label="Notes"
                  multiline
                  rows={2}
                  value={formik.values.notes}
                  onChange={formik.handleChange}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {}}>Cancel</Button>
          <Button 
            onClick={() => formik.handleSubmit()} 
            variant="contained"
            disabled={!formik.isValid}
          >
            Record Transaction
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventoryPage;
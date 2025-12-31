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
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [view, setView] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching inventory data...');
      
      const [overviewResponse, productsResponse, transactionsResponse] = await Promise.all([
        inventoryAPI.getOverview(),
        productAPI.getProducts(),
        inventoryAPI.getTransactions()
      ]);

      // Debug log to see actual response structure
      console.log('Overview Response:', overviewResponse);
      console.log('Products Response:', productsResponse);
      console.log('Transactions Response:', transactionsResponse);

      // Extract data safely - handle different response structures
      const inventoryResponse = overviewResponse.data?.data || overviewResponse.data || overviewResponse || [];
      const productsResponseData = productsResponse.data?.data || productsResponse.data || productsResponse || [];
      const transactionsResponseData = transactionsResponse.data?.data || transactionsResponse.data || transactionsResponse || [];

      console.log('Inventory Data:', inventoryResponse);
      console.log('Products Data:', productsResponseData);
      console.log('Transactions Data:', transactionsResponseData);

      // Ensure all data are arrays
      const safeInventoryData = Array.isArray(inventoryResponse) ? inventoryResponse : [];
      const safeProductsData = Array.isArray(productsResponseData) ? productsResponseData : [];
      const safeTransactionsData = Array.isArray(transactionsResponseData) ? transactionsResponseData : [];

      setInventoryData(safeInventoryData);
      setProducts(safeProductsData);
      setTransactions(safeTransactionsData);
      
      // Calculate stats
      if (safeInventoryData.length > 0) {
        const totalValue = safeInventoryData.reduce((sum, item) => {
          const stock = item.current_stock || item.stock || item.quantity || 0;
          const cost = item.cost_price || item.price || item.unit_cost || 0;
          return sum + (stock * cost);
        }, 0);
        
        const lowStockItems = safeInventoryData.filter(item => {
          const stock = item.current_stock || item.stock || item.quantity || 0;
          const minStock = item.min_stock_level || item.min_stock || item.min_quantity || 0;
          return stock <= minStock && stock > 0;
        }).length;
        
        const outOfStock = safeInventoryData.filter(item => {
          const stock = item.current_stock || item.stock || item.quantity || 0;
          return stock === 0;
        }).length;
        
        setStats({
          totalValue,
          totalItems: safeInventoryData.length,
          lowStockItems,
          outOfStock
        });
      } else {
        // Set default stats if no data
        setStats({
          totalValue: 0,
          totalItems: 0,
          lowStockItems: 0,
          outOfStock: 0
        });
      }
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch inventory data';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Set empty arrays on error
      setInventoryData([]);
      setProducts([]);
      setTransactions([]);
      setStats({
        totalValue: 0,
        totalItems: 0,
        lowStockItems: 0,
        outOfStock: 0
      });
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
        setTransactionDialogOpen(false);
        fetchInventoryData();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Transaction failed');
      }
    }
  });

  const getStockStatus = (item) => {
    const current = item.current_stock || item.stock || item.quantity || 0;
    const min = item.min_stock_level || item.min_stock || item.min_quantity || 0;
    
    if (current === 0) return { label: 'Out of Stock', color: 'error', icon: <Warning /> };
    if (current <= min) return { label: 'Low Stock', color: 'warning', icon: <Warning /> };
    return { label: 'In Stock', color: 'success', icon: <CheckCircle /> };
  };

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) amount = 0;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getStockValue = (item) => {
    const stock = item.current_stock || item.stock || item.quantity || 0;
    const cost = item.cost_price || item.price || item.unit_cost || 0;
    return stock * cost;
  };

  // Safe filtering of inventory data
  const filteredInventory = (Array.isArray(inventoryData) ? inventoryData : []).filter(item => {
    if (!item) return false;
    
    const productName = item.product_name || item.name || item.productName || '';
    const sku = item.sku || item.product_code || item.code || '';
    
    const matchesSearch = productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const currentStock = item.current_stock || item.stock || item.quantity || 0;
    const minStock = item.min_stock_level || item.min_stock || item.min_quantity || 0;
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'low' && currentStock <= minStock && currentStock > 0) ||
                         (filterStatus === 'out' && currentStock === 0);
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  if (error && inventoryData.length === 0) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Inventory Management
        </Typography>
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={fetchInventoryData}
          startIcon={<Refresh />}
        >
          Retry Loading Data
        </Button>
      </Box>
    );
  }

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
            onClick={() => setTransactionDialogOpen(true)}
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
              {filteredInventory.map((item, index) => {
                const stockStatus = getStockStatus(item);
                const totalValue = getStockValue(item);
                const productName = item.product_name || item.name || item.productName || 'Unknown Product';
                const sku = item.sku || item.product_code || item.code || 'N/A';
                const currentStock = item.current_stock || item.stock || item.quantity || 0;
                const minStock = item.min_stock_level || item.min_stock || item.min_quantity || 0;
                const unitCost = item.cost_price || item.price || item.unit_cost || 0;
                const category = item.category || item.product_category || '';
                const unit = item.unit_of_measure || item.unit || 'units';
                
                return (
                  <TableRow key={item.id || item._id || index}>
                    <TableCell>
                      <Typography fontWeight="bold">{productName}</Typography>
                      {category && (
                        <Typography variant="body2" color="text.secondary">
                          {category}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={sku} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" justifyContent="flex-end">
                        <InventoryIcon sx={{ mr: 1, fontSize: 16 }} />
                        {currentStock} {unit}
                      </Box>
                    </TableCell>
                    <TableCell align="right">{minStock}</TableCell>
                    <TableCell align="right">{formatCurrency(unitCost)}</TableCell>
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
                      {searchTerm || filterStatus !== 'all' 
                        ? 'No inventory items match your search criteria' 
                        : 'No inventory items found'}
                    </Alert>
                    <Button 
                      variant="outlined" 
                      onClick={() => {
                        setSearchTerm('');
                        setFilterStatus('all');
                      }}
                    >
                      Clear Filters
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Transaction Form Dialog */}
      <Dialog open={transactionDialogOpen} onClose={() => setTransactionDialogOpen(false)} maxWidth="sm" fullWidth>
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
                    {products.map(product => {
                      const productName = product.product_name || product.name || 'Unknown Product';
                      const currentStock = product.current_stock || product.stock || product.quantity || 0;
                      return (
                        <MenuItem key={product.id || product._id} value={product.id || product._id}>
                          {productName} (Stock: {currentStock})
                        </MenuItem>
                      );
                    })}
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
          <Button onClick={() => setTransactionDialogOpen(false)}>Cancel</Button>
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
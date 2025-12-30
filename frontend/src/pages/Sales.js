// Add these imports:
import { AttachMoney, Warning } from '@mui/icons-material';
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
  Autocomplete
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  ShoppingCart,
  Receipt,
  Download,
  FilterList,
  TrendingUp,
  TrendingDown,
  Visibility
} from '@mui/icons-material';
import { salesAPI, productAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const validationSchema = yup.object({
  customer_name: yup.string().required('Customer name is required'),
  product_id: yup.number().required('Product is required'),
  quantity: yup.number().min(1, 'Quantity must be at least 1').required('Quantity is required'),
  unit_price: yup.number().min(0, 'Price must be positive').required('Price is required'),
  total_amount: yup.number().min(0, 'Amount must be positive'),
  tax_rate: yup.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate cannot exceed 100%'),
  discount: yup.number().min(0, 'Discount cannot be negative'),
  payment_status: yup.string().required('Payment status is required'),
  sale_date: yup.date().required('Sale date is required')
});

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [salesResponse, productsResponse, statsResponse] = await Promise.all([
        salesAPI.getSales(),
        productAPI.getProducts(),
        salesAPI.getSalesStats()
      ]);
      setSales(salesResponse.data.data);
      setProducts(productsResponse.data.data);
      setStats(statsResponse.data.data);
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      customer_name: '',
      product_id: '',
      quantity: 1,
      unit_price: 0,
      total_amount: 0,
      tax_rate: 18,
      discount: 0,
      payment_status: 'Pending',
      sale_date: new Date(),
      notes: ''
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        if (editingSale) {
          await salesAPI.updateSale(editingSale.id, values);
          toast.success('Sale updated successfully');
        } else {
          await salesAPI.createSale(values);
          toast.success('Sale created successfully');
        }
        formik.resetForm();
        setOpenDialog(false);
        setEditingSale(null);
        fetchData();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Operation failed');
      }
    }
  });

  const calculateTotal = () => {
    const quantity = parseFloat(formik.values.quantity) || 0;
    const unitPrice = parseFloat(formik.values.unit_price) || 0;
    const discount = parseFloat(formik.values.discount) || 0;
    const taxRate = parseFloat(formik.values.tax_rate) || 0;
    
    const subtotal = quantity * unitPrice;
    const discountAmount = subtotal * (discount / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (taxRate / 100);
    const total = afterDiscount + taxAmount;
    
    formik.setFieldValue('total_amount', total.toFixed(2));
    return total;
  };

  useEffect(() => {
    if (formik.values.product_id && products.length > 0) {
      const selectedProduct = products.find(p => p.id === formik.values.product_id);
      if (selectedProduct) {
        formik.setFieldValue('unit_price', selectedProduct.unit_price);
        calculateTotal();
      }
    }
  }, [formik.values.product_id, formik.values.quantity, formik.values.discount, formik.values.tax_rate]);

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Pending': return 'warning';
      case 'Overdue': return 'error';
      case 'Partially Paid': return 'info';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">
          Sales Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setEditingSale(null);
            formik.resetForm();
            formik.setFieldValue('sale_date', new Date());
            setOpenDialog(true);
          }}
        >
          New Sale
        </Button>
      </Box>

      {/* Sales Statistics */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Total Revenue
                    </Typography>
                    <Typography variant="h4">
                      ₹{stats.total_revenue?.toLocaleString() || 0}
                    </Typography>
                    <Box display="flex" alignItems="center" sx={{ mt: 1 }}>
                      {stats.revenue_change > 0 ? (
                        <TrendingUp color="success" fontSize="small" />
                      ) : (
                        <TrendingDown color="error" fontSize="small" />
                      )}
                      <Typography 
                        variant="body2" 
                        color={stats.revenue_change > 0 ? 'success.main' : 'error.main'}
                        sx={{ ml: 0.5 }}
                      >
                        {stats.revenue_change > 0 ? '+' : ''}{stats.revenue_change}%
                      </Typography>
                    </Box>
                  </Box>
                  <ShoppingCart color="primary" sx={{ fontSize: 40 }} />
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
                      Total Sales
                    </Typography>
                    <Typography variant="h4">
                      {stats.total_sales}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      This month
                    </Typography>
                  </Box>
                  <Receipt color="success" sx={{ fontSize: 40 }} />
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
                      Avg. Order Value
                    </Typography>
                    <Typography variant="h4">
                      ₹{stats.average_order_value?.toFixed(2) || 0}
                    </Typography>
                  </Box>
                  <AttachMoney color="warning" sx={{ fontSize: 40 }} />
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
                      Outstanding
                    </Typography>
                    <Typography variant="h4">
                      ₹{stats.outstanding_amount?.toLocaleString() || 0}
                    </Typography>
                    <Chip
                      label={`${stats.pending_sales} pending`}
                      size="small"
                      color="warning"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  <Warning color="error" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Recent Sales Table */}
      <Paper sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">
            Recent Sales
          </Typography>
          <Box display="flex" gap={1}>
            <Button startIcon={<FilterList />} variant="outlined">
              Filter
            </Button>
            <Button startIcon={<Download />} variant="outlined">
              Export
            </Button>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sale ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Product</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sales.slice(0, 10).map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>
                    <Chip label={`SALE-${sale.id}`} size="small" />
                  </TableCell>
                  <TableCell>{sale.customer_name}</TableCell>
                  <TableCell>{sale.Product?.product_name}</TableCell>
                  <TableCell align="right">{sale.quantity}</TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold">
                      ₹{sale.total_amount?.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(sale.sale_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={sale.payment_status}
                      size="small"
                      color={getPaymentStatusColor(sale.payment_status)}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small">
                      <Visibility fontSize="small" />
                    </IconButton>
                    <IconButton size="small">
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small">
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {sales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Alert severity="info" sx={{ my: 2 }}>
                      No sales records found. Create your first sale!
                    </Alert>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Sale Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSale ? 'Edit Sale' : 'Create New Sale'}
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="customer_name"
                    label="Customer Name"
                    value={formik.values.customer_name}
                    onChange={formik.handleChange}
                    error={formik.touched.customer_name && Boolean(formik.errors.customer_name)}
                    helperText={formik.touched.customer_name && formik.errors.customer_name}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Product</InputLabel>
                    <Select
                      name="product_id"
                      value={formik.values.product_id}
                      label="Product"
                      onChange={formik.handleChange}
                      error={formik.touched.product_id && Boolean(formik.errors.product_id)}
                    >
                      <MenuItem value="">Select Product</MenuItem>
                      {products.map(product => (
                        <MenuItem key={product.id} value={product.id}>
                          {product.product_name} (₹{product.unit_price})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    name="quantity"
                    label="Quantity"
                    type="number"
                    value={formik.values.quantity}
                    onChange={formik.handleChange}
                    error={formik.touched.quantity && Boolean(formik.errors.quantity)}
                    helperText={formik.touched.quantity && formik.errors.quantity}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
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
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    name="total_amount"
                    label="Total Amount"
                    value={formik.values.total_amount}
                    disabled
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    name="discount"
                    label="Discount %"
                    type="number"
                    value={formik.values.discount}
                    onChange={formik.handleChange}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    name="tax_rate"
                    label="Tax Rate %"
                    type="number"
                    value={formik.values.tax_rate}
                    onChange={formik.handleChange}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Status</InputLabel>
                    <Select
                      name="payment_status"
                      value={formik.values.payment_status}
                      label="Payment Status"
                      onChange={formik.handleChange}
                    >
                      <MenuItem value="Pending">Pending</MenuItem>
                      <MenuItem value="Paid">Paid</MenuItem>
                      <MenuItem value="Partially Paid">Partially Paid</MenuItem>
                      <MenuItem value="Overdue">Overdue</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Sale Date"
                    value={formik.values.sale_date}
                    onChange={(date) => formik.setFieldValue('sale_date', date)}
                    renderInput={(params) => (
                      <TextField fullWidth {...params} />
                    )}
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
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => formik.handleSubmit()} 
            variant="contained"
            disabled={!formik.isValid}
          >
            {editingSale ? 'Update Sale' : 'Create Sale'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sales;
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
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  LinearProgress,
  Alert,
  InputAdornment
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Inventory,
  Warning,
  CheckCircle,
  FilterList,
  Download,
  Upload
} from '@mui/icons-material';
import { productAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { useFormik } from 'formik';
import * as yup from 'yup';

const validationSchema = yup.object({
  product_name: yup.string().required('Product name is required'),
  sku: yup.string().required('SKU is required'),
  category: yup.string().required('Category is required'),
  unit_price: yup.number().min(0, 'Price must be positive').required('Price is required'),
  cost_price: yup.number().min(0, 'Cost must be positive').required('Cost is required'),
  current_stock: yup.number().min(0, 'Stock cannot be negative').required('Stock is required'),
  min_stock_level: yup.number().min(0, 'Minimum stock level required'),
  description: yup.string()
});

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getProducts();
      setProducts(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch products');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      product_name: '',
      sku: '',
      category: '',
      unit_price: '',
      cost_price: '',
      current_stock: '',
      min_stock_level: '',
      description: '',
      unit_of_measure: 'units'
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        if (editingProduct) {
          await productAPI.updateProduct(editingProduct.id, values);
          toast.success('Product updated successfully');
        } else {
          await productAPI.createProduct(values);
          toast.success('Product created successfully');
        }
        formik.resetForm();
        setOpenDialog(false);
        setEditingProduct(null);
        fetchProducts();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Operation failed');
      }
    }
  });

  const handleEdit = (product) => {
    setEditingProduct(product);
    formik.setValues(product);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productAPI.deleteProduct(id);
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  const getStockStatus = (current, min) => {
    if (current === 0) return { label: 'Out of Stock', color: 'error' };
    if (current <= min) return { label: 'Low Stock', color: 'warning' };
    return { label: 'In Stock', color: 'success' };
  };

  const categories = ['Raw Material', 'Finished Goods', 'Component', 'Packaging', 'MRO'];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

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
          Product Management
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Upload />}
          >
            Import
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setEditingProduct(null);
              formik.resetForm();
              setOpenDialog(true);
            }}
          >
            Add Product
          </Button>
        </Box>
      </Box>

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search products by name or SKU..."
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
              <InputLabel>Category</InputLabel>
              <Select
                value={filterCategory}
                label="Category"
                onChange={(e) => setFilterCategory(e.target.value)}
                startAdornment={<FilterList />}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map(cat => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button fullWidth variant="outlined" startIcon={<Download />}>
              Export Products
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Products Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Cost</TableCell>
              <TableCell align="right">Stock</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product.current_stock, product.min_stock_level);
              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <Box>
                      <Typography fontWeight="bold">{product.product_name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {product.description?.substring(0, 50)}...
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={product.sku} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold">
                      ₹{product.unit_price.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    ₹{product.cost_price.toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    <Box display="flex" alignItems="center" justifyContent="flex-end">
                      <Inventory sx={{ mr: 1, fontSize: 16 }} />
                      {product.current_stock} {product.unit_of_measure}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={stockStatus.color === 'error' ? <Warning /> : <CheckCircle />}
                      label={stockStatus.label}
                      color={stockStatus.color}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit">
                      <IconButton onClick={() => handleEdit(product)}>
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton onClick={() => handleDelete(product.id)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Alert severity="info" sx={{ my: 2 }}>
                    No products found. Add your first product!
                  </Alert>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="product_name"
                  label="Product Name"
                  value={formik.values.product_name}
                  onChange={formik.handleChange}
                  error={formik.touched.product_name && Boolean(formik.errors.product_name)}
                  helperText={formik.touched.product_name && formik.errors.product_name}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="sku"
                  label="SKU"
                  value={formik.values.sku}
                  onChange={formik.handleChange}
                  error={formik.touched.sku && Boolean(formik.errors.sku)}
                  helperText={formik.touched.sku && formik.errors.sku}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={formik.values.category}
                    label="Category"
                    onChange={formik.handleChange}
                    error={formik.touched.category && Boolean(formik.errors.category)}
                  >
                    {categories.map(cat => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="unit_of_measure"
                  label="Unit of Measure"
                  value={formik.values.unit_of_measure}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="unit_price"
                  label="Selling Price"
                  type="number"
                  value={formik.values.unit_price}
                  onChange={formik.handleChange}
                  error={formik.touched.unit_price && Boolean(formik.errors.unit_price)}
                  helperText={formik.touched.unit_price && formik.errors.unit_price}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="cost_price"
                  label="Cost Price"
                  type="number"
                  value={formik.values.cost_price}
                  onChange={formik.handleChange}
                  error={formik.touched.cost_price && Boolean(formik.errors.cost_price)}
                  helperText={formik.touched.cost_price && formik.errors.cost_price}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="current_stock"
                  label="Current Stock"
                  type="number"
                  value={formik.values.current_stock}
                  onChange={formik.handleChange}
                  error={formik.touched.current_stock && Boolean(formik.errors.current_stock)}
                  helperText={formik.touched.current_stock && formik.errors.current_stock}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="min_stock_level"
                  label="Minimum Stock Level"
                  type="number"
                  value={formik.values.min_stock_level}
                  onChange={formik.handleChange}
                  error={formik.touched.min_stock_level && Boolean(formik.errors.min_stock_level)}
                  helperText={formik.touched.min_stock_level && formik.errors.min_stock_level}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="description"
                  label="Description"
                  multiline
                  rows={3}
                  value={formik.values.description}
                  onChange={formik.handleChange}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => formik.handleSubmit()} 
            variant="contained"
            disabled={!formik.isValid || formik.isSubmitting}
          >
            {editingProduct ? 'Update Product' : 'Create Product'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Products;
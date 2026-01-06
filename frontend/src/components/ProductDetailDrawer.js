import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  Divider,
  Chip,
  Grid,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

/**
 * =========================
 * Product Detail Drawer
 * =========================
 */
const ProductDetailDrawer = ({ open, onClose, product }) => {
  if (!product) return null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 380, p: 2 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Product Details</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Basic Info */}
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle2">Product Name</Typography>
            <Typography>{product.product_name}</Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2">Product Code</Typography>
            <Typography>{product.product_code}</Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle2">Category</Typography>
            <Typography>{product.category || '-'}</Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle2">Unit</Typography>
            <Typography>{product.unit || 'PCS'}</Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Pricing */}
        <Typography variant="subtitle2">Pricing</Typography>
        <Grid container spacing={2} mt={1}>
          <Grid item xs={6}>
            <Typography variant="caption">Selling Price</Typography>
            <Typography>₹ {product.selling_price}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption">Cost Price</Typography>
            <Typography>₹ {product.cost_price}</Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Stock */}
        <Typography variant="subtitle2">Stock</Typography>
        <Grid container spacing={2} mt={1}>
          <Grid item xs={6}>
            <Typography variant="caption">Current</Typography>
            <Typography>{product.current_stock}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption">Min Level</Typography>
            <Typography>{product.min_stock_level}</Typography>
          </Grid>
        </Grid>

        <Box mt={2}>
          <Chip
            label={
              product.current_stock <= product.min_stock_level
                ? 'Low Stock'
                : 'Stock OK'
            }
            color={
              product.current_stock <= product.min_stock_level
                ? 'warning'
                : 'success'
            }
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Description */}
        <Typography variant="subtitle2">Description</Typography>
        <Typography variant="body2">
          {product.description || 'No description'}
        </Typography>
      </Box>
    </Drawer>
  );
};

export default ProductDetailDrawer;

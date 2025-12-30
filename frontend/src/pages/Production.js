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
  Stepper,
  Step,
  StepLabel,
  Tooltip,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  PlayArrow,
  Pause,
  CheckCircle,
  Warning,
  Factory,
  Timeline,
  Speed,
  CalendarToday,
  FilterList,
  Download,
  Visibility
} from '@mui/icons-material';
import { productionAPI, productAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Line, Bar } from 'react-chartjs-2';

const validationSchema = yup.object({
  product_id: yup.number().required('Product is required'),
  planned_quantity: yup.number().min(1, 'Quantity must be at least 1').required('Quantity is required'),
  actual_quantity: yup.number().min(0, 'Quantity cannot be negative'),
  production_date: yup.date().required('Production date is required'),
  start_time: yup.string().required('Start time is required'),
  end_time: yup.string().required('End time is required'),
  machine_id: yup.string().required('Machine ID is required'),
  operator_name: yup.string().required('Operator name is required'),
  status: yup.string().required('Status is required')
});

const Production = () => {
  const [productions, setProductions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduction, setEditingProduction] = useState(null);
  const [stats, setStats] = useState(null);
  const [oeeData, setOeeData] = useState(null);
  const [activeProductions, setActiveProductions] = useState([]);

  useEffect(() => {
    fetchData();
    // Simulate real-time updates for active productions
    const interval = setInterval(() => {
      fetchActiveProductions();
    }, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [productionsResponse, productsResponse, statsResponse, oeeResponse] = await Promise.all([
        productionAPI.getProductions(),
        productAPI.getProducts(),
        productionAPI.getProductionStats(),
        productionAPI.getOEE({ period: 'week' })
      ]);
      setProductions(productionsResponse.data.data);
      setProducts(productsResponse.data.data);
      setStats(statsResponse.data.data);
      setOeeData(oeeResponse.data.data);
      fetchActiveProductions();
    } catch (error) {
      toast.error('Failed to fetch production data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveProductions = async () => {
    // In a real app, this would come from an API
    const active = productions.filter(p => p.status === 'In Progress');
    setActiveProductions(active);
  };

  const formik = useFormik({
    initialValues: {
      product_id: '',
      planned_quantity: 100,
      actual_quantity: 0,
      production_date: new Date(),
      start_time: '08:00',
      end_time: '17:00',
      machine_id: 'MACH-001',
      operator_name: '',
      status: 'Scheduled',
      defects: 0,
      downtime_minutes: 0,
      notes: ''
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        if (editingProduction) {
          await productionAPI.updateProduction(editingProduction.id, values);
          toast.success('Production order updated successfully');
        } else {
          await productionAPI.createProduction(values);
          toast.success('Production order created successfully');
        }
        formik.resetForm();
        setOpenDialog(false);
        setEditingProduction(null);
        fetchData();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Operation failed');
      }
    }
  });

  const handleStartProduction = async (id) => {
    try {
      await productionAPI.updateProduction(id, { status: 'In Progress', start_time: new Date().toISOString() });
      toast.success('Production started');
      fetchData();
    } catch (error) {
      toast.error('Failed to start production');
    }
  };

  const handleCompleteProduction = async (id) => {
    try {
      await productionAPI.updateProduction(id, { 
        status: 'Completed', 
        end_time: new Date().toISOString(),
        actual_quantity: formik.values.planned_quantity // In real app, this would be actual count
      });
      toast.success('Production completed');
      fetchData();
    } catch (error) {
      toast.error('Failed to complete production');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'In Progress': return 'primary';
      case 'Scheduled': return 'info';
      case 'On Hold': return 'warning';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const calculateEfficiency = (planned, actual, defects) => {
    if (planned === 0) return 0;
    const goodUnits = actual - defects;
    return Math.round((goodUnits / planned) * 100);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  // Chart data for OEE
  const oeeChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'OEE %',
        data: oeeData?.daily_oee || [85, 88, 82, 90, 87, 75, 80],
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const efficiencyChartData = {
    labels: ['Machine 1', 'Machine 2', 'Machine 3', 'Machine 4'],
    datasets: [
      {
        label: 'Efficiency %',
        data: [92, 85, 78, 95],
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(255, 99, 132, 0.8)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">
          Production Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setEditingProduction(null);
            formik.resetForm();
            formik.setFieldValue('production_date', new Date());
            setOpenDialog(true);
          }}
        >
          New Production Order
        </Button>
      </Box>

      {/* Production Stats */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Total Production
                    </Typography>
                    <Typography variant="h4">
                      {stats.total_units?.toLocaleString() || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Units this month
                    </Typography>
                  </Box>
                  <Factory color="primary" sx={{ fontSize: 40 }} />
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
                      Overall OEE
                    </Typography>
                    <Typography variant="h4">
                      {oeeData?.overall_oee || 0}%
                    </Typography>
                    <Box display="flex" alignItems="center" sx={{ mt: 1 }}>
                      <CircularProgress 
                        variant="determinate" 
                        value={oeeData?.overall_oee || 0} 
                        size={20}
                        color={oeeData?.overall_oee > 85 ? 'success' : oeeData?.overall_oee > 70 ? 'warning' : 'error'}
                      />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {oeeData?.overall_oee > 85 ? 'Excellent' : oeeData?.overall_oee > 70 ? 'Good' : 'Needs Improvement'}
                      </Typography>
                    </Box>
                  </Box>
                  <Speed color="success" sx={{ fontSize: 40 }} />
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
                      Active Orders
                    </Typography>
                    <Typography variant="h4">
                      {activeProductions.length}
                    </Typography>
                    <Chip
                      label={`${stats.completed_orders || 0} completed`}
                      size="small"
                      color="success"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  <Timeline color="warning" sx={{ fontSize: 40 }} />
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
                      Avg. Efficiency
                    </Typography>
                    <Typography variant="h4">
                      {stats.average_efficiency || 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Last 7 days
                    </Typography>
                  </Box>
                  <CheckCircle color="info" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Active Productions */}
      {activeProductions.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Active Productions
          </Typography>
          <Grid container spacing={2}>
            {activeProductions.map((production) => {
              const product = products.find(p => p.id === production.product_id);
              return (
                <Grid item xs={12} md={6} key={production.id}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography fontWeight="bold">
                          {product?.product_name || 'Unknown Product'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Order: PROD-{production.id}
                        </Typography>
                      </Box>
                      <Chip
                        label="In Progress"
                        color="primary"
                        icon={<PlayArrow />}
                      />
                    </Box>
                    <Box sx={{ mt: 2 }}>
                      <Stepper activeStep={1} alternativeLabel>
                        <Step><StepLabel>Scheduled</StepLabel></Step>
                        <Step><StepLabel>In Progress</StepLabel></Step>
                        <Step><StepLabel>Quality Check</StepLabel></Step>
                        <Step><StepLabel>Completed</StepLabel></Step>
                      </Stepper>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        Target: {production.planned_quantity} units
                      </Typography>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleCompleteProduction(production.id)}
                      >
                        Mark Complete
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      )}

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Overall Equipment Effectiveness (OEE)
            </Typography>
            <Box sx={{ height: 300 }}>
              <Line
                data={oeeChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: 'OEE %'
                      }
                    }
                  },
                  plugins: {
                    legend: { position: 'top' }
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Machine Efficiency
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar
                data={efficiencyChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: 'Efficiency %'
                      }
                    }
                  },
                  plugins: {
                    legend: { display: false }
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Production Orders Table */}
      <Paper sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">
            Production Orders
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
                <TableCell>Order ID</TableCell>
                <TableCell>Product</TableCell>
                <TableCell align="right">Planned</TableCell>
                <TableCell align="right">Actual</TableCell>
                <TableCell>Machine</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Efficiency</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {productions.slice(0, 10).map((production) => {
                const product = products.find(p => p.id === production.product_id);
                const efficiency = calculateEfficiency(
                  production.planned_quantity,
                  production.actual_quantity || 0,
                  production.defects || 0
                );
                
                return (
                  <TableRow key={production.id}>
                    <TableCell>
                      <Chip label={`PROD-${production.id}`} size="small" />
                    </TableCell>
                    <TableCell>
                      {product?.product_name || 'Unknown'}
                    </TableCell>
                    <TableCell align="right">
                      {production.planned_quantity}
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" justifyContent="flex-end">
                        {production.actual_quantity || 0}
                        {production.defects > 0 && (
                          <Tooltip title={`${production.defects} defects`}>
                            <Warning color="error" fontSize="small" sx={{ ml: 1 }} />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{production.machine_id}</TableCell>
                    <TableCell>
                      <Chip
                        label={production.status}
                        size="small"
                        color={getStatusColor(production.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <LinearProgress 
                          variant="determinate" 
                          value={efficiency} 
                          sx={{ flexGrow: 1, mr: 1 }}
                          color={efficiency > 90 ? 'success' : efficiency > 80 ? 'warning' : 'error'}
                        />
                        <Typography variant="body2">
                          {efficiency}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      {production.status === 'Scheduled' && (
                        <Tooltip title="Start Production">
                          <IconButton 
                            size="small" 
                            onClick={() => handleStartProduction(production.id)}
                            color="primary"
                          >
                            <PlayArrow fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
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
                    </TableCell>
                  </TableRow>
                );
              })}
              {productions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Alert severity="info" sx={{ my: 2 }}>
                      No production orders found. Create your first order!
                    </Alert>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Production Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProduction ? 'Edit Production Order' : 'Create Production Order'}
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
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
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="planned_quantity"
                    label="Planned Quantity *"
                    type="number"
                    value={formik.values.planned_quantity}
                    onChange={formik.handleChange}
                    error={formik.touched.planned_quantity && Boolean(formik.errors.planned_quantity)}
                    helperText={formik.touched.planned_quantity && formik.errors.planned_quantity}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Production Date *"
                    value={formik.values.production_date}
                    onChange={(date) => formik.setFieldValue('production_date', date)}
                    renderInput={(params) => (
                      <TextField fullWidth {...params} />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="machine_id"
                    label="Machine ID *"
                    value={formik.values.machine_id}
                    onChange={formik.handleChange}
                    error={formik.touched.machine_id && Boolean(formik.errors.machine_id)}
                    helperText={formik.touched.machine_id && formik.errors.machine_id}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="operator_name"
                    label="Operator Name *"
                    value={formik.values.operator_name}
                    onChange={formik.handleChange}
                    error={formik.touched.operator_name && Boolean(formik.errors.operator_name)}
                    helperText={formik.touched.operator_name && formik.errors.operator_name}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status *</InputLabel>
                    <Select
                      name="status"
                      value={formik.values.status}
                      label="Status *"
                      onChange={formik.handleChange}
                      error={formik.touched.status && Boolean(formik.errors.status)}
                    >
                      <MenuItem value="Scheduled">Scheduled</MenuItem>
                      <MenuItem value="In Progress">In Progress</MenuItem>
                      <MenuItem value="On Hold">On Hold</MenuItem>
                      <MenuItem value="Completed">Completed</MenuItem>
                      <MenuItem value="Cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="start_time"
                    label="Start Time *"
                    type="time"
                    value={formik.values.start_time}
                    onChange={formik.handleChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="end_time"
                    label="End Time *"
                    type="time"
                    value={formik.values.end_time}
                    onChange={formik.handleChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="defects"
                    label="Defects Count"
                    type="number"
                    value={formik.values.defects}
                    onChange={formik.handleChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="downtime_minutes"
                    label="Downtime (Minutes)"
                    type="number"
                    value={formik.values.downtime_minutes}
                    onChange={formik.handleChange}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">min</InputAdornment>,
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
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => formik.handleSubmit()} 
            variant="contained"
            disabled={!formik.isValid}
          >
            {editingProduction ? 'Update Order' : 'Create Order'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Production;
import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Inventory,
  ShoppingCart,
  Factory,
  AttachMoney,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { dashboardAPI, productAPI, salesAPI, productionAPI } from '../services/api';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [healthScore, setHealthScore] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [overview, stats, health] = await Promise.all([
        dashboardAPI.getOverview(),
        productAPI.getProductStats(),
        dashboardAPI.getHealthScore()
      ]);
      
      setDashboardData({
        ...overview.data.data,
        productStats: stats.data.data
      });
      setHealthScore(health.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Healthy': return 'success';
      case 'Warning': return 'warning';
      case 'Critical': return 'error';
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

  const salesChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Sales Revenue',
        data: [65000, 59000, 80000, 81000, 56000, 55000],
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  const productionChartData = {
    labels: ['Product A', 'Product B', 'Product C', 'Product D'],
    datasets: [
      {
        label: 'Production Units',
        data: [1200, 1900, 3000, 500],
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
        ],
      },
    ],
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Business Dashboard
      </Typography>

      {/* Health Score Card */}
      {healthScore && (
        <Card sx={{ mb: 4, bgcolor: `${getStatusColor(healthScore.health_status)}.light` }}>
          <CardContent>
            <Grid container alignItems="center" spacing={2}>
              <Grid item>
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    bgcolor: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `4px solid ${getStatusColor(healthScore.health_status)}.main`
                  }}
                >
                  <Typography variant="h3" fontWeight="bold">
                    {healthScore.overall_score}
                  </Typography>
                  <Typography variant="caption">SCORE</Typography>
                </Box>
              </Grid>
              <Grid item xs>
                <Typography variant="h5" gutterBottom>
                  Business Health: {healthScore.health_status}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Last updated: {new Date(healthScore.timestamp).toLocaleDateString()}
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {healthScore.factors.map((factor, index) => (
                    <Chip
                      key={index}
                      label={`${factor.name}: ${factor.score}`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Total Products
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData?.summary?.total_products || 0}
                  </Typography>
                  <Chip
                    icon={dashboardData?.summary?.low_stock_products > 0 ? <Warning /> : <CheckCircle />}
                    label={`${dashboardData?.summary?.low_stock_products || 0} low stock`}
                    size="small"
                    color={dashboardData?.summary?.low_stock_products > 0 ? 'warning' : 'success'}
                    sx={{ mt: 1 }}
                  />
                </Box>
                <Inventory color="primary" sx={{ fontSize: 40 }} />
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
                    ₹{dashboardData?.summary?.total_sales?.toLocaleString() || 0}
                  </Typography>
                  <Box display="flex" alignItems="center" sx={{ mt: 1 }}>
                    {dashboardData?.summary?.total_sales > 0 ? (
                      <>
                        <TrendingUp color="success" fontSize="small" />
                        <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                          Active
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No sales yet
                      </Typography>
                    )}
                  </Box>
                </Box>
                <ShoppingCart color="success" sx={{ fontSize: 40 }} />
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
                    Total Production
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData?.summary?.total_production?.toLocaleString() || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Units
                  </Typography>
                </Box>
                <Factory color="warning" sx={{ fontSize: 40 }} />
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
                    Business Health
                  </Typography>
                  <Typography variant="h4">
                    {healthScore?.overall_score || 0}/100
                  </Typography>
                  <Chip
                    label={healthScore?.health_status || 'Calculating...'}
                    size="small"
                    color={getStatusColor(healthScore?.health_status)}
                    sx={{ mt: 1 }}
                  />
                </Box>
                <AttachMoney color="error" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Sales Trend
            </Typography>
            <Box sx={{ height: 300 }}>
              <Line
                data={salesChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: false }
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Production Distribution
            </Typography>
            <Box sx={{ height: 300 }}>
              <Pie
                data={productionChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Sales
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Customer</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData?.recent_sales?.slice(0, 5).map((sale, index) => (
                    <TableRow key={index}>
                      <TableCell>{sale.customer_name}</TableCell>
                      <TableCell>{sale.Product?.product_name}</TableCell>
                      <TableCell align="right">₹{sale.total_amount?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip
                          label={sale.payment_status}
                          size="small"
                          color={sale.payment_status === 'Paid' ? 'success' : 'warning'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!dashboardData?.recent_sales || dashboardData.recent_sales.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography color="text.secondary" py={2}>
                          No recent sales
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Button fullWidth sx={{ mt: 2 }}>View All Sales</Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Production
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell>Efficiency</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData?.recent_production?.slice(0, 5).map((prod, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(prod.production_date).toLocaleDateString()}</TableCell>
                      <TableCell>{prod.Product?.product_name}</TableCell>
                      <TableCell align="right">{prod.actual_quantity}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${prod.efficiency}%`}
                          size="small"
                          color={prod.efficiency > 90 ? 'success' : prod.efficiency > 80 ? 'warning' : 'error'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!dashboardData?.recent_production || dashboardData.recent_production.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography color="text.secondary" py={2}>
                          No recent production
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Button fullWidth sx={{ mt: 2 }}>View All Production</Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
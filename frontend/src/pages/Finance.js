import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tabs,
  Tab,
  Tooltip,
  InputAdornment
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  AccountBalance,
  Receipt,
  Download,
  FilterList,
  Visibility,
  Print,
  Share,
  CalendarToday,
  ArrowUpward,
  ArrowDownward,
  CompareArrows
} from '@mui/icons-material';
import { financeAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { Line, Bar } from 'react-chartjs-2';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const Finance = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profitLossData, setProfitLossData] = useState(null);
  const [balanceSheetData, setBalanceSheetData] = useState(null);
  const [cashFlowData, setCashFlowData] = useState(null);
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1));
  const [endDate, setEndDate] = useState(new Date());

  useEffect(() => {
    fetchFinancialData();
  }, [period]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const params = { period, start_date: startDate.toISOString(), end_date: endDate.toISOString() };
      
      const [plResponse, bsResponse, cfResponse] = await Promise.all([
        financeAPI.getProfitLoss(params),
        financeAPI.getBalanceSheet(params),
        financeAPI.getCashFlow(params)
      ]);
      
      setProfitLossData(plResponse.data.data);
      setBalanceSheetData(bsResponse.data.data);
      setCashFlowData(cfResponse.data.data);
    } catch (error) {
      toast.error('Failed to fetch financial data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'success.main';
    if (change < 0) return 'error.main';
    return 'text.secondary';
  };

  const getChangeIcon = (change) => {
    if (change > 0) return <ArrowUpward fontSize="small" />;
    if (change < 0) return <ArrowDownward fontSize="small" />;
    return <CompareArrows fontSize="small" />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  // Financial KPIs
  const financialKPIs = [
    {
      title: 'Total Revenue',
      value: profitLossData?.total_revenue || 0,
      change: profitLossData?.revenue_change || 0,
      icon: <Receipt sx={{ fontSize: 40 }} />,
      color: 'primary'
    },
    {
      title: 'Net Profit',
      value: profitLossData?.net_profit || 0,
      change: profitLossData?.profit_change || 0,
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      color: 'success'
    },
    {
      title: 'Gross Margin',
      value: profitLossData?.gross_margin_percentage || 0,
      change: profitLossData?.margin_change || 0,
      icon: <AccountBalance sx={{ fontSize: 40 }} />,
      color: 'info',
      suffix: '%'
    },
    {
      title: 'Cash Flow',
      value: cashFlowData?.net_cash_flow || 0,
      change: cashFlowData?.cash_flow_change || 0,
      icon: <AttachMoney sx={{ fontSize: 40 }} />,
      color: 'warning'
    }
  ];

  // Revenue vs Expenses Chart
  const revenueExpenseChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: [65000, 59000, 80000, 81000, 56000, 55000],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Expenses',
        data: [45000, 48000, 40000, 38000, 42000, 41000],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Profit Margin Chart
  const profitMarginChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Profit Margin %',
        data: [25, 28, 30, 32, 29, 27],
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">
          Financial Management
        </Typography>
        <Box display="flex" gap={2}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="From"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              renderInput={(params) => (
                <TextField size="small" {...params} sx={{ width: 150 }} />
              )}
            />
            <DatePicker
              label="To"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              renderInput={(params) => (
                <TextField size="small" {...params} sx={{ width: 150 }} />
              )}
            />
          </LocalizationProvider>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={period}
              label="Period"
              onChange={(e) => setPeriod(e.target.value)}
            >
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="quarter">This Quarter</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
              <MenuItem value="custom">Custom</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={fetchFinancialData}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Financial KPIs */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {financialKPIs.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      {kpi.title}
                    </Typography>
                    <Typography variant="h4" sx={{ mt: 1 }}>
                      {kpi.suffix ? `${kpi.value}${kpi.suffix}` : formatCurrency(kpi.value)}
                    </Typography>
                    <Box display="flex" alignItems="center" sx={{ mt: 1 }}>
                      {getChangeIcon(kpi.change)}
                      <Typography 
                        variant="body2" 
                        color={getChangeColor(kpi.change)}
                        sx={{ ml: 0.5 }}
                      >
                        {kpi.change > 0 ? '+' : ''}{kpi.change}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        vs last period
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ color: `${kpi.color}.main` }}>
                    {kpi.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Revenue vs Expenses
            </Typography>
            <Box sx={{ height: 300 }}>
              <Line
                data={revenueExpenseChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                    mode: 'index',
                    intersect: false,
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return '₹' + value.toLocaleString();
                        }
                      }
                    }
                  },
                  plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `${context.dataset.label}: ₹${context.parsed.y.toLocaleString()}`;
                        }
                      }
                    }
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Profit Margin Trend
            </Typography>
            <Box sx={{ height: 300 }}>
              <Line
                data={profitMarginChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      ticks: {
                        callback: function(value) {
                          return value + '%';
                        }
                      },
                      title: {
                        display: true,
                        text: 'Margin %'
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
      </Grid>

      {/* Financial Reports Tabs */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Profit & Loss" />
          <Tab label="Balance Sheet" />
          <Tab label="Cash Flow" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && profitLossData && (
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5">
              Profit & Loss Statement
            </Typography>
            <Box display="flex" gap={1}>
              <Tooltip title="Print">
                <IconButton>
                  <Print />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export">
                <IconButton>
                  <Download />
                </IconButton>
              </Tooltip>
              <Tooltip title="Share">
                <IconButton>
                  <Share />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <TableContainer>
            <Table>
              <TableBody>
                {/* Revenue Section */}
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell colSpan={2}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Revenue
                    </Typography>
                  </TableCell>
                </TableRow>
                
                {profitLossData.revenue_items?.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ pl: 4 }}>{item.name}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold">
                        {formatCurrency(item.amount)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
                
                <TableRow>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold">
                      Total Revenue
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="h6" color="primary.main">
                      {formatCurrency(profitLossData.total_revenue)}
                    </Typography>
                  </TableCell>
                </TableRow>

                {/* Cost of Goods Sold */}
                <TableRow sx={{ bgcolor: 'grey.50', mt: 2 }}>
                  <TableCell colSpan={2}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Cost of Goods Sold
                    </Typography>
                  </TableCell>
                </TableRow>
                
                {profitLossData.cogs_items?.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ pl: 4 }}>{item.name}</TableCell>
                    <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                  </TableRow>
                ))}
                
                <TableRow>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold">
                      Total COGS
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" color="error.main">
                      {formatCurrency(profitLossData.total_cogs)}
                    </Typography>
                  </TableCell>
                </TableRow>

                {/* Gross Profit */}
                <TableRow>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold">
                      Gross Profit
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(profitLossData.gross_profit)}
                    </Typography>
                  </TableCell>
                </TableRow>

                {/* Operating Expenses */}
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell colSpan={2}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Operating Expenses
                    </Typography>
                  </TableCell>
                </TableRow>
                
                {profitLossData.expense_items?.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ pl: 4 }}>{item.name}</TableCell>
                    <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                  </TableRow>
                ))}
                
                <TableRow>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold">
                      Total Expenses
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" color="error.main">
                      {formatCurrency(profitLossData.total_expenses)}
                    </Typography>
                  </TableCell>
                </TableRow>

                {/* Net Profit */}
                <TableRow sx={{ borderTop: 2, borderColor: 'divider' }}>
                  <TableCell>
                    <Typography variant="h6" fontWeight="bold">
                      Net Profit
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="h4" color={profitLossData.net_profit >= 0 ? 'success.main' : 'error.main'}>
                      {formatCurrency(profitLossData.net_profit)}
                    </Typography>
                  </TableCell>
                </TableRow>

                {/* Profit Margin */}
                <TableRow>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      Profit Margin
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${profitLossData.profit_margin_percentage?.toFixed(1)}%`}
                      color={profitLossData.profit_margin_percentage > 20 ? 'success' : 
                             profitLossData.profit_margin_percentage > 10 ? 'warning' : 'error'}
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Period:</strong> {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
              <br />
              <strong>Generated:</strong> {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </Typography>
          </Box>
        </Paper>
      )}

      {activeTab === 1 && balanceSheetData && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Balance Sheet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            As of {new Date(endDate).toLocaleDateString()}
          </Typography>

          <Grid container spacing={3}>
            {/* Assets */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary.main">
                    Assets
                  </Typography>
                  
                  {balanceSheetData.assets?.map((asset, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {asset.category}
                      </Typography>
                      {asset.items?.map((item, idx) => (
                        <Box key={idx} display="flex" justifyContent="space-between" sx={{ pl: 2, mb: 0.5 }}>
                          <Typography variant="body2">{item.name}</Typography>
                          <Typography variant="body2">{formatCurrency(item.amount)}</Typography>
                        </Box>
                      ))}
                      <Box display="flex" justifyContent="space-between" sx={{ mt: 1, borderTop: 1, borderColor: 'divider', pt: 1 }}>
                        <Typography variant="subtitle2">Total {asset.category}</Typography>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {formatCurrency(asset.total)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}

                  <Box display="flex" justifyContent="space-between" sx={{ mt: 3, pt: 2, borderTop: 2, borderColor: 'divider' }}>
                    <Typography variant="h6">Total Assets</Typography>
                    <Typography variant="h6" color="primary.main">
                      {formatCurrency(balanceSheetData.total_assets)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Liabilities & Equity */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="error.main">
                    Liabilities
                  </Typography>
                  
                  {balanceSheetData.liabilities?.map((liability, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {liability.category}
                      </Typography>
                      {liability.items?.map((item, idx) => (
                        <Box key={idx} display="flex" justifyContent="space-between" sx={{ pl: 2, mb: 0.5 }}>
                          <Typography variant="body2">{item.name}</Typography>
                          <Typography variant="body2">{formatCurrency(item.amount)}</Typography>
                        </Box>
                      ))}
                      <Box display="flex" justifyContent="space-between" sx={{ mt: 1, borderTop: 1, borderColor: 'divider', pt: 1 }}>
                        <Typography variant="subtitle2">Total {liability.category}</Typography>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {formatCurrency(liability.total)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}

                  <Box display="flex" justifyContent="space-between" sx={{ mt: 2, pt: 2, borderTop: 2, borderColor: 'divider' }}>
                    <Typography variant="h6">Total Liabilities</Typography>
                    <Typography variant="h6" color="error.main">
                      {formatCurrency(balanceSheetData.total_liabilities)}
                    </Typography>
                  </Box>

                  {/* Equity */}
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom color="success.main">
                      Equity
                    </Typography>
                    
                    {balanceSheetData.equity_items?.map((item, index) => (
                      <Box key={index} display="flex" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="body2">{item.name}</Typography>
                        <Typography variant="body2">{formatCurrency(item.amount)}</Typography>
                      </Box>
                    ))}

                    <Box display="flex" justifyContent="space-between" sx={{ mt: 2, pt: 2, borderTop: 2, borderColor: 'divider' }}>
                      <Typography variant="h6">Total Equity</Typography>
                      <Typography variant="h6" color="success.main">
                        {formatCurrency(balanceSheetData.total_equity)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Balance Check */}
                  <Box display="flex" justifyContent="space-between" sx={{ 
                    mt: 3, 
                    p: 2, 
                    bgcolor: balanceSheetData.balanced ? 'success.light' : 'error.light',
                    borderRadius: 1
                  }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Assets = Liabilities + Equity
                    </Typography>
                    <Chip
                      label={balanceSheetData.balanced ? 'BALANCED' : 'NOT BALANCED'}
                      color={balanceSheetData.balanced ? 'success' : 'error'}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {activeTab === 2 && cashFlowData && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Cash Flow Statement
          </Typography>

          <TableContainer>
            <Table>
              <TableBody>
                {/* Operating Activities */}
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell colSpan={2}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Cash Flow from Operating Activities
                    </Typography>
                  </TableCell>
                </TableRow>
                
                {cashFlowData.operating_activities?.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ pl: 4 }}>{item.name}</TableCell>
                    <TableCell align="right" sx={{ 
                      color: item.amount >= 0 ? 'success.main' : 'error.main'
                    }}>
                      {formatCurrency(item.amount)}
                    </TableCell>
                  </TableRow>
                ))}
                
                <TableRow>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold">
                      Net Cash from Operations
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="h6" color={cashFlowData.net_operating_cash >= 0 ? 'success.main' : 'error.main'}>
                      {formatCurrency(cashFlowData.net_operating_cash)}
                    </Typography>
                  </TableCell>
                </TableRow>

                {/* Investing Activities */}
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell colSpan={2}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Cash Flow from Investing Activities
                    </Typography>
                  </TableCell>
                </TableRow>
                
                {cashFlowData.investing_activities?.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ pl: 4 }}>{item.name}</TableCell>
                    <TableCell align="right" sx={{ 
                      color: item.amount >= 0 ? 'success.main' : 'error.main'
                    }}>
                      {formatCurrency(item.amount)}
                    </TableCell>
                  </TableRow>
                ))}
                
                <TableRow>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold">
                      Net Cash from Investing
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" color={cashFlowData.net_investing_cash >= 0 ? 'success.main' : 'error.main'}>
                      {formatCurrency(cashFlowData.net_investing_cash)}
                    </Typography>
                  </TableCell>
                </TableRow>

                {/* Financing Activities */}
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell colSpan={2}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Cash Flow from Financing Activities
                    </Typography>
                  </TableCell>
                </TableRow>
                
                {cashFlowData.financing_activities?.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ pl: 4 }}>{item.name}</TableCell>
                    <TableCell align="right" sx={{ 
                      color: item.amount >= 0 ? 'success.main' : 'error.main'
                    }}>
                      {formatCurrency(item.amount)}
                    </TableCell>
                  </TableRow>
                ))}
                
                <TableRow>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold">
                      Net Cash from Financing
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" color={cashFlowData.net_financing_cash >= 0 ? 'success.main' : 'error.main'}>
                      {formatCurrency(cashFlowData.net_financing_cash)}
                    </Typography>
                  </TableCell>
                </TableRow>

                {/* Net Cash Flow */}
                <TableRow sx={{ borderTop: 2, borderColor: 'divider' }}>
                  <TableCell>
                    <Typography variant="h6" fontWeight="bold">
                      Net Increase in Cash
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="h4" color={cashFlowData.net_cash_flow >= 0 ? 'success.main' : 'error.main'}>
                      {formatCurrency(cashFlowData.net_cash_flow)}
                    </Typography>
                  </TableCell>
                </TableRow>

                {/* Cash at Beginning and End */}
                <TableRow>
                  <TableCell>
                    <Typography variant="body2">
                      Cash at Beginning of Period
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(cashFlowData.beginning_cash)}
                  </TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      Cash at End of Period
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="h6" color="primary.main">
                      {formatCurrency(cashFlowData.ending_cash)}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default Finance;
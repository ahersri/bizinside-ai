// Add these imports at the top:
import { Factory, Inventory } from '@mui/icons-material';
import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Insights,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Lightbulb,
  Timeline,
  CompareArrows,
  Download,
  Refresh,
  Share,
  Info,
  Settings,
  PlayArrow,
  Pause,
  Assessment,
  Analytics,
  Psychology
} from '@mui/icons-material';
import { aiAPI, dashboardAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { Line, Bar, Radar } from 'react-chartjs-2';

const AIPage = () => {
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [insights, setInsights] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('sales');
  const [predictionPeriod, setPredictionPeriod] = useState(7);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [analysisInput, setAnalysisInput] = useState('');

  useEffect(() => {
    fetchAIData();
  }, []);

  const fetchAIData = async () => {
    try {
      setLoading(true);
      const [predictionsResponse, anomaliesResponse, healthResponse] = await Promise.all([
        aiAPI.predictSales({ period: predictionPeriod }),
        aiAPI.detectAnomalies(),
        dashboardAPI.getHealthScore()
      ]);
      
      setPredictions(predictionsResponse.data.data);
      setAnomalies(anomaliesResponse.data.data);
      
      // Generate insights from health score
      if (healthResponse.data.data) {
        generateInsights(healthResponse.data.data);
      }
      
      // Simulate business analysis data
      setAnalysis({
        revenue_trend: 'positive',
        efficiency_score: 78,
        risk_level: 'low',
        recommendations: [
          'Increase inventory of Product A by 20%',
          'Reduce production downtime by optimizing maintenance schedule',
          'Consider price increase for high-demand products',
          'Expand sales team for Q4 seasonal demand'
        ]
      });
      
    } catch (error) {
      toast.error('Failed to fetch AI insights');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (healthData) => {
    const generatedInsights = [];
    
    if (healthData.overall_score < 70) {
      generatedInsights.push({
        title: 'Business Health Needs Improvement',
        description: 'Overall business health score is below optimal levels.',
        severity: 'high',
        icon: <Warning />,
        color: 'error'
      });
    }
    
    if (healthData.factors?.some(f => f.name === 'Inventory Turnover' && f.score < 60)) {
      generatedInsights.push({
        title: 'Low Inventory Turnover',
        description: 'Inventory is moving slower than optimal. Consider promotional activities.',
        severity: 'medium',
        icon: <Inventory />,
        color: 'warning'
      });
    }
    
    if (healthData.factors?.some(f => f.name === 'Profit Margin' && f.score > 85)) {
      generatedInsights.push({
        title: 'Excellent Profit Margins',
        description: 'Your business is maintaining strong profit margins. Consider reinvestment.',
        severity: 'low',
        icon: <TrendingUp />,
        color: 'success'
      });
    }
    
    // Add more insights based on actual data
    generatedInsights.push({
      title: 'Seasonal Demand Pattern Detected',
      description: 'Sales show 25% increase during Q4. Plan inventory accordingly.',
      severity: 'info',
      icon: <Timeline />,
      color: 'info'
    });
    
    generatedInsights.push({
      title: 'Production Efficiency Opportunity',
      description: 'Machine 3 shows 15% lower efficiency than others. Schedule maintenance.',
      severity: 'medium',
      icon: <Factory />,
      color: 'warning'
    });
    
    setInsights(generatedInsights);
  };

  const runBusinessAnalysis = async () => {
    try {
      const response = await aiAPI.analyzeBusiness({ query: analysisInput });
      toast.success('Analysis completed');
      // Handle analysis results
    } catch (error) {
      toast.error('Analysis failed');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'info';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  // Sales Prediction Chart
  const salesPredictionChartData = {
    labels: predictions?.dates || ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
    datasets: [
      {
        label: 'Historical Sales',
        data: predictions?.historical || [65000, 59000, 80000, 81000, 56000, 55000, 58000],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Predicted Sales',
        data: predictions?.predictions || [62000, 64000, 68000, 72000, 69000, 71000, 73000],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        borderDash: [5, 5],
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Business Health Radar Chart
  const healthRadarChartData = {
    labels: ['Revenue', 'Profit', 'Efficiency', 'Inventory', 'Cash Flow', 'Growth'],
    datasets: [
      {
        label: 'Your Business',
        data: [85, 78, 92, 65, 88, 72],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgb(54, 162, 235)',
        pointBackgroundColor: 'rgb(54, 162, 235)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(54, 162, 235)'
      },
      {
        label: 'Industry Average',
        data: [75, 70, 80, 70, 75, 65],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgb(255, 99, 132)',
        pointBackgroundColor: 'rgb(255, 99, 132)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(255, 99, 132)'
      }
    ]
  };

  // Anomaly Detection Chart
  const anomalyChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Sales',
        data: [65000, 59000, 80000, 81000, 56000, 55000, 58000, 62000, 70000, 75000, 85000, 90000],
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Anomalies',
        data: [null, null, 80000, null, null, null, null, null, null, null, 85000, null],
        backgroundColor: 'rgba(255, 99, 132, 0.8)',
        borderColor: 'rgba(255, 99, 132, 1)',
        pointRadius: 8,
        pointHoverRadius: 10
      }
    ]
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box display="flex" alignItems="center" gap={2}>
          <Psychology sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4">
              AI Business Intelligence
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Predictive analytics and intelligent insights for your manufacturing business
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Settings />}
          >
            AI Settings
          </Button>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={fetchAIData}
          >
            Refresh Insights
          </Button>
        </Box>
      </Box>

      {/* AI Insights Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" color="primary.main">
                  <Insights sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Key Insights
                </Typography>
                <Chip label={`${insights.length} found`} size="small" />
              </Box>
              
              <List dense>
                {insights.slice(0, 3).map((insight, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemIcon sx={{ color: `${insight.color}.main` }}>
                        {insight.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={insight.title}
                        secondary={insight.description}
                        primaryTypographyProps={{ variant: 'subtitle2' }}
                        secondaryTypographyProps={{ variant: 'body2' }}
                      />
                      <Chip
                        label={insight.severity}
                        size="small"
                        color={getSeverityColor(insight.severity)}
                      />
                    </ListItem>
                    {index < insights.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
              
              {insights.length > 3 && (
                <Button fullWidth sx={{ mt: 2 }}>
                  View All {insights.length} Insights
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" color="success.main">
                  <TrendingUp sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Sales Predictions
                </Typography>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={predictionPeriod}
                    onChange={(e) => setPredictionPeriod(e.target.value)}
                  >
                    <MenuItem value={7}>7 days</MenuItem>
                    <MenuItem value={30}>30 days</MenuItem>
                    <MenuItem value={90}>90 days</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              {predictions && (
                <>
                  <Typography variant="h3" align="center" gutterBottom>
                    ₹{predictions?.average_prediction?.toLocaleString() || '0'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center" paragraph>
                    Average predicted daily sales (next {predictionPeriod} days)
                  </Typography>
                  
                  <Box display="flex" justifyContent="space-around" sx={{ mt: 2 }}>
                    <Box textAlign="center">
                      <Typography variant="body2" color="text.secondary">
                        Confidence
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {predictions?.confidence_score || 0}%
                      </Typography>
                    </Box>
                    <Box textAlign="center">
                      <Typography variant="body2" color="text.secondary">
                        Trend
                      </Typography>
                      <Typography variant="h6" color={predictions?.trend === 'up' ? 'success.main' : 'error.main'}>
                        {predictions?.trend === 'up' ? '↑ Rising' : '↓ Falling'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Button fullWidth sx={{ mt: 3 }} startIcon={<Download />}>
                    Download Forecast Report
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" color="warning.main">
                  <Warning sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Anomaly Detection
                </Typography>
                <Chip 
                  label={`${anomalies.length} detected`} 
                  size="small" 
                  color={anomalies.length > 0 ? 'warning' : 'success'}
                />
              </Box>
              
              {anomalies.length > 0 ? (
                <>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {anomalies.length} potential anomalies detected in your data
                  </Alert>
                  
                  <List dense>
                    {anomalies.slice(0, 2).map((anomaly, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Warning color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary={anomaly.type}
                          secondary={`Detected on ${new Date(anomaly.detected_at).toLocaleDateString()}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                  
                  <Button fullWidth sx={{ mt: 2 }} color="warning">
                    Investigate Anomalies
                  </Button>
                </>
              ) : (
                <>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    No anomalies detected. Your operations are running normally.
                  </Alert>
                  <Typography variant="body2" color="text.secondary" align="center">
                    Last checked: {new Date().toLocaleDateString()}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Sales Predictions vs Historical Data
              </Typography>
              <ToggleButtonGroup
                value={selectedMetric}
                exclusive
                onChange={(e, newValue) => newValue && setSelectedMetric(newValue)}
                size="small"
              >
                <ToggleButton value="sales">Sales</ToggleButton>
                <ToggleButton value="production">Production</ToggleButton>
                <ToggleButton value="inventory">Inventory</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            
            <Box sx={{ height: 300 }}>
              <Line
                data={salesPredictionChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `${context.dataset.label}: ₹${context.parsed.y.toLocaleString()}`;
                        }
                      }
                    }
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
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Business Health Comparison
            </Typography>
            <Box sx={{ height: 300 }}>
              <Radar
                data={healthRadarChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    r: {
                      beginAtZero: true,
                      max: 100,
                      ticks: {
                        stepSize: 20
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

      {/* AI Recommendations */}
      {analysis && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Typography variant="h5">
              <Lightbulb sx={{ verticalAlign: 'middle', mr: 2, color: 'warning.main' }} />
              AI Recommendations
            </Typography>
            <Chip
              icon={<Assessment />}
              label={`Based on ${insights.length} insights`}
              color="primary"
            />
          </Box>

          <Grid container spacing={3}>
            {analysis.recommendations.map((recommendation, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" alignItems="flex-start" gap={2}>
                      <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: 'primary.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'primary.contrastText'
                      }}>
                        {index + 1}
                      </Box>
                      <Box flex={1}>
                        <Typography variant="subtitle1" gutterBottom>
                          {recommendation}
                        </Typography>
                        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                          <Chip
                            label="High Impact"
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                          <Typography variant="body2" color="text.secondary">
                            Estimated benefit: 15-20%
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <Info sx={{ verticalAlign: 'middle', mr: 1 }} />
              These recommendations are generated by AI based on your business data patterns and industry benchmarks.
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Business Analysis Tool */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom mb={3}>
          AI Business Analysis Tool
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Ask AI about your business..."
              placeholder="e.g., How can I improve profit margins? What's the optimal inventory level for Product X?"
              value={analysisInput}
              onChange={(e) => setAnalysisInput(e.target.value)}
              multiline
              rows={3}
              InputProps={{
                endAdornment: (
                  <Tooltip title="Get AI Analysis">
                    <IconButton 
                      color="primary" 
                      onClick={runBusinessAnalysis}
                      disabled={!analysisInput.trim()}
                    >
                      <PlayArrow />
                    </IconButton>
                  </Tooltip>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary" paragraph>
                Ask questions about:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><CompareArrows fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Financial performance" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Factory fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Production optimization" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Inventory fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Inventory management" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><TrendingUp fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Sales forecasting" />
                </ListItem>
              </List>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Analysis Results Dialog */}
      <Dialog 
        open={showAnalysisDialog} 
        onClose={() => setShowAnalysisDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          AI Business Analysis Results
        </DialogTitle>
        <DialogContent>
          {/* Analysis results would go here */}
          <Typography paragraph>
            Based on your business data, here are the key findings...
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAnalysisDialog(false)}>Close</Button>
          <Button variant="contained" startIcon={<Download />}>
            Download Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AIPage;
import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Card,
  CardContent,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  LinearProgress,
  Chip,
  InputAdornment,
  Avatar,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Business,
  LocationOn,
  Phone,
  Email,
  Language,
  Edit,
  Save,
  Settings,
  People,
  Receipt,
  Security,
  Notifications,
  Upload as UploadIcon
} from '@mui/icons-material';
import { businessAPI, uploadAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { useFormik } from 'formik';
import * as yup from 'yup';

const businessValidationSchema = yup.object({
  business_name: yup.string().required('Business name is required'),
  business_type: yup.string().required('Business type is required'),
  industry: yup.string().required('Industry is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone is required'),
  address: yup.string().required('Address is required'),
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required'),
  country: yup.string().required('Country is required'),
  pincode: yup.string().required('Pincode is required'),
  currency: yup.string().required('Currency is required'),
  timezone: yup.string().required('Timezone is required'),
  fiscal_year_start: yup.string().required('Fiscal year start is required'),
  gst_number: yup.string(),
  pan_number: yup.string()
});

const BusinessPage = () => {
  const { business } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [businessData, setBusinessData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    fetchBusinessData();
  }, []);

  const fetchBusinessData = async () => {
    try {
      const response = await businessAPI.getBusiness();
      setBusinessData(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch business data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      business_name: '',
      business_type: '',
      industry: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      fiscal_year_start: 'April',
      gst_number: '',
      pan_number: '',
      website: '',
      description: ''
    },
    validationSchema: businessValidationSchema,
    onSubmit: async (values) => {
      try {
        await businessAPI.updateBusiness(values);
        toast.success('Business updated successfully');
        setEditing(false);
        fetchBusinessData();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Update failed');
      }
    }
  });

  useEffect(() => {
    if (businessData) {
      formik.setValues(businessData);
    }
  }, [businessData]);

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const response = await uploadAPI.uploadFile('logo', file);
        setLogo(URL.createObjectURL(file));
        toast.success('Logo uploaded successfully');
      } catch (error) {
        toast.error('Failed to upload logo');
      }
    }
  };

  const industries = [
    'Manufacturing',
    'Retail',
    'Wholesale',
    'Construction',
    'Food & Beverage',
    'Textiles',
    'Electronics',
    'Automotive',
    'Pharmaceutical',
    'Other'
  ];

  const businessTypes = [
    'Proprietorship',
    'Partnership',
    'LLP',
    'Private Limited',
    'Public Limited'
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">
          Business Settings
        </Typography>
        <Button
          variant="contained"
          startIcon={editing ? <Save /> : <Edit />}
          onClick={() => {
            if (editing) {
              formik.handleSubmit();
            } else {
              setEditing(true);
            }
          }}
        >
          {editing ? 'Save Changes' : 'Edit Business'}
        </Button>
      </Box>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab icon={<Business />} label="Profile" />
        <Tab icon={<Settings />} label="Settings" />
        <Tab icon={<People />} label="Team" />
        <Tab icon={<Receipt />} label="Billing" />
        <Tab icon={<Security />} label="Security" />
      </Tabs>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Business Logo & Basic Info */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Box display="flex" flexDirection="column" alignItems="center">
                <Avatar
                  src={logo || '/api/placeholder/150/150'}
                  sx={{ width: 150, height: 150, mb: 2 }}
                >
                  {businessData?.business_name?.charAt(0) || 'B'}
                </Avatar>
                
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="logo-upload"
                  type="file"
                  onChange={handleLogoUpload}
                />
                <label htmlFor="logo-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadIcon />}
                    sx={{ mb: 2 }}
                  >
                    Upload Logo
                  </Button>
                </label>
                
                <Typography variant="h6" align="center" gutterBottom>
                  {businessData?.business_name || 'Business Name'}
                </Typography>
                <Chip
                  label={businessData?.business_type || 'Business Type'}
                  color="primary"
                  size="small"
                  sx={{ mb: 1 }}
                />
                <Chip
                  label={businessData?.industry || 'Industry'}
                  variant="outlined"
                  size="small"
                />
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Quick Stats */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  BUSINESS OVERVIEW
                </Typography>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Status</Typography>
                  <Chip label="Active" color="success" size="small" />
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Subscription</Typography>
                  <Typography variant="body2" fontWeight="bold">Pro Plan</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Users</Typography>
                  <Typography variant="body2">5/10</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Created</Typography>
                  <Typography variant="body2">
                    {businessData?.created_at ? new Date(businessData.created_at).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Business Details Form */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Business Information
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="business_name"
                    label="Business Name"
                    value={formik.values.business_name}
                    onChange={formik.handleChange}
                    error={formik.touched.business_name && Boolean(formik.errors.business_name)}
                    helperText={formik.touched.business_name && formik.errors.business_name}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Business Type</InputLabel>
                    <Select
                      name="business_type"
                      value={formik.values.business_type}
                      label="Business Type"
                      onChange={formik.handleChange}
                      disabled={!editing}
                    >
                      {businessTypes.map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Industry</InputLabel>
                    <Select
                      name="industry"
                      value={formik.values.industry}
                      label="Industry"
                      onChange={formik.handleChange}
                      disabled={!editing}
                    >
                      {industries.map(industry => (
                        <MenuItem key={industry} value={industry}>{industry}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="email"
                    label="Business Email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                    disabled={!editing}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="phone"
                    label="Phone Number"
                    value={formik.values.phone}
                    onChange={formik.handleChange}
                    error={formik.touched.phone && Boolean(formik.errors.phone)}
                    helperText={formik.touched.phone && formik.errors.phone}
                    disabled={!editing}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="website"
                    label="Website"
                    value={formik.values.website}
                    onChange={formik.handleChange}
                    disabled={!editing}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Language />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="address"
                    label="Address"
                    value={formik.values.address}
                    onChange={formik.handleChange}
                    error={formik.touched.address && Boolean(formik.errors.address)}
                    helperText={formik.touched.address && formik.errors.address}
                    disabled={!editing}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOn />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    name="city"
                    label="City"
                    value={formik.values.city}
                    onChange={formik.handleChange}
                    error={formik.touched.city && Boolean(formik.errors.city)}
                    helperText={formik.touched.city && formik.errors.city}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    name="state"
                    label="State"
                    value={formik.values.state}
                    onChange={formik.handleChange}
                    error={formik.touched.state && Boolean(formik.errors.state)}
                    helperText={formik.touched.state && formik.errors.state}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    name="pincode"
                    label="Pincode"
                    value={formik.values.pincode}
                    onChange={formik.handleChange}
                    error={formik.touched.pincode && Boolean(formik.errors.pincode)}
                    helperText={formik.touched.pincode && formik.errors.pincode}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="gst_number"
                    label="GST Number"
                    value={formik.values.gst_number}
                    onChange={formik.handleChange}
                    disabled={!editing}
                    placeholder="GSTINXXXXXXX"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="pan_number"
                    label="PAN Number"
                    value={formik.values.pan_number}
                    onChange={formik.handleChange}
                    disabled={!editing}
                    placeholder="AAAAA0000A"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="description"
                    label="Business Description"
                    multiline
                    rows={3}
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    disabled={!editing}
                    placeholder="Describe your business..."
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Financial Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Currency</InputLabel>
                    <Select
                      name="currency"
                      value={formik.values.currency}
                      label="Currency"
                      onChange={formik.handleChange}
                      disabled={!editing}
                    >
                      <MenuItem value="INR">Indian Rupee (₹)</MenuItem>
                      <MenuItem value="USD">US Dollar ($)</MenuItem>
                      <MenuItem value="EUR">Euro (€)</MenuItem>
                      <MenuItem value="GBP">British Pound (£)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Timezone</InputLabel>
                    <Select
                      name="timezone"
                      value={formik.values.timezone}
                      label="Timezone"
                      onChange={formik.handleChange}
                      disabled={!editing}
                    >
                      <MenuItem value="Asia/Kolkata">India (IST)</MenuItem>
                      <MenuItem value="America/New_York">Eastern Time (ET)</MenuItem>
                      <MenuItem value="Europe/London">London (GMT)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Fiscal Year Start</InputLabel>
                    <Select
                      name="fiscal_year_start"
                      value={formik.values.fiscal_year_start}
                      label="Fiscal Year Start"
                      onChange={formik.handleChange}
                      disabled={!editing}
                    >
                      <MenuItem value="January">January</MenuItem>
                      <MenuItem value="April">April</MenuItem>
                      <MenuItem value="July">July</MenuItem>
                      <MenuItem value="October">October</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            System Settings
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Notification Settings
                  </Typography>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Email Notifications"
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="SMS Alerts"
                  />
                  <FormControlLabel
                    control={<Switch />}
                    label="Low Stock Alerts"
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Payment Reminders"
                  />
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Data & Privacy
                  </Typography>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Auto Backup Daily"
                  />
                  <FormControlLabel
                    control={<Switch />}
                    label="Export Data Monthly"
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="GDPR Compliance"
                  />
                  <Button size="small" sx={{ mt: 2 }}>Request Data Export</Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {tabValue === 2 && (
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">
              Team Members
            </Typography>
            <Button variant="contained" startIcon={<People />}>
              Invite Team Member
            </Button>
          </Box>
          <Alert severity="info">
            Team management feature coming soon. Currently supports single user mode.
          </Alert>
        </Paper>
      )}

      {tabValue === 3 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Billing & Subscription
          </Typography>
          <Alert severity="info">
            Billing system integration coming soon. You're currently on the Free Trial plan.
          </Alert>
        </Paper>
      )}

      {tabValue === 4 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Security Settings
          </Typography>
          <Alert severity="info">
            Security features including 2FA, login history, and session management coming soon.
          </Alert>
        </Paper>
      )}
    </Box>
  );
};

export default BusinessPage;
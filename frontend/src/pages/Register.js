// Add this import:
import { FormControlLabel } from '@mui/material';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Alert,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  LinearProgress,
  IconButton
} from '@mui/material';
import {
  Business,
  Person,
  Email,
  Phone,
  LocationOn,
  Lock,
  ArrowBack,
  ArrowForward,
  CheckCircle
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useFormik } from 'formik';
import * as yup from 'yup';

const steps = ['Business Details', 'Owner Information', 'Account Setup', 'Confirmation'];

const businessValidationSchema = yup.object({
  business_name: yup.string().required('Business name is required'),
  business_type: yup.string().required('Business type is required'),
  industry: yup.string().required('Industry is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone number is required'),
  address: yup.string().required('Address is required'),
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required'),
  country: yup.string().required('Country is required'),
  pincode: yup.string().required('Pincode is required')
});

const ownerValidationSchema = yup.object({
  full_name: yup.string().required('Full name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone number is required'),
  position: yup.string().required('Position is required')
});

const accountValidationSchema = yup.object({
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirm_password: yup.string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
  terms: yup.boolean().oneOf([true], 'You must accept the terms')
});

const Register = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const businessFormik = useFormik({
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
      pincode: ''
    },
    validationSchema: businessValidationSchema,
    onSubmit: () => handleNext()
  });

  const ownerFormik = useFormik({
    initialValues: {
      full_name: '',
      email: '',
      phone: '',
      position: 'Owner'
    },
    validationSchema: ownerValidationSchema,
    onSubmit: () => handleNext()
  });

  const accountFormik = useFormik({
    initialValues: {
      password: '',
      confirm_password: '',
      terms: false
    },
    validationSchema: accountValidationSchema,
    onSubmit: () => handleSubmit()
  });

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    const businessData = {
      ...businessFormik.values
    };

    const ownerData = {
      ...ownerFormik.values,
      password: accountFormik.values.password
    };

    try {
      const result = await register(businessData, ownerData);
      setLoading(false);
      if (result.success) {
        setSuccess(true);
        handleNext();
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (error) {
      setLoading(false);
      setError('An unexpected error occurred');
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

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box component="form" onSubmit={businessFormik.handleSubmit}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              Tell us about your business
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="business_name"
                  label="Business Name"
                  value={businessFormik.values.business_name}
                  onChange={businessFormik.handleChange}
                  error={businessFormik.touched.business_name && Boolean(businessFormik.errors.business_name)}
                  helperText={businessFormik.touched.business_name && businessFormik.errors.business_name}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Business />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Business Type</InputLabel>
                  <Select
                    name="business_type"
                    value={businessFormik.values.business_type}
                    label="Business Type"
                    onChange={businessFormik.handleChange}
                    error={businessFormik.touched.business_type && Boolean(businessFormik.errors.business_type)}
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
                    value={businessFormik.values.industry}
                    label="Industry"
                    onChange={businessFormik.handleChange}
                    error={businessFormik.touched.industry && Boolean(businessFormik.errors.industry)}
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
                  value={businessFormik.values.email}
                  onChange={businessFormik.handleChange}
                  error={businessFormik.touched.email && Boolean(businessFormik.errors.email)}
                  helperText={businessFormik.touched.email && businessFormik.errors.email}
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
                  label="Business Phone"
                  value={businessFormik.values.phone}
                  onChange={businessFormik.handleChange}
                  error={businessFormik.touched.phone && Boolean(businessFormik.errors.phone)}
                  helperText={businessFormik.touched.phone && businessFormik.errors.phone}
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
                  name="country"
                  label="Country"
                  value={businessFormik.values.country}
                  onChange={businessFormik.handleChange}
                  disabled
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="address"
                  label="Business Address"
                  value={businessFormik.values.address}
                  onChange={businessFormik.handleChange}
                  error={businessFormik.touched.address && Boolean(businessFormik.errors.address)}
                  helperText={businessFormik.touched.address && businessFormik.errors.address}
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
                  value={businessFormik.values.city}
                  onChange={businessFormik.handleChange}
                  error={businessFormik.touched.city && Boolean(businessFormik.errors.city)}
                  helperText={businessFormik.touched.city && businessFormik.errors.city}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  name="state"
                  label="State"
                  value={businessFormik.values.state}
                  onChange={businessFormik.handleChange}
                  error={businessFormik.touched.state && Boolean(businessFormik.errors.state)}
                  helperText={businessFormik.touched.state && businessFormik.errors.state}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  name="pincode"
                  label="Pincode"
                  value={businessFormik.values.pincode}
                  onChange={businessFormik.handleChange}
                  error={businessFormik.touched.pincode && Boolean(businessFormik.errors.pincode)}
                  helperText={businessFormik.touched.pincode && businessFormik.errors.pincode}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box component="form" onSubmit={ownerFormik.handleSubmit}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              Owner Information
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="full_name"
                  label="Full Name"
                  value={ownerFormik.values.full_name}
                  onChange={ownerFormik.handleChange}
                  error={ownerFormik.touched.full_name && Boolean(ownerFormik.errors.full_name)}
                  helperText={ownerFormik.touched.full_name && ownerFormik.errors.full_name}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="position"
                  label="Position"
                  value={ownerFormik.values.position}
                  onChange={ownerFormik.handleChange}
                  error={ownerFormik.touched.position && Boolean(ownerFormik.errors.position)}
                  helperText={ownerFormik.touched.position && ownerFormik.errors.position}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="email"
                  label="Email Address"
                  value={ownerFormik.values.email}
                  onChange={ownerFormik.handleChange}
                  error={ownerFormik.touched.email && Boolean(ownerFormik.errors.email)}
                  helperText={ownerFormik.touched.email && ownerFormik.errors.email}
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
                  value={ownerFormik.values.phone}
                  onChange={ownerFormik.handleChange}
                  error={ownerFormik.touched.phone && Boolean(ownerFormik.errors.phone)}
                  helperText={ownerFormik.touched.phone && ownerFormik.errors.phone}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box component="form" onSubmit={accountFormik.handleSubmit}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              Create Your Account
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  value={accountFormik.values.password}
                  onChange={accountFormik.handleChange}
                  error={accountFormik.touched.password && Boolean(accountFormik.errors.password)}
                  helperText={accountFormik.touched.password && accountFormik.errors.password}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="confirm_password"
                  label="Confirm Password"
                  type="password"
                  value={accountFormik.values.confirm_password}
                  onChange={accountFormik.handleChange}
                  error={accountFormik.touched.confirm_password && Boolean(accountFormik.errors.confirm_password)}
                  helperText={accountFormik.touched.confirm_password && accountFormik.errors.confirm_password}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <input
                      type="checkbox"
                      name="terms"
                      checked={accountFormik.values.terms}
                      onChange={accountFormik.handleChange}
                    />
                  }
                  label={
                    <Typography variant="body2">
                      I agree to the Terms of Service and Privacy Policy
                    </Typography>
                  }
                />
                {accountFormik.touched.terms && accountFormik.errors.terms && (
                  <Typography color="error" variant="caption">
                    {accountFormik.errors.terms}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
              <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Registration Successful!
              </Typography>
              <Typography color="text.secondary" align="center">
                Your business account has been created successfully. You can now access your dashboard.
              </Typography>
            </Box>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Account Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Business Name
                    </Typography>
                    <Typography variant="body1">
                      {businessFormik.values.business_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Industry
                    </Typography>
                    <Typography variant="body1">
                      {businessFormik.values.industry}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {ownerFormik.values.email}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Account Type
                    </Typography>
                    <Typography variant="body1">
                      Free Trial (30 days)
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Alert severity="info" sx={{ mb: 3 }}>
              You'll receive a welcome email with setup instructions. Check your spam folder if you don't see it.
            </Alert>
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  const handleStepSubmit = () => {
    switch (activeStep) {
      case 0:
        businessFormik.handleSubmit();
        break;
      case 1:
        ownerFormik.handleSubmit();
        break;
      case 2:
        accountFormik.handleSubmit();
        break;
      case 3:
        navigate('/dashboard');
        break;
      default:
        break;
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          marginBottom: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
            <Business sx={{ fontSize: 40, color: 'primary.main', mr: 1 }} />
            <Typography component="h1" variant="h4">
              bizinside.ai
            </Typography>
          </Box>
          
          <Typography component="h2" variant="h5" align="center" gutterBottom>
            Create Your Business Account
          </Typography>
          
          <Typography color="text.secondary" align="center" paragraph>
            Join thousands of manufacturers who trust bizinside.ai
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4, pt: 2 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading && (
            <LinearProgress sx={{ mb: 2 }} />
          )}

          {getStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0 || loading}
              onClick={handleBack}
              startIcon={<ArrowBack />}
            >
              Back
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={() => navigate('/dashboard')}
                endIcon={<ArrowForward />}
              >
                Go to Dashboard
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleStepSubmit}
                disabled={loading}
                endIcon={<ArrowForward />}
              >
                {activeStep === steps.length - 2 ? 'Create Account' : 'Continue'}
              </Button>
            )}
          </Box>

          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Typography component="span" color="primary" sx={{ fontWeight: 'bold' }}>
                  Sign In
                </Typography>
              </Link>
            </Typography>
          </Box>
        </Paper>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            By registering, you agree to our Terms of Service and Privacy Policy
          </Typography>
          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} bizinside.ai - Manufacturing Business Intelligence
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default Register;
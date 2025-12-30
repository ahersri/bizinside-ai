// Add this import:
import { Chip } from '@mui/material';
import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Avatar,
  Divider,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  InputAdornment,
  IconButton,
  Tab,
  Tabs
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  Business,
  Edit,
  Save,
  Lock,
  Visibility,
  VisibilityOff,
  Upload as UploadIcon,
  Security,
  History
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { useFormik } from 'formik';
import * as yup from 'yup';

const profileValidationSchema = yup.object({
  full_name: yup.string().required('Full name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone number is required'),
  position: yup.string().required('Position is required')
});

const passwordValidationSchema = yup.object({
  current_password: yup.string().required('Current password is required'),
  new_password: yup.string().min(8, 'Password must be at least 8 characters').required('New password is required'),
  confirm_password: yup.string()
    .oneOf([yup.ref('new_password'), null], 'Passwords must match')
    .required('Confirm password is required')
});

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [avatar, setAvatar] = useState(null);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const response = await authAPI.getProfile();
      setProfileData(response.data.data.user);
    } catch (error) {
      toast.error('Failed to fetch profile data');
    } finally {
      setProfileLoading(false);
    }
  };

  const profileFormik = useFormik({
    initialValues: {
      full_name: '',
      email: '',
      phone: '',
      position: ''
    },
    validationSchema: profileValidationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      const result = await updateProfile(values);
      setLoading(false);
      if (result.success) {
        setEditing(false);
        fetchProfileData();
      }
    }
  });

  const passwordFormik = useFormik({
    initialValues: {
      current_password: '',
      new_password: '',
      confirm_password: ''
    },
    validationSchema: passwordValidationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await authAPI.updatePassword({
          current_password: values.current_password,
          new_password: values.new_password
        });
        toast.success('Password updated successfully');
        passwordFormik.resetForm();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Password update failed');
      } finally {
        setLoading(false);
      }
    }
  });

  useEffect(() => {
    if (profileData) {
      profileFormik.setValues({
        full_name: profileData.full_name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        position: profileData.position || ''
      });
    }
  }, [profileData]);

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatar(e.target.result);
      };
      reader.readAsDataURL(file);
      toast.success('Avatar updated');
    }
  };

  const handleClickShowPassword = (field) => {
    setShowPassword({
      ...showPassword,
      [field]: !showPassword[field]
    });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (profileLoading) {
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
          My Profile
        </Typography>
        {tabValue === 0 && (
          <Button
            variant="contained"
            startIcon={editing ? <Save /> : <Edit />}
            onClick={() => {
              if (editing) {
                profileFormik.handleSubmit();
              } else {
                setEditing(true);
              }
            }}
            disabled={loading}
          >
            {editing ? 'Save Changes' : 'Edit Profile'}
          </Button>
        )}
      </Box>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab icon={<Person />} label="Profile" />
        <Tab icon={<Security />} label="Security" />
        <Tab icon={<History />} label="Activity" />
      </Tabs>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Profile Picture & Basic Info */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Box display="flex" flexDirection="column" alignItems="center">
                <Avatar
                  src={avatar || '/api/placeholder/150/150'}
                  sx={{ width: 150, height: 150, mb: 2 }}
                >
                  {profileData?.full_name?.charAt(0) || 'U'}
                </Avatar>
                
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="avatar-upload"
                  type="file"
                  onChange={handleAvatarUpload}
                />
                <label htmlFor="avatar-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadIcon />}
                    sx={{ mb: 2 }}
                  >
                    Change Photo
                  </Button>
                </label>
                
                <Typography variant="h6" align="center" gutterBottom>
                  {profileData?.full_name || 'User Name'}
                </Typography>
                <Typography color="text.secondary" align="center" paragraph>
                  {profileData?.position || 'Position'}
                </Typography>
                
                <Divider sx={{ width: '100%', my: 2 }} />
                
                <Box width="100%">
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    ACCOUNT INFORMATION
                  </Typography>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Member Since</Typography>
                    <Typography variant="body2">
                      {profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Last Login</Typography>
                    <Typography variant="body2">
                      {profileData?.last_login ? new Date(profileData.last_login).toLocaleString() : 'N/A'}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Account Status</Typography>
                    <Typography variant="body2" color="success.main" fontWeight="bold">
                      Active
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Profile Details Form */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Personal Information
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="full_name"
                    label="Full Name"
                    value={profileFormik.values.full_name}
                    onChange={profileFormik.handleChange}
                    error={profileFormik.touched.full_name && Boolean(profileFormik.errors.full_name)}
                    helperText={profileFormik.touched.full_name && profileFormik.errors.full_name}
                    disabled={!editing}
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
                    value={profileFormik.values.position}
                    onChange={profileFormik.handleChange}
                    error={profileFormik.touched.position && Boolean(profileFormik.errors.position)}
                    helperText={profileFormik.touched.position && profileFormik.errors.position}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="email"
                    label="Email Address"
                    value={profileFormik.values.email}
                    onChange={profileFormik.handleChange}
                    error={profileFormik.touched.email && Boolean(profileFormik.errors.email)}
                    helperText={profileFormik.touched.email && profileFormik.errors.email}
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
                    value={profileFormik.values.phone}
                    onChange={profileFormik.handleChange}
                    error={profileFormik.touched.phone && Boolean(profileFormik.errors.phone)}
                    helperText={profileFormik.touched.phone && profileFormik.errors.phone}
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
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Business Information
              </Typography>
              
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        Business Name
                      </Typography>
                      <Typography variant="body1">
                        {profileData?.business_name || 'Not specified'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        Industry
                      </Typography>
                      <Typography variant="body1">
                        {profileData?.industry || 'Not specified'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        startIcon={<Business />}
                        size="small"
                        component="a"
                        href="/business"
                      >
                        Manage Business Settings
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {editing && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Changes to email will require verification. You'll receive a confirmation email.
                </Alert>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Change Password
              </Typography>
              
              <Box component="form" onSubmit={passwordFormik.handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="current_password"
                      label="Current Password"
                      type={showPassword.current ? 'text' : 'password'}
                      value={passwordFormik.values.current_password}
                      onChange={passwordFormik.handleChange}
                      error={passwordFormik.touched.current_password && Boolean(passwordFormik.errors.current_password)}
                      helperText={passwordFormik.touched.current_password && passwordFormik.errors.current_password}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => handleClickShowPassword('current')}
                              edge="end"
                            >
                              {showPassword.current ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="new_password"
                      label="New Password"
                      type={showPassword.new ? 'text' : 'password'}
                      value={passwordFormik.values.new_password}
                      onChange={passwordFormik.handleChange}
                      error={passwordFormik.touched.new_password && Boolean(passwordFormik.errors.new_password)}
                      helperText={passwordFormik.touched.new_password && passwordFormik.errors.new_password}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => handleClickShowPassword('new')}
                              edge="end"
                            >
                              {showPassword.new ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="confirm_password"
                      label="Confirm New Password"
                      type={showPassword.confirm ? 'text' : 'password'}
                      value={passwordFormik.values.confirm_password}
                      onChange={passwordFormik.handleChange}
                      error={passwordFormik.touched.confirm_password && Boolean(passwordFormik.errors.confirm_password)}
                      helperText={passwordFormik.touched.confirm_password && passwordFormik.errors.confirm_password}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => handleClickShowPassword('confirm')}
                              edge="end"
                            >
                              {showPassword.confirm ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={loading || !passwordFormik.isValid}
                    >
                      Update Password
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Security Settings
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                Two-factor authentication and session management coming soon.
              </Alert>
              
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  ACTIVE SESSIONS
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="center" py={1}>
                  <Box>
                    <Typography variant="body2">Current Session</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {navigator.userAgent}
                    </Typography>
                  </Box>
                  <Chip label="Active" color="success" size="small" />
                </Box>
                <Button fullWidth variant="outlined" sx={{ mt: 2 }}>
                  Logout Other Sessions
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Account Activity
          </Typography>
          <Alert severity="info">
            Activity log feature coming soon. You'll be able to see login history, profile changes, and system activities.
          </Alert>
        </Paper>
      )}
    </Box>
  );
};

export default Profile;
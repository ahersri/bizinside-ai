import React from 'react';
import { Container, Typography, Box, Button, Paper } from '@mui/material';
import { Home, ArrowBack } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          py: 8
        }}
      >
        <Paper elevation={3} sx={{ p: 6, borderRadius: 4 }}>
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: '6rem', md: '8rem' },
              fontWeight: 'bold',
              color: 'primary.main',
              mb: 2
            }}
          >
            404
          </Typography>
          
          <Typography variant="h4" component="h2" gutterBottom>
            Page Not Found
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4, maxWidth: 500 }}>
            The page you are looking for might have been removed, had its name changed,
            or is temporarily unavailable.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<ArrowBack />}
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              component={Link}
              to="/dashboard"
              startIcon={<Home />}
            >
              Go to Dashboard
            </Button>
          </Box>

          <Box sx={{ mt: 6, pt: 4, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary">
              If you believe this is an error, please contact support@bizinside.ai
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default NotFound;
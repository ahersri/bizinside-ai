import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Upload as UploadIcon,
  CloudUpload,
  Description,
  CheckCircle,
  Error,
  Pending,
  Delete,
  Visibility,
  GetApp,
  TableChart,
  Timeline
} from '@mui/icons-material';
import { uploadAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const Upload = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedModule, setSelectedModule] = useState('products');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewData, setPreviewData] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const modules = [
    { value: 'products', label: 'Products', icon: <TableChart /> },
    { value: 'sales', label: 'Sales', icon: <Timeline /> },
    { value: 'inventory', label: 'Inventory', icon: <Description /> },
    { value: 'production', label: 'Production', icon: <TableChart /> },
    { value: 'customers', label: 'Customers', icon: <TableChart /> }
  ];

  const templateFormats = {
    products: {
      columns: ['product_name', 'sku', 'category', 'unit_price', 'cost_price', 'current_stock', 'min_stock_level', 'description'],
      required: ['product_name', 'sku', 'unit_price']
    },
    sales: {
      columns: ['customer_name', 'product_id', 'quantity', 'unit_price', 'total_amount', 'sale_date', 'payment_status'],
      required: ['customer_name', 'product_id', 'quantity', 'sale_date']
    },
    inventory: {
      columns: ['product_id', 'transaction_type', 'quantity', 'unit_price', 'total_value', 'transaction_date', 'notes'],
      required: ['product_id', 'transaction_type', 'quantity']
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      const validTypes = ['.csv', '.xlsx', '.xls'];
      const fileExtension = file.name.split('.').pop().toLowerCase();
      return validTypes.includes(`.${fileExtension}`);
    });

    if (validFiles.length !== files.length) {
      toast.error('Some files were rejected. Only CSV and Excel files are allowed.');
    }

    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const progress = ((i + 1) / uploadedFiles.length) * 100;
        setUploadProgress(progress);

        await uploadAPI.uploadFile(selectedModule, file);
        
        // Update file status
        setUploadedFiles(prev => prev.map((f, index) => 
          index === i ? { ...f, status: 'success' } : f
        ));
      }

      toast.success('All files uploaded successfully!');
      setActiveStep(2);
    } catch (error) {
      toast.error('Upload failed: ' + (error.response?.data?.error || 'Unknown error'));
      setActiveStep(3); // Error step
    } finally {
      setLoading(false);
      setUploadProgress(100);
    }
  };

  const handleRemoveFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDownloadTemplate = () => {
    const template = templateFormats[selectedModule];
    if (!template) return;

    const csvContent = template.columns.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedModule}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Template downloaded');
  };

  const getFileStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle color="success" />;
      case 'error':
        return <Error color="error" />;
      default:
        return <Pending color="disabled" />;
    }
  };

  const steps = ['Select Module', 'Upload Files', 'Review & Confirm', 'Complete'];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">
          Data Upload
        </Typography>
        <Button
          variant="outlined"
          startIcon={<GetApp />}
          onClick={handleDownloadTemplate}
        >
          Download Template
        </Button>
      </Box>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {activeStep === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            Select Data Module
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            Choose the module where you want to upload data. Each module has specific column requirements.
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Module</InputLabel>
                <Select
                  value={selectedModule}
                  label="Module"
                  onChange={(e) => setSelectedModule(e.target.value)}
                >
                  {modules.map(module => (
                    <MenuItem key={module.value} value={module.value}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {module.icon}
                        {module.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {templateFormats[selectedModule] && (
            <Card variant="outlined" sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Required Columns for {modules.find(m => m.value === selectedModule)?.label}
                </Typography>
                <Grid container spacing={1}>
                  {templateFormats[selectedModule].columns.map((column, index) => (
                    <Grid item key={index}>
                      <Chip
                        label={column}
                        size="small"
                        color={templateFormats[selectedModule].required.includes(column) ? 'primary' : 'default'}
                        variant={templateFormats[selectedModule].required.includes(column) ? 'filled' : 'outlined'}
                      />
                    </Grid>
                  ))}
                </Grid>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  * Highlighted columns are required
                </Typography>
              </CardContent>
            </Card>
          )}

          <Box display="flex" justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button
              variant="contained"
              onClick={() => setActiveStep(1)}
            >
              Next: Upload Files
            </Button>
          </Box>
        </Paper>
      )}

      {activeStep === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            Upload Files
          </Typography>
          
          <Alert severity="warning" sx={{ mb: 3 }}>
            Please ensure your file matches the template format. Maximum file size: 10MB. Supported formats: CSV, XLSX, XLS.
          </Alert>

          <Box
            sx={{
              border: '2px dashed #ccc',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              mb: 3,
              backgroundColor: '#fafafa',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: '#f5f5f5',
                borderColor: '#1976d2'
              }
            }}
            onClick={() => document.getElementById('file-input').click()}
          >
            <input
              id="file-input"
              type="file"
              multiple
              accept=".csv,.xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Drop files here or click to browse
            </Typography>
            <Typography color="text.secondary">
              Upload CSV or Excel files
            </Typography>
          </Box>

          {loading && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                Uploading... {Math.round(uploadProgress)}%
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}

          {uploadedFiles.length > 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Selected Files ({uploadedFiles.length})
              </Typography>
              <List>
                {uploadedFiles.map((file, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      <Box>
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveFile(index)}
                          disabled={loading}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemIcon>
                      {getFileStatusIcon(file.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={file.name}
                      secondary={`${(file.size / 1024).toFixed(2)} KB`}
                    />
                    <Chip
                      label={file.status || 'Pending'}
                      size="small"
                      color={file.status === 'success' ? 'success' : 'default'}
                      sx={{ ml: 2 }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          <Box display="flex" justifyContent="space-between" sx={{ mt: 3 }}>
            <Button
              onClick={() => setActiveStep(0)}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={uploadedFiles.length === 0 || loading}
              startIcon={<UploadIcon />}
            >
              {loading ? 'Uploading...' : 'Upload Files'}
            </Button>
          </Box>
        </Paper>
      )}

      {activeStep === 2 && (
        <Paper sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" mb={3}>
            <CheckCircle sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
            <Box>
              <Typography variant="h6">
                Upload Successful!
              </Typography>
              <Typography color="text.secondary">
                Your data has been uploaded successfully.
              </Typography>
            </Box>
          </Box>

          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Upload Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Module
                  </Typography>
                  <Typography variant="body1">
                    {modules.find(m => m.value === selectedModule)?.label}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Files Uploaded
                  </Typography>
                  <Typography variant="body1">
                    {uploadedFiles.length}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Typography variant="body1" color="success.main">
                    Completed
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Time
                  </Typography>
                  <Typography variant="body1">
                    {new Date().toLocaleTimeString()}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Box display="flex" justifyContent="space-between">
            <Button
              onClick={() => {
                setUploadedFiles([]);
                setActiveStep(0);
              }}
            >
              Upload More Data
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                // Navigate to the module page
                window.location.href = `/${selectedModule}`;
              }}
            >
              View {modules.find(m => m.value === selectedModule)?.label}
            </Button>
          </Box>
        </Paper>
      )}

      {activeStep === 3 && (
        <Paper sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" mb={3}>
            <Error sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
            <Box>
              <Typography variant="h6" color="error">
                Upload Failed
              </Typography>
              <Typography color="text.secondary">
                There was an error uploading your files.
              </Typography>
            </Box>
          </Box>

          <Alert severity="error" sx={{ mb: 3 }}>
            Please check your file format and try again. Ensure all required columns are present.
          </Alert>

          <Box display="flex" justifyContent="space-between">
            <Button
              onClick={() => {
                setUploadedFiles([]);
                setActiveStep(0);
              }}
            >
              Start Over
            </Button>
            <Button
              variant="contained"
              onClick={() => setActiveStep(1)}
            >
              Try Again
            </Button>
          </Box>
        </Paper>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Data Preview</DialogTitle>
        <DialogContent>
          {previewData ? (
            <Box>
              {/* Add data preview table here */}
              <Typography>Preview data would be displayed here</Typography>
            </Box>
          ) : (
            <Typography>No preview available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Upload;
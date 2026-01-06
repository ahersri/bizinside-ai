import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './styles/global.css';

/**
 * =========================
 * React Query Client
 * =========================
 * Intern-safe defaults:
 * - No refetch on window focus
 * - Cache results for performance
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000, // 1 minute
    },
  },
});

// =========================
// MUI THEME
// =========================
const theme = createTheme({
  palette: {
    primary: { main: '#1976d2', light: '#42a5f5', dark: '#1565c0' },
    secondary: { main: '#dc004e', light: '#ff4081', dark: '#9a0036' },
    success: { main: '#4caf50', light: '#81c784', dark: '#388e3c' },
    warning: { main: '#ff9800', light: '#ffb74d', dark: '#f57c00' },
    error: { main: '#f44336', light: '#e57373', dark: '#d32f2f' },
    info: { main: '#2196f3', light: '#64b5f6', dark: '#1976d2' },
    background: { default: '#f5f5f5', paper: '#ffffff' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 600, fontSize: '2.5rem' },
    h2: { fontWeight: 600, fontSize: '2rem' },
    h3: { fontWeight: 600, fontSize: '1.75rem' },
    h4: { fontWeight: 600, fontSize: '1.5rem' },
    h5: { fontWeight: 500, fontSize: '1.25rem' },
    h6: { fontWeight: 500, fontSize: '1rem' },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 500, borderRadius: 8 },
        contained: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.15)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600, backgroundColor: '#fafafa' },
      },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 8 } },
    },
  },
});

// =========================
// RENDER
// =========================
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '14px',
            },
            success: { style: { background: '#4caf50' } },
            error: { style: { background: '#f44336' } },
            loading: { style: { background: '#757575' } },
          }}
        />
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

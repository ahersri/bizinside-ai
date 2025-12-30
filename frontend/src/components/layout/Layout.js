import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Inventory,
  ShoppingCart,
  Factory,
  AttachMoney,
  Insights,
  Business,
  Upload,
  Notifications,
  Person,
  Logout,
  ChevronLeft,
  ChevronRight
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Products', icon: <Inventory />, path: '/products' },
  { text: 'Sales', icon: <ShoppingCart />, path: '/sales' },
  { text: 'Production', icon: <Factory />, path: '/production' },
  { text: 'Inventory', icon: <Inventory />, path: '/inventory' },
  { text: 'Finance', icon: <AttachMoney />, path: '/finance' },
  { text: 'AI Insights', icon: <Insights />, path: '/ai' },
  { text: 'Business', icon: <Business />, path: '/business' },
  { text: 'Upload Data', icon: <Upload />, path: '/upload' },
];

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const drawer = (
    <div>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1 }}>
        <Typography variant="h6" noWrap component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Business /> bizinside.ai
        </Typography>
        <IconButton onClick={handleDrawerToggle}>
          {mobileOpen ? <ChevronLeft /> : <ChevronRight />}
        </IconButton>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            component={Link}
            to={item.path}
            selected={location.pathname === item.path}
            onClick={() => setMobileOpen(false)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
          </Typography>
          
          <IconButton color="inherit">
            <Badge badgeContent={3} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          
          <IconButton onClick={handleMenuOpen} sx={{ ml: 1 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
              {user?.full_name?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                {user?.full_name}
              </Typography>
            </MenuItem>
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                {user?.business_name}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem component={Link} to="/profile" onClick={handleMenuClose}>
              <ListItemIcon><Person fontSize="small" /></ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={() => { handleMenuClose(); logout(); }}>
              <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
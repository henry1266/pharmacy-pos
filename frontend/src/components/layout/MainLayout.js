import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Import axios
import { Tooltip, AppBar, Toolbar, Typography, IconButton, Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, Avatar, Badge, Collapse, Popover, Button } from '@mui/material'; // Added Popover, Button
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import SellIcon from '@mui/icons-material/Sell';
import SellOutlinedIcon from '@mui/icons-material/SellOutlined';
import LocalMallIcon from '@mui/icons-material/LocalMall';
import LocalMallOutlinedIcon from '@mui/icons-material/LocalMallOutlined';
import FactoryIcon from '@mui/icons-material/Factory';
import FactoryOutlinedIcon from '@mui/icons-material/FactoryOutlined';
import PeopleIcon from '@mui/icons-material/People';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ReceiptOutlinedIcon from '@mui/icons-material/ReceiptOutlined';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import AssuredWorkloadIcon from '@mui/icons-material/AssuredWorkload';
import AssuredWorkloadOutlinedIcon from '@mui/icons-material/AssuredWorkloadOutlined';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import CategoryIcon from '@mui/icons-material/Category';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import ListAltIcon from '@mui/icons-material/ListAlt'; // Icon for Product List
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

import SettingsModal from '../settings/SettingsModal';

import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../../assets/css/dashui-theme.css';

/**
 * 主要佈局組件，包含頂部導航欄和側邊菜單
 * @param {Object} props - 組件屬性
 * @param {React.ReactNode} props.children - 子組件內容
 * @returns {React.ReactElement} 佈局組件
 */
const MainLayout = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accountingSubMenuOpen, setAccountingSubMenuOpen] = useState(false);
  const [productSubMenuOpen, setProductSubMenuOpen] = useState(false); // State for product submenu
  const [anchorEl, setAnchorEl] = useState(null); // State for Popover anchor
  const navigate = useNavigate();
  const location = useLocation();

  // Function to check if a path belongs to the product section
  const isProductPath = (path) => {
    return path.startsWith('/products') || path.startsWith('/product-categories');
  };

  // Function to check if a path belongs to the accounting section
  const isAccountingPath = (path) => {
    return path.startsWith('/accounting') || path.startsWith('/settings/monitored-products');
  };

  // Get user info from localStorage
  const [user, setUser] = useState(null);
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user data from localStorage", error);
        // Handle error, maybe clear invalid data
        localStorage.removeItem('user');
      }
    }
  }, []);

  const menuItems = [
    { 
      text: '儀表板', 
      icon: (location.pathname === '/dashboard') ? <DashboardOutlinedIcon /> : <DashboardIcon />, 
      path: '/dashboard' 
    },
    { 
      text: '銷售管理', 
      icon: (location.pathname.startsWith('/sales')) ? <SellOutlinedIcon /> : <SellIcon />, 
      path: '/sales' 
    },
    // Modified Product Menu Item to be a collapsible group
    { 
      text: '商品管理', 
      icon: isProductPath(location.pathname) ? <LocalMallOutlinedIcon /> : <LocalMallIcon />, 
      // No direct path, click toggles submenu
      subItems: [
        { text: '商品列表', path: '/products', icon: <ListAltIcon fontSize="small" sx={{ ml: 1 }} /> },
        { text: '商品分類', path: '/product-categories', icon: <CategoryIcon fontSize="small" sx={{ ml: 1 }} /> },
      ]
    },
    // Removed '產品分類' as it's now a subitem
    { 
      text: '進貨單管理', 
      icon: (location.pathname.startsWith('/purchase-orders')) ? <ReceiptOutlinedIcon /> : <ReceiptIcon />, 
      path: '/purchase-orders',
      adminOnly: true // Mark as admin only
    },
    { 
      text: '出貨單管理', 
      icon: (location.pathname.startsWith('/shipping-orders')) ? <LocalShippingOutlinedIcon /> : <LocalShippingIcon />, 
      path: '/shipping-orders' 
    },
    { 
      text: '供應商管理', 
      icon: (location.pathname === '/suppliers') ? <FactoryOutlinedIcon /> : <FactoryIcon />, 
      path: '/suppliers',
      adminOnly: true // Mark as admin only
    },
    { 
      text: '會員管理', 
      icon: (location.pathname === '/customers') ? <PeopleOutlinedIcon /> : <PeopleIcon />, 
      path: '/customers' 
    },
    // Modified Accounting Menu Item to be a collapsible group
    { 
      text: '記帳管理', 
      icon: isAccountingPath(location.pathname) ? <AccountBalanceWalletOutlinedIcon /> : <AccountBalanceWalletIcon />, 
      // No direct path, click toggles submenu
      subItems: [
        { text: '記帳列表', path: '/accounting' },
        { text: '名目設定', path: '/accounting/categories', icon: <CategoryIcon fontSize="small" sx={{ ml: 1 }} /> },
        { text: '監測產品設定', path: '/settings/monitored-products', icon: <MonitorHeartIcon fontSize="small" sx={{ ml: 1 }} /> }
      ]
    },
    { text: '報表功能', icon: <BarChartIcon />, path: '/reports' },
  ];

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleLogout = () => {
    handleClosePopover(); // Close popover before logout
    localStorage.removeItem('token'); // Clear token on logout
    localStorage.removeItem('user'); // Clear user info on logout
    delete axios.defaults.headers.common['x-auth-token']; // Remove token from axios headers
    navigate('/login');
  };
  
  const handleSettingsClick = () => {
    setSettingsOpen(true);
  };
  
  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };

  // Toggle Accounting Submenu
  const handleAccountingClick = () => {
    setAccountingSubMenuOpen(!accountingSubMenuOpen);
  };

  // Toggle Product Submenu
  const handleProductClick = () => {
    setProductSubMenuOpen(!productSubMenuOpen);
  };

  // Handle Avatar Click to open Popover
  const handleAvatarClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Handle Popover Close
  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const openPopover = Boolean(anchorEl);
  const popoverId = openPopover ? 'user-popover' : undefined;

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => {
    if (!item.adminOnly) return true; // Show if not admin only
    return user && user.role === 'admin'; // Show if admin only and user is admin
  });

  // Determine Avatar content based on user role
  const getAvatarContent = () => {
    if (!user) return '?';
    if (user.role === 'admin') return 'A';
    if (user.role === 'stuff') return 'S'; // Assuming 'stuff' is the role name
    if (user.username) return user.username.charAt(0).toUpperCase();
    return '?';
  };


  return (
    <Box sx={{ display: 'flex' }}>
      {/* Top Navigation Bar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            POS系統
          </Typography>

          <NavIconButton
            to="/shipping-orders/new"
            tooltip="出貨"
            activeIcon={<LocalShippingIcon />}
            inactiveIcon={<LocalShippingOutlinedIcon />}
          />
          
          <NavIconButton
            to="/purchase-orders/new"
            tooltip="進貨"
            activeIcon={<AssignmentIcon />}
            inactiveIcon={<AssignmentOutlinedIcon />}
            adminOnly={true} // Apply admin check
            userRole={user?.role} // Pass user role
          />
          
          <NavIconButton
            to="/sales/new"
            tooltip="銷售"
            activeIcon={<PointOfSaleIcon />}
            inactiveIcon={<PointOfSaleOutlinedIcon />}
          />
          
          <NavIconButton
            to="/accounting/new"
            tooltip="記帳"
            activeIcon={<AssuredWorkloadIcon />}
            inactiveIcon={<AssuredWorkloadOutlinedIcon />}
          />

          <Tooltip title="設定">
            <IconButton color="inherit" sx={{ mr: 2 }} onClick={handleSettingsClick}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <Avatar 
            aria-describedby={popoverId}
            sx={{ 
              width: 36, 
              height: 36,
              cursor: 'pointer',
              bgcolor: 'var(--primary-color)'
            }}
            onClick={handleAvatarClick} // Changed onClick to open popover
          >
            {getAvatarContent()} {/* Use function to get avatar content */}
          </Avatar>
          {/* User Info Popover */}
          <Popover
            id={popoverId}
            open={openPopover}
            anchorEl={anchorEl}
            onClose={handleClosePopover}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            sx={{ mt: 1 }}
          >
            <Box sx={{ p: 2, minWidth: 200 }}>
              <Typography variant="subtitle1" gutterBottom>
                {user?.username || '使用者'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                角色: {user?.role || '未知'}
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Button 
                variant="outlined" 
                color="error" 
                size="small" 
                fullWidth 
                onClick={handleLogout} 
                startIcon={<LogoutIcon />}
              >
                登出
              </Button>
            </Box>
          </Popover>
        </Toolbar>
      </AppBar>
      
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        open={true}
        sx={{
          width: 200,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: 200, 
            boxSizing: 'border-box',
            backgroundColor: 'var(--bg-sidebar)',
            color: 'var(--text-light)',
            borderRight: 'none'
          },
          display: { xs: 'none', sm: 'block' }
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <Box sx={{ px: 3, mb: 3 }}>
            <Typography variant="h6" component="div" sx={{ color: 'var(--text-light)', fontWeight: 600 }}>
              興安藥局
            </Typography>
          </Box>
          
          <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
          
          <List component="nav">
            {/* Use filteredMenuItems */}
            {filteredMenuItems.map((item) => {
              if (item.subItems) {
                const isOpen = item.text === '記帳管理' ? accountingSubMenuOpen : productSubMenuOpen;
                const handleClick = item.text === '記帳管理' ? handleAccountingClick : handleProductClick;
                const isActive = item.text === '記帳管理' ? isAccountingPath(location.pathname) : isProductPath(location.pathname);
                
                // Filter subItems based on adminOnly flag
                const filteredSubItems = item.subItems.filter(subItem => {
                  if (!subItem.adminOnly) return true;
                  return user && user.role === 'admin';
                });

                // If all subitems are filtered out, don't render the main item
                if (filteredSubItems.length === 0 && item.subItems.length > 0) {
                  return null;
                }

                return (
                  <React.Fragment key={item.text}>
                    <ListItem 
                      button 
                      onClick={handleClick}
                      sx={{
                        borderLeft: isActive ? '3px solid var(--primary-color)' : '3px solid transparent',
                        pl: 2.5,
                        py: 1.5,
                        backgroundColor: isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.05)'
                        }
                      }}
                    >
                      <ListItemIcon sx={{ 
                        color: isActive ? 'var(--text-light)' : 'rgba(255, 255, 255, 0.7)',
                        minWidth: 40
                      }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.text} 
                        primaryTypographyProps={{ 
                          sx: { 
                            color: isActive ? 'var(--text-light)' : 'rgba(255, 255, 255, 0.7)',
                            fontWeight: 500
                          } 
                        }}
                      />
                      {isOpen ? <ExpandLess sx={{ color: 'rgba(255, 255, 255, 0.7)' }} /> : <ExpandMore sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />}
                    </ListItem>
                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {/* Use filteredSubItems */}
                        {filteredSubItems.map((subItem) => (
                          <ListItem 
                            button 
                            key={subItem.text} 
                            onClick={() => handleNavigation(subItem.path)}
                            selected={location.pathname === subItem.path}
                            sx={{
                              pl: 4, // Indent sub-items
                              py: 1,
                              '&.Mui-selected': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)'
                              },
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)'
                              }
                            }}
                          >
                            {subItem.icon && (
                              <ListItemIcon sx={{ 
                                color: location.pathname === subItem.path ? 'var(--text-light)' : 'rgba(255, 255, 255, 0.7)',
                                minWidth: 30
                              }}>
                                {subItem.icon}
                              </ListItemIcon>
                            )}
                            <ListItemText 
                              primary={subItem.text} 
                              primaryTypographyProps={{ 
                                sx: { 
                                  color: location.pathname === subItem.path ? 'var(--text-light)' : 'rgba(255, 255, 255, 0.7)',
                                  fontWeight: location.pathname === subItem.path ? 500 : 400,
                                  fontSize: '0.9rem'
                                } 
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Collapse>
                  </React.Fragment>
                );
              } else {
                // Render non-collapsible items
                const isActive = location.pathname.startsWith(item.path) && item.path !== '/';
                return (
                  <ListItem 
                    button 
                    key={item.text} 
                    onClick={() => handleNavigation(item.path)}
                    selected={isActive}
                    sx={{
                      borderLeft: isActive ? '3px solid var(--primary-color)' : '3px solid transparent',
                      pl: 2.5,
                      py: 1.5,
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)'
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)'
                      }
                    }}
                  >
                    <ListItemIcon sx={{ 
                      color: isActive ? 'var(--text-light)' : 'rgba(255, 255, 255, 0.7)',
                      minWidth: 40
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text} 
                      primaryTypographyProps={{ 
                        sx: { 
                          color: isActive ? 'var(--text-light)' : 'rgba(255, 255, 255, 0.7)',
                          fontWeight: isActive ? 500 : 400
                        } 
                      }}
                    />
                  </ListItem>
                );
              }
            })}
          </List>
        </Box>
      </Drawer>

      {/* Main Content Area */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          backgroundColor: 'var(--bg-primary)',
          minHeight: '100vh'
        }}
      >
        <Toolbar />
        {children}
      </Box>

      {/* Settings Modal */}
      <SettingsModal open={settingsOpen} onClose={handleSettingsClose} />
    </Box>
  );
};

// Helper component for Nav Icon Buttons in AppBar
const NavIconButton = ({ to, tooltip, activeIcon, inactiveIcon, adminOnly = false, userRole }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  // Hide if adminOnly and user is not admin
  if (adminOnly && userRole !== 'admin') {
    return null;
  }

  return (
    <Tooltip title={tooltip}>
      <IconButton 
        color="inherit" 
        component={Link} 
        to={to} 
        sx={{ 
          mr: 2,
          color: isActive ? 'var(--primary-color)' : 'inherit'
        }}
      >
        {isActive ? activeIcon : inactiveIcon}
      </IconButton>
    </Tooltip>
  );
};

export default MainLayout;


import React, { useState, useEffect, useCallback } from 'react';
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
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import CategoryIcon from '@mui/icons-material/Category';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import ListAltIcon from '@mui/icons-material/ListAlt'; // Icon for Product List
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../../assets/css/dashui-theme.css';

const NavIconButton = ({ to, tooltip, activeIcon, inactiveIcon, adminOnly, userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/'); // More robust active check

  if (adminOnly && userRole !== 'admin') {
    return null; // Don't render if adminOnly and user is not admin
  }

  return (
    <Tooltip title={tooltip}>
      <IconButton color="inherit" onClick={() => navigate(to)} sx={{ mx: 0.5 }}>
        {isActive ? activeIcon : inactiveIcon}
      </IconButton>
    </Tooltip>
  );
};

const MainLayout = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountingSubMenuOpen, setAccountingSubMenuOpen] = useState(false);
  const [productSubMenuOpen, setProductSubMenuOpen ] = useState(false);
  const [settingSubMenuOpen, setSettingSubMenuOpen ] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isTestMode, setIsTestMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(''); // New state for countdown

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user data from localStorage", error);
        localStorage.removeItem('user');
      }
    }
    const testModeActive = localStorage.getItem('isTestMode') === 'true';
    setIsTestMode(testModeActive);
  }, []);

  const handleClosePopover = useCallback(() => setAnchorEl(null), []);

  const handleLogout = useCallback(() => {
    handleClosePopover();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isTestMode');
    localStorage.removeItem('loginTime'); // Clear loginTime
    delete axios.defaults.headers.common['x-auth-token'];
    if (location.pathname !== '/login') {
      navigate('/login');
    }
  }, [navigate, location.pathname, handleClosePopover]);

  // JWT Expiry Timer Effect
  useEffect(() => {
    const token = localStorage.getItem('token');
    const loginTimeStr = localStorage.getItem('loginTime'); // Assumed to be stored as Unix timestamp string

    if (token && loginTimeStr) {
      const loginTimestamp = parseInt(loginTimeStr, 10);
      const jwtAuthExpiration = 604800; // 7 days in seconds, from default.json
      const expiryTimestamp = loginTimestamp + jwtAuthExpiration;

      const updateDisplayAndCheckExpiry = () => {
        const now = Math.floor(Date.now() / 1000);
        const remainingSeconds = expiryTimestamp - now;

        if (remainingSeconds <= 0) {
          setTimeLeft('已過期');
          if (location.pathname !== '/login') {
            handleLogout(); // Perform logout and redirect
          }
          return true; // Indicates expired
        } else {
          const days = Math.floor(remainingSeconds / (24 * 60 * 60));
          const hours = Math.floor((remainingSeconds % (24 * 60 * 60)) / (60 * 60));
          const minutes = Math.floor((remainingSeconds % (60 * 60)) / 60);
          const seconds = remainingSeconds % 60;

          let timeLeftString = '';
          if (days > 0) timeLeftString += `${days}天 `;
          if (days > 0 || hours > 0) timeLeftString += `${hours}時 `;
          timeLeftString += `${minutes}分 ${seconds}秒`;
          
          setTimeLeft(` (登入將於 ${timeLeftString} 後失效)`);
          return false; // Indicates not expired
        }
      };

      // Initial check and display update
      if (updateDisplayAndCheckExpiry()) {
        return; // Already expired and handled, no interval needed
      }

      const intervalId = setInterval(() => {
        if (updateDisplayAndCheckExpiry()) {
          clearInterval(intervalId); // Stop timer if expired
        }
      }, 1000);

      return () => clearInterval(intervalId); // Cleanup on unmount
    } else {
      setTimeLeft(''); // Clear if no token/loginTime
    }
  }, [location.pathname, handleLogout]); // Dependencies

  const isProductPath = (path) => path.startsWith('/products') || path.startsWith('/product-categories');
  const isAccountingPath = (path) => path.startsWith('/accounting') || path.startsWith('/settings/monitored-products');
  const isSettingPath = (path) => /^\/settings(\/|$)/.test(path);

  const menuItems = [
    { text: '儀表板', icon: (location.pathname === '/dashboard') ? <DashboardOutlinedIcon /> : <DashboardIcon />, path: '/dashboard', adminOnly: true },
    { text: '銷售管理', icon: (location.pathname.startsWith('/sales')) ? <SellOutlinedIcon /> : <SellIcon />, path: '/sales' },
    { text: '商品管理', icon: isProductPath(location.pathname) ? <LocalMallOutlinedIcon /> : <LocalMallIcon />, subItems: [
        { text: '商品列表', path: '/products', icon: <ListAltIcon fontSize="small" sx={{ ml: 1 }} /> },
        { text: '商品分類', path: '/product-categories', icon: <CategoryIcon fontSize="small" sx={{ ml: 1 }} /> },
      ]
    },
    { text: '進貨單管理', icon: (location.pathname.startsWith('/purchase-orders')) ? <ReceiptOutlinedIcon /> : <ReceiptIcon />, path: '/purchase-orders', adminOnly: true },
    { text: '出貨單管理', icon: (location.pathname.startsWith('/shipping-orders')) ? <LocalShippingOutlinedIcon /> : <LocalShippingIcon />, path: '/shipping-orders', adminOnly: true },
    { text: '供應商管理', icon: (location.pathname === '/suppliers') ? <FactoryOutlinedIcon /> : <FactoryIcon />, path: '/suppliers', adminOnly: true },
    { text: '會員管理', icon: (location.pathname === '/customers') ? <PeopleOutlinedIcon /> : <PeopleIcon />, path: '/customers', adminOnly: true },
    { text: '記帳管理', icon: isAccountingPath(location.pathname) ? <AccountBalanceWalletOutlinedIcon /> : <AccountBalanceWalletIcon />, subItems: [
        { text: '記帳列表', path: '/accounting' },
        { text: '名目設定', path: '/accounting/categories', icon: <CategoryIcon fontSize="small" sx={{ ml: 1 }} /> },
      ]
    },
    { text: '報表功能', icon: <BarChartIcon />, path: '/reports', adminOnly: true },
    { text: '系統設定', icon: isSettingPath(location.pathname) ? <SettingsOutlinedIcon /> : <SettingsIcon />, subItems: [
        { text: '設定列表', path: '/settings' },
        { text: 'ip設定', path: '/settings/ip', icon: <CategoryIcon fontSize="small" sx={{ ml: 1 }} /> },
      ]
    },
  ];

  const toggleDrawer = () => setDrawerOpen(!drawerOpen);
  const handleNavigation = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleSettingClick = () => setSettingSubMenuOpen(!settingSubMenuOpen);
  const handleAccountingClick = () => setAccountingSubMenuOpen(!accountingSubMenuOpen);
  const handleProductClick = () => setProductSubMenuOpen(!productSubMenuOpen);
  const handleAvatarClick = (event) => setAnchorEl(event.currentTarget);

  const openPopover = Boolean(anchorEl);
  const popoverId = openPopover ? 'user-popover' : undefined;

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.adminOnly) return true;
    return user && user.role === 'admin';
  });

  const getAvatarContent = () => {
    if (isTestMode) return 'T'; // Test Mode Avatar
    if (!user) return '?';
    if (user.role === 'admin') return 'A';
    if (user.role === 'stuff') return 'S';
    if (user.username) return user.username.charAt(0).toUpperCase();
    return '?';
  };
  
  const getUserRoleDisplay = () => {
    if (isTestMode) return '測試模式';
    if (user?.role === 'admin') return '管理員';
    if (user?.role === 'stuff') return '員工';
    return user?.role || '未知';
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)' }}>
        <Toolbar>
          <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={toggleDrawer} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            POS系統 {isTestMode && <Typography component="span" sx={{ fontSize: '0.7em', color: 'orange', fontWeight: 'bold' }}>(測試模式)</Typography>}
            {timeLeft && <Typography component="span" sx={{ fontSize: '0.7em', color: 'lightcoral', marginLeft: 1 }}>{timeLeft}</Typography>} {/* Display timeLeft */}
          </Typography>

          <NavIconButton to="/shipping-orders/new" tooltip="出貨" activeIcon={<LocalShippingIcon />} inactiveIcon={<LocalShippingOutlinedIcon />} adminOnly={true} userRole={user?.role} />
          <NavIconButton to="/purchase-orders/new" tooltip="進貨" activeIcon={<AssignmentIcon />} inactiveIcon={<AssignmentOutlinedIcon />} adminOnly={true} userRole={user?.role} />
          <NavIconButton to="/sales/new" tooltip="銷售" activeIcon={<PointOfSaleIcon />} inactiveIcon={<PointOfSaleOutlinedIcon />} />
          <NavIconButton to="/accounting/new" tooltip="記帳" activeIcon={<AssuredWorkloadIcon />} inactiveIcon={<AssuredWorkloadOutlinedIcon />} />
          
          <Avatar aria-describedby={popoverId} sx={{ width: 36, height: 36, cursor: 'pointer', bgcolor: isTestMode ? 'orange' : 'var(--primary-color)' }} onClick={handleAvatarClick}>
            {getAvatarContent()}
          </Avatar>
          <Popover id={popoverId} open={openPopover} anchorEl={anchorEl} onClose={handleClosePopover} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} sx={{ mt: 1 }}>
            <Box sx={{ p: 2, minWidth: 200 }}>
              <Typography variant="subtitle1" gutterBottom>
                {isTestMode ? '測試帳戶' : (user?.username || '使用者')}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                角色: {getUserRoleDisplay()}
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Button variant="outlined" color="error" size="small" fullWidth onClick={handleLogout} startIcon={<LogoutIcon />}>
                登出
              </Button>
            </Box>
          </Popover>
        </Toolbar>
      </AppBar>
      
      <Drawer variant="permanent" open={true} sx={{ width: 200, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: 200, boxSizing: 'border-box', backgroundColor: 'var(--bg-sidebar)', color: 'var(--text-light)', borderRight: 'none' }, display: { xs: 'none', sm: 'block' } }}>
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <Box sx={{ px: 3, mb: 3 }}>
            <Typography variant="h6" component="div" sx={{ color: 'var(--text-light)', fontWeight: 600 }}>
              興安藥局
            </Typography>
          </Box>
          <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
          <List component="nav">
            {filteredMenuItems.map((item) => {
              if (item.subItems) {
                const isOpen = item.text === '記帳管理' ? accountingSubMenuOpen : item.text === '商品管理' ? productSubMenuOpen : item.text === '系統設定' ? settingSubMenuOpen : false;
                const handleClick = item.text === '記帳管理' ? handleAccountingClick : item.text === '商品管理' ? handleProductClick : item.text === '系統設定' ? handleSettingClick : undefined;
                const isActive = item.text === '記帳管理' ? isAccountingPath(location.pathname) : item.text === '商品管理' ? isProductPath(location.pathname) : item.text === '系統設定' ? isSettingPath(location.pathname) : false;
                const filteredSubItems = item.subItems.filter(subItem => !subItem.adminOnly || (user && user.role === 'admin'));
                if (filteredSubItems.length === 0 && item.subItems.length > 0) return null;
                return (
                  <React.Fragment key={item.text}>
                    <ListItem button onClick={handleClick} sx={{ borderLeft: isActive ? '3px solid var(--primary-color)' : '3px solid transparent', pl: 2.5, py: 1.5, backgroundColor: isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' } }}>
                      <ListItemIcon sx={{ color: isActive ? 'var(--text-light)' : 'rgba(255, 255, 255, 0.7)', minWidth: 40 }}>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} primaryTypographyProps={{ sx: { color: isActive ? 'var(--text-light)' : 'rgba(255, 255, 255, 0.7)', fontWeight: 500 } }} />
                      {isOpen ? <ExpandLess sx={{ color: 'rgba(255, 255, 255, 0.7)' }} /> : <ExpandMore sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />}
                    </ListItem>
                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {filteredSubItems.map((subItem) => (
                          <ListItem button key={subItem.text} onClick={() => handleNavigation(subItem.path)} sx={{ pl: 4, py: 1, borderLeft: location.pathname === subItem.path ? '3px solid var(--primary-color)' : '3px solid transparent', backgroundColor: location.pathname === subItem.path ? 'rgba(255, 255, 255, 0.08)' : 'transparent', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)' } }}>
                            {subItem.icon && <ListItemIcon sx={{ color: location.pathname === subItem.path ? 'var(--text-light)' : 'rgba(255, 255, 255, 0.6)', minWidth: 30 }}>{subItem.icon}</ListItemIcon>}
                            <ListItemText primary={subItem.text} primaryTypographyProps={{ sx: { color: location.pathname === subItem.path ? 'var(--text-light)' : 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' } }} />
                          </ListItem>
                        ))}
                      </List>
                    </Collapse>
                  </React.Fragment>
                );
              } else {
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path + '/'));
                return (
                  <ListItem button key={item.text} onClick={() => handleNavigation(item.path)} sx={{ borderLeft: isActive ? '3px solid var(--primary-color)' : '3px solid transparent', pl: 2.5, py: 1.5, backgroundColor: isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' } }}>
                    <ListItemIcon sx={{ color: isActive ? 'var(--text-light)' : 'rgba(255, 255, 255, 0.7)', minWidth: 40 }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} primaryTypographyProps={{ sx: { color: isActive ? 'var(--text-light)' : 'rgba(255, 255, 255, 0.7)', fontWeight: 500 } }} />
                  </ListItem>
                );
              }
            })}
          </List>
        </Box>
      </Drawer>
      {/* Main Content Area */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
        <Toolbar /> {/* For spacing below AppBar */}
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;


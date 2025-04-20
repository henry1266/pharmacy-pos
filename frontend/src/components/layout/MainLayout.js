import React, { useState } from 'react';
import { Tooltip, AppBar, Toolbar, Typography, IconButton, Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, Avatar, Badge } from '@mui/material';
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
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
	{ 
      text: '儀表板', 
      icon: (location.pathname === '/dashboard') ? <DashboardOutlinedIcon /> : <DashboardIcon />, 
      path: '/dashboard' 
    },
	{ 
		text: '銷售管理', 
		icon: (location.pathname === '/sales') ? <SellOutlinedIcon /> : <SellIcon />, 
		path: '/sales' 
	},
	{ 
      text: '商品管理', 
      icon: (location.pathname === '/products') ? <LocalMallOutlinedIcon /> : <LocalMallIcon />, 
      path: '/products' 
    },
	{ 
		text: '進貨單管理', 
		icon: (location.pathname === '/purchase-orders') ? <ReceiptOutlinedIcon /> : <ReceiptIcon />, 
		path: '/purchase-orders' 
	},
	{ 
		text: '出貨單管理', 
		icon: (location.pathname === '/shipping-orders') ? <LocalShippingOutlinedIcon /> : <LocalShippingIcon />, 
		path: '/shipping-orders' 
	},
    { 
      text: '供應商管理', 
      icon: (location.pathname === '/suppliers') ? <FactoryOutlinedIcon /> : <FactoryIcon />, 
      path: '/suppliers' 
    },
	{ 
      text: '會員管理', 
      icon: (location.pathname === '/customers') ? <PeopleOutlinedIcon /> : <PeopleIcon />, 
      path: '/customers' 
    },
    { 
      text: '記帳系統', 
      icon: (location.pathname === '/accounting') ? <AccountBalanceWalletOutlinedIcon /> : <AccountBalanceWalletIcon />, 
      path: '/accounting' 
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
    // 實現登出邏輯
    navigate('/login');
  };
  
  // 處理設定按鈕點擊
  const handleSettingsClick = () => {
    setSettingsOpen(true);
  };
  
  // 處理設定窗口關閉
  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* 頂部導航欄 */}
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

		  
		  {/* 設置圖標 */}
          <Tooltip title="設訂">
		  <IconButton color="inherit" sx={{ mr: 2 }} onClick={handleSettingsClick}>
            <SettingsIcon />
          </IconButton>
          </Tooltip>
          {/* 用戶頭像 */}
          <Avatar 
            sx={{ 
              width: 36, 
              height: 36,
              cursor: 'pointer',
              bgcolor: 'var(--primary-color)'
            }}
          >
            A
          </Avatar>
        </Toolbar>
      </AppBar>
      
      {/* 側邊欄 */}
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
          {/* 側邊欄標題 */}
          <Box sx={{ px: 3, mb: 3 }}>
            <Typography variant="h6" component="div" sx={{ color: 'var(--text-light)', fontWeight: 600 }}>
              興安藥局
            </Typography>
          </Box>
          
          <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
          
          {/* 菜單項目 */}
          <List>
            {menuItems.map((item) => (
              <ListItem 
                button 
                key={item.text} 
                onClick={() => handleNavigation(item.path)}
                selected={location.pathname === item.path}
                sx={{
                  borderLeft: location.pathname === item.path ? '3px solid var(--primary-color)' : '3px solid transparent',
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
                  color: location.pathname === item.path ? 'var(--text-light)' : 'rgba(255, 255, 255, 0.7)',
                  minWidth: 40
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    sx: { 
                      color: location.pathname === item.path ? 'var(--text-light)' : 'rgba(255, 255, 255, 0.7)',
                      fontWeight: 500
                    } 
                  }}
                />
              </ListItem>
            ))}
          </List>
          
          <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', my: 2 }} />
          
          {/* 登出選項 */}
          <List>
            <ListItem 
              button 
              onClick={handleLogout}
              sx={{
                pl: 2.5,
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)'
                }
              }}
            >
              <ListItemIcon sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                minWidth: 40
              }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText 
                primary="登出" 
                primaryTypographyProps={{ 
                  sx: { 
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontWeight: 500
                  } 
                }}
              />
            </ListItem>
          </List>
        </Box>
      </Drawer>
      
      {/* 移動設備側邊欄 */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            width: 200,
            backgroundColor: 'var(--bg-sidebar)',
            color: 'var(--text-light)'
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" component="div" sx={{ color: 'var(--text-light)', fontWeight: 600 }}>
            POS系統
          </Typography>
        </Box>
        <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
        <List>
          {menuItems.map((item) => (
            <ListItem 
              button 
              key={item.text} 
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
              sx={{
                borderLeft: location.pathname === item.path ? '3px solid var(--primary-color)' : '3px solid transparent',
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
                color: location.pathname === item.path ? 'var(--text-light)' : 'rgba(255, 255, 255, 0.7)',
                minWidth: 40
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  sx: { 
                    color: location.pathname === item.path ? 'var(--text-light)' : 'rgba(255, 255, 255, 0.7)',
                    fontWeight: 500
                  } 
                }}
              />
            </ListItem>
          ))}
        </List>
        <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', my: 2 }} />
        <List>
          <ListItem 
            button 
            onClick={handleLogout}
            sx={{
              pl: 2.5,
              py: 1.5,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }
            }}
          >
            <ListItemIcon sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              minWidth: 40
            }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText 
              primary="登出" 
              primaryTypographyProps={{ 
                sx: { 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: 500
                } 
              }}
            />
          </ListItem>
        </List>
      </Drawer>
      
      {/* 主內容區域 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          ml: { sm: '0' },
          backgroundColor: 'var(--bg-primary)',
          minHeight: '100vh'
        }}
      >
        <Toolbar />
        {children}
      </Box>
      
      {/* 設定彈出窗口 */}
      <SettingsModal open={settingsOpen} onClose={handleSettingsClose} />
    </Box>
  );
};

const NavIconButton = ({ to, tooltip, activeIcon, inactiveIcon }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Tooltip title={tooltip}>
      <Link to={to} style={{ color: 'inherit', textDecoration: 'none' }}>
        <IconButton
          sx={{
            mr: 2,
            color: isActive ? 'primary.main' : 'grey',
            transition: 'transform 0.2s ease, color 0.2s ease',
            '&:hover': {
              color: 'primary.main',
              transform: 'scale(1.3)',
            },
          }}
        >
          {isActive ? activeIcon : inactiveIcon}
        </IconButton>
      </Link>
    </Tooltip>
  );
};

export default MainLayout;

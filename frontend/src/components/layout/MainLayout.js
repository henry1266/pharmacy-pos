import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, Avatar, Badge } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MedicationIcon from '@mui/icons-material/Medication';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptIcon from '@mui/icons-material/Receipt';
import BarChartIcon from '@mui/icons-material/BarChart';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../assets/css/dashui-theme.css';

/**
 * 主要佈局組件，包含頂部導航欄和側邊菜單
 * @param {Object} props - 組件屬性
 * @param {React.ReactNode} props.children - 子組件內容
 * @returns {React.ReactElement} 佈局組件
 */
const MainLayout = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: '儀表板', icon: <DashboardIcon />, path: '/dashboard' },
    { text: '藥品管理', icon: <MedicationIcon />, path: '/products' },
    { 
      text: '供應商管理', 
      icon: (location.pathname === '/suppliers') ? <LocalShippingOutlinedIcon /> : <LocalShippingIcon />, 
      path: '/suppliers' 
    },
    { text: '會員管理', icon: <PeopleIcon />, path: '/customers' },
    { text: '進貨單管理', icon: <ShoppingCartIcon />, path: '/purchase-orders' },
    { text: '銷售管理', icon: <ReceiptIcon />, path: '/sales' },
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
            藥局POS系統
          </Typography>
          
          {/* 搜索圖標 */}
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <SearchIcon />
          </IconButton>
          
          {/* 通知圖標 */}
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Badge badgeContent={4} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          
          {/* 設置圖標 */}
          <IconButton color="inherit" sx={{ mr: 2 }}>
            <SettingsIcon />
          </IconButton>
          
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
              藥局POS系統
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
            藥局POS系統
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
    </Box>
  );
};

export default MainLayout;

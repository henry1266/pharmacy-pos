import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import axios from 'axios';
import { Tooltip, AppBar, Toolbar, Typography, IconButton, Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, Avatar, Collapse, Popover, Button, useTheme, useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
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
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import {
  LocalShippingOutlined as LocalShippingOutlinedIcon,
  Assignment as AssignmentIcon,
  AssignmentOutlined as AssignmentOutlinedIcon,
  PointOfSale as PointOfSaleIcon,
  PointOfSaleOutlined as PointOfSaleOutlinedIcon,
  AccountTree as AccountTreeIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  AccessTime as AccessTimeIcon,
  CalendarMonth as CalendarMonthIcon,
  Person as PersonIcon,
  BadgeOutlined as BadgeOutlinedIcon,
  Badge as BadgeIcon,
  ListAlt as ListAltIcon,
  Category as CategoryIcon,
  SettingsOutlined as SettingsOutlinedIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import '../assets/css/dashui-theme.css';
import ProductSearchDialog from './common/ProductSearchDialog';
import useProductData from '../hooks/useProductData';

interface NavIconButtonProps {
  to: string;
  tooltip: string;
  activeIcon: React.ReactNode;
  inactiveIcon: React.ReactNode;
  adminOnly?: boolean;
  userRole?: string;
}

const NavIconButton: React.FC<NavIconButtonProps> = ({ to, tooltip, activeIcon, inactiveIcon, adminOnly, userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/');

  if (adminOnly && userRole !== 'admin') {
    return null;
  }

  return (
    <Tooltip title={tooltip}>
      <IconButton color="inherit" onClick={() => navigate(to)} sx={{ mx: 0.5 }}>
        {isActive ? activeIcon : inactiveIcon}
      </IconButton>
    </Tooltip>
  );
};

interface User {
  username?: string;
  role?: string;
}

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path?: string;
  adminOnly?: boolean;
  subItems?: SubMenuItem[];
}

interface SubMenuItem {
  text: string;
  path: string;
  icon?: React.ReactNode;
  adminOnly?: boolean;
}

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // xs
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg')); // sm, md
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg')); // lg, xl
  
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [accountingSubMenuOpen, setAccountingSubMenuOpen] = useState<boolean>(false);
  const [accounting3SubMenuOpen, setAccounting3SubMenuOpen] = useState<boolean>(false);
  const [productSubMenuOpen, setProductSubMenuOpen] = useState<boolean>(false);
  const [settingSubMenuOpen, setSettingSubMenuOpen] = useState<boolean>(false);
  const [employeeSubMenuOpen, setEmployeeSubMenuOpen] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [searchDialogOpen, setSearchDialogOpen] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isTestMode, setIsTestMode] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  // 控制頂部導航欄的顯示和隱藏
  const [showAppBar, setShowAppBar] = useState<boolean>(true);
  
  // 獲取產品數據用於搜尋
  const { allProducts, loading: productsLoading } = useProductData();

  // 檢查螢幕寬度，在小於1300px的螢幕上預設隱藏頂部導航欄
  useEffect(() => {
    const isSmallScreen = window.innerWidth < 1300;
    setShowAppBar(!isSmallScreen); // 大螢幕顯示，小螢幕隱藏
    
    // 監聽窗口大小變化
    const handleResize = () => {
      const isSmall = window.innerWidth < 1300;
      setShowAppBar(!isSmall);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // 切換頂部導航欄的顯示/隱藏
  const toggleAppBar = () => {
    // 只在小螢幕上切換顯示/隱藏
    if (window.innerWidth < 1300) {
      setShowAppBar(prev => !prev);
    }
  };

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
    localStorage.removeItem('loginTime');
    delete axios.defaults.headers.common['x-auth-token'];
    if (location.pathname !== '/login') {
      navigate('/login');
    }
  }, [navigate, location.pathname, handleClosePopover]);

  // JWT Expiry Timer Effect
  useEffect(() => {
    const token = localStorage.getItem('token');
    const loginTimeStr = localStorage.getItem('loginTime');
    const testModeActive = localStorage.getItem('isTestMode') === 'true';

    //console.log('🕐 JWT 過期檢查:', { token: !!token, loginTimeStr, testModeActive });

    // 如果是測試模式，跳過 JWT 過期檢查
    if (testModeActive) {
      console.log('🧪 測試模式，跳過 JWT 過期檢查');
      setTimeLeft(' (測試模式 - 無過期時間)');
      return () => {}; // 返回空的清理函數
    }

    if (token && loginTimeStr) {
      const loginTimestamp = parseInt(loginTimeStr, 10);
      const jwtAuthExpiration = 604800; // 7 days in seconds, from default.json
      const expiryTimestamp = loginTimestamp + jwtAuthExpiration;

      const updateDisplayAndCheckExpiry = (): boolean => {
        const now = Math.floor(Date.now() / 1000);
        const remainingSeconds = expiryTimestamp - now;

        if (remainingSeconds <= 0) {
          console.log('❌ JWT Token 已過期，執行登出');
          setTimeLeft('已過期');
          if (location.pathname !== '/login') {
            handleLogout();
          }
          return true;
        } else {
          const days = Math.floor(remainingSeconds / (24 * 60 * 60));
          const hours = Math.floor((remainingSeconds % (24 * 60 * 60)) / (60 * 60));
          const minutes = Math.floor((remainingSeconds % (60 * 60)) / 60);
          const seconds = remainingSeconds % 60;

          let timeLeftString = '';
          if (days > 0) timeLeftString += `${days}天 `;
          if (days > 0 || hours > 0) timeLeftString += `${hours}時 `;
          timeLeftString += `${minutes}分 ${seconds}秒`;
          
          setTimeLeft(` ( ${timeLeftString} 後登出)`);
          return false;
        }
      };

      // Initial check and display update
      if (updateDisplayAndCheckExpiry()) {
        return () => {}; // 返回空的清理函數
      }

      const intervalId = setInterval(() => {
        if (updateDisplayAndCheckExpiry()) {
          clearInterval(intervalId);
        }
      }, 1000);

      return () => clearInterval(intervalId);
    } else {
      setTimeLeft('');
      return () => {}; // 返回空的清理函數
    }
  }, [location.pathname, handleLogout, isTestMode]);

  const isProductPath = (path: string): boolean => path.startsWith('/products') || path.startsWith('/product-categories');
  const isAccountingPath = (path: string): boolean => (path.startsWith('/accounting') && !path.startsWith('/accounting2') && !path.startsWith('/accounting3')) || path.startsWith('/settings/monitored-products');
  const isAccounting3Path = (path: string): boolean => path.startsWith('/accounting3');
  const isSettingPath = (path: string): boolean => /^\/settings(\/|$)/.test(path);
  const isEmployeePath = (path: string): boolean => path.startsWith('/employees');

  const menuItems: MenuItem[] = [
    { text: '儀表板', icon: (location.pathname === '/dashboard') ? <DashboardOutlinedIcon /> : <DashboardIcon />, path: '/dashboard' },
    { text: '銷售管理', icon: (location.pathname.startsWith('/sales')) ? <PointOfSaleOutlinedIcon /> : <PointOfSaleIcon />, path: '/sales' },
    { text: '商品管理', icon: isProductPath(location.pathname) ? <LocalMallOutlinedIcon /> : <LocalMallIcon />, subItems: [
        { text: '商品列表', path: '/products', icon: <ListAltIcon fontSize="small" sx={{ ml: 1 }} /> },
        { text: '商品分類', path: '/product-categories', icon: <CategoryIcon fontSize="small" sx={{ ml: 1 }} /> },
      ]
    },
    { text: '進貨單管理', icon: (location.pathname.startsWith('/purchase-orders')) ? <ReceiptOutlinedIcon /> : <ReceiptIcon />, path: '/purchase-orders', adminOnly: true },
    { text: '出貨單管理', icon: (location.pathname.startsWith('/shipping-orders')) ? <LocalShippingOutlinedIcon /> : <LocalShippingIcon />, path: '/shipping-orders', adminOnly: true },
    { text: '供應商管理', icon: (location.pathname.startsWith('/suppliers')) ? <FactoryOutlinedIcon /> : <FactoryIcon />, path: '/suppliers', adminOnly: true
    },
    { text: '員工管理', icon: isEmployeePath(location.pathname) ? <BadgeOutlinedIcon /> : <BadgeIcon />, subItems: [
        { text: '基本資料', path: '/employees', icon: <PersonIcon fontSize="small" sx={{ ml: 1 }} />, adminOnly: true },
        { text: '排班系統', path: '/employees/scheduling', icon: <CalendarMonthIcon fontSize="small" sx={{ ml: 1 }} /> },
        { text: '加班管理', path: '/employees/overtime', icon: <AccessTimeIcon fontSize="small" sx={{ ml: 1 }} /> },
      ]
    },
    { text: '會員管理', icon: (location.pathname === '/customers') ? <PeopleOutlinedIcon /> : <PeopleIcon />, path: '/customers', adminOnly: true },
    { text: '記帳管理', icon: isAccountingPath(location.pathname) ? <AccountBalanceWalletOutlinedIcon /> : <AccountBalanceWalletIcon />, subItems: [
        { text: '記帳列表', path: '/journals' },
        { text: '名目設定', path: '/journals/categories', icon: <CategoryIcon fontSize="small" sx={{ ml: 1 }} /> },
        { text: '業績報表', path: '/journals/categories/all' },
        { text: '監測列表', path: '/settings/monitored-products' },
      ]
    },
    { text: '會計系統', icon: isAccounting3Path(location.pathname) ? <AccountBalanceWalletOutlinedIcon /> : <AccountBalanceWalletIcon /> , subItems: [
        { text: '會計首頁', path: '/accounting3' , icon: <HomeIcon fontSize="small" sx={{ ml: 1 }} /> },
        { text: '會計列表', path: '/accounting3/transaction', icon: <CategoryIcon fontSize="small" sx={{ ml: 1 }} /> },
        { text: '會計科目', path: '/accounting3/accounts' , icon: <AccountTreeIcon fontSize="small" sx={{ ml: 1 }} /> },
        { text: '機構管理', path: '/accounting3/organizations', icon: <BusinessIcon fontSize="small" sx={{ ml: 1 }} />, adminOnly: true },
        { text: '結帳管理', path: '/accounting3/payments', icon: <BusinessIcon fontSize="small" sx={{ ml: 1 }} />, adminOnly: true },
      ]
    },
    { text: '報表功能', icon: <BarChartIcon />, path: '/reports', adminOnly: true },
    { text: '系統設定', icon: isSettingPath(location.pathname) ? <SettingsOutlinedIcon /> : <SettingsIcon />, subItems: [
        { text: '設定列表', path: '/settings' },
        { text: '個人帳號', path: '/settings/account', icon: <PersonIcon fontSize="small" sx={{ ml: 1 }} /> },
        { text: '員工帳號管理', path: '/settings/employee-accounts', icon: <PeopleIcon fontSize="small" sx={{ ml: 1 }} />, adminOnly: true },
      ]
    },
  ];

  const toggleDrawer = () => setDrawerOpen(!drawerOpen);
  const handleNavigation = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleSettingClick = () => setSettingSubMenuOpen(!settingSubMenuOpen);
  const handleAccountingClick = () => setAccountingSubMenuOpen(!accountingSubMenuOpen);
  const handleAccounting3Click = () => setAccounting3SubMenuOpen(!accounting3SubMenuOpen);
  const handleProductClick = () => setProductSubMenuOpen(!productSubMenuOpen);
  const handleEmployeeClick = () => setEmployeeSubMenuOpen(!employeeSubMenuOpen);
  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);

  // 搜尋對話框處理函數
  const handleSearchClick = () => setSearchDialogOpen(true);
  const handleSearchClose = () => setSearchDialogOpen(false);
  
  // 處理產品選擇
  const handleProductSelect = (product: any) => {
    // 導航到產品詳情頁面或執行其他操作
    navigate(`/products/${product._id}`);
  };

  // 處理套餐選擇
  const handlePackageSelect = (packageItem: any) => {
    // 導航到套餐詳情頁面或執行其他操作
    console.log('選擇套餐:', packageItem);
  };

  // 處理產品在新分頁中開啟
  const handleProductSelectNewTab = (product: any) => {
    const url = `/products/${product._id}`;
    window.open(url, '_blank');
  };

  // 處理套餐在新分頁中開啟
  const handlePackageSelectNewTab = (packageItem: any) => {
    // 如果有套餐詳情頁面，可以在這裡實現
    console.log('在新分頁中開啟套餐:', packageItem);
    // window.open(`/packages/${packageItem._id}`, '_blank');
  };

  const openPopover = Boolean(anchorEl);
  const popoverId = openPopover ? 'user-popover' : undefined;

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.adminOnly) return true;
    return user && user.role === 'admin';
  });

  // 提取巢狀三元運算符為獨立函數
  const getAvatarContent = (): string => {
    if (isTestMode) return 'T';
    if (!user) return '?';
    if (user.role === 'admin') return 'A';
    if (user.role === 'stuff') return 'S';
    if (user.username) return user.username.charAt(0).toUpperCase();
    return '?';
  };
  
  const getUserRoleDisplay = (): string => {
    if (isTestMode) return '測試模式';
    if (user?.role === 'admin') return '管理員';
    if (user?.role === 'stuff') return '員工';
    return user?.role ?? '未知';
  };

  // 提取複雜的渲染邏輯為獨立函數，降低認知複雜度
  const renderMenuItem = (item: MenuItem): React.ReactNode => {
    if (item.subItems) {
      return renderSubMenu(item);
    } else {
      return renderSingleMenuItem(item);
    }
  };

  // 渲染子選單
  const renderSubMenu = (item: MenuItem): React.ReactNode => {
    // 確定子選單是否開啟
    let isOpen: boolean;
    let handleClick: () => void;
    let isActive: boolean;

    // 根據選單類型設置對應的狀態和處理函數
    switch (item.text) {
      case '記帳管理':
        isOpen = accountingSubMenuOpen;
        handleClick = handleAccountingClick;
        isActive = isAccountingPath(location.pathname);
        break;
      case '會計系統':
        isOpen = accounting3SubMenuOpen;
        handleClick = handleAccounting3Click;
        isActive = isAccounting3Path(location.pathname);
        break;
      case '商品管理':
        isOpen = productSubMenuOpen;
        handleClick = handleProductClick;
        isActive = isProductPath(location.pathname);
        break;
      case '系統設定':
        isOpen = settingSubMenuOpen;
        handleClick = handleSettingClick;
        isActive = isSettingPath(location.pathname);
        break;
      case '員工管理':
        isOpen = employeeSubMenuOpen;
        handleClick = handleEmployeeClick;
        isActive = isEmployeePath(location.pathname);
        break;
      default:
        isOpen = false;
        handleClick = () => {};
        isActive = false;
    }

    // 過濾子選單項目
    const filteredSubItems = item.subItems?.filter(subItem =>
      !subItem.adminOnly || (user && user.role === 'admin')
    ) || [];
    
    // 如果過濾後沒有子選單項目，則不渲染
    if (filteredSubItems.length === 0) {
      return null;
    }

    return (
      <React.Fragment key={item.text}>
        <ListItem
          onClick={handleClick}
          sx={{
            borderLeft: isActive ? '3px solid var(--primary-color)' : '3px solid transparent',
            pl: 2.5,
            py: 1.5,
            backgroundColor: isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
            cursor: 'pointer'
          }}
        >
          <ListItemIcon 
            sx={{ 
              color: isActive ? 'var(--text-light)' : 'rgba(255, 255, 255, 0.7)', 
              minWidth: 40 
            }}
          >
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
          {isOpen ? 
            <ExpandLess sx={{ color: 'rgba(255, 255, 255, 0.7)' }} /> : 
            <ExpandMore sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
          }
        </ListItem>
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {filteredSubItems.map(subItem => renderSubMenuItem(subItem))}
          </List>
        </Collapse>
      </React.Fragment>
    );
  };

  // 渲染子選單項目
  const renderSubMenuItem = (subItem: SubMenuItem): React.ReactNode => {
    const isActive = location.pathname === subItem.path;
    
    return (
      <ListItem
        key={subItem.text}
        onClick={() => handleNavigation(subItem.path)}
        sx={{
          pl: 4,
          py: 1,
          borderLeft: isActive ? '3px solid var(--primary-color)' : '3px solid transparent',
          backgroundColor: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
          cursor: 'pointer'
        }}
      >
        {subItem.icon && (
          <ListItemIcon 
            sx={{ 
              color: isActive ? 'var(--text-light)' : 'rgba(255, 255, 255, 0.6)', 
              minWidth: 30 
            }}
          >
            {subItem.icon}
          </ListItemIcon>
        )}
        <ListItemText 
          primary={subItem.text} 
          primaryTypographyProps={{ 
            sx: { 
              color: isActive ? 'var(--text-light)' : 'rgba(255, 255, 255, 0.6)', 
              fontSize: '0.9rem' 
            } 
          }} 
        />
      </ListItem>
    );
  };

  // 渲染單一選單項目
  const renderSingleMenuItem = (item: MenuItem): React.ReactNode => {
    if (!item.path) return null;
    
    const isActive = location.pathname === item.path || 
                    (item.path !== '/' && location.pathname.startsWith(item.path + '/'));
    
    return (
      <ListItem
        key={item.text}
        onClick={() => item.path && handleNavigation(item.path)}
        sx={{
          borderLeft: isActive ? '3px solid var(--primary-color)' : '3px solid transparent',
          pl: 2.5,
          py: 1.5,
          backgroundColor: isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
          cursor: 'pointer'
        }}
      >
        <ListItemIcon 
          sx={{ 
            color: isActive ? 'var(--text-light)' : 'rgba(255, 255, 255, 0.7)', 
            minWidth: 40 
          }}
        >
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
      </ListItem>
    );
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* 左上角可點擊區域，用於在小螢幕上顯示/隱藏頂部導航欄 */}
      <Box
        onClick={toggleAppBar}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '160px',
          height: '70px',
          zIndex: (theme) => theme.zIndex.drawer + 2,
          cursor: 'pointer',
          display: 'none', // 預設隱藏
          '@media (max-width: 1299px)': {
            display: 'block' // 小螢幕上顯示
          }
        }}
      />
      
      <AppBar position="fixed" sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
        // 在小於1300px的螢幕上根據狀態控制顯示/隱藏
        '@media (max-width: 1299px)': {
          transform: showAppBar ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.3s ease-in-out'
        }
      }}>
        <Toolbar>
          <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={toggleDrawer} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            POS {isTestMode && <Typography component="span" sx={{ fontSize: '0.7em', color: 'orange', fontWeight: 'bold' }}>(測試模式)</Typography>}
            {timeLeft && <Typography component="span" sx={{ fontSize: '0.7em', color: 'lightcoral', marginLeft: 1 }}>{timeLeft}</Typography>}
          </Typography>

          <Tooltip title="搜尋產品">
            <IconButton color="inherit" onClick={handleSearchClick} sx={{ mx: 0.5 }}>
              <SearchOutlinedIcon />
            </IconButton>
          </Tooltip>
          <NavIconButton to="/shipping-orders/new" tooltip="出貨" activeIcon={<LocalShippingIcon />} inactiveIcon={<LocalShippingOutlinedIcon />} adminOnly={true} userRole={user?.role || ''} />
          <NavIconButton to="/purchase-orders/new" tooltip="進貨" activeIcon={<AssignmentIcon />} inactiveIcon={<AssignmentOutlinedIcon />} adminOnly={true} userRole={user?.role || ''} />
          <NavIconButton to="/sales/new" tooltip="銷售" activeIcon={<PointOfSaleIcon />} inactiveIcon={<PointOfSaleOutlinedIcon />} />
          <NavIconButton to="/journals/new" tooltip="記帳" activeIcon={<AssuredWorkloadIcon />} inactiveIcon={<AssuredWorkloadOutlinedIcon />} />
          
          <Avatar aria-describedby={popoverId} sx={{ width: 36, height: 36, cursor: 'pointer', bgcolor: isTestMode ? 'orange' : 'var(--primary-color)' }} onClick={handleAvatarClick}>
            {getAvatarContent()}
          </Avatar>
          <Popover id={popoverId} open={openPopover} anchorEl={anchorEl} onClose={handleClosePopover} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} sx={{ mt: 1 }}>
            <Box sx={{ p: 2, minWidth: 200 }}>
              <Typography variant="subtitle1" gutterBottom>
                {isTestMode ? '測試帳戶' : (user?.username ?? '使用者')}
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
      
      {/* Mobile: Hidden Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={toggleDrawer}
          sx={{
            width: 200,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: 200,
              boxSizing: 'border-box',
              backgroundColor: 'var(--bg-sidebar)',
              color: 'var(--text-light)',
              borderRight: 'none'
            }
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto', mt: 2 }}>
            <Box sx={{ px: 3, mb: 3 }}>
              <Typography variant="h6" component="div" sx={{ color: 'var(--text-light)', fontWeight: 600 }}>
                {isTestMode ? '測試模式' : (user?.username ?? '興安藥局')}
              </Typography>
            </Box>
            <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
            <List component="nav">
              {filteredMenuItems.map(renderMenuItem)}
            </List>
          </Box>
        </Drawer>
      )}

      {/* Tablet: Collapsible Drawer */}
      {isTablet && (
        <Drawer
          variant="persistent"
          open={drawerOpen}
          sx={{
            width: drawerOpen ? 200 : 0,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: 200,
              boxSizing: 'border-box',
              backgroundColor: 'var(--bg-sidebar)',
              color: 'var(--text-light)',
              borderRight: 'none',
              transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: theme.transitions.create('transform', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              })
            }
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto', mt: 2 }}>
            <Box sx={{ px: 3, mb: 3 }}>
              <Typography variant="h6" component="div" sx={{ color: 'var(--text-light)', fontWeight: 600 }}>
                {isTestMode ? '測試模式' : (user?.username ?? '興安藥局')}
              </Typography>
            </Box>
            <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
            <List component="nav">
              {filteredMenuItems.map(renderMenuItem)}
            </List>
          </Box>
        </Drawer>
      )}

      {/* Desktop: Permanent Drawer */}
      {isDesktop && (
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
            }
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto', mt: 2 }}>
            <Box sx={{ px: 3, mb: 3 }}>
              <Typography variant="h6" component="div" sx={{ color: 'var(--text-light)', fontWeight: 600 }}>
                {isTestMode ? '測試模式' : (user?.username ?? 'USER')}
              </Typography>
            </Box>
            <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
            <List component="nav">
              {filteredMenuItems.map(renderMenuItem)}
            </List>
          </Box>
        </Drawer>
      )}

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          // 在小螢幕上減少頂部的 padding
          '@media (max-width: 1299px)': {
            pt: 1
          },
          backgroundColor: 'var(--bg-primary)',
          minHeight: '100vh',
          marginLeft: isTablet && drawerOpen ? '200px' : '0',
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          })
        }}
      >
        {/* 在小螢幕上隱藏或減少 Toolbar 的高度 */}
        <Box sx={{
          '@media (max-width: 1299px)': {
            height: showAppBar ? '64px' : '30px', // 如果 AppBar 顯示則保留空間，否則只留一點點空間
            transition: 'height 0.3s ease-in-out'
          }
        }}>
          <Toolbar sx={{
            '@media (max-width: 1299px)': {
              minHeight: showAppBar ? '64px' : '30px',
              p: 0
            }
          }} />
        </Box>
        {children}
      </Box>

      {/* 搜尋產品對話框 */}
      <ProductSearchDialog
        open={searchDialogOpen}
        onClose={handleSearchClose}
        products={allProducts}
        onSelectProduct={handleProductSelect}
        onSelectPackage={handlePackageSelect}
        onSelectProductNewTab={handleProductSelectNewTab}
        onSelectPackageNewTab={handlePackageSelectNewTab}
        title="搜尋產品"
        placeholder="輸入產品名稱、代碼、條碼或健保碼..."
      />
    </Box>
  );
};

export default MainLayout;
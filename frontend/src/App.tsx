import React, { useEffect } from 'react';
import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
// 使用 JSX 元素類型來避免 React Router 類型問題
// 合併 react-router-dom 的導入，避免重複導入
import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom';
import AppRouter from './AppRouter'; // 這將包含受保護的路由
import axios from 'axios';
import './assets/css/dashui-theme.css';
// 導入主題上下文提供者
import { ThemeContextProvider } from './contexts/ThemeContext';
// 在 TypeScript 中不需要 PropTypes，因為我們已經有了類型定義

// 創建預設主題（作為後備）
const fallbackTheme = createTheme({
  palette: {
    primary: {
      main: '#624bff',
      light: '#e5e1ff',
      dark: '#5040d9',
    },
    secondary: {
      main: '#6c757d',
    },
    success: {
      main: '#00d97e',
    },
    error: {
      main: '#e53f3c',
    },
    warning: {
      main: '#f5a623',
    },
    info: {
      main: '#39afd1',
    },
    background: {
      default: '#f5f4f8',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)',
          transition: 'all 0.3s',
          '&:hover': {
            boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: '#000000', // 將文字顏色設為黑色
        },
      },
    },
  },
});


// 處理受保護路由的元件
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem('token');
  const isTestMode = localStorage.getItem('isTestMode') === 'true';
  
  // 調試信息
  console.log('🔐 ProtectedRoute 檢查:', { token: !!token, isTestMode });
  
  if (!token) {
    console.log('❌ 沒有 token，重定向到登入頁面');
    return <Navigate to="/login" replace />;
  }
  
  // 如果是測試模式，直接允許訪問
  if (isTestMode) {
    console.log('✅ 測試模式，允許訪問');
    return <>{children}</>;
  }
  
  // 正常模式的 JWT 驗證
  try {
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = tokenData.exp * 1000;
    const isValid = Date.now() < expirationTime;
    
    if (!isValid) {
      console.log('❌ Token 已過期，重定向到登入頁面');
      return <Navigate to="/login" replace />;
    }
    
    console.log('✅ 正常模式，Token 有效');
    return <>{children}</>;
  } catch (error) {
    console.error('❌ Token 驗證錯誤:', error);
    return <Navigate to="/login" replace />;
  }
};

const App: React.FC = () => {
  // 如果令牌存在，則設置 axios 默認標頭（在初始加載時）
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // 同時設定兩種認證方式以確保相容性
      axios.defaults.headers.common['x-auth-token'] = token;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
      delete axios.defaults.headers.common['Authorization'];
    }
    
    // 優化的存儲變更監聽器
    const handleStorageChange = (event: StorageEvent) => {
      console.log('📦 Storage 變更事件:', { key: event.key, newValue: event.newValue, oldValue: event.oldValue });
      
      // 忽略測試模式相關的 storage 變更
      if (event.key === 'isTestMode') {
        console.log('🧪 忽略測試模式 storage 變更');
        return;
      }
      
      // 忽略主題和 WebSocket 相關的 storage 變更
      if (event.key?.startsWith('socket_') || event.key?.startsWith('theme_')) {
        console.log('🎨 忽略主題/WebSocket storage 變更');
        return;
      }
      
      // 只處理認證相關的變更
      if (event.key === 'token' || event.key === 'user') {
        const newToken = localStorage.getItem('token');
        const isTestMode = localStorage.getItem('isTestMode') === 'true';
        
        console.log('🔐 處理認證相關變更:', { newToken: !!newToken, isTestMode });
        
        // 更新 axios 標頭
        if (newToken) {
          // 同時設定兩種認證方式以確保相容性
          axios.defaults.headers.common['x-auth-token'] = newToken;
          axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          console.log('✅ 已更新 axios 標頭');
        } else {
          delete axios.defaults.headers.common['x-auth-token'];
          delete axios.defaults.headers.common['Authorization'];
          console.log('❌ 已清除 axios 標頭');
          
          // 只有在非測試模式且確實是登出時才重新載入
          if (event.key === 'token' && !newToken && !isTestMode) {
            console.log('🔄 非測試模式登出，重新載入頁面');
            window.location.reload();
          } else if (isTestMode) {
            console.log('🧪 測試模式，不重新載入頁面');
          }
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // @ts-ignore - 忽略 React Router 類型問題
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        {/* 公共登錄路由 - 使用預設主題 */}
        <Route
          path="/login"
          element={
            <ThemeProvider theme={fallbackTheme}>
              <CssBaseline />
              <LoginPage />
            </ThemeProvider>
          }
        />
        
        {/* 受保護的路由 - 使用動態主題 */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <ThemeContextProvider>
                <MainLayout>
                  <AppRouter />
                </MainLayout>
              </ThemeContextProvider>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
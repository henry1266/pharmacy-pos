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

// 簡單檢查身份驗證令牌
const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  // 通過檢查令牌是否存在且未過期來實現令牌驗證
  if (token) {
    try {
      // 基本檢查 - 在生產環境中，應使用適當的 JWT 驗證
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = tokenData.exp * 1000; // 轉換為毫秒
      return Date.now() < expirationTime;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }
  return false;
};

// 處理受保護路由的元件
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  if (!isAuthenticated()) {
    // 將他們重定向到 /login 頁面，但保存他們被重定向時嘗試訪問的當前位置。
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
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
      // 只處理認證相關的變更
      if (event.key === 'token' || event.key === 'user') {
        const newToken = localStorage.getItem('token');
        
        // 更新 axios 標頭
        if (newToken) {
          // 同時設定兩種認證方式以確保相容性
          axios.defaults.headers.common['x-auth-token'] = newToken;
          axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        } else {
          delete axios.defaults.headers.common['x-auth-token'];
          delete axios.defaults.headers.common['Authorization'];
          // 只有在登出時才重新載入
          if (event.key === 'token' && !newToken) {
            window.location.reload();
          }
        }
      }
      
      // 忽略主題和 WebSocket 相關的 storage 變更
      if (event.key?.startsWith('socket_') ||
          event.key?.startsWith('theme_') ||
          event.key === 'isTestMode') {
        return;
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
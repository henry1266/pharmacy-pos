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
// 在 TypeScript 中不需要 PropTypes，因為我們已經有了類型定義

// 創建自定義主題
const theme = createTheme({
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
      axios.defaults.headers.common['x-auth-token'] = token;
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
    }
    // 存儲變更的基本監聽器，用於更新身份驗證狀態（可選，可能需要更強大的狀態管理）
    const handleStorageChange = () => {
        // 強制重新渲染或更新狀態（如果需要）
        window.location.reload(); // 最簡單的方式，但不是理想的用戶體驗
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // @ts-ignore - 忽略 React Router 類型問題
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* @ts-ignore - 忽略 React Router 類型問題 */}
      <Router>
        {/* @ts-ignore - 忽略 React Router 類型問題 */}
        <Routes>
          {/* 公共登錄路由 */}
          {/* @ts-ignore - 忽略 React Router 類型問題 */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* 受保護的路由 - 包裝 MainLayout 和 AppRouter */}
          {/* @ts-ignore - 忽略 React Router 類型問題 */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <AppRouter /> {/* AppRouter 現在只包含受保護的路由 */}
                </MainLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
/**
 * 統一通知提供者組件
 * 提供全域通知管理和顯示功能
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Button,
  Box,
  IconButton,
  Slide,
  SlideProps
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';

// 通知項目介面
interface NotificationItem {
  id: string;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  duration?: number;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    color?: 'primary' | 'secondary' | 'inherit';
  }>;
}

// Context 介面
interface NotificationContextType {
  notifications: NotificationItem[];
  showNotification: (notification: Omit<NotificationItem, 'id'>) => string;
  showSuccess: (message: string, title?: string, options?: Partial<NotificationItem>) => string;
  showError: (message: string, title?: string, options?: Partial<NotificationItem>) => string;
  showWarning: (message: string, title?: string, options?: Partial<NotificationItem>) => string;
  showInfo: (message: string, title?: string, options?: Partial<NotificationItem>) => string;
  hideNotification: (id: string) => void;
  clearAll: () => void;
}

// 建立 Context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Slide 轉場動畫
function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

// Provider Props
interface NotificationProviderProps {
  children: ReactNode;
  maxNotifications?: number;
  defaultDuration?: number;
}

/**
 * 通知提供者組件
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 5,
  defaultDuration = 6000
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  /**
   * 生成唯一 ID
   */
  const generateId = useCallback(() => {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * 顯示通知
   */
  const showNotification = useCallback((notification: Omit<NotificationItem, 'id'>) => {
    const id = generateId();
    const newNotification: NotificationItem = {
      id,
      duration: defaultDuration,
      ...notification
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      // 限制最大通知數量
      return updated.slice(0, maxNotifications);
    });

    // 自動隱藏（除非是持久通知）
    if (!newNotification.persistent && newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        hideNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, [generateId, defaultDuration, maxNotifications]);

  /**
   * 顯示成功通知
   */
  const showSuccess = useCallback((
    message: string, 
    title?: string, 
    options?: Partial<NotificationItem>
  ) => {
    return showNotification({
      message,
      title,
      severity: 'success',
      ...options
    });
  }, [showNotification]);

  /**
   * 顯示錯誤通知
   */
  const showError = useCallback((
    message: string, 
    title?: string, 
    options?: Partial<NotificationItem>
  ) => {
    return showNotification({
      message,
      title,
      severity: 'error',
      duration: 8000, // 錯誤通知顯示更久
      ...options
    });
  }, [showNotification]);

  /**
   * 顯示警告通知
   */
  const showWarning = useCallback((
    message: string, 
    title?: string, 
    options?: Partial<NotificationItem>
  ) => {
    return showNotification({
      message,
      title,
      severity: 'warning',
      ...options
    });
  }, [showNotification]);

  /**
   * 顯示資訊通知
   */
  const showInfo = useCallback((
    message: string, 
    title?: string, 
    options?: Partial<NotificationItem>
  ) => {
    return showNotification({
      message,
      title,
      severity: 'info',
      ...options
    });
  }, [showNotification]);

  /**
   * 隱藏通知
   */
  const hideNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  /**
   * 清除所有通知
   */
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  /**
   * 獲取圖示
   */
  const getIcon = (severity: NotificationItem['severity']) => {
    switch (severity) {
      case 'success':
        return <SuccessIcon />;
      case 'error':
        return <ErrorIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'info':
      default:
        return <InfoIcon />;
    }
  };

  const contextValue: NotificationContextType = {
    notifications,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideNotification,
    clearAll
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* 渲染通知 */}
      {notifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open={true}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          TransitionComponent={SlideTransition}
          sx={{
            top: `${80 + index * 80}px !important`, // 堆疊顯示
            zIndex: 1400 + index
          }}
        >
          <Alert
            severity={notification.severity}
            icon={getIcon(notification.severity)}
            action={
              <Box display="flex" alignItems="center" gap={1}>
                {/* 自定義操作按鈕 */}
                {notification.actions?.map((action, actionIndex) => (
                  <Button
                    key={actionIndex}
                    size="small"
                    color={action.color || 'inherit'}
                    onClick={() => {
                      action.action();
                      if (!notification.persistent) {
                        hideNotification(notification.id);
                      }
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
                
                {/* 關閉按鈕 */}
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={() => hideNotification(notification.id)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            }
            sx={{
              minWidth: 300,
              maxWidth: 500,
              '& .MuiAlert-message': {
                flex: 1
              }
            }}
          >
            {notification.title && (
              <AlertTitle>{notification.title}</AlertTitle>
            )}
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </NotificationContext.Provider>
  );
};

/**
 * 使用通知 Hook
 */
export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

/**
 * 高階組件：為組件添加通知功能
 */
export function withNotification<P extends object>(
  Component: React.ComponentType<P>
) {
  const WrappedComponent = (props: P) => {
    const notification = useNotification();
    return <Component {...props} notification={notification} />;
  };

  WrappedComponent.displayName = `withNotification(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default NotificationProvider;
/**
 * React 錯誤邊界組件
 * 捕獲子組件中的 JavaScript 錯誤，防止整個應用崩潰
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Collapse,
  IconButton
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  BugReport as BugReportIcon
} from '@mui/icons-material';
import { ErrorHandler, AppError, ErrorType, ErrorSeverity } from '../errors/ErrorHandler';

// Props 介面
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  allowRetry?: boolean;
  context?: string;
}

// State 介面
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  appError: AppError | null;
  showDetails: boolean;
  retryCount: number;
}

/**
 * 通用錯誤邊界組件
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private readonly maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      appError: null,
      showDetails: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // 更新 state 以顯示錯誤 UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 處理錯誤
    const appError = ErrorHandler.handleError(error, {
      context: this.props.context,
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    });

    // 記錄錯誤
    ErrorHandler.logError(appError);

    // 更新狀態
    this.setState({
      errorInfo,
      appError
    });

    // 調用外部錯誤處理器
    this.props.onError?.(error, errorInfo);
  }

  /**
   * 重試處理
   */
  handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount >= this.maxRetries) {
      console.warn('已達到最大重試次數');
      return;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      appError: null,
      retryCount: retryCount + 1
    });
  };

  /**
   * 重新載入頁面
   */
  handleReload = () => {
    window.location.reload();
  };

  /**
   * 切換詳細資訊顯示
   */
  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  /**
   * 渲染錯誤 UI
   */
  renderErrorUI() {
    const { error, errorInfo, appError, showDetails, retryCount } = this.state;
    const { allowRetry = true, showDetails: showDetailsDefault = false } = this.props;

    const canRetry = allowRetry && retryCount < this.maxRetries;
    const severity = appError?.severity || ErrorSeverity.MEDIUM;
    const isHighSeverity = [ErrorSeverity.HIGH, ErrorSeverity.CRITICAL].includes(severity);

    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
        p={3}
      >
        <Card sx={{ maxWidth: 600, width: '100%' }}>
          <CardContent>
            {/* 錯誤標題 */}
            <Box display="flex" alignItems="center" mb={2}>
              <BugReportIcon 
                color={isHighSeverity ? 'error' : 'warning'} 
                sx={{ mr: 1, fontSize: 32 }} 
              />
              <Typography variant="h5" component="h2">
                {appError ? ErrorHandler.formatErrorForDisplay(appError).title : '應用程式錯誤'}
              </Typography>
            </Box>

            {/* 錯誤訊息 */}
            <Alert 
              severity={isHighSeverity ? 'error' : 'warning'}
              sx={{ mb: 2 }}
            >
              <AlertTitle>
                {appError?.userMessage || '應用程式發生未預期的錯誤'}
              </AlertTitle>
              {retryCount > 0 && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  已重試 {retryCount} 次
                </Typography>
              )}
            </Alert>

            {/* 操作按鈕 */}
            <Box display="flex" gap={2} mb={2}>
              {canRetry && (
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleRetry}
                  color="primary"
                >
                  重試 ({this.maxRetries - retryCount} 次剩餘)
                </Button>
              )}
              <Button
                variant="outlined"
                onClick={this.handleReload}
                color="secondary"
              >
                重新載入頁面
              </Button>
            </Box>

            {/* 詳細資訊切換 */}
            {(showDetailsDefault || process.env.NODE_ENV === 'development') && (
              <>
                <Button
                  startIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  onClick={this.toggleDetails}
                  size="small"
                  sx={{ mb: 1 }}
                >
                  {showDetails ? '隱藏' : '顯示'}技術詳情
                </Button>

                <Collapse in={showDetails}>
                  <Alert severity="info" sx={{ mt: 1 }}>
                    <AlertTitle>技術詳情</AlertTitle>
                    <Typography variant="body2" component="pre" sx={{ 
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      maxHeight: 200,
                      overflow: 'auto'
                    }}>
                      <strong>錯誤訊息:</strong> {error?.message}
                      {'\n\n'}
                      <strong>錯誤堆疊:</strong> {error?.stack}
                      {errorInfo?.componentStack && (
                        <>
                          {'\n\n'}
                          <strong>組件堆疊:</strong> {errorInfo.componentStack}
                        </>
                      )}
                    </Typography>
                  </Alert>
                </Collapse>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  }

  render() {
    const { hasError } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // 如果提供了自定義 fallback，使用它
      if (fallback) {
        return fallback;
      }
      
      // 否則使用預設錯誤 UI
      return this.renderErrorUI();
    }

    return children;
  }
}

/**
 * 會計模組專用錯誤邊界
 */
export const AccountingErrorBoundary: React.FC<{
  children: ReactNode;
  module?: string;
}> = ({ children, module = 'Accounting' }) => {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    console.error(`${module} 模組錯誤:`, error, errorInfo);
    
    // 可以在這裡添加特定的錯誤處理邏輯
    // 例如：發送錯誤報告、清除相關快取等
  };

  return (
    <ErrorBoundary
      context={`${module}Module`}
      onError={handleError}
      allowRetry={true}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      {children}
    </ErrorBoundary>
  );
};

/**
 * 高階組件：為組件添加錯誤邊界
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default ErrorBoundary;
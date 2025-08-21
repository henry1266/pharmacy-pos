import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * 錯誤邊界元件
 * 捕獲子元件中的 JavaScript 錯誤，並顯示備用 UI
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // 更新 state，下次渲染時顯示備用 UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 記錄錯誤信息
    console.error('DailySchedulePanel 錯誤:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      // 如果提供了自定義的備用 UI，則使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 否則顯示默認的錯誤 UI
      return (
        <Box sx={{ p: 2 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body1" fontWeight="medium">
              班表顯示發生錯誤
            </Typography>
            <Typography variant="body2">
              {this.state.error?.message || '未知錯誤'}
            </Typography>
          </Alert>
          <Button variant="outlined" color="primary" onClick={this.handleReset}>
            重試
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
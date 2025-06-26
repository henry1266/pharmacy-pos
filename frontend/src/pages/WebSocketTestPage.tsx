import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Send as SendIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import useSocket from '../hooks/useSocket';
import socketService from '../services/socketService';

const WebSocketTestPage: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<string>('未連接');
  const [messages, setMessages] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<{ id: string; text: string; timestamp: Date }[]>([]);

  const { connect, disconnect, joinSalesNew2Room, leaveSalesNew2Room, isConnected, onSaleCreated, onSaleUpdated } = useSocket({
    autoConnect: true,
    joinSalesNew2Room: true
  });

  // 監聽連接狀態變化
  useEffect(() => {
    const checkConnection = () => {
      const connected = isConnected();
      setConnectionStatus(connected ? '已連接' : '未連接');
    };

    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // 監聽 WebSocket 事件
  useEffect(() => {
    onSaleCreated((data: any) => {
      console.log('收到銷售建立事件:', data);
      setMessages(prev => [...prev, { type: 'sale-created', data, timestamp: new Date() }]);
      setTestResults(prev => [...prev, { id: Date.now().toString(), text: `✅ 收到銷售建立事件: ${data.message}`, timestamp: new Date() }]);
    });

    onSaleUpdated((data: any) => {
      console.log('收到銷售更新事件:', data);
      setMessages(prev => [...prev, { type: 'sale-updated', data, timestamp: new Date() }]);
      setTestResults(prev => [...prev, { id: Date.now().toString(), text: `✅ 收到銷售更新事件: ${data.message}`, timestamp: new Date() }]);
    });
  }, [onSaleCreated, onSaleUpdated]);

  const handleConnect = () => {
    connect();
    setTestResults(prev => [...prev, { id: Date.now().toString(), text: '🔄 嘗試連接 WebSocket...', timestamp: new Date() }]);
  };

  const handleDisconnect = () => {
    disconnect();
    setTestResults(prev => [...prev, { id: Date.now().toString(), text: '🔌 斷開 WebSocket 連接', timestamp: new Date() }]);
  };

  const handleJoinRoom = () => {
    joinSalesNew2Room();
    setTestResults(prev => [...prev, { id: Date.now().toString(), text: '🏠 嘗試加入 sales-new2 房間', timestamp: new Date() }]);
  };

  const handleLeaveRoom = () => {
    leaveSalesNew2Room();
    setTestResults(prev => [...prev, { id: Date.now().toString(), text: '🚪 離開 sales-new2 房間', timestamp: new Date() }]);
  };

  const handleClearMessages = () => {
    setMessages([]);
    setTestResults([]);
  };

  const handleTestSaleCreation = async () => {
    try {
      // 模擬發送一個測試銷售記錄
      const testSale = {
        items: [
          {
            product: '507f1f77bcf86cd799439011', // 測試產品ID
            quantity: 1,
            price: 100,
            subtotal: 100
          }
        ],
        totalAmount: 100,
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        notes: 'WebSocket 測試銷售'
      };

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testSale),
      });

      if (response.ok) {
        setTestResults(prev => [...prev, { id: Date.now().toString(), text: '📤 測試銷售記錄已發送', timestamp: new Date() }]);
      } else {
        setTestResults(prev => [...prev, { id: Date.now().toString(), text: '❌ 測試銷售記錄發送失敗', timestamp: new Date() }]);
      }
    } catch (error) {
      setTestResults(prev => [...prev, { id: Date.now().toString(), text: `❌ 測試錯誤: ${error}`, timestamp: new Date() }]);
    }
  };

  const getConnectionColor = () => {
    return isConnected() ? 'success' : 'error';
  };

  const getConnectionIcon = () => {
    return isConnected() ? <WifiIcon /> : <WifiOffIcon />;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        WebSocket 連接測試
      </Typography>

      <Grid container spacing={3}>
        {/* 連接狀態 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                連接狀態
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Chip
                  icon={getConnectionIcon()}
                  label={connectionStatus}
                  color={getConnectionColor()}
                  variant="outlined"
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleConnect}
                  disabled={isConnected()}
                >
                  連接
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleDisconnect}
                  disabled={!isConnected()}
                >
                  斷開
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleJoinRoom}
                  disabled={!isConnected()}
                >
                  加入房間
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleLeaveRoom}
                  disabled={!isConnected()}
                >
                  離開房間
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 測試功能 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                測試功能
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<SendIcon />}
                  onClick={handleTestSaleCreation}
                  disabled={!isConnected()}
                >
                  測試銷售事件
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleClearMessages}
                >
                  清除記錄
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 測試結果 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              測試結果
            </Typography>
            {testResults.length === 0 ? (
              <Typography color="text.secondary">
                尚無測試結果
              </Typography>
            ) : (
              <List dense>
                {testResults.map((result) => (
                  <ListItem key={result.id}>
                    <ListItemText
                      primary={result.text}
                      secondary={result.timestamp.toLocaleTimeString()}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* 接收到的訊息 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              接收到的 WebSocket 訊息
            </Typography>
            {messages.length === 0 ? (
              <Typography color="text.secondary">
                尚未接收到任何訊息
              </Typography>
            ) : (
              <List dense>
                {messages.map((message) => (
                  <ListItem key={`${message.type}-${message.timestamp.getTime()}`}>
                    <ListItemText
                      primary={`${message.type}: ${message.data.message}`}
                      secondary={message.timestamp.toLocaleString()}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Alert severity="info">
          <Typography variant="body2">
            <strong>使用說明：</strong>
            <br />
            1. 確認 WebSocket 連接狀態為「已連接」
            <br />
            2. 點擊「加入房間」加入 sales-new2 房間
            <br />
            3. 點擊「測試銷售事件」或在其他頁面建立銷售記錄
            <br />
            4. 觀察是否收到 WebSocket 事件通知
            <br />
            5. 如果其他電腦無法收到通知，請檢查網路設定和伺服器 URL 配置
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default WebSocketTestPage;
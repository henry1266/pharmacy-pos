/**
 * 主題預覽組件
 * 顯示當前主題的實際效果
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  LinearProgress,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';

interface ThemePreviewProps {
  themeName?: string;
  showTitle?: boolean;
}

export const ThemePreview: React.FC<ThemePreviewProps> = ({ 
  themeName = '主題預覽',
  showTitle = true 
}) => {
  return (
    <Box>
      {showTitle && (
        <Typography variant="h6" gutterBottom>
          {themeName} - 實際效果預覽
        </Typography>
      )}
      
      <Grid container spacing={3}>
        {/* 側邊欄預覽 */}
        <Grid item xs={12} md={4}>
          <Paper 
            sx={{ 
              backgroundColor: 'var(--bg-sidebar)',
              color: 'var(--text-light)',
              p: 2,
              borderRadius: 'var(--border-radius)'
            }}
          >
            <Typography variant="h6" sx={{ color: 'var(--text-light)', mb: 2 }}>
              📱 側邊欄
            </Typography>
            <List dense>
              <ListItem sx={{ color: 'var(--text-light)' }}>
                <ListItemIcon sx={{ color: 'var(--primary-color)' }}>
                  <DashboardIcon />
                </ListItemIcon>
                <ListItemText primary="儀表板" />
              </ListItem>
              <ListItem sx={{ color: 'var(--text-light)' }}>
                <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  <ShoppingCartIcon />
                </ListItemIcon>
                <ListItemText primary="銷售管理" />
              </ListItem>
              <ListItem sx={{ color: 'var(--text-light)' }}>
                <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  <PeopleIcon />
                </ListItemIcon>
                <ListItemText primary="員工管理" />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* 主內容區預覽 */}
        <Grid item xs={12} md={8}>
          <Box sx={{ backgroundColor: 'var(--bg-primary)', p: 2, borderRadius: 'var(--border-radius)' }}>
            <Typography variant="h6" sx={{ color: 'var(--text-primary)', mb: 2 }}>
              📊 主內容區
            </Typography>
            
            {/* 統計卡片 */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Card sx={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <Box 
                        sx={{ 
                          width: 40, 
                          height: 40, 
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary-color)',
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2
                        }}
                      >
                        <AssessmentIcon />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ color: 'var(--text-primary)' }}>
                          1,234
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                          今日銷售
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6}>
                <Card sx={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <Box 
                        sx={{ 
                          width: 40, 
                          height: 40, 
                          backgroundColor: 'rgba(0, 217, 126, 0.1)',
                          color: 'var(--success-color)',
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2
                        }}
                      >
                        <PeopleIcon />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ color: 'var(--text-primary)' }}>
                          56
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                          在線員工
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* 按鈕預覽 */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ color: 'var(--text-primary)', mb: 1 }}>
                🔘 按鈕樣式
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Button 
                  variant="contained" 
                  sx={{ backgroundColor: 'var(--primary-color)' }}
                >
                  主要按鈕
                </Button>
                <Button 
                  variant="outlined" 
                  sx={{ 
                    borderColor: 'var(--primary-color)',
                    color: 'var(--primary-color)'
                  }}
                >
                  次要按鈕
                </Button>
                <Button 
                  variant="contained" 
                  sx={{ backgroundColor: 'var(--success-color)' }}
                >
                  成功
                </Button>
                <Button 
                  variant="contained" 
                  sx={{ backgroundColor: 'var(--danger-color)' }}
                >
                  危險
                </Button>
              </Box>
            </Box>

            {/* 狀態標籤預覽 */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ color: 'var(--text-primary)', mb: 1 }}>
                🏷️ 狀態標籤
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip 
                  label="進行中" 
                  sx={{ 
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary-color)'
                  }} 
                />
                <Chip 
                  label="已完成" 
                  sx={{ 
                    backgroundColor: 'rgba(0, 217, 126, 0.1)',
                    color: 'var(--success-color)'
                  }} 
                />
                <Chip 
                  label="警告" 
                  sx={{ 
                    backgroundColor: 'rgba(245, 166, 35, 0.1)',
                    color: 'var(--warning-color)'
                  }} 
                />
                <Chip 
                  label="錯誤" 
                  sx={{ 
                    backgroundColor: 'rgba(229, 63, 60, 0.1)',
                    color: 'var(--danger-color)'
                  }} 
                />
              </Box>
            </Box>

            {/* 進度條預覽 */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ color: 'var(--text-primary)', mb: 1 }}>
                📊 進度條
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={75} 
                sx={{ 
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'var(--border-color)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'var(--primary-color)'
                  }
                }}
              />
              <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                75% 完成
              </Typography>
            </Box>

            {/* 警告框預覽 */}
            <Alert 
              severity="info" 
              sx={{ 
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary-color)',
                '& .MuiAlert-icon': {
                  color: 'var(--primary-color)'
                }
              }}
            >
              這是使用 Material 3 主題的資訊提示框
            </Alert>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ThemePreview;
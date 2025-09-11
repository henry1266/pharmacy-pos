import React from 'react';
import {
  Typography,
  Box,
  Alert
} from '@mui/material';

// 定義元件 Props 介面
interface SchedulingHeaderProps {
  isAdmin?: boolean;
  error?: string;
  title?: string;
}

/**
 * 排班系統標題組件
 * 顯示標題、管理員權限警告和錯誤信息
 */
const SchedulingHeader: React.FC<SchedulingHeaderProps> = ({ 
  isAdmin = false, 
  error = null, 
  title = "員工排班系統" 
}) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h5" component="h5" sx={{ mb: 2 }}>
        {title}
      </Typography>
      
      {!isAdmin && (
        <Alert severity="info" sx={{ mb: 1 }}>
          您正在以檢視模式查看排班表。如需修改排班，請聯繫管理員。
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default SchedulingHeader;
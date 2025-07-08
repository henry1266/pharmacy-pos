import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  Snackbar,
  Paper,
  Breadcrumbs,
  Link,
  Fab,
  Tooltip,
} from '@mui/material';
import {
  AccountTree as AccountTreeIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';

// 導入 accounting3 階層管理組件
import { AccountHierarchyManager } from '../modules/accounting3/components/features/accounts/AccountHierarchyManager';

// 導入共享類型
import { Account2 } from '@pharmacy-pos/shared/types/accounting2';

/**
 * 科目管理頁面
 * 
 * 功能：
 * - 獨立的科目階層管理
 * - 科目的新增、編輯、刪除
 * - 科目階層的展開/收合
 * - 搜尋和過濾功能
 */
export const AccountsManagementPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 通知狀態
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // 顯示通知
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // 關閉通知
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // 處理科目選擇
  const handleAccountSelect = (account: Account2) => {
    console.log('選擇科目:', account);
    // 可以導航到科目詳情頁面或執行其他操作
  };

  // 處理新增科目
  const handleAccountCreate = () => {
    console.log('新增科目');
    showSnackbar('新增科目功能開發中', 'info');
    // TODO: 實作新增科目功能
  };

  // 處理編輯科目
  const handleAccountEdit = (account: Account2) => {
    console.log('編輯科目:', account);
    showSnackbar('編輯科目功能開發中', 'info');
    // TODO: 實作編輯科目功能
  };

  // 處理刪除科目
  const handleAccountDelete = (accountId: string) => {
    console.log('刪除科目:', accountId);
    if (window.confirm('確定要刪除這個科目嗎？此操作無法復原。')) {
      showSnackbar('刪除科目功能開發中', 'info');
      // TODO: 實作刪除科目功能
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* 麵包屑導航 */}
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/accounting3');
            }}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <ReceiptIcon fontSize="small" />
            會計管理
          </Link>
          <Typography 
            color="text.primary" 
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <AccountTreeIcon fontSize="small" />
            科目管理
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* 頁面標題 */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <AccountTreeIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            科目階層管理
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          管理會計科目的階層結構，包括新增、編輯、刪除科目以及調整階層關係
        </Typography>
      </Box>

      {/* 主要內容區域 */}
      <Paper sx={{ height: 'calc(100vh - 200px)', minHeight: 600 }}>
        <AccountHierarchyManager
          onAccountSelect={handleAccountSelect}
          onAccountCreate={handleAccountCreate}
          onAccountEdit={handleAccountEdit}
          onAccountDelete={handleAccountDelete}
          showToolbar={true}
          showSearch={true}
          showSettings={true}
          height="100%"
        />
      </Paper>

      {/* 右側固定按鈕 */}
      <Box
        sx={{
          position: 'fixed',
          right: 16,
          top: '40%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          zIndex: 1000
        }}
      >
        <Tooltip title="返回交易管理" placement="left" arrow>
          <Fab 
            color="secondary" 
            size="medium" 
            onClick={() => navigate('/accounting3')} 
            aria-label="返回交易管理"
          >
            <ArrowBackIcon />
          </Fab>
        </Tooltip>
        
        <Tooltip title="新增科目" placement="left" arrow>
          <Fab 
            color="primary" 
            size="medium" 
            onClick={handleAccountCreate} 
            aria-label="新增科目"
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      </Box>

      {/* 通知 Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AccountsManagementPage;
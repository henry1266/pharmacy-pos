import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Snackbar,
  Fab,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  AccountBalance as AccountBalanceIcon,
  AccountTree as AccountTreeIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { AccountingDataGrid } from '../components/accounting2/AccountingDataGrid';
import { TransactionGroupForm } from '../components/accounting2/TransactionGroupForm';
import AccountManagement from '../components/accounting2/AccountManagement';
import {
  fetchTransactionGroups2,
  createTransactionGroup2,
  updateTransactionGroup2,
  deleteTransactionGroup2,
  fetchAccounts2
} from '../redux/actions';

// 新增機構相關 actions
const fetchOrganizations2 = () => async (dispatch: any) => {
  try {
    dispatch({ type: 'FETCH_ORGANIZATIONS2_REQUEST' });
    const response = await fetch('/api/organizations', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (response.ok) {
      const data = await response.json();
      const organizations = Array.isArray(data.data) ? data.data : [];
      dispatch({ type: 'FETCH_ORGANIZATIONS2_SUCCESS', payload: organizations });
    }
  } catch (error) {
    dispatch({ type: 'FETCH_ORGANIZATIONS2_FAILURE', payload: 'Failed to fetch organizations' });
  }
};

interface TransactionGroup {
  _id: string;
  description: string;
  transactionDate: string;
  organizationId?: string;
  invoiceNo?: string;
  receiptUrl?: string;
  totalAmount: number;
  isBalanced: boolean;
  entries: AccountingEntry[];
  createdAt: string;
  updatedAt: string;
}

interface AccountingEntry {
  _id: string;
  accountId: string;
  accountName: string;
  accountCode: string;
  debitAmount: number;
  creditAmount: number;
  description: string;
}

interface TransactionGroupFormData {
  description: string;
  transactionDate: Date;
  organizationId?: string;
  invoiceNo: string;
  receiptUrl?: string;
  attachments: File[];
  entries: AccountingEntry[];
}

export const Accounting2Page: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useAppDispatch();
  const { transactionId } = useParams<{ transactionId?: string }>();
  const isCopyMode = window.location.pathname.includes('/copy');
  
  // Redux state
  const { transactionGroups, loading, error } = useAppSelector(state => state.transactionGroup2);
  
  // Local state
  const [currentTab, setCurrentTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionGroup | null>(null);
  const [copyingTransaction, setCopyingTransaction] = useState<TransactionGroup | null>(null);
  const [viewingTransaction, setViewingTransaction] = useState<TransactionGroup | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // 載入交易群組、會計科目和機構資料
  useEffect(() => {
    console.log('🔄 Accounting2Page 初始化載入資料');
    dispatch(fetchTransactionGroups2() as any);
    dispatch(fetchAccounts2() as any);
    dispatch(fetchOrganizations2() as any);
  }, [dispatch]);

  // 監聽 Redux 狀態變化，用於除錯
  useEffect(() => {
    console.log('📊 TransactionGroups 狀態變化:', {
      transactionGroupsLength: transactionGroups.length,
      loading,
      error,
      firstTransaction: transactionGroups[0]
    });
  }, [transactionGroups, loading, error]);

  // 處理從 URL 參數進入編輯或複製模式
  useEffect(() => {
    if (transactionId && transactionGroups.length > 0) {
      const transactionToProcess = transactionGroups.find(t => t._id === transactionId);
      if (transactionToProcess) {
        if (isCopyMode) {
          console.log('📋 從 URL 參數自動打開複製對話框:', transactionToProcess);
          // 複製模式：設置要複製的交易，但編輯交易設為 null（表示新增模式）
          setCopyingTransaction(transactionToProcess);
          setEditingTransaction(null);
          setDialogOpen(true);
        } else {
          console.log('🔧 從 URL 參數自動打開編輯對話框:', transactionToProcess);
          setEditingTransaction(transactionToProcess);
          setCopyingTransaction(null);
          setDialogOpen(true);
        }
      }
    }
  }, [transactionId, transactionGroups, isCopyMode]);

  // 處理新增交易
  const handleCreateNew = () => {
    setEditingTransaction(null);
    setDialogOpen(true);
  };

  // 處理編輯交易
  const handleEdit = (transactionGroup: TransactionGroup) => {
    setEditingTransaction(transactionGroup);
    setDialogOpen(true);
  };

  // 處理檢視交易
  const handleView = (transactionGroup: TransactionGroup) => {
    setViewingTransaction(transactionGroup);
  };

  // 處理刪除交易
  const handleDelete = async (id: string) => {
    if (window.confirm('確定要刪除這筆交易嗎？此操作無法復原。')) {
      try {
        await dispatch(deleteTransactionGroup2(id) as any);
        showSnackbar('交易已成功刪除', 'success');
      } catch (error) {
        console.error('刪除交易失敗:', error);
        showSnackbar('刪除交易失敗', 'error');
      }
    }
  };

  // 處理表單提交
  const handleFormSubmit = async (formData: TransactionGroupFormData) => {
    try {
      console.log('🔍 handleFormSubmit 開始:', { editingTransaction, formData });
      
      if (editingTransaction) {
        await dispatch(updateTransactionGroup2(editingTransaction._id, formData) as any);
        showSnackbar('交易已成功更新', 'success');
      } else {
        await dispatch(createTransactionGroup2(formData) as any);
        showSnackbar('交易已成功建立', 'success');
      }
      setDialogOpen(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error('表單提交失敗:', error);
      showSnackbar(editingTransaction ? '更新交易失敗' : '建立交易失敗', 'error');
    }
  };

  // 顯示通知
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // 關閉通知
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // 關閉對話框
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTransaction(null);
    setCopyingTransaction(null);
  };

  // 關閉檢視對話框
  const handleCloseViewDialog = () => {
    setViewingTransaction(null);
  };

  // 處理 Tab 切換
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Tab 面板組件
  interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
  }

  const TabPanel = (props: TabPanelProps) => {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`accounting-tabpanel-${index}`}
        aria-labelledby={`accounting-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ py: 3 }}>
            {children}
          </Box>
        )}
      </div>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* 頁面標題 */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <AccountBalanceIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            複式記帳系統
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          管理您的複式記帳交易，確保借貸平衡，追蹤財務狀況
        </Typography>
      </Box>

      {/* 錯誤提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tab 導航 */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="會計系統功能選項"
          variant={isMobile ? "fullWidth" : "standard"}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500
            }
          }}
        >
          <Tab
            icon={<ReceiptIcon />}
            iconPosition="start"
            label="交易管理"
            id="accounting-tab-0"
            aria-controls="accounting-tabpanel-0"
          />
          <Tab
            icon={<AccountTreeIcon />}
            iconPosition="start"
            label="會計科目"
            id="accounting-tab-1"
            aria-controls="accounting-tabpanel-1"
          />
        </Tabs>
      </Paper>

      {/* Tab 內容面板 */}
      <TabPanel value={currentTab} index={0}>
        <AccountingDataGrid
          onCreateNew={handleCreateNew}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={handleDelete}
        />
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <AccountManagement />
      </TabPanel>

      {/* 浮動新增按鈕 (行動版) - 只在交易管理 Tab 顯示 */}
      {isMobile && currentTab === 0 && (
        <Fab
          color="primary"
          aria-label="新增交易"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: theme.zIndex.fab
          }}
          onClick={handleCreateNew}
        >
          <AddIcon />
        </Fab>
      )}

      {/* 新增/編輯交易對話框 */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          {editingTransaction ? '編輯交易群組' : copyingTransaction ? '複製交易群組' : '建立交易群組'}
        </DialogTitle>
        <DialogContent>
          <TransactionGroupForm
            mode={editingTransaction ? 'edit' : 'create'}
            initialData={editingTransaction ? {
              description: editingTransaction.description,
              transactionDate: new Date(editingTransaction.transactionDate),
              organizationId: editingTransaction.organizationId,
              receiptUrl: editingTransaction.receiptUrl || '',
              invoiceNo: editingTransaction.invoiceNo || '',
              entries: Array.isArray(editingTransaction.entries) ? editingTransaction.entries.map(entry => ({
                accountId: entry.accountId || '',
                debitAmount: entry.debitAmount || 0,
                creditAmount: entry.creditAmount || 0,
                description: entry.description || ''
              })) : []
            } : copyingTransaction ? {
              description: copyingTransaction.description,
              transactionDate: new Date(), // 複製時使用今天的日期
              organizationId: copyingTransaction.organizationId,
              receiptUrl: copyingTransaction.receiptUrl || '',
              invoiceNo: '', // 複製時清空發票號碼
              entries: Array.isArray(copyingTransaction.entries) ? copyingTransaction.entries.map(entry => ({
                accountId: entry.accountId || '',
                debitAmount: entry.debitAmount || 0,
                creditAmount: entry.creditAmount || 0,
                description: entry.description || ''
              })) : []
            } : undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            取消
          </Button>
        </DialogActions>
      </Dialog>

      {/* 檢視交易對話框 */}
      <Dialog
        open={!!viewingTransaction}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          交易詳情
        </DialogTitle>
        <DialogContent>
          {viewingTransaction && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {viewingTransaction.description}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                交易日期：{new Date(viewingTransaction.transactionDate).toLocaleDateString('zh-TW')}
              </Typography>
              {viewingTransaction.invoiceNo && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  發票號碼：{viewingTransaction.invoiceNo}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" gutterBottom>
                總金額：NT$ {viewingTransaction.totalAmount.toLocaleString()}
              </Typography>
              <Typography variant="body2" color={viewingTransaction.isBalanced ? 'success.main' : 'error.main'}>
                狀態：{viewingTransaction.isBalanced ? '已平衡' : '未平衡'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>
            關閉
          </Button>
          {viewingTransaction && (
            <Button
              variant="contained"
              onClick={() => {
                handleCloseViewDialog();
                handleEdit(viewingTransaction);
              }}
            >
              編輯
            </Button>
          )}
        </DialogActions>
      </Dialog>

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

export default Accounting2Page;
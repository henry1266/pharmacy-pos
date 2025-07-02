import React, { useState, useEffect } from 'react';
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

interface TransactionGroup {
  _id: string;
  description: string;
  transactionDate: string;
  organizationId?: string;
  invoiceNo?: string;
  totalAmount: number;
  isBalanced: boolean;
  entries: any[];
  createdAt: string;
  updatedAt: string;
}

interface TransactionGroupFormData {
  description: string;
  transactionDate: Date;
  organizationId?: string;
  invoiceNo: string;
  attachments: File[];
  entries: any[];
}

export const Accounting2Page: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useAppDispatch();
  
  // Redux state
  const { transactionGroups, loading, error } = useAppSelector(state => state.transactionGroup2);
  
  // Local state
  const [currentTab, setCurrentTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionGroup | null>(null);
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

  // 載入交易群組資料
  useEffect(() => {
    // TODO: 實作載入交易群組的 action
    // dispatch(fetchTransactionGroups());
  }, [dispatch]);

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
        // TODO: 實作刪除交易的 action
        // await dispatch(deleteTransactionGroup(id));
        showSnackbar('交易已成功刪除', 'success');
      } catch (error) {
        showSnackbar('刪除交易失敗', 'error');
      }
    }
  };

  // 處理表單提交
  const handleFormSubmit = async (formData: TransactionGroupFormData) => {
    try {
      if (editingTransaction) {
        // TODO: 實作更新交易的 action
        // await dispatch(updateTransactionGroup({ id: editingTransaction._id, data: formData }));
        showSnackbar('交易已成功更新', 'success');
      } else {
        // TODO: 實作建立交易的 action
        // await dispatch(createTransactionGroup(formData));
        showSnackbar('交易已成功建立', 'success');
      }
      setDialogOpen(false);
      setEditingTransaction(null);
    } catch (error) {
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
          {editingTransaction ? '編輯交易群組' : '建立交易群組'}
        </DialogTitle>
        <DialogContent>
          <TransactionGroupForm
            mode={editingTransaction ? 'edit' : 'create'}
            initialData={editingTransaction ? {
              description: editingTransaction.description,
              transactionDate: new Date(editingTransaction.transactionDate),
              organizationId: editingTransaction.organizationId,
              invoiceNo: editingTransaction.invoiceNo || '',
              entries: editingTransaction.entries || []
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
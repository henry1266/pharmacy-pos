import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  ListAlt as ListIcon,
  Add as AddIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../hooks/redux';

// 導入內嵌分錄組件
import { DoubleEntryFormWithEntries } from '../components/accounting2/DoubleEntryFormWithEntries';
import { TransactionGroupFormWithEntries } from '../components/accounting2/TransactionGroupFormWithEntries';
import DoubleEntryDetailPageWithEntries from '../components/accounting2/DoubleEntryDetailPageWithEntries';
import { AccountingDataGridWithEntries } from '../components/accounting2/AccountingDataGridWithEntries';

// 導入內嵌分錄 Redux actions
import {
  fetchTransactionGroupsWithEntries,
  createTransactionGroupWithEntries,
  updateTransactionGroupWithEntries,
  deleteTransactionGroupWithEntries,
  confirmTransactionGroupWithEntries,
  unlockTransactionGroupWithEntries,
  fetchAccounts2,
  fetchOrganizations2
} from '../redux/actions';

// 導入共享類型
import {
  TransactionGroupWithEntries,
  EmbeddedAccountingEntry,
  TransactionGroupWithEntriesFormData,
  EmbeddedAccountingEntryFormData
} from '../../../shared/types/accounting2';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
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
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `accounting-tab-${index}`,
    'aria-controls': `accounting-tabpanel-${index}`,
  };
}

// 移除本地介面定義，使用 shared 的 TransactionGroupWithEntriesFormData

export const Accounting3Page: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { transactionId } = useParams<{ transactionId?: string }>();
  const isCopyMode = window.location.pathname.includes('/copy');
  const isNewMode = window.location.pathname.includes('/new');
  const returnTo = searchParams.get('returnTo');
  const defaultAccountId = searchParams.get('defaultAccountId');
  const defaultOrganizationId = searchParams.get('defaultOrganizationId');
  
  // Redux state - 使用內嵌分錄狀態
  const { transactionGroups, loading, error } = useAppSelector(state => state.transactionGroupWithEntries);
  
  // Local state
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionGroupWithEntries | null>(null);
  const [copyingTransaction, setCopyingTransaction] = useState<TransactionGroupWithEntries | null>(null);
  const [viewingTransaction, setViewingTransaction] = useState<TransactionGroupWithEntries | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // 載入交易群組和會計科目資料
  useEffect(() => {
    console.log('🔄 Accounting3Page 初始化載入資料');
    dispatch(fetchTransactionGroupsWithEntries() as any);
    dispatch(fetchAccounts2() as any);
    dispatch(fetchOrganizations2() as any);
  }, [dispatch]);

  // 監聽 Redux 狀態變化
  useEffect(() => {
    console.log('📊 TransactionGroupsWithEntries 狀態變化:', {
      transactionGroupsLength: transactionGroups.length,
      loading,
      error,
      firstTransaction: transactionGroups[0]
    });
  }, [transactionGroups, loading, error]);

  // 處理從 URL 參數進入編輯或複製模式
  useEffect(() => {
    if (transactionId) {
      const transactionToProcess = transactionGroups.find(t => t._id === transactionId);
      
      if (transactionToProcess) {
        if (isCopyMode) {
          console.log('📋 從 Redux store 自動打開複製對話框:', transactionToProcess);
          setCopyingTransaction(transactionToProcess);
          setEditingTransaction(null);
          setDialogOpen(true);
        } else {
          console.log('🔧 從 Redux store 自動打開編輯對話框:', transactionToProcess);
          setEditingTransaction(transactionToProcess);
          setCopyingTransaction(null);
          setDialogOpen(true);
        }
      } else if (transactionGroups.length > 0) {
        console.log('🔍 Redux store 中找不到交易，透過 API 直接獲取:', transactionId);
        fetchTransactionDirectly(transactionId);
      }
    }
  }, [transactionId, transactionGroups, isCopyMode]);

  // 直接透過 API 獲取單一交易
  const fetchTransactionDirectly = async (id: string) => {
    try {
      console.log('📡 直接 API 獲取內嵌分錄交易:', id);
      const response = await fetch(`/api/accounting2/transaction-groups-with-entries/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const transaction = result.data;
          console.log('✅ 直接 API 獲取內嵌分錄交易成功:', transaction);
          
          if (isCopyMode) {
            console.log('📋 透過 API 自動打開複製對話框:', transaction);
            setCopyingTransaction(transaction);
            setEditingTransaction(null);
            setDialogOpen(true);
          } else {
            console.log('🔧 透過 API 自動打開編輯對話框:', transaction);
            setEditingTransaction(transaction);
            setCopyingTransaction(null);
            setDialogOpen(true);
          }
        } else {
          console.error('❌ API 回應格式錯誤:', result);
          showSnackbar('找不到指定的交易', 'error');
        }
      } else {
        console.error('❌ API 請求失敗:', response.status, response.statusText);
        showSnackbar('載入交易失敗', 'error');
      }
    } catch (error) {
      console.error('❌ 直接獲取交易失敗:', error);
      showSnackbar('載入交易失敗', 'error');
    }
  };

  // 處理從科目詳情頁面的「增加明細」按鈕進入新增模式
  useEffect(() => {
    if (defaultAccountId && !transactionId && !dialogOpen) {
      console.log('🆕 從科目詳情頁面自動打開新增交易對話框，預設科目ID:', defaultAccountId, '預設機構ID:', defaultOrganizationId);
      setEditingTransaction(null);
      setCopyingTransaction(null);
      setDialogOpen(true);
    }
  }, [defaultAccountId, defaultOrganizationId, transactionId, dialogOpen]);

  // Tab 切換處理
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 處理新增交易
  const handleCreateNew = () => {
    setEditingTransaction(null);
    setCopyingTransaction(null);
    setDialogOpen(true);
  };

  // 處理編輯交易
  const handleEdit = (transactionGroup: TransactionGroupWithEntries) => {
    setEditingTransaction(transactionGroup);
    setDialogOpen(true);
  };

  // 處理檢視交易
  const handleView = (transactionGroup: TransactionGroupWithEntries) => {
    setViewingTransaction(transactionGroup);
    setDetailDialogOpen(true);
  };

  // 處理刪除交易
  const handleDelete = async (id: string) => {
    if (window.confirm('確定要刪除這筆交易嗎？此操作無法復原。')) {
      try {
        await dispatch(deleteTransactionGroupWithEntries(id) as any);
        showSnackbar('交易已成功刪除', 'success');
      } catch (error) {
        console.error('刪除交易失敗:', error);
        showSnackbar('刪除交易失敗', 'error');
      }
    }
  };

  // 處理複製交易
  const handleCopy = (transactionGroup: TransactionGroupWithEntries) => {
    setCopyingTransaction(transactionGroup);
    setEditingTransaction(null);
    setDialogOpen(true);
  };

  // 處理確認交易
  const handleConfirm = async (id: string) => {
    if (window.confirm('確定要確認這筆交易嗎？確認後將無法直接編輯。')) {
      try {
        await dispatch(confirmTransactionGroupWithEntries(id) as any);
        showSnackbar('交易已成功確認', 'success');
        // 重新載入資料以更新狀態
        setTimeout(() => {
          dispatch(fetchTransactionGroupsWithEntries() as any);
        }, 100);
      } catch (error) {
        console.error('確認交易失敗:', error);
        showSnackbar('確認交易失敗', 'error');
      }
    }
  };

  // 處理解鎖交易
  const handleUnlock = async (id: string) => {
    if (window.confirm('確定要解鎖這筆交易嗎？解鎖後交易將回到草稿狀態。')) {
      try {
        await dispatch(unlockTransactionGroupWithEntries(id) as any);
        showSnackbar('交易已成功解鎖', 'success');
        // 重新載入資料以更新狀態
        setTimeout(() => {
          dispatch(fetchTransactionGroupsWithEntries() as any);
        }, 100);
      } catch (error) {
        console.error('解鎖交易失敗:', error);
        showSnackbar('解鎖交易失敗', 'error');
      }
    }
  };

  // 處理表單提交
  const handleFormSubmit = async (formData: TransactionGroupWithEntriesFormData) => {
    try {
      console.log('🔍 handleFormSubmit 開始:', { editingTransaction, copyingTransaction, isCopyMode, returnTo, formData });
      
      // 轉換表單資料為 Redux action 期望的格式
      const convertFormDataToApiData = (data: TransactionGroupWithEntriesFormData): Omit<TransactionGroupWithEntries, '_id' | 'createdAt' | 'updatedAt'> => {
        return {
          description: data.description,
          transactionDate: data.transactionDate,
          organizationId: data.organizationId,
          receiptUrl: data.receiptUrl || '',
          invoiceNo: data.invoiceNo || '',
          entries: data.entries || [],
          linkedTransactionIds: data.linkedTransactionIds || [],
          sourceTransactionId: data.sourceTransactionId,
          fundingType: data.fundingType || 'original',
          status: 'draft' // 預設狀態
        } as Omit<TransactionGroupWithEntries, '_id' | 'createdAt' | 'updatedAt'>;
      };

      const apiData = convertFormDataToApiData(formData);
      
      if (editingTransaction) {
        // 對於更新操作，使用 Partial 類型
        const updateData: Partial<TransactionGroupWithEntries> = {
          description: apiData.description,
          transactionDate: apiData.transactionDate,
          organizationId: apiData.organizationId,
          receiptUrl: apiData.receiptUrl,
          invoiceNo: apiData.invoiceNo,
          entries: apiData.entries,
          linkedTransactionIds: apiData.linkedTransactionIds,
          sourceTransactionId: apiData.sourceTransactionId,
          fundingType: apiData.fundingType
        };
        
        await dispatch(updateTransactionGroupWithEntries(editingTransaction._id, updateData) as any);
        showSnackbar('交易已成功更新', 'success');
        
        setDialogOpen(false);
        setEditingTransaction(null);
        setCopyingTransaction(null);
        
        setTimeout(() => {
          dispatch(fetchTransactionGroupsWithEntries() as any);
        }, 100);
        
        if (returnTo && editingTransaction) {
          console.log('🔄 編輯成功，準備返回原頁面:', decodeURIComponent(returnTo));
          setTimeout(() => {
            navigate(decodeURIComponent(returnTo));
          }, 1000);
        }
      } else {
        await dispatch(createTransactionGroupWithEntries(apiData) as any);
        showSnackbar(copyingTransaction ? '交易已成功複製' : '交易已成功建立', 'success');
        
        setDialogOpen(false);
        setEditingTransaction(null);
        setCopyingTransaction(null);
        
        setTimeout(() => {
          dispatch(fetchTransactionGroupsWithEntries() as any);
        }, 100);
        
        if (returnTo && (copyingTransaction || defaultAccountId)) {
          const actionType = copyingTransaction ? '複製' : '新增';
          console.log(`🔄 ${actionType}成功，準備返回原頁面:`, decodeURIComponent(returnTo));
          setTimeout(() => {
            navigate(decodeURIComponent(returnTo));
          }, 1000);
        }
      }
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
    
    if (isCopyMode && transactionId && returnTo) {
      navigate('/accounting3');
    }
  };

  // 關閉詳情對話框
  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setViewingTransaction(null);
  };

  // 安全的日期轉換函數
  const safeDateConvert = (dateValue: any): Date => {
    if (!dateValue) return new Date();
    
    try {
      if (typeof dateValue === 'object' && dateValue.$date) {
        const converted = new Date(dateValue.$date);
        return !isNaN(converted.getTime()) ? converted : new Date();
      }
      
      const converted = new Date(dateValue);
      return !isNaN(converted.getTime()) ? converted : new Date();
    } catch (error) {
      console.error('❌ 日期轉換失敗:', error);
      return new Date();
    }
  };

  // 如果是新增模式，直接顯示新增表單
  if (isNewMode) {
    return (
      <Container maxWidth="xl" sx={{ py: 1 }}>
        {/* 頁面標題 */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <AccountBalanceIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4" component="h1" fontWeight="bold">
              新增交易
            </Typography>
          </Box>
          
          {/* 返回按鈕 */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/accounting3')}
              sx={{ mb: 2 }}
            >
              返回列表
            </Button>
          </Box>
        </Box>

        {/* 錯誤提示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* 新增交易表單 */}
        <Paper sx={{ width: '100%', p: 3 }}>
          <TransactionGroupFormWithEntries
            mode="create"
            defaultAccountId={defaultAccountId || undefined}
            defaultOrganizationId={defaultOrganizationId || undefined}
            onSubmit={async (formData) => {
              await handleFormSubmit(formData);
              navigate('/accounting3');
            }}
            onCancel={() => navigate('/accounting3')}
          />
        </Paper>

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
  }

  return (
    <Container maxWidth="xl" sx={{ py: 1 }}>
      {/* 頁面標題 */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <AccountBalanceIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            內嵌分錄記帳系統
          </Typography>
        </Box>
        
        {/* 功能按鈕 */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/accounting3/new')}
            sx={{ mb: 2 }}
          >
            新增交易
          </Button>
        </Box>
      </Box>

      {/* 錯誤提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 主要內容區域 - 只顯示交易列表 */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            交易列表
          </Typography>
          <AccountingDataGridWithEntries
            onCreateNew={() => navigate('/accounting3/new')}
            onEdit={handleEdit}
            onView={handleView}
            onDelete={handleDelete}
            onCopy={handleCopy}
            onConfirm={handleConfirm}
            onUnlock={handleUnlock}
          />
        </Box>
      </Paper>

      {/* 新增/編輯交易對話框 */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {editingTransaction ? '編輯交易群組' : copyingTransaction ? '複製交易群組' : '建立交易群組'}
        </DialogTitle>
        <DialogContent>
          <TransactionGroupFormWithEntries
            mode={editingTransaction ? 'edit' : 'create'}
            defaultAccountId={defaultAccountId || undefined}
            defaultOrganizationId={defaultOrganizationId || undefined}
            isCopyMode={!!copyingTransaction}
            transactionId={editingTransaction?._id}
            currentStatus={editingTransaction?.status}
            onStatusChange={(newStatus) => {
              console.log('🔄 狀態變更:', { transactionId: editingTransaction?._id, newStatus });
              if (editingTransaction) {
                setEditingTransaction({
                  ...editingTransaction,
                  status: newStatus
                });
              }
            }}
            initialData={(() => {
              const convertEntries = (entries: EmbeddedAccountingEntry[]): EmbeddedAccountingEntryFormData[] => {
                return Array.isArray(entries) ? entries.map(entry => ({
                  _id: entry._id,
                  sequence: entry.sequence || 1,
                  accountId: typeof entry.accountId === 'string' ? entry.accountId : entry.accountId?._id || '',
                  debitAmount: entry.debitAmount || 0,
                  creditAmount: entry.creditAmount || 0,
                  description: entry.description || '',
                  sourceTransactionId: entry.sourceTransactionId,
                  fundingPath: entry.fundingPath
                })) : [];
              };

              return editingTransaction ? {
                description: editingTransaction.description,
                transactionDate: safeDateConvert(editingTransaction.transactionDate),
                organizationId: editingTransaction.organizationId,
                receiptUrl: editingTransaction.receiptUrl || '',
                invoiceNo: editingTransaction.invoiceNo || '',
                entries: convertEntries(editingTransaction.entries || []),
                linkedTransactionIds: editingTransaction.linkedTransactionIds,
                sourceTransactionId: editingTransaction.sourceTransactionId,
                fundingType: editingTransaction.fundingType || 'original'
              } : copyingTransaction ? {
                description: '',
                transactionDate: new Date(),
                organizationId: copyingTransaction.organizationId,
                receiptUrl: '',
                invoiceNo: '',
                entries: convertEntries(copyingTransaction.entries || []),
                linkedTransactionIds: undefined,
                sourceTransactionId: undefined,
                fundingType: 'original'
              } : undefined;
            })()}
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

      {/* 檢視交易詳情對話框 */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetailDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          交易詳情
        </DialogTitle>
        <DialogContent>
          {viewingTransaction && (
            <DoubleEntryDetailPageWithEntries
              organizationId={viewingTransaction.organizationId}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailDialog}>
            關閉
          </Button>
          {viewingTransaction && (
            <>
              <Button
                variant="outlined"
                onClick={() => {
                  handleCloseDetailDialog();
                  handleCopy(viewingTransaction);
                }}
              >
                複製
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  handleCloseDetailDialog();
                  handleEdit(viewingTransaction);
                }}
              >
                編輯
              </Button>
            </>
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

export default Accounting3Page;
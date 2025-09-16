import React, { useCallback } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Typography,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  FileCopy as CopyIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon
} from '@mui/icons-material';
import { TransactionGroupWithEntries } from '../../payments/types';
import { formatDateToString } from '../utils/dateUtils';
import DataTable from '@/components/DataTable';

interface TransactionListProps {
  transactions: TransactionGroupWithEntries[];
  loading: boolean;
  pagination: {
    total: number;
    page: number;
    limit: number;
  } | null;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onEdit: (transaction: TransactionGroupWithEntries) => void;
  onView: (transaction: TransactionGroupWithEntries) => void;
  onCopy: (transaction: TransactionGroupWithEntries) => void;
  onDelete: (id: string) => void;
  onConfirm: (id: string) => void;
  onUnlock: (id: string) => void;
}

/**
 * 交易列表組件
 * 顯示交易列表和分頁控制
 * 使用 DataTable 組件實現，與 SalesPage 保持一致的排版
 */
export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  loading,
  pagination,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onView,
  onDelete,
  onConfirm,
  onUnlock
}) => {
  // 使用從 props 傳遞過來的 onEdit 函數
  const handleEditClick = useCallback((transaction: TransactionGroupWithEntries) => {
    onEdit(transaction);
  }, [onEdit]);
  
  // 處理複製按鈕點擊 - 在新分頁中打開複製頁面
  const handleCopyClick = useCallback((transaction: TransactionGroupWithEntries) => {
    // 在新分頁中打開複製頁面
    window.open(`/accounting3/transaction/${transaction._id}/copy`, '_blank');
  }, []);

  // 獲取交易狀態標籤顏色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'confirmed': return 'primary';
      case 'pending': return 'warning';
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // 獲取交易狀態中文名稱
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return '草稿';
      case 'confirmed': return '已確認';
      case 'pending': return '處理中';
      case 'completed': return '已完成';
      case 'failed': return '失敗';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  // 計算交易金額
  const calculateAmount = (transaction: TransactionGroupWithEntries) => {
    if (!transaction.entries || transaction.entries.length === 0) return 0;
    
    // 找到第一個借方金額大於 0 的分錄
    const debitEntry = transaction.entries.find(entry => entry.debitAmount > 0);
    if (debitEntry) return debitEntry.debitAmount;
    
    // 如果沒有借方金額，則返回第一個貸方金額
    const creditEntry = transaction.entries.find(entry => entry.creditAmount > 0);
    if (creditEntry) return creditEntry.creditAmount;
    
    return 0;
  };

  // 獲取組織名稱
  const getOrganizationName = (organizationId: any) => {
    if (!organizationId) return '';
    if (typeof organizationId === 'string') return organizationId;
    return (organizationId as any)?.name || '';
  };

  // 定義表格列
  const columns = [
    {
      field: 'transactionDate',
      headerName: '日期',
      flex: 1.3,
      valueFormatter: (params: any) => {
        if (!params.value) return '';
        try {
          return formatDateToString(new Date(params.value), 'yyyy/MM/dd');
        } catch (error) {
          console.error('日期格式錯誤', error);
          return params.value;
        }
      }
    },
    {
      field: 'description',
      headerName: '描述',
      flex: 2,
      renderCell: (params: any) => (
        <Typography
          variant="body2"
          sx={{
            maxWidth: 250,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {params.value}
        </Typography>
      )
    },
    {
      field: 'amount',
      headerName: '金額',
      flex: 1,
      valueFormatter: (params: any) => params.value.toFixed(2),
    },
    {
      field: 'organization',
      headerName: '組織',
      flex: 1.5,
    },
    {
      field: 'status',
      headerName: '狀態',
      flex: 1,
      renderCell: (params: any) => (
        <Chip
          label={getStatusLabel(params.value)}
          color={getStatusColor(params.value) as any}
          size="small"
        />
      )
    },
    {
      field: 'actions',
      headerName: '操作',
      flex: 2,
      renderCell: (params: any) => {
        const transaction = params.row.originalTransaction;
        return (
          <Box display="flex" justifyContent="center">
            <Tooltip title="查看詳情">
              <IconButton
                size="small"
                onClick={() => onView(transaction)}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="複製">
              <IconButton
                size="small"
                onClick={() => handleCopyClick(transaction)}
              >
                <CopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {transaction.status === 'draft' && (
              <>
                <Tooltip title="編輯">
                  <IconButton
                    size="small"
                    onClick={() => handleEditClick(transaction)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="確認">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => onConfirm(transaction._id)}
                  >
                    <LockIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="刪除">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDelete(transaction._id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}

            {transaction.status === 'confirmed' && (
              <Tooltip title="解鎖">
                <IconButton
                  size="small"
                  color="warning"
                  onClick={() => onUnlock(transaction._id)}
                >
                  <LockOpenIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      }
    }
  ];

  // 準備 DataTable 的行數據
  const rows = transactions.map((transaction) => {
    return {
      id: transaction._id,
      transactionDate: transaction.transactionDate,
      description: transaction.description,
      amount: calculateAmount(transaction),
      organization: getOrganizationName(transaction.organizationId),
      status: transaction.status,
      originalTransaction: transaction // 保存原始交易對象，以便在操作中使用
    };
  });

  // 如果沒有數據且正在加載，顯示加載指示器
  if (loading && transactions.length === 0) {
    return (
      <Paper sx={{ width: '100%', mb: 2, p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={24} />
        <Typography variant="body2" sx={{ ml: 2 }}>
          載入中...
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ width: '100%', mb: 2 }}>
      <DataTable
        rows={rows}
        columns={columns}
        loading={loading}
        pageSize={pagination?.limit || 10}
        rowsPerPageOptions={[10, 25, 50, 100]}
        checkboxSelection={false}
        disablePagination={!pagination}
        paginationMode="server"
        page={pagination ? pagination.page - 1 : 0}
        rowCount={pagination?.total || 0}
        onPageChange={onPageChange}
        onPageSizeChange={onRowsPerPageChange}
        sx={{
          width: '100%',
          height: '100%',
          p: 0,
          m: 0,
          '& .MuiDataGrid-root': {
            border: 'none',
            backgroundColor: 'transparent'
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: 'none'
          }
        }}
      />
    </Paper>
  );
};

export default TransactionList;
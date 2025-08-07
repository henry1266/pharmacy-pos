import React from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
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
import { TransactionGroupWithEntries } from '../types';
import { formatDateToString } from '../utils/dateUtils';

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
 */
export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  loading,
  pagination,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onView,
  onCopy,
  onDelete,
  onConfirm,
  onUnlock
}) => {
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

  return (
    <Paper sx={{ width: '100%', mb: 2 }}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>日期</TableCell>
              <TableCell>描述</TableCell>
              <TableCell>金額</TableCell>
              <TableCell>組織</TableCell>
              <TableCell>狀態</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    載入中...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2">
                    沒有找到交易記錄
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TableRow key={transaction._id} hover>
                  <TableCell>
                    {formatDateToString(new Date(transaction.transactionDate), 'yyyy/MM/dd')}
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 250,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {transaction.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {calculateAmount(transaction).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {getOrganizationName(transaction.organizationId)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(transaction.status)}
                      color={getStatusColor(transaction.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
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
                          onClick={() => onCopy(transaction)}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {transaction.status === 'draft' && (
                        <>
                          <Tooltip title="編輯">
                            <IconButton
                              size="small"
                              onClick={() => onEdit(transaction)}
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination && (
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={pagination.total}
          rowsPerPage={pagination.limit}
          page={pagination.page - 1}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          labelRowsPerPage="每頁行數:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
        />
      )}
    </Paper>
  );
};

export default TransactionList;
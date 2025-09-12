import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  Box,
  Grid,
  Paper,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  FileCopy as CopyIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon
} from '@mui/icons-material';
import { TransactionGroupWithEntries } from '../types';
import { formatDateToString } from '../../../transactions/utils/dateUtils';

interface TransactionDetailProps {
  open: boolean;
  onClose: () => void;
  transaction: TransactionGroupWithEntries | null;
  onEdit: (transaction: TransactionGroupWithEntries) => void;
  onCopy: (transaction: TransactionGroupWithEntries) => void;
  onDelete: (id: string) => void;
  onConfirm: (id: string) => void;
  onUnlock: (id: string) => void;
}

/**
 * 交易詳情對話框組件
 * 顯示交易的詳細信息和分錄
 */
export const TransactionDetail: React.FC<TransactionDetailProps> = ({
  open,
  onClose,
  transaction,
  onDelete,
  onConfirm,
  onUnlock
}) => {
  const navigate = useNavigate();
  
  if (!transaction) return null;
  
  // 處理編輯按鈕點擊 - 在新分頁中打開編輯頁面
  const handleEditClick = useCallback((transaction: TransactionGroupWithEntries) => {
    // 關閉詳情對話框
    onClose();
    
    // 在新分頁中打開編輯頁面
    window.open(`/accounting3/transaction/${transaction._id}/edit`, '_blank');
  }, [onClose]);
  
  // 處理複製按鈕點擊 - 在新分頁中打開複製頁面
  const handleCopyClick = useCallback((transaction: TransactionGroupWithEntries) => {
    // 關閉詳情對話框
    onClose();
    
    // 在新分頁中打開複製頁面
    window.open(`/accounting3/transaction/${transaction._id}/copy`, '_blank');
  }, [onClose]);

  // 計算借貸總額
  const totalDebit = transaction.entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
  const totalCredit = transaction.entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

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

  // 獲取科目名稱
  const getAccountName = (accountId: any) => {
    if (typeof accountId === 'string') {
      return accountId;
    }
    return accountId?.name || '未知科目';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '70vh',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            交易詳情
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* 基本信息 */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1" fontWeight="bold">
                  基本信息
                </Typography>
                <Chip
                  label={getStatusLabel(transaction.status)}
                  color={getStatusColor(transaction.status) as any}
                  size="small"
                />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">
                    交易描述
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {transaction.description || '無描述'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    交易日期
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDateToString(new Date(transaction.transactionDate), 'yyyy/MM/dd')}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    組織
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {transaction.organizationId ? (
                      typeof transaction.organizationId === 'string'
                        ? transaction.organizationId
                        : (transaction.organizationId as any)?.name || '未知組織'
                    ) : '無'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">
                    收據 URL
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {transaction.receiptUrl ? (
                      <a href={transaction.receiptUrl} target="_blank" rel="noopener noreferrer">
                        {transaction.receiptUrl}
                      </a>
                    ) : '無'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">
                    發票號碼
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {transaction.invoiceNo || '無'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">
                    創建時間
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDateToString(new Date(transaction.createdAt), 'yyyy/MM/dd HH:mm:ss')}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">
                    更新時間
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDateToString(new Date(transaction.updatedAt), 'yyyy/MM/dd HH:mm:ss')}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* 分錄 */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                分錄
              </Typography>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>序號</TableCell>
                      <TableCell>科目</TableCell>
                      <TableCell align="right">借方</TableCell>
                      <TableCell align="right">貸方</TableCell>
                      <TableCell>描述</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transaction.entries.map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell>{entry.sequence}</TableCell>
                        <TableCell>{getAccountName(entry.accountId)}</TableCell>
                        <TableCell align="right">
                          {entry.debitAmount ? entry.debitAmount.toFixed(2) : '0.00'}
                        </TableCell>
                        <TableCell align="right">
                          {entry.creditAmount ? entry.creditAmount.toFixed(2) : '0.00'}
                        </TableCell>
                        <TableCell>{entry.description || ''}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={2} align="right">
                        <Typography variant="subtitle2">合計:</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2">{totalDebit.toFixed(2)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2">{totalCredit.toFixed(2)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={isBalanced ? '平衡' : '不平衡'}
                          color={isBalanced ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* 關聯交易 */}
          {transaction.linkedTransactionIds && transaction.linkedTransactionIds.length > 0 && (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  關聯交易
                </Typography>

                <Box display="flex" flexWrap="wrap" gap={1}>
                  {transaction.linkedTransactionIds.map((id, index) => (
                    <Chip key={index} label={id} size="small" />
                  ))}
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Box display="flex" justifyContent="space-between" width="100%" px={2}>
          <Box>
            {transaction.status === 'draft' && (
              <Button
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => onDelete(transaction._id)}
              >
                刪除
              </Button>
            )}
          </Box>

          <Box display="flex" gap={1}>
            <Button
              color="inherit"
              startIcon={<CopyIcon />}
              onClick={() => handleCopyClick(transaction)}
            >
              複製
            </Button>

            {transaction.status === 'draft' && (
              <>
                <Button
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={() => handleEditClick(transaction)}
                >
                  編輯
                </Button>
                <Button
                  color="primary"
                  variant="contained"
                  startIcon={<LockIcon />}
                  onClick={() => onConfirm(transaction._id)}
                >
                  確認
                </Button>
              </>
            )}

            {transaction.status === 'confirmed' && (
              <Button
                color="warning"
                startIcon={<LockOpenIcon />}
                onClick={() => onUnlock(transaction._id)}
              >
                解鎖
              </Button>
            )}

            <Button onClick={onClose} color="inherit">
              關閉
            </Button>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionDetail;
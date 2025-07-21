import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import { TransactionGroupWithEntries, EmbeddedAccountingEntry } from '@pharmacy-pos/shared/types/accounting2';

// 臨時型別擴展，確保 referencedByInfo 和 fundingSourceUsages 屬性可用
interface ExtendedTransactionGroupWithEntries extends TransactionGroupWithEntries {
  referencedByInfo?: Array<{
    _id: string;
    groupNumber: string;
    description: string;
    transactionDate: Date | string;
    totalAmount: number;
    status: 'draft' | 'confirmed' | 'cancelled';
  }>;
  fundingSourceUsages?: Array<{
    sourceTransactionId: string;
    usedAmount: number;
    sourceTransactionDescription?: string;
    sourceTransactionGroupNumber?: string;
    sourceTransactionDate?: Date | string;
    sourceTransactionAmount?: number;
  }>;
}

interface TransactionDetailDialogProps {
  open: boolean;
  transaction: ExtendedTransactionGroupWithEntries | null;
  onClose: () => void;
}

/**
 * 交易詳情對話框組件
 * 顯示交易的詳細資訊，包括分錄明細
 */
export const TransactionDetailDialog: React.FC<TransactionDetailDialogProps> = ({
  open,
  transaction,
  onClose
}) => {
  // 格式化日期
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('zh-TW');
  };

  // 格式化貨幣
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD'
    }).format(amount);
  };

  // 計算交易群組總金額
  const calculateTotalAmount = (entries: EmbeddedAccountingEntry[]) => {
    return entries.reduce((total, entry) => total + (entry.debitAmount || 0), 0);
  };

  // 取得狀態顏色
  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'draft': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // 取得狀態標籤
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return '已確認';
      case 'draft': return '草稿';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InfoIcon color="primary" />
          交易詳情
        </Box>
      </DialogTitle>
      <DialogContent>
        {transaction && (
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">交易編號</Typography>
                <Typography variant="body1" fontFamily="monospace" fontWeight="bold">
                  {(transaction as any).groupNumber || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">交易日期</Typography>
                <Typography variant="body1">
                  {formatDate(transaction.transactionDate)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">交易描述</Typography>
                <Typography variant="body1">
                  {transaction.description}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">狀態</Typography>
                <Chip
                  label={getStatusLabel(transaction.status)}
                  color={getStatusColor(transaction.status)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">總金額</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {formatCurrency(calculateTotalAmount(transaction.entries || []))}
                </Typography>
              </Grid>
              {transaction.entries && transaction.entries.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    分錄明細
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>科目</TableCell>
                          <TableCell align="right">借方</TableCell>
                          <TableCell align="right">貸方</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {transaction.entries.map((entry, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {(entry as any).accountName || '未知科目'}
                            </TableCell>
                            <TableCell align="right">
                              {entry.debitAmount ? formatCurrency(entry.debitAmount) : '-'}
                            </TableCell>
                            <TableCell align="right">
                              {entry.creditAmount ? formatCurrency(entry.creditAmount) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          關閉
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionDetailDialog;
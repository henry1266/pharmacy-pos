import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Box
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  ContentCopy as ContentCopyIcon,
  CheckCircle as ConfirmIcon,
  LockOpen as UnlockIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { Account2, TransactionGroupWithEntries, EmbeddedAccountingEntry } from '@pharmacy-pos/shared/types/accounting2';
import { TransactionFlowDisplay } from './TransactionFlowDisplay';
import { FundingStatusDisplay } from './FundingStatusDisplay';

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
  accountAmount?: number;
  runningBalance?: number;
  displayOrder?: number;
}

interface TransactionTableProps {
  transactions: ExtendedTransactionGroupWithEntries[];
  selectedAccount: Account2;
  onRowClick: (event: React.MouseEvent<HTMLElement>, transaction: ExtendedTransactionGroupWithEntries) => void;
  onTransactionView?: (transaction: ExtendedTransactionGroupWithEntries) => void;
  onTransactionEdit?: (transaction: ExtendedTransactionGroupWithEntries) => void;
  onTransactionCopy?: (transaction: ExtendedTransactionGroupWithEntries) => void;
  onTransactionConfirm?: (id: string) => void;
  onTransactionUnlock?: (id: string) => void;
  onTransactionDelete?: (id: string) => void;
}

/**
 * 交易表格組件
 * 顯示交易列表和相關操作
 */
export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  selectedAccount,
  onRowClick,
  onTransactionView,
  onTransactionEdit,
  onTransactionCopy,
  onTransactionConfirm,
  onTransactionUnlock,
  onTransactionDelete
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

  // 檢查借貸平衡
  const isBalanced = (entries: EmbeddedAccountingEntry[]) => {
    const totalDebit = entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
    const totalCredit = entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
    return Math.abs(totalDebit - totalCredit) < 0.01; // 允許小數點誤差
  };

  // 處理複製交易的預設行為
  const handleDefaultCopy = async (transaction: ExtendedTransactionGroupWithEntries) => {
    try {
      // 計算交易群組總金額
      const calculateTotalAmount = (entries: any[]) => {
        return entries.reduce((total, entry) => total + (entry.debitAmount || 0), 0);
      };

      // 複製交易資料到剪貼簿
      const transactionData = {
        編號: (transaction as any).groupNumber || 'N/A',
        描述: transaction.description,
        日期: formatDate(transaction.transactionDate),
        狀態: getStatusLabel(transaction.status),
        金額: formatCurrency(calculateTotalAmount(transaction.entries || []))
      };
      
      const textToCopy = Object.entries(transactionData)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      
      await navigator.clipboard.writeText(textToCopy);
      console.log('交易資料已複製到剪貼簿');
    } catch (err) {
      console.error('複製失敗:', err);
    }
  };

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>交易日期</TableCell>
            <TableCell>交易描述</TableCell>
            <TableCell align="center">交易流向</TableCell>
            <TableCell align="right">本科目金額</TableCell>
            <TableCell align="right">累計餘額</TableCell>
            <TableCell align="center">狀態</TableCell>
            <TableCell align="center">資金狀態</TableCell>
            <TableCell align="center">操作</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow
              key={transaction._id}
              hover
              onClick={(event) => onRowClick(event, transaction)}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <TableCell>
                {formatDate(transaction.transactionDate)}
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight="medium">
                  {transaction.description}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                  #{(transaction as any).groupNumber || 'N/A'}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <TransactionFlowDisplay transaction={transaction} />
              </TableCell>
              <TableCell align="right">
                <Typography
                  variant="body2"
                  fontWeight="medium"
                  color={transaction.accountAmount! >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(transaction.accountAmount!)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  color={transaction.runningBalance! >= 0 ? 'success.main' : 'error.main'}
                  sx={{
                    backgroundColor: transaction.runningBalance! >= 0 ? 'success.50' : 'error.50',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1
                  }}
                >
                  {formatCurrency(transaction.runningBalance!)}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Chip
                  label={getStatusLabel(transaction.status)}
                  color={getStatusColor(transaction.status)}
                  size="small"
                />
              </TableCell>
              <TableCell align="center">
                <FundingStatusDisplay transaction={transaction} />
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Tooltip title="檢視">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onTransactionView) onTransactionView(transaction);
                      }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  
                  {/* 編輯按鈕 - 只有草稿狀態可以編輯 */}
                  {transaction.status === 'draft' && onTransactionEdit && (
                    <Tooltip title="編輯">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTransactionEdit(transaction);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  <Tooltip title="複製">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onTransactionCopy) {
                          onTransactionCopy(transaction);
                        } else {
                          handleDefaultCopy(transaction);
                        }
                      }}
                    >
                      <ContentCopyIcon />
                    </IconButton>
                  </Tooltip>
                  
                  {/* 確認按鈕 - 只有草稿狀態且已平衡可以確認 */}
                  {transaction.status === 'draft' && transaction.entries &&
                   isBalanced(transaction.entries) && onTransactionConfirm && (
                    <Tooltip title="確認交易">
                      <IconButton
                        size="small"
                        color="success"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTransactionConfirm(transaction._id);
                        }}
                      >
                        <ConfirmIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  {/* 解鎖按鈕 - 只有已確認狀態可以解鎖 */}
                  {transaction.status === 'confirmed' && onTransactionUnlock && (
                    <Tooltip title="解鎖交易">
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTransactionUnlock(transaction._id);
                        }}
                      >
                        <UnlockIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  {/* 刪除按鈕 - 只有草稿狀態可以刪除 */}
                  {transaction.status === 'draft' && onTransactionDelete && (
                    <Tooltip title="刪除">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTransactionDelete(transaction._id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TransactionTable;
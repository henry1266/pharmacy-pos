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
import { Account2 } from '@pharmacy-pos/shared/types/accounting2';
import { ExtendedTransactionGroupWithEntries } from './types';
import {
  formatDate,
  formatCurrency,
  getStatusColor,
  getStatusLabel,
  isBalanced,
  copyTransactionToClipboard
} from './utils';
import { ACTION_TOOLTIPS, TRANSACTION_STATUS, TABLE_HEADERS } from './constants';
import { AccountTransactionListFlowDisplay } from './AccountTransactionListFlowDisplay';
import { AccountTransactionListFundingStatusDisplay } from './AccountTransactionListFundingStatusDisplay';

interface AccountTransactionListTableProps {
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
export const AccountTransactionListTable: React.FC<AccountTransactionListTableProps> = ({
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
  // 處理複製交易的預設行為
  const handleDefaultCopy = async (transaction: ExtendedTransactionGroupWithEntries) => {
    try {
      await copyTransactionToClipboard(transaction);
    } catch (err) {
      console.error('複製失敗:', err);
    }
  };

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{TABLE_HEADERS.TRANSACTION_DATE}</TableCell>
            <TableCell>{TABLE_HEADERS.DESCRIPTION}</TableCell>
            <TableCell align="center">{TABLE_HEADERS.FLOW}</TableCell>
            <TableCell align="right">{TABLE_HEADERS.ACCOUNT_AMOUNT}</TableCell>
            <TableCell align="right">{TABLE_HEADERS.RUNNING_BALANCE}</TableCell>
            <TableCell align="center">{TABLE_HEADERS.STATUS}</TableCell>
            <TableCell align="center">{TABLE_HEADERS.FUNDING_STATUS}</TableCell>
            <TableCell align="center">{TABLE_HEADERS.ACTIONS}</TableCell>
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
                <AccountTransactionListFlowDisplay transaction={transaction} />
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
                <AccountTransactionListFundingStatusDisplay transaction={transaction} />
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Tooltip title={ACTION_TOOLTIPS.VIEW}>
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
                  {transaction.status === TRANSACTION_STATUS.DRAFT && onTransactionEdit && (
                    <Tooltip title={ACTION_TOOLTIPS.EDIT}>
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
                  
                  <Tooltip title={ACTION_TOOLTIPS.COPY}>
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
                  {transaction.status === TRANSACTION_STATUS.DRAFT && transaction.entries &&
                   isBalanced(transaction.entries) && onTransactionConfirm && (
                    <Tooltip title={ACTION_TOOLTIPS.CONFIRM}>
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
                  {transaction.status === TRANSACTION_STATUS.CONFIRMED && onTransactionUnlock && (
                    <Tooltip title={ACTION_TOOLTIPS.UNLOCK}>
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
                  {transaction.status === TRANSACTION_STATUS.DRAFT && onTransactionDelete && (
                    <Tooltip title={ACTION_TOOLTIPS.DELETE}>
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

export default AccountTransactionListTable;
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
  isBalanced,
  copyTransactionToClipboard
} from './utils';
import { ACTION_TOOLTIPS, TRANSACTION_STATUS, TABLE_HEADERS } from './constants';
import { AccountTransactionListFlowDisplay } from './AccountTransactionListFlowDisplay';
import { AccountTransactionListFundingStatusDisplay } from './AccountTransactionListFundingStatusDisplay';

interface AccountTransactionListTableProps {
  transactions: ExtendedTransactionGroupWithEntries[];
  selectedAccount: Account2;
  onTransactionView?: ((transaction: ExtendedTransactionGroupWithEntries) => void) | undefined;
  onTransactionEdit?: ((transaction: ExtendedTransactionGroupWithEntries) => void) | undefined;
  onTransactionCopy?: ((transaction: ExtendedTransactionGroupWithEntries) => void) | undefined;
  onTransactionConfirm?: ((id: string) => void) | undefined;
  onTransactionUnlock?: ((id: string) => void) | undefined;
  onTransactionDelete?: ((id: string) => void) | undefined;
}

/**
 * 交易表格組件
 * 顯示交易列表和相關操作
 */
/**
 * 交易表格組件 - 觸控平板優化版本
 * 顯示交易列表和相關操作，針對觸控平板進行了優化
 */
export const AccountTransactionListTable: React.FC<AccountTransactionListTableProps> = ({
  transactions,
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

  // 共用的按鈕樣式 - 觸控優化（小螢幕和平板更緊湊）
  const actionButtonStyle = {
    width: { xs: 28, sm: 32, md: 40 },
    height: { xs: 28, sm: 32, md: 40 },
    m: { xs: 0.1, sm: 0.25, md: 0.5 },
    transition: 'all 0.2s',
    '& .MuiSvgIcon-root': {
      fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.5rem' }
    },
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: 2
    },
    '&:active': {
      transform: 'translateY(0)',
      boxShadow: 0
    }
  };

  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{
        boxShadow: 2,
        borderRadius: 2,
        overflow: 'hidden',
        width: '100%',
        maxWidth: '100%'
      }}
    >
      <Table
        sx={{
          width: '100%',
          tableLayout: 'fixed',
          '& .MuiTableCell-root': {
            px: { xs: 0.5, sm: 1, md: 2 },
            py: { xs: 1, sm: 1.5, md: 2 },
            fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }
        }}
      >
        <TableHead>
          <TableRow
            sx={{
              backgroundColor: 'action.hover',
              '& .MuiTableCell-head': {
                fontWeight: 'bold',
                whiteSpace: 'nowrap'
              }
            }}
          >
            <TableCell width="9%">{TABLE_HEADERS.TRANSACTION_DATE}</TableCell>
            <TableCell width="16%">{TABLE_HEADERS.DESCRIPTION}</TableCell>
            <TableCell width="18%" align="center">{TABLE_HEADERS.FLOW}</TableCell>
            <TableCell width="12%" align="right">{TABLE_HEADERS.ACCOUNT_AMOUNT}</TableCell>
            <TableCell width="12%" align="right">{TABLE_HEADERS.RUNNING_BALANCE}</TableCell>
            <TableCell width="7%" align="center">{TABLE_HEADERS.STATUS}</TableCell>
            <TableCell width="7%" align="center">{TABLE_HEADERS.FUNDING_STATUS}</TableCell>
            <TableCell width="18%" align="center">{TABLE_HEADERS.ACTIONS}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow
              key={transaction._id}
              sx={{
                height: { xs: 72, sm: 80 },
                '&:hover': {
                  backgroundColor: 'action.hover'
                },
                transition: 'background-color 0.2s'
              }}
            >
              <TableCell>
                <Typography variant="body1" fontWeight="medium">
                  {formatDate(transaction.transactionDate)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body1" fontWeight="medium">
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
                  variant="body1"
                  fontWeight="medium"
                  color={transaction.accountAmount! >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(transaction.accountAmount!)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography
                  variant="body1"
                  fontWeight="bold"
                  color={transaction.runningBalance! >= 0 ? 'success.main' : 'error.main'}
                  sx={{
                    backgroundColor: transaction.runningBalance! >= 0 ? 'success.50' : 'error.50',
                    px: { xs: 1, sm: 1.5 },
                    py: { xs: 0.75, sm: 1 },
                    borderRadius: 1.5,
                    display: 'inline-block'
                  }}
                >
                  {formatCurrency(transaction.runningBalance!)}
                </Typography>
              </TableCell>
              <TableCell align="center">
                {transaction.status === TRANSACTION_STATUS.CONFIRMED ? (
                  <Chip
                    icon={<ConfirmIcon fontSize="small" />}
                    color="success"
                    size="small"
                    sx={{
                      height: { xs: 24, sm: 28 },
                      width: { xs: 24, sm: 28 },
                      '& .MuiChip-label': { display: 'none' }
                    }}
                  />
                ) : (
                  <Chip
                    icon={
                      transaction.status === TRANSACTION_STATUS.DRAFT ?
                      <EditIcon fontSize="small" /> :
                      <DeleteIcon fontSize="small" />
                    }
                    color={getStatusColor(transaction.status)}
                    size="small"
                    sx={{
                      height: { xs: 24, sm: 28 },
                      width: { xs: 24, sm: 28 },
                      '& .MuiChip-label': { display: 'none' }
                    }}
                  />
                )}
              </TableCell>
              <TableCell align="center">
                <AccountTransactionListFundingStatusDisplay transaction={transaction} />
              </TableCell>
              <TableCell align="center">
                {/* 平板和手機版 - 簡化版本，只顯示查看按鈕 */}
                <Box
                  sx={{
                    display: { xs: 'flex', md: 'none' },
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <IconButton
                    size="medium"
                    sx={{
                      width: 36,
                      height: 36,
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.dark'
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onTransactionView) onTransactionView(transaction);
                    }}
                  >
                    <VisibilityIcon />
                  </IconButton>
                </Box>
                
                {/* 桌面版 - 完整版本 */}
                <Box
                  sx={{
                    display: { xs: 'none', md: 'flex' },
                    gap: 0.5,
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    maxWidth: '100%',
                    padding: 0.5,
                    '& > *': { zIndex: 2 }
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                    <IconButton
                      size="medium"
                      sx={actionButtonStyle}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onTransactionView) onTransactionView(transaction);
                      }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                    
                    {/* 編輯按鈕 - 只有草稿狀態可以編輯 */}
                    {transaction.status === TRANSACTION_STATUS.DRAFT && onTransactionEdit && (
                      <IconButton
                        size="medium"
                        sx={actionButtonStyle}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTransactionEdit(transaction);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                    
                    <IconButton
                      size="medium"
                      sx={actionButtonStyle}
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
                    
                    {/* 確認按鈕 - 只有草稿狀態且已平衡可以確認 */}
                    {transaction.status === TRANSACTION_STATUS.DRAFT && transaction.entries &&
                     isBalanced(transaction.entries) && onTransactionConfirm && (
                      <IconButton
                        size="medium"
                        color="success"
                        sx={actionButtonStyle}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTransactionConfirm(transaction._id);
                        }}
                      >
                        <ConfirmIcon />
                      </IconButton>
                    )}
                    
                    {/* 解鎖按鈕 - 只有已確認狀態可以解鎖 */}
                    {transaction.status === TRANSACTION_STATUS.CONFIRMED && onTransactionUnlock && (
                      <IconButton
                        size="medium"
                        color="warning"
                        sx={actionButtonStyle}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTransactionUnlock(transaction._id);
                        }}
                      >
                        <UnlockIcon />
                      </IconButton>
                    )}
                    
                    {/* 刪除按鈕 - 只有草稿狀態可以刪除 */}
                    {transaction.status === TRANSACTION_STATUS.DRAFT && onTransactionDelete && (
                      <IconButton
                        size="medium"
                        color="error"
                        sx={actionButtonStyle}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTransactionDelete(transaction._id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
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
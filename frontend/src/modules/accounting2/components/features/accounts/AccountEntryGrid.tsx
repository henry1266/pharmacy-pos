import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '@utils/formatters';
import { AccountingEntryDetail } from '../../../../../services/doubleEntryService';

// 分錄表格 Props 介面
interface AccountEntryGridProps {
  entries: AccountingEntryDetail[];
  loading?: boolean;
  onEdit?: (entry: AccountingEntryDetail) => void;
  onDelete?: (entryId: string) => void;
  onView?: (entry: AccountingEntryDetail) => void;
}

/**
 * 科目分錄表格組件
 * 
 * 職責：
 * - 顯示科目相關的分錄記錄
 * - 提供分錄操作功能（查看、編輯、刪除）
 * - 格式化分錄資料顯示
 */
export const AccountEntryGrid: React.FC<AccountEntryGridProps> = ({
  entries,
  loading = false,
  onEdit,
  onDelete,
  onView
}) => {
  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          載入分錄資料中...
        </Typography>
      </Paper>
    );
  }

  if (entries.length === 0) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          暫無分錄記錄
        </Typography>
      </Paper>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return '已核准';
      case 'pending':
        return '待審核';
      case 'rejected':
        return '已拒絕';
      default:
        return '未知';
    }
  };

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>日期</TableCell>
            <TableCell>摘要</TableCell>
            <TableCell align="right">借方金額</TableCell>
            <TableCell align="right">貸方金額</TableCell>
            <TableCell align="right">餘額</TableCell>
            <TableCell>狀態</TableCell>
            <TableCell>參考號</TableCell>
            <TableCell align="center">操作</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry._id} hover>
              <TableCell>
                <Typography variant="body2">
                  {formatDate(entry.transactionDate)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ maxWidth: 200 }}>
                  {entry.description}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography 
                  variant="body2" 
                  color={entry.debitAmount > 0 ? 'success.main' : 'text.secondary'}
                  sx={{ fontWeight: entry.debitAmount > 0 ? 'bold' : 'normal' }}
                >
                  {entry.debitAmount > 0 ? formatCurrency(entry.debitAmount) : '-'}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography 
                  variant="body2" 
                  color={entry.creditAmount > 0 ? 'error.main' : 'text.secondary'}
                  sx={{ fontWeight: entry.creditAmount > 0 ? 'bold' : 'normal' }}
                >
                  {entry.creditAmount > 0 ? formatCurrency(entry.creditAmount) : '-'}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography
                  variant="body2"
                  color={(entry.debitAmount - entry.creditAmount) >= 0 ? 'success.main' : 'error.main'}
                  sx={{ fontWeight: 'bold' }}
                >
                  {formatCurrency(entry.debitAmount - entry.creditAmount)}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={getStatusLabel(entry.status)}
                  color={getStatusColor(entry.status) as any}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {entry.invoiceNo || '-'}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {onView && (
                    <Tooltip title="查看詳情">
                      <IconButton 
                        size="small" 
                        onClick={() => onView(entry)}
                        color="info"
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {onEdit && (
                    <Tooltip title="編輯">
                      <IconButton 
                        size="small" 
                        onClick={() => onEdit(entry)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {onDelete && (
                    <Tooltip title="刪除">
                      <IconButton 
                        size="small" 
                        onClick={() => onDelete(entry._id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
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

export default AccountEntryGrid;
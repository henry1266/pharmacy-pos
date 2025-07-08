import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Typography,
  Collapse,
  Button,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useAppSelector } from '@/hooks/redux';

interface TransactionGroup {
  _id: string;
  description: string;
  transactionDate: string;
  organizationId?: string;
  invoiceNo?: string;
  totalAmount: number;
  isBalanced: boolean;
  entries: AccountingEntry[];
  createdAt: string;
  updatedAt: string;
}

interface AccountingEntry {
  _id: string;
  accountId: string;
  accountName: string;
  accountCode: string;
  debitAmount: number;
  creditAmount: number;
  description: string;
  categoryId?: string;
  categoryName?: string;
}

interface AccountingDataGridProps {
  onCreateNew: () => void;
  onEdit: (transactionGroup: TransactionGroup) => void;
  onDelete: (id: string) => void;
  onView: (transactionGroup: TransactionGroup) => void;
}

export const AccountingDataGrid: React.FC<AccountingDataGridProps> = ({
  onCreateNew,
  onEdit,
  onDelete,
  onView
}) => {
  const { transactionGroups = [], loading, error } = useAppSelector(state => state.transactionGroup2);
  
  // 確保每個 transactionGroup 都有 entries 陣列
  const safeTransactionGroups = transactionGroups.map(group => ({
    ...group,
    entries: Array.isArray(group.entries) ? group.entries : []
  }));
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const handleExpandRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        載入交易資料時發生錯誤：{error}
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceIcon color="primary" />
            <Typography variant="h6">複式記帳交易</Typography>
          </Box>
        }
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateNew}
          >
            新增交易
          </Button>
        }
      />
      
      <CardContent>
        {safeTransactionGroups.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <ReceiptIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              尚無交易記錄
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              開始建立您的第一筆複式記帳交易
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onCreateNew}
            >
              建立交易
            </Button>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width="50px"></TableCell>
                  <TableCell>交易描述</TableCell>
                  <TableCell>交易日期</TableCell>
                  <TableCell>發票號碼</TableCell>
                  <TableCell align="right">金額</TableCell>
                  <TableCell align="center">狀態</TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {safeTransactionGroups.map((group) => (
                  <React.Fragment key={group._id}>
                    {/* 主要交易行 */}
                    <TableRow hover>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleExpandRow(group._id)}
                        >
                          {expandedRows.has(group._id) ? (
                            <ExpandLessIcon />
                          ) : (
                            <ExpandMoreIcon />
                          )}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {group.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {formatDate(group.transactionDate)}
                      </TableCell>
                      <TableCell>
                        {group.invoiceNo || '-'}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(group.totalAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={group.isBalanced ? '已平衡' : '未平衡'}
                          color={group.isBalanced ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="檢視">
                            <IconButton
                              size="small"
                              onClick={() => onView(group)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="編輯">
                            <IconButton
                              size="small"
                              onClick={() => onEdit(group)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="刪除">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => onDelete(group._id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>

                    {/* 展開的分錄詳情 */}
                    <TableRow>
                      <TableCell colSpan={7} sx={{ p: 0 }}>
                        <Collapse in={expandedRows.has(group._id)}>
                          <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <Typography variant="subtitle2" gutterBottom>
                              分錄明細
                            </Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>會計科目</TableCell>
                                  <TableCell>摘要</TableCell>
                                  <TableCell align="right">借方</TableCell>
                                  <TableCell align="right">貸方</TableCell>
                                  <TableCell>類別</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {group.entries && group.entries.length > 0 ? group.entries.map((entry) => (
                                  <TableRow key={entry._id}>
                                    <TableCell>
                                      <Typography variant="body2">
                                        {entry.accountCode} - {entry.accountName}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2">
                                        {entry.description}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                      {entry.debitAmount > 0 ? (
                                        <Typography variant="body2" color="success.main">
                                          {formatCurrency(entry.debitAmount)}
                                        </Typography>
                                      ) : (
                                        '-'
                                      )}
                                    </TableCell>
                                    <TableCell align="right">
                                      {entry.creditAmount > 0 ? (
                                        <Typography variant="body2" color="error.main">
                                          {formatCurrency(entry.creditAmount)}
                                        </Typography>
                                      ) : (
                                        '-'
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {entry.categoryName ? (
                                        <Chip
                                          label={entry.categoryName}
                                          size="small"
                                          variant="outlined"
                                        />
                                      ) : (
                                        '-'
                                      )}
                                    </TableCell>
                                  </TableRow>
                                )) : (
                                  <TableRow>
                                    <TableCell colSpan={5} align="center">
                                      <Typography variant="body2" color="text.secondary">
                                        此交易群組尚無分錄資料
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default AccountingDataGrid;
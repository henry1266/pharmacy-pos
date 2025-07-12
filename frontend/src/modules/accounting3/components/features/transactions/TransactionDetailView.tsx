import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Divider,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as CopyIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Description as DescriptionIcon,
  Business as BusinessIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

// 導入類型
import {
  TransactionGroupWithEntries3,
  EmbeddedAccountingEntry3,
  Account3,
  TRANSACTION_STATUS_3,
  FUNDING_TYPES_3
} from '@pharmacy-pos/shared/types/accounting3';

// 導入服務
import { accounting3Service } from '../../../../../services/accounting3Service';

interface TransactionDetailViewProps {
  transactionId: string;
  onEdit?: (transaction: TransactionGroupWithEntries3) => void;
  onDelete?: (transactionId: string) => void;
  onCopy?: (transaction: TransactionGroupWithEntries3) => void;
  showActions?: boolean;
}

/**
 * 交易詳細檢視組件
 * 顯示單一交易的完整資訊，包括基本資訊和所有分錄
 */
export const TransactionDetailView: React.FC<TransactionDetailViewProps> = ({
  transactionId,
  onEdit,
  onDelete,
  onCopy,
  showActions = true
}) => {
  const navigate = useNavigate();
  
  // 狀態管理
  const [transaction, setTransaction] = useState<TransactionGroupWithEntries3 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Record<string, Account3>>({});

  // 載入交易資料
  useEffect(() => {
    loadTransaction();
  }, [transactionId]);

  const loadTransaction = async () => {
    try {
      setLoading(true);
      setError(null);

      // 獲取交易詳細資料
      const response = await accounting3Service.transactions.getById(transactionId);
      
      if (response.success && response.data) {
        setTransaction(response.data);
        
        // 載入相關科目資料
        await loadAccountsData(response.data.entries);
      } else {
        setError('無法載入交易資料');
      }
    } catch (err) {
      console.error('載入交易失敗:', err);
      setError('載入交易時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 載入科目資料
  const loadAccountsData = async (entries: EmbeddedAccountingEntry3[]) => {
    try {
      const accountIds = entries
        .map(entry => typeof entry.accountId === 'string' ? entry.accountId : entry.accountId._id)
        .filter((id, index, arr) => arr.indexOf(id) === index); // 去重

      const accountsData: Record<string, Account3> = {};
      
      // 批量載入科目資料
      await Promise.all(
        accountIds.map(async (accountId) => {
          try {
            const accountResponse = await accounting3Service.accounts.getById(accountId);
            if (accountResponse.success && accountResponse.data) {
              accountsData[accountId] = accountResponse.data;
            }
          } catch (error) {
            console.warn(`載入科目 ${accountId} 失敗:`, error);
          }
        })
      );

      setAccounts(accountsData);
    } catch (error) {
      console.error('載入科目資料失敗:', error);
    }
  };

  // 獲取狀態顯示資訊
  const getStatusInfo = (status: string) => {
    const statusConfig = TRANSACTION_STATUS_3.find(s => s.value === status);
    return {
      label: statusConfig?.label || status,
      color: status === 'confirmed' ? 'success' : status === 'cancelled' ? 'error' : 'warning'
    };
  };

  // 獲取資金類型顯示資訊
  const getFundingTypeInfo = (fundingType: string) => {
    const typeConfig = FUNDING_TYPES_3.find(t => t.value === fundingType);
    return {
      label: typeConfig?.label || fundingType,
      color: typeConfig?.color || '#666'
    };
  };

  // 格式化金額
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // 格式化日期
  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'yyyy年MM月dd日 HH:mm', { locale: zhTW });
  };

  // 處理編輯
  const handleEdit = () => {
    if (transaction && onEdit) {
      onEdit(transaction);
    } else if (transaction) {
      navigate(`/accounting3/transaction/${transaction._id}/edit`);
    }
  };

  // 處理複製
  const handleCopy = () => {
    if (transaction && onCopy) {
      onCopy(transaction);
    } else if (transaction) {
      navigate(`/accounting3/transaction/${transaction._id}/copy`);
    }
  };

  // 處理刪除
  const handleDelete = () => {
    if (transaction && window.confirm('確定要刪除這筆交易嗎？此操作無法復原。')) {
      if (onDelete) {
        onDelete(transaction._id);
      } else {
        // 預設刪除邏輯
        accounting3Service.transactions.delete(transaction._id)
          .then(() => {
            navigate('/accounting3');
          })
          .catch((error) => {
            console.error('刪除交易失敗:', error);
            alert('刪除交易失敗');
          });
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!transaction) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        找不到交易資料
      </Alert>
    );
  }

  const statusInfo = getStatusInfo(transaction.status);
  const fundingTypeInfo = getFundingTypeInfo(transaction.fundingType);

  return (
    <Box sx={{ p: 2 }}>
      {/* 麵包屑導航 */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('/accounting3');
          }}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <ReceiptIcon fontSize="small" />
          交易管理
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <DescriptionIcon fontSize="small" />
          交易詳情
        </Typography>
      </Breadcrumbs>

      {/* 頁面標題和操作按鈕 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            交易詳情
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {transaction.groupNumber}
          </Typography>
        </Box>
        
        {showActions && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/accounting3')}
            >
              返回列表
            </Button>
            <Tooltip title="編輯交易">
              <IconButton color="primary" onClick={handleEdit}>
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="複製交易">
              <IconButton color="secondary" onClick={handleCopy}>
                <CopyIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="刪除交易">
              <IconButton color="error" onClick={handleDelete}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* 基本資訊卡片 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon />
                基本資訊
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <DescriptionIcon fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      交易描述
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="medium">
                    {transaction.description}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CalendarIcon fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      交易日期
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {formatDate(transaction.transactionDate)}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <MoneyIcon fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      交易金額
                    </Typography>
                  </Box>
                  <Typography variant="h6" color="primary">
                    {formatAmount(transaction.totalAmount)}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    交易狀態
                  </Typography>
                  <Chip
                    label={statusInfo.label}
                    color={statusInfo.color as any}
                    size="small"
                  />
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    資金類型
                  </Typography>
                  <Chip
                    label={fundingTypeInfo.label}
                    size="small"
                    sx={{ backgroundColor: fundingTypeInfo.color, color: 'white' }}
                  />
                </Grid>

                {transaction.invoiceNo && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      發票號碼
                    </Typography>
                    <Typography variant="body1">
                      {transaction.invoiceNo}
                    </Typography>
                  </Grid>
                )}

                {transaction.receiptUrl && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      憑證
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ReceiptIcon />}
                      href={transaction.receiptUrl}
                      target="_blank"
                    >
                      查看憑證
                    </Button>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 被引用情況及餘額卡片 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountBalanceIcon />
                被引用情況及餘額
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    交易總額
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {formatAmount(transaction.totalAmount)}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    剩餘可用金額
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {(() => {
                      // 計算剩餘可用金額
                      if (!transaction.referencedByInfo || transaction.referencedByInfo.length === 0) {
                        return formatAmount(transaction.totalAmount);
                      }
                      
                      const usedAmount = transaction.referencedByInfo
                        .filter(ref => ref.status !== 'cancelled')
                        .reduce((sum, ref) => sum + ref.totalAmount, 0);
                      
                      const availableAmount = Math.max(0, transaction.totalAmount - usedAmount);
                      return formatAmount(availableAmount);
                    })()}
                  </Typography>
                </Grid>

                {transaction.referencedByInfo && transaction.referencedByInfo.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      被引用情況
                    </Typography>
                    <Chip
                      label={`被 ${transaction.referencedByInfo.length} 筆交易引用`}
                      color="warning"
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    {(() => {
                      const usedAmount = transaction.referencedByInfo
                        .filter(ref => ref.status !== 'cancelled')
                        .reduce((sum, ref) => sum + ref.totalAmount, 0);
                      
                      if (usedAmount > 0 && usedAmount < transaction.totalAmount) {
                        return (
                          <Chip
                            label="部分已使用"
                            color="info"
                            size="small"
                          />
                        );
                      } else if (usedAmount >= transaction.totalAmount) {
                        return (
                          <Chip
                            label="已全部使用"
                            color="error"
                            size="small"
                          />
                        );
                      }
                      return null;
                    })()}
                  </Grid>
                )}

                {(!transaction.referencedByInfo || transaction.referencedByInfo.length === 0) && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      引用狀態
                    </Typography>
                    <Chip
                      label="未被引用"
                      color="success"
                      size="small"
                    />
                  </Grid>
                )}

                {transaction.sourceTransactionId && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      資金來源
                    </Typography>
                    <Chip
                      label="有資金來源"
                      color="primary"
                      size="small"
                    />
                  </Grid>
                )}

                {/* 顯示被引用的交易詳情 */}
                {transaction.referencedByInfo && transaction.referencedByInfo.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      被引用詳情
                    </Typography>
                    <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                      {transaction.referencedByInfo.map((ref, index) => (
                        <Box key={ref._id} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="caption" display="block">
                            <strong>{ref.groupNumber}</strong> - {ref.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {formatDate(ref.transactionDate)} | {formatAmount(ref.totalAmount)} | {ref.status === 'confirmed' ? '已確認' : ref.status === 'cancelled' ? '已取消' : '草稿'}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 分錄明細表格 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                分錄明細 ({transaction.entries.length} 筆)
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>序號</TableCell>
                      <TableCell>科目</TableCell>
                      <TableCell>描述</TableCell>
                      <TableCell align="right">借方金額</TableCell>
                      <TableCell align="right">貸方金額</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transaction.entries.map((entry, index) => {
                      const accountId = typeof entry.accountId === 'string' 
                        ? entry.accountId 
                        : entry.accountId._id;
                      const account = accounts[accountId] || 
                        (typeof entry.accountId === 'object' ? entry.accountId : null);
                      
                      return (
                        <TableRow key={entry._id || index}>
                          <TableCell>{entry.sequence || index + 1}</TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {account?.name || '未知科目'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {account?.code}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {entry.description}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            {entry.debitAmount > 0 && (
                              <Typography variant="body2" color="success.main" fontWeight="medium">
                                {formatAmount(entry.debitAmount)}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {entry.creditAmount > 0 && (
                              <Typography variant="body2" color="error.main" fontWeight="medium">
                                {formatAmount(entry.creditAmount)}
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 資金追蹤資訊 */}
        {(transaction.sourceTransactionId || transaction.linkedTransactionIds.length > 0) && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  資金追蹤資訊
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {transaction.sourceTransactionId && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      資金來源交易
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/accounting3/transaction/${transaction.sourceTransactionId}`)}
                    >
                      查看來源交易
                    </Button>
                  </Box>
                )}

                {transaction.linkedTransactionIds.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      關聯交易 ({transaction.linkedTransactionIds.length} 筆)
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {transaction.linkedTransactionIds.map((linkedId) => (
                        <Button
                          key={linkedId}
                          variant="outlined"
                          size="small"
                          onClick={() => navigate(`/accounting3/transaction/${linkedId}`)}
                        >
                          查看關聯交易
                        </Button>
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* 系統資訊 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                系統資訊
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    建立時間
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(transaction.createdAt)}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    最後更新
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(transaction.updatedAt)}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    建立者
                  </Typography>
                  <Typography variant="body2">
                    {transaction.createdBy}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    交易ID
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {transaction._id}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TransactionDetailView;
import React, { FC, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  List,
  ListItem,
  Button,
  Grid,
  Paper,
  Chip
} from '@mui/material';
import { format } from 'date-fns';

// 導入類型
import { TransactionGroupWithEntries3 } from '@pharmacy-pos/shared/types/accounting3';
import { FUNDING_TYPES_3, TRANSACTION_STATUS_3 } from '@pharmacy-pos/shared/types/accounting3';

interface TransactionDetailPanelProps {
  selectedTransaction: TransactionGroupWithEntries3 | null;
}

/**
 * 交易詳細面板組件
 * 顯示選中交易的詳細信息
 */
const TransactionDetailPanel: FC<TransactionDetailPanelProps> = ({
  selectedTransaction
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!selectedTransaction) {
    return (
      <Card elevation={2} sx={{ borderRadius: '0.5rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            選擇一個交易記錄查看詳情
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // 格式化日期
  const formattedDate = selectedTransaction.transactionDate 
    ? format(new Date(selectedTransaction.transactionDate), 'yyyy-MM-dd')
    : '無日期';

  // 獲取交易狀態標籤顏色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'confirmed': return 'primary';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // 獲取交易狀態中文名稱
  const getStatusLabel = (status: string) => {
    const statusItem = TRANSACTION_STATUS_3.find(item => item.value === status);
    return statusItem ? statusItem.label : status;
  };

  // 獲取資金類型中文名稱
  const getFundingTypeLabel = (type: string) => {
    const typeItem = FUNDING_TYPES_3.find(item => item.value === type);
    return typeItem ? typeItem.label : type;
  };

  // 計算交易金額
  const calculateAmount = (transaction: TransactionGroupWithEntries3) => {
    if (!transaction.entries || transaction.entries.length === 0) return 0;
    
    // 找到第一個借方金額大於 0 的分錄
    const debitEntry = transaction.entries.find(entry => entry.debitAmount > 0);
    if (debitEntry) return debitEntry.debitAmount;
    
    // 如果沒有借方金額，則返回第一個貸方金額
    const creditEntry = transaction.entries.find(entry => entry.creditAmount > 0);
    if (creditEntry) return creditEntry.creditAmount;
    
    return 0;
  };

  return (
    <Card elevation={2} sx={{ borderRadius: '0.5rem', height: '100%' }}>
      <CardContent sx={{ py: 1 }}>
        <Typography component="div" sx={{ fontWeight: 600 }}>交易單 {selectedTransaction.groupNumber}</Typography>
        <List dense sx={{ py: 0 }}>
          {/* 日期和狀態左右排列 */}
          <ListItem sx={{ py: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: 3,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        mb: 0.5,
                        fontWeight: 400
                      }}
                    >
                      日期
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 600,
                        color: 'text.primary'
                      }}
                    >
                      {formattedDate}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: 3,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        mb: 0.5,
                        fontWeight: 400
                      }}
                    >
                      狀態
                    </Typography>
                    <Chip
                      label={getStatusLabel(selectedTransaction.status)}
                      color={getStatusColor(selectedTransaction.status) as any}
                      size="small"
                    />
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </ListItem>
          
          {/* 資金類型和發票號碼左右排列 */}
          <ListItem sx={{ py: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: 3,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        mb: 0.5,
                        fontWeight: 400
                      }}
                    >
                      資金類型
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 600,
                        color: 'text.primary'
                      }}
                    >
                      {getFundingTypeLabel(selectedTransaction.fundingType)}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: 3,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        mb: 0.5,
                        fontWeight: 400
                      }}
                    >
                      發票號碼
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 600,
                        color: 'text.primary'
                      }}
                    >
                      {selectedTransaction.invoiceNo || '無'}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </ListItem>
          
          {/* 描述 */}
          <ListItem sx={{ py: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>描述:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'pre-wrap' }}>{selectedTransaction.description}</Typography>
          </ListItem>
        </List>

        {selectedTransaction.entries && selectedTransaction.entries.length > 0 && (
          <>
            <Divider sx={{ my: 1.5 }} />
            
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>分錄項目</Typography>
            <List dense sx={{ py: 0 }}>
              {selectedTransaction.entries.slice(0, isExpanded ? selectedTransaction.entries.length : 3).map((entry, index) => (
                <ListItem key={index} sx={{ py: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {typeof entry.accountId === 'string' 
                        ? entry.accountId 
                        : entry.accountId?.name || '未命名科目'}
                    </Typography>
                    <Typography variant="body2">
                      {entry.debitAmount > 0 
                        ? `借: ${entry.debitAmount.toLocaleString()}`
                        : `貸: ${entry.creditAmount.toLocaleString()}`}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {entry.description || '無描述'}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
              {selectedTransaction.entries.length > 3 && (
                <ListItem sx={{ py: 0.5 }}>
                  <Button
                    onClick={() => setIsExpanded(!isExpanded)}
                    color="primary"
                    size="small"
                    sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
                  >
                    {isExpanded
                      ? '收起項目列表'
                      : `+${selectedTransaction.entries.length - 3} 個更多項目...`}
                  </Button>
                </ListItem>
              )}
            </List>
          </>
        )}

        <Divider sx={{ my: 1.5 }} />
        <ListItem sx={{ py: 1 }}>
          <Paper
            elevation={1}
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              backgroundColor: 'background.paper',
              transition: 'all 0.2s',
              width: '100%',
              '&:hover': {
                boxShadow: 3,
                transform: 'translateY(-2px)'
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 400
                }}
              >
                總金額
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  color: 'primary.main'
                }}
              >
                ${selectedTransaction.totalAmount ? selectedTransaction.totalAmount.toLocaleString() : '0'}
              </Typography>
            </Box>
          </Paper>
        </ListItem>
      </CardContent>
    </Card>
  );
};

export default TransactionDetailPanel;
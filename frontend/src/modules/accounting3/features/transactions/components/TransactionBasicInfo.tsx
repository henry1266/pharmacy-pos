import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Divider,
  Grid,
  Box,
  Button,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Description as DescriptionIcon,
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  Input as InputIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { TransactionGroupWithEntries3 } from '@pharmacy-pos/shared/types/accounting3';
import { formatAmount, formatDate, getStatusInfo, getFundingTypeInfo } from '../utils';
import { embeddedFundingTrackingService } from '../../../services/transactionGroupWithEntriesService';

interface TransactionBasicInfoProps {
  transaction: TransactionGroupWithEntries3;
}

/**
 * 交易基本資訊卡片組件
 */
export const TransactionBasicInfo: React.FC<TransactionBasicInfoProps> = ({
  transaction
}) => {
  const navigate = useNavigate();
  const statusInfo = getStatusInfo(transaction.status);
  const fundingTypeInfo = getFundingTypeInfo(transaction.fundingType);
  
  // 資金流向狀態
  const [fundingFlow, setFundingFlow] = useState<any>(null);
  const [loadingFundingFlow, setLoadingFundingFlow] = useState(false);

  // 提取帳戶ID的工具函數
  const extractAccountId = (accountId: string | any): string | null => {
    if (typeof accountId === 'string') {
      return accountId;
    }
    if (typeof accountId === 'object' && accountId?._id) {
      return accountId._id;
    }
    return null;
  };

  // 處理帳戶點擊事件
  const handleAccountClick = (accountId: string | any) => {
    const cleanId = extractAccountId(accountId);
    if (cleanId) {
      navigate(`/accounting3/accounts/${cleanId}`);
    }
  };

  // 獲取資金流向資訊
  useEffect(() => {
    const fetchFundingFlow = async () => {
      if (!transaction._id) return;
      
      try {
        setLoadingFundingFlow(true);
        const response = await embeddedFundingTrackingService.getFundingFlow(transaction._id);
        if (response.success) {
          setFundingFlow(response.data);
        }
      } catch (error) {
        console.error('獲取資金流向失敗:', error);
      } finally {
        setLoadingFundingFlow(false);
      }
    };

    fetchFundingFlow();
  }, [transaction._id]);

  // 計算剩餘可用金額
  const calculateRemainingAmount = (): number => {
    if (fundingFlow && fundingFlow.availableAmount !== undefined) {
      return fundingFlow.availableAmount;
    }
    
    // 如果沒有資金流向資料，使用基本計算
    const totalAmount = transaction.totalAmount || 0;
    const linkedCount = transaction.linkedTransactionIds?.length || 0;
    
    if (linkedCount === 0) {
      return totalAmount; // 沒有被引用，全額可用
    }
    
    // 如果有被引用但沒有詳細資料，返回 0（保守估計）
    return 0;
  };

  // 渲染交易流向圖
  const renderTransactionFlow = () => {
    if (!transaction.entries || transaction.entries.length < 2) {
      return <Typography variant="caption" color="text.disabled">-</Typography>;
    }

    // 找到主要的借方和貸方科目
    const debitEntries = transaction.entries.filter(entry => (entry.debitAmount || 0) > 0);
    const creditEntries = transaction.entries.filter(entry => (entry.creditAmount || 0) > 0);

    if (debitEntries.length === 0 || creditEntries.length === 0) {
      return <Typography variant="caption" color="text.disabled">-</Typography>;
    }

    // 取第一個借方和貸方科目作為代表
    const fromAccount = creditEntries[0];
    const toAccount = debitEntries[0];

    // 獲取科目名稱 - 處理不同的數據結構
    const getAccountName = (entry: any) => {
      // 如果 accountId 是物件，直接取 name
      if (typeof entry.accountId === 'object' && entry.accountId?.name) {
        return entry.accountId.name;
      }
      
      // 如果有 accountName 屬性
      if (entry.accountName) {
        return entry.accountName;
      }
      
      // 如果有 account 屬性
      if (entry.account?.name) {
        return entry.account.name;
      }
      
      return '未知科目';
    };

    const fromAccountName = getAccountName(fromAccount);
    const toAccountName = getAccountName(toAccount);

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5, minWidth: 180 }}>
        <Chip
          label={fromAccountName}
          size="small"
          color="secondary"
          clickable
          onClick={() => handleAccountClick(fromAccount.accountId)}
          sx={{
            fontSize: '0.75rem',
            height: 24,
            mr: 0.5,
            maxWidth: 80,
            cursor: 'pointer',
            '& .MuiChip-label': {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: '0.75rem'
            },
            '&:hover': {
              backgroundColor: 'secondary.dark'
            }
          }}
        />
        <ArrowForwardIcon sx={{ fontSize: 16, color: 'primary.main', mx: 0.25 }} />
        <Chip
          label={toAccountName}
          size="small"
          color="primary"
          clickable
          onClick={() => handleAccountClick(toAccount.accountId)}
          sx={{
            fontSize: '0.75rem',
            height: 24,
            ml: 0.5,
            maxWidth: 80,
            cursor: 'pointer',
            '& .MuiChip-label': {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: '0.75rem'
            },
            '&:hover': {
              backgroundColor: 'primary.dark'
            }
          }}
        />
      </Box>
    );
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon />
          基本資訊
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
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
            <Typography variant="body2" color="text.secondary" gutterBottom>
              交易流向
            </Typography>
            {renderTransactionFlow()}
          </Grid>

          <Grid item xs={6}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ReceiptIcon fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                交易編號
              </Typography>
            </Box>
            <Typography variant="body1" fontWeight="medium">
              {transaction.groupNumber}
            </Typography>
          </Grid>

                    <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <MoneyIcon fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                剩餘可用金額
              </Typography>
            </Box>
            {loadingFundingFlow ? (
              <Typography variant="body2" color="text.secondary">
                載入中...
              </Typography>
            ) : (
              <Typography
                variant="h6"
                color={calculateRemainingAmount() > 0 ? "success.main" : "error.main"}
              >
                {formatAmount(calculateRemainingAmount())}
              </Typography>
            )}
            {fundingFlow && fundingFlow.totalUsedAmount > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                已使用: {formatAmount(fundingFlow.totalUsedAmount)}
              </Typography>
            )}
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
  );
};

export default TransactionBasicInfo;
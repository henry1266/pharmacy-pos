import React from 'react';
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
} from '@mui/icons-material';
import { TransactionGroupWithEntries3 } from '@pharmacy-pos/shared/types/accounting3';
import { formatAmount, formatDate, getStatusInfo, getFundingTypeInfo } from '../utils/transactionUtils';

interface TransactionBasicInfoProps {
  transaction: TransactionGroupWithEntries3;
}

/**
 * 交易基本資訊卡片組件
 */
export const TransactionBasicInfo: React.FC<TransactionBasicInfoProps> = ({
  transaction
}) => {
  const statusInfo = getStatusInfo(transaction.status);
  const fundingTypeInfo = getFundingTypeInfo(transaction.fundingType);

  return (
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
  );
};

export default TransactionBasicInfo;
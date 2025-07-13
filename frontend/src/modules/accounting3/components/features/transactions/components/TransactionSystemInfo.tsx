import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Divider,
  Grid,
} from '@mui/material';
import { TransactionGroupWithEntries3 } from '@pharmacy-pos/shared/types/accounting3';
import { formatDate } from '../utils/transactionUtils';

interface TransactionSystemInfoProps {
  transaction: TransactionGroupWithEntries3;
}

/**
 * 交易系統資訊組件
 */
export const TransactionSystemInfo: React.FC<TransactionSystemInfoProps> = ({
  transaction
}) => {
  return (
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
  );
};

export default TransactionSystemInfo;
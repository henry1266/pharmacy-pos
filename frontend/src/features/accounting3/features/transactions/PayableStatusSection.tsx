import React from 'react';
import { Box, Typography, Chip, Button, TableRow, TableCell } from '@mui/material';
import { PayableStatusSectionProps } from './types';
import { formatAmount, formatDate } from '../../transactions/utils/transactionUtils';
import FlowSection from './FlowSection';
import TransactionTable from './TransactionTable';

/**
 * 應付帳款狀態組件
 * 顯示應付帳款的付款狀態和歷史
 */
const PayableStatusSection: React.FC<PayableStatusSectionProps> = ({
  transaction,
  navigate
}) => {
  const transactionAny = transaction as any;
  
  // 如果不是採購交易或沒有應付帳款信息，不顯示此區塊
  if (transactionAny.transactionType !== 'purchase' || !transactionAny.payableInfo) {
    return null;
  }

  return (
    <FlowSection
      title="付款狀態"
      statusChip={
        <Chip
          label={transactionAny.payableInfo.isPaidOff ? '已付清' : '未付清'}
          color={transactionAny.payableInfo.isPaidOff ? 'success' : 'warning'}
          size="small"
        />
      }
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" gutterBottom>
          總金額: {formatAmount(transaction.totalAmount || 0)}
        </Typography>
        <Typography variant="body2" gutterBottom>
          已付金額: {formatAmount(transactionAny.payableInfo.totalPaidAmount || 0)}
        </Typography>
        <Typography variant="body2" gutterBottom>
          剩餘金額: {formatAmount((transaction.totalAmount || 0) - (transactionAny.payableInfo.totalPaidAmount || 0))}
        </Typography>
        
        {transactionAny.payableInfo.paymentHistory && transactionAny.payableInfo.paymentHistory.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              付款歷史 ({transactionAny.payableInfo.paymentHistory.length} 筆)
            </Typography>
            <TransactionTable>
              {transactionAny.payableInfo.paymentHistory.map((history: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => navigate(`/accounting3/transaction/${history.paymentTransactionId}`)}
                    >
                      查看付款交易
                    </Button>
                  </TableCell>
                  <TableCell>
                    {formatAmount(history.paidAmount)}
                  </TableCell>
                  <TableCell>
                    {formatDate(history.paymentDate)}
                  </TableCell>
                  <TableCell>
                    {history.paymentMethod || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TransactionTable>
          </Box>
        )}
      </Box>
    </FlowSection>
  );
};

export default PayableStatusSection;
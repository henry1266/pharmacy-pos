import React from 'react';
import { Button, TableRow, TableCell, Chip } from '@mui/material';
import { PaymentFlowSectionProps } from './types';
import { formatAmount } from '../../transactions/utils/transactionUtils';
import FlowSection from './FlowSection';
import TransactionTable from './TransactionTable';

/**
 * 付款流向詳情組件
 * 顯示付款交易的明細
 */
const PaymentFlowSection: React.FC<PaymentFlowSectionProps> = ({
  transaction,
  navigate
}) => {
  const transactionAny = transaction as any;
  
  // 如果不是付款交易或沒有付款信息，不顯示此區塊
  if (transactionAny.transactionType !== 'payment' || !transactionAny.paymentInfo) {
    return null;
  }

  return (
    <FlowSection
      title="付款明細"
      count={transactionAny.paymentInfo.payableTransactions?.length || 0}
      statusChip={
        <Chip
          label={`${transactionAny.paymentInfo.paymentMethod} 付款`}
          color="info"
          size="small"
        />
      }
    >
      <TransactionTable>
        {transactionAny.paymentInfo.payableTransactions?.map((payment: any, index: number) => (
          <TableRow key={index}>
            <TableCell>
              <Button
                variant="text"
                size="small"
                onClick={() => navigate(`/accounting3/transaction/${payment.transactionId}`)}
              >
                查看應付帳款
              </Button>
            </TableCell>
            <TableCell>
              付款金額: {formatAmount(payment.paidAmount)}
              {payment.remainingAmount && payment.remainingAmount > 0 && (
                <div style={{ color: '#ed6c02', fontSize: '0.75rem' }}>
                  剩餘: {formatAmount(payment.remainingAmount)}
                </div>
              )}
            </TableCell>
            <TableCell>
              <Chip
                label={!payment.remainingAmount || payment.remainingAmount === 0 ? '已付清' : '部分付款'}
                color={!payment.remainingAmount || payment.remainingAmount === 0 ? 'success' : 'warning'}
                size="small"
              />
            </TableCell>
          </TableRow>
        )) || []}
      </TransactionTable>
    </FlowSection>
  );
};

export default PaymentFlowSection;
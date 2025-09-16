import React from 'react';
import { Box, Chip } from '@mui/material';
import { FlowToSectionProps } from './types';
import FlowSection from './FlowSection';
import TransactionTable from './TransactionTable';
import TransactionTableRow from './TransactionTableRow';
import { TRANSACTION_TYPES } from './constants';

/**
 * 流向區塊組件
 * 顯示交易的資金流向
 */
const FlowToSection: React.FC<FlowToSectionProps> = ({
  transaction,
  navigate,
  loading,
  linkedTransactionDetails
}) => {
  // 計算流向總計
  const calculateFlowTotal = () => {
    const usedAmount = transaction.referencedByInfo
      ?.filter((ref: any) => ref.status !== 'cancelled')
      .reduce((sum: number, ref: any) => sum + ref.totalAmount, 0) || 0;
    
    return usedAmount;
  };
  // 渲染流向詳情
  const renderReferencedByInfo = () => {
    if (!transaction.referencedByInfo || transaction.referencedByInfo.length === 0) {
      return (
        <Chip
          label="未被引用"
          color="success"
          size="small"
        />
      );
    }

    return (
      <Box sx={{ maxHeight: 300 }}>
        <TransactionTable>
          {transaction.referencedByInfo.map((ref, index) => (
            <TransactionTableRow
              key={index}
              transactionInfo={ref}
              transactionId={ref._id}
              index={index}
              type={TRANSACTION_TYPES.REFERENCED}
              navigate={navigate}
              calculateUsedAmount={() => 0} // 不需要計算使用金額
              calculateBalanceInfo={() => ({ usedFromThisSource: 0, availableAmount: 0, totalAmount: 0 })} // 不需要計算餘額
              loading={loading}
              linkedTransactionDetails={linkedTransactionDetails}
            />
          ))}
        </TransactionTable>
      </Box>
    );
  };

  // 計算狀態標籤
  const getStatusChip = () => {
    const usedAmount = transaction.referencedByInfo
      ?.filter((ref: any) => ref.status !== 'cancelled')
      .reduce((sum: number, ref: any) => sum + ref.totalAmount, 0) || 0;
    
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
    return undefined;
  };

  return (
    <FlowSection
      title="流向"
      count={transaction.referencedByInfo?.length || 0}
      statusChip={getStatusChip()}
    >
      {renderReferencedByInfo()}
    </FlowSection>
  );
};

export default FlowToSection;
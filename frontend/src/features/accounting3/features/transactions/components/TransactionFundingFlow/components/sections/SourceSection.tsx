import React from 'react';
import { Box, Typography } from '@mui/material';
import { SourceSectionProps } from '../../types';
import { extractObjectId } from '../../../../utils/transactionUtils';
import FlowSection from '../ui/FlowSection';
import TransactionTable from '../ui/TransactionTable';
import TransactionTableRow from '../rows/TransactionTableRow';
import NavigationButton from '../ui/NavigationButton';
import { TRANSACTION_TYPES } from '../../constants';

/**
 * 來源區塊組件
 * 顯示交易的資金來源和關聯交易
 */
const SourceSection: React.FC<SourceSectionProps> = ({
  transaction,
  navigate,
  calculateUsedAmount,
  calculateBalanceInfo,
  loading,
  linkedTransactionDetails
}) => {
  // 檢查是否有多個來源
  const hasMultipleSources = (transaction.sourceTransactionId ? 1 : 0) + (transaction.linkedTransactionIds?.length || 0) > 1;
  // 渲染來源交易資訊
  const renderSourceTransaction = () => {
    if (!transaction.sourceTransactionId) return null;

    const cleanSourceId = extractObjectId(transaction.sourceTransactionId);
    console.log('🔍 資金來源交易 ID 提取:', { 原始: transaction.sourceTransactionId, 提取後: cleanSourceId });
    
    // 如果有來源交易資訊，顯示詳細格式
    if (typeof transaction.sourceTransactionId === 'object' && transaction.sourceTransactionId !== null) {
      const sourceInfo = transaction.sourceTransactionId as any;
      
      return (
        <TransactionTable>
          <TransactionTableRow
            transactionInfo={sourceInfo}
            transactionId={transaction.sourceTransactionId}
            index={0}
            type={TRANSACTION_TYPES.SOURCE}
            navigate={navigate}
            calculateUsedAmount={calculateUsedAmount}
            calculateBalanceInfo={calculateBalanceInfo}
            loading={loading}
            linkedTransactionDetails={linkedTransactionDetails}
          />
        </TransactionTable>
      );
    } else {
      // 如果只有 ID，顯示簡化格式
      return <NavigationButton transactionId={transaction.sourceTransactionId} label="查看來源交易" navigate={navigate} />;
    }
  };

  // 渲染關聯交易列表
  const renderLinkedTransactions = () => {
    if (!transaction.linkedTransactionIds || transaction.linkedTransactionIds.length === 0) {
      return null;
    }

    return (
      <Box>
        <Box sx={{ maxHeight: 300 }}>
          <TransactionTable>
            {transaction.linkedTransactionIds.map((linkedId, index) => (
              <TransactionTableRow
                key={index}
                transactionInfo={linkedId}
                transactionId={linkedId}
                index={index}
                type={TRANSACTION_TYPES.LINKED}
                navigate={navigate}
                calculateUsedAmount={calculateUsedAmount}
                calculateBalanceInfo={calculateBalanceInfo}
                loading={loading}
                linkedTransactionDetails={linkedTransactionDetails}
              />
            ))}
          </TransactionTable>
        </Box>
      </Box>
    );
  };

  // 如果沒有來源和關聯交易，不顯示此區塊
  if (!transaction.sourceTransactionId && (!transaction.linkedTransactionIds || transaction.linkedTransactionIds.length === 0)) {
    return null;
  }

  return (
    <FlowSection
      title="來源"
      count={(transaction.sourceTransactionId ? 1 : 0) + (transaction.linkedTransactionIds?.length || 0)}
    >
      {transaction.sourceTransactionId && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            資金來源交易
          </Typography>
          {renderSourceTransaction()}
        </Box>
      )}
      {renderLinkedTransactions()}
    </FlowSection>
  );
};

export default SourceSection;
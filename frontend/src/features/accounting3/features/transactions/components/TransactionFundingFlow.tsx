import React from 'react';
import { TransactionGroupWithEntries3 } from '@pharmacy-pos/shared/types/accounting3';
import TransactionFundingFlowComponent from './TransactionFundingFlow/index';

/**
 * 交易資金流向追蹤組件
 * 此文件為原始組件的包裝器，用於保持向後兼容性
 */
interface TransactionFundingFlowProps {
  transaction: TransactionGroupWithEntries3;
}

export const TransactionFundingFlow: React.FC<TransactionFundingFlowProps> = ({
  transaction
}) => {
  return <TransactionFundingFlowComponent transaction={transaction} />;
};

export default TransactionFundingFlow;
import { useMemo } from 'react';
import { TransactionGroupWithEntries3 } from '@pharmacy-pos/shared/types/accounting3';
import { extractObjectId } from '../../../utils/transactionUtils';
import { BalanceCalculationResult } from '../types';

/**
 * 交易計算 Hook
 * 提供各種交易金額計算功能
 */
export const useTransactionCalculations = (
  transaction: TransactionGroupWithEntries3,
  linkedTransactionDetails: {[key: string]: any}
) => {
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

  // 檢查是否有多個來源
  const hasMultipleSources = useMemo(() => {
    return (transaction.sourceTransactionId ? 1 : 0) + (transaction.linkedTransactionIds?.length || 0) > 1;
  }, [transaction.sourceTransactionId, transaction.linkedTransactionIds]);

  // 計算從特定來源使用的金額
  const calculateUsedAmount = useMemo(() => {
    return (sourceInfo: any, isMultipleSource: boolean): number => {
      if (sourceInfo.usedAmount !== undefined) {
        return sourceInfo.usedAmount;
      }
      if (sourceInfo.allocatedAmount !== undefined) {
        return sourceInfo.allocatedAmount;
      }
      
      if (isMultipleSource) {
        const currentTransactionAmount = transaction.totalAmount || 0;
        const sourceAmount = sourceInfo.totalAmount || 0;
        
        // 計算所有來源的總金額
        let totalSourceAmount = 0;
        if (transaction.sourceTransactionId && typeof transaction.sourceTransactionId === 'object') {
          const sourceData = transaction.sourceTransactionId as any;
          totalSourceAmount += sourceData.totalAmount || 0;
        }
        if (transaction.linkedTransactionIds) {
          transaction.linkedTransactionIds.forEach(linkedId => {
            if (typeof linkedId === 'object' && linkedId !== null) {
              const linkedData = linkedId as any;
              totalSourceAmount += linkedData.totalAmount || 0;
            }
          });
        }
        
        // 按比例分配
        if (totalSourceAmount > 0) {
          return Math.round((sourceAmount / totalSourceAmount) * currentTransactionAmount);
        }
        return currentTransactionAmount;
      }
      
      // 單一來源：使用當前交易的總金額
      return transaction.totalAmount || 0;
    };
  }, [transaction]);

  // 計算餘額資訊
  const calculateBalanceInfo = useMemo(() => {
    return (
      transactionId: string,
      sourceInfo: any,
      usedAmount: number
    ): BalanceCalculationResult => {
      const cleanId = extractObjectId(transactionId);
      
      // 檢查是否有從 API 獲取的餘額資料
      if (cleanId && linkedTransactionDetails[cleanId] && linkedTransactionDetails[cleanId].hasRealBalance) {
        const balanceData = linkedTransactionDetails[cleanId];
        const totalAmount = balanceData.totalAmount || 0;
        let availableAmount = balanceData.availableAmount || 0;
        
        // 調整餘額
        if (usedAmount >= totalAmount) {
          availableAmount = 0;
        } else if (availableAmount + usedAmount > totalAmount) {
          availableAmount = Math.max(0, totalAmount - usedAmount);
        }
        
        return {
          usedFromThisSource: usedAmount,
          availableAmount,
          totalAmount
        };
      }
      
      // 回退到原始資料
      const totalAmount = sourceInfo.totalAmount || 0;
      const availableAmount = sourceInfo.availableAmount !== undefined
        ? sourceInfo.availableAmount
        : totalAmount;
      
      return {
        usedFromThisSource: usedAmount,
        availableAmount,
        totalAmount
      };
    };
  }, [linkedTransactionDetails]);

  // 工具函數：計算總計金額
  const calculateSourceTotal = () => {
    let total = 0;
    
    // 計算來源交易金額
    if (transaction.sourceTransactionId && typeof transaction.sourceTransactionId === 'object') {
      const sourceInfo = transaction.sourceTransactionId as any;
      if (sourceInfo.totalAmount) {
        total += sourceInfo.totalAmount;
      }
    }
    
    // 計算關聯交易金額
    if (transaction.linkedTransactionIds) {
      transaction.linkedTransactionIds.forEach(linkedId => {
        if (typeof linkedId === 'object' && linkedId !== null) {
          const linkedInfo = linkedId as any;
          if (linkedInfo.totalAmount) {
            total += linkedInfo.totalAmount;
          }
        }
      });
    }
    
    return total;
  };

  // 工具函數：計算流向總計
  const calculateFlowTotal = () => {
    const usedAmount = transaction.referencedByInfo
      ?.filter((ref: any) => ref.status !== 'cancelled')
      .reduce((sum: number, ref: any) => sum + ref.totalAmount, 0) || 0;
    
    return usedAmount;
  };

  // 工具函數：計算剩餘金額（來源總計 - 流向總計）
  const calculateRemainingAmount = () => {
    const sourceTotal = calculateSourceTotal();
    const flowTotal = calculateFlowTotal();
    
    return Math.max(0, sourceTotal - flowTotal);
  };

  // 工具函數：計算剩餘可用金額
  const calculateAvailableAmount = () => {
    if (!transaction.referencedByInfo || transaction.referencedByInfo.length === 0) {
      return transaction.totalAmount;
    }
    
    const usedAmount = transaction.referencedByInfo
      .filter((ref: any) => ref.status !== 'cancelled')
      .reduce((sum: number, ref: any) => sum + ref.totalAmount, 0);
    
    return Math.max(0, transaction.totalAmount - usedAmount);
  };

  return {
    extractAccountId,
    hasMultipleSources,
    calculateUsedAmount,
    calculateBalanceInfo,
    calculateSourceTotal,
    calculateFlowTotal,
    calculateRemainingAmount,
    calculateAvailableAmount
  };
};
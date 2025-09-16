import { useState, useEffect } from 'react';
import { TransactionGroupWithEntries3 } from '@pharmacy-pos/shared/types/accounting3';
import { accounting3Service } from '../../services/accounting3Service';
import { extractObjectId, isValidObjectId } from '../utils/transactionUtils';

/**
 * 交易餘額 Hook
 * 處理獲取關聯交易和來源交易的詳細資訊（使用餘額計算 API）
 */
export const useTransactionBalance = (transaction: TransactionGroupWithEntries3) => {
  const [linkedTransactionDetails, setLinkedTransactionDetails] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState(false);

  // 獲取關聯交易和來源交易的詳細資訊（使用新的餘額計算 API）
  useEffect(() => {
    const fetchLinkedTransactionDetails = async () => {
      console.log('🚀 開始獲取關聯交易和來源交易詳情:', {
        hasLinkedTransactionIds: !!transaction.linkedTransactionIds,
        linkedTransactionIdsLength: transaction.linkedTransactionIds?.length,
        linkedTransactionIds: transaction.linkedTransactionIds,
        hasSourceTransactionId: !!transaction.sourceTransactionId,
        sourceTransactionId: transaction.sourceTransactionId
      });

      // 收集所有需要查詢餘額的交易 ID
      const allTransactionIds: string[] = [];
      
      // 添加關聯交易 ID
      if (transaction.linkedTransactionIds && transaction.linkedTransactionIds.length > 0) {
        for (const linkedId of transaction.linkedTransactionIds) {
          const cleanId = extractObjectId(linkedId);
          if (cleanId && isValidObjectId(cleanId)) {
            allTransactionIds.push(cleanId);
          }
        }
      }
      
      // 添加來源交易 ID
      if (transaction.sourceTransactionId) {
        const cleanSourceId = extractObjectId(transaction.sourceTransactionId);
        if (cleanSourceId && isValidObjectId(cleanSourceId)) {
          allTransactionIds.push(cleanSourceId);
        }
      }
      
      // 添加流向交易 ID
      if (transaction.referencedByInfo && transaction.referencedByInfo.length > 0) {
        for (const ref of transaction.referencedByInfo) {
          const cleanRefId = extractObjectId(ref._id);
          if (cleanRefId && isValidObjectId(cleanRefId)) {
            allTransactionIds.push(cleanRefId);
          }
        }
      }

      if (allTransactionIds.length === 0) {
        console.log('⚠️ 沒有有效的交易 ID，跳過 API 調用');
        return;
      }

      setLoading(true);
      const details: {[key: string]: any} = {};

      try {
        console.log('💰 使用新的餘額計算 API 獲取真實餘額資訊');
        console.log('📋 所有交易 IDs:', allTransactionIds);

        // 使用新的批次餘額計算 API
        const balanceResponse = await accounting3Service.transactions.calculateBalances(allTransactionIds);
        
        console.log('📡 餘額計算 API 回應:', {
          success: balanceResponse.success,
          hasData: !!balanceResponse.data,
          balancesCount: balanceResponse.data?.balances?.length || 0,
          summary: balanceResponse.data?.summary,
          balances: balanceResponse.data?.balances
        });

        if (balanceResponse.success && balanceResponse.data?.balances) {
          for (const balance of balanceResponse.data.balances) {
            if (balance.success) {
              console.log('✅ 獲取真實餘額成功:', {
                transactionId: balance.transactionId,
                totalAmount: balance.totalAmount,
                usedAmount: balance.usedAmount,
                availableAmount: balance.availableAmount,
                referencedByCount: balance.referencedByCount
              });

              // 同時獲取交易基本資訊
              try {
                const transactionResponse = await accounting3Service.transactions.getById(balance.transactionId);
                if (transactionResponse.success && transactionResponse.data) {
                  details[balance.transactionId] = {
                    ...transactionResponse.data,
                    // 使用真實計算的餘額資訊
                    totalAmount: balance.totalAmount,
                    usedAmount: balance.usedAmount,
                    availableAmount: balance.availableAmount,
                    referencedByCount: balance.referencedByCount,
                    referencedByTransactions: balance.referencedByTransactions,
                    // 標記這是真實計算的餘額
                    hasRealBalance: true
                  };
                } else {
                  // 如果無法獲取交易詳情，至少保存餘額資訊
                  details[balance.transactionId] = {
                    _id: balance.transactionId,
                    id: balance.transactionId,
                    totalAmount: balance.totalAmount,
                    usedAmount: balance.usedAmount,
                    availableAmount: balance.availableAmount,
                    referencedByCount: balance.referencedByCount,
                    referencedByTransactions: balance.referencedByTransactions,
                    hasRealBalance: true,
                    description: '無法獲取交易詳情'
                  };
                }
              } catch (error) {
                console.warn('⚠️ 獲取交易詳情失敗，但餘額計算成功:', balance.transactionId, error);
                details[balance.transactionId] = {
                  _id: balance.transactionId,
                  id: balance.transactionId,
                  totalAmount: balance.totalAmount,
                  usedAmount: balance.usedAmount,
                  availableAmount: balance.availableAmount,
                  referencedByCount: balance.referencedByCount,
                  referencedByTransactions: balance.referencedByTransactions,
                  hasRealBalance: true,
                  description: '無法獲取交易詳情'
                };
              }
            } else {
              console.error('❌ 餘額計算失敗:', {
                transactionId: balance.transactionId,
                error: balance.error
              });
            }
          }
        }
        
        console.log('🎯 最終獲取的詳情:', {
          detailsKeys: Object.keys(details),
          detailsCount: Object.keys(details).length,
          hasRealBalanceData: Object.values(details).some((d: any) => d.hasRealBalance),
          details: details
        });
        
        setLinkedTransactionDetails(details);
      } catch (error) {
        console.error('❌ 獲取關聯交易詳情失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLinkedTransactionDetails();
  }, [transaction.linkedTransactionIds, transaction.sourceTransactionId, transaction.referencedByInfo]);

  return { linkedTransactionDetails, loading };
};
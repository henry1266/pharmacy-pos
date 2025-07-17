import mongoose from 'mongoose';
import TransactionGroupWithEntries from '../models/TransactionGroupWithEntries';

/**
 * 資金來源處理輔助函數
 */

// 按比例分配計算已使用金額
export const calculateProportionalUsage = async (
  sourceTransaction: any,
  userId: string
): Promise<number> => {
  // 查找所有使用此資金來源的交易
  const linkedTransactions = await TransactionGroupWithEntries.find({
    linkedTransactionIds: sourceTransaction._id,
    status: { $ne: 'cancelled' },
    createdBy: userId
  }).populate('linkedTransactionIds', 'totalAmount');

  let totalUsedAmount = 0;
  
  for (const tx of linkedTransactions) {
    // 獲取此交易的所有資金來源
    const allSources = tx.linkedTransactionIds as any[];
    if (allSources && allSources.length > 0) {
      // 計算所有資金來源的總金額
      const totalSourceAmount = allSources.reduce((sum, src) => {
        const srcAmount = typeof src === 'object' ? src.totalAmount : 0;
        return sum + (srcAmount || 0);
      }, 0);
      
      // 按比例分配此交易對當前資金來源的使用金額
      if (totalSourceAmount > 0) {
        const sourceRatio = (sourceTransaction.totalAmount || 0) / totalSourceAmount;
        const allocatedAmount = (tx.totalAmount || 0) * sourceRatio;
        totalUsedAmount += allocatedAmount;
      }
    } else {
      // 如果沒有多個資金來源，使用完整金額
      totalUsedAmount += (tx.totalAmount || 0);
    }
  }
  
  return totalUsedAmount;
};

// 格式化資金來源資訊
export const formatFundingSourceInfo = async (
  linkedTx: any,
  userId: string
): Promise<any> => {
  // 如果 linkedTx 是 ObjectId 字串或未 populate，需要重新查詢
  let sourceTransaction = linkedTx;
  if (typeof linkedTx === 'string' || (linkedTx && !linkedTx.groupNumber)) {
    const sourceId = linkedTx._id || linkedTx;
    sourceTransaction = await TransactionGroupWithEntries.findById(sourceId);
  }
  
  if (!sourceTransaction) {
    console.warn('⚠️ 找不到資金來源交易:', linkedTx._id || linkedTx);
    return {
      _id: linkedTx._id || linkedTx,
      groupNumber: 'TXN-未知',
      description: '未知資金來源',
      transactionDate: new Date(),
      totalAmount: 0,
      availableAmount: 0,
      fundingType: '一般資金',
      status: 'unknown'
    };
  }
  
  // 計算已使用金額
  const totalUsedAmount = await calculateProportionalUsage(sourceTransaction, userId);
  const availableAmount = (sourceTransaction.totalAmount || 0) - totalUsedAmount;
  
  return {
    _id: sourceTransaction._id,
    groupNumber: sourceTransaction.groupNumber,
    description: sourceTransaction.description,
    transactionDate: sourceTransaction.transactionDate,
    totalAmount: sourceTransaction.totalAmount,
    availableAmount: availableAmount,
    fundingType: sourceTransaction.fundingType || '一般資金',
    status: sourceTransaction.status
  };
};

// 處理資金來源使用明細
export const processFundingSourceUsages = async (
  groupObj: any
): Promise<any[]> => {
  if (!groupObj.fundingSourceUsages || groupObj.fundingSourceUsages.length === 0) {
    return [];
  }
  
  console.log(`🔍 處理交易 ${groupObj.groupNumber} 的資金來源使用明細:`, groupObj.fundingSourceUsages);
  
  const fundingSourceUsages = await Promise.all(
    groupObj.fundingSourceUsages.map(async (usage: any) => {
      // 查詢資金來源交易的詳細資訊
      const sourceTransaction = await TransactionGroupWithEntries.findById(usage.sourceTransactionId);
      
      if (sourceTransaction) {
        return {
          sourceTransactionId: usage.sourceTransactionId,
          usedAmount: usage.usedAmount,
          sourceTransactionDescription: sourceTransaction.description,
          sourceTransactionGroupNumber: sourceTransaction.groupNumber,
          sourceTransactionDate: sourceTransaction.transactionDate,
          sourceTransactionAmount: sourceTransaction.totalAmount
        };
      } else {
        console.warn(`⚠️ 找不到資金來源交易: ${usage.sourceTransactionId}`);
        return {
          sourceTransactionId: usage.sourceTransactionId,
          usedAmount: usage.usedAmount,
          sourceTransactionDescription: '未知交易',
          sourceTransactionGroupNumber: 'TXN-未知',
          sourceTransactionDate: new Date(),
          sourceTransactionAmount: 0
        };
      }
    })
  );
  
  console.log(`✅ 交易 ${groupObj.groupNumber} 資金來源使用明細處理完成:`, fundingSourceUsages);
  return fundingSourceUsages;
};

// 自動計算按比例分配的資金使用明細
export const calculateProportionalFundingUsage = async (
  linkedTransactionIds: string[],
  totalAmount: number,
  userId: string
): Promise<any[]> => {
  console.log('🔍 自動計算資金來源按比例分配...');
  
  const fundingSourceUsages = [];
  
  // 查詢所有資金來源的總金額
  const sourceTransactions = await TransactionGroupWithEntries.find({
    _id: { $in: linkedTransactionIds.map((id: string) => new mongoose.Types.ObjectId(id)) },
    createdBy: userId,
    status: 'confirmed'
  });
  
  const totalSourceAmount = sourceTransactions.reduce((sum, tx) => sum + (tx.totalAmount || 0), 0);
  
  if (totalSourceAmount > 0) {
    for (const sourceTx of sourceTransactions) {
      const sourceRatio = (sourceTx.totalAmount || 0) / totalSourceAmount;
      const allocatedAmount = totalAmount * sourceRatio;
      
      fundingSourceUsages.push({
        sourceTransactionId: sourceTx._id,
        usedAmount: allocatedAmount,
        description: `按比例分配 (${(sourceRatio * 100).toFixed(2)}%)`
      });
      
      console.log(`💰 資金來源 ${sourceTx.groupNumber} 分配金額: ${allocatedAmount.toFixed(2)} (${(sourceRatio * 100).toFixed(2)}%)`);
    }
    
    console.log('✅ 自動設定按比例分配的資金使用明細');
  }
  
  return fundingSourceUsages;
};

// 查詢被引用情況
export const getReferencedByInfo = async (
  transactionId: any,
  userId: string
): Promise<any[]> => {
  const referencedByTransactions = await TransactionGroupWithEntries.find({
    linkedTransactionIds: transactionId,
    createdBy: userId
  }).select('_id groupNumber description transactionDate totalAmount status fundingType').lean();

  return referencedByTransactions.map(tx => ({
    _id: tx._id,
    groupNumber: tx.groupNumber,
    description: tx.description,
    transactionDate: tx.transactionDate,
    totalAmount: tx.totalAmount,
    status: tx.status,
    fundingType: tx.fundingType
  }));
};
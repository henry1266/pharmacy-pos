import mongoose from 'mongoose';
// import TransactionGroupWithEntries from '../models/TransactionGroupWithEntries';
import { processFundingSourceUsages, getReferencedByInfo } from './fundingSourceHelpers';
import { businessLogger } from './logger';

/**
 * 交易格式化輔助函數
 */

// 格式化內嵌分錄
export const formatEmbeddedEntries = (entries: any[]): any[] => {
  return entries.map((entry: any, index: number) => {
    const account = entry.accountId as any;
    const category = entry.categoryId as any;
    const sourceTransaction = entry.sourceTransactionId as any;
    
    // 使用logger替代console.log
    businessLogger.debug('格式化內嵌分錄', {
      entryIndex: index + 1,
      accountId: account?._id,
      accountName: account?.name,
      accountCode: account?.code,
      categoryName: category?.name,
      sourceTransactionId: sourceTransaction?._id,
      sourceTransactionDescription: sourceTransaction?.description
    });

    return {
      _id: entry._id,
      sequence: entry.sequence,
      accountId: account?._id || entry.accountId,
      accountName: account?.name || '未知科目',
      accountCode: account?.code || '',
      debitAmount: entry.debitAmount || 0,
      creditAmount: entry.creditAmount || 0,
      description: entry.description || '',
      categoryId: category?._id || entry.categoryId,
      categoryName: category?.name || '',
      sourceTransactionId: entry.sourceTransactionId,
      sourceTransactionDescription: sourceTransaction?.description || null,
      sourceTransactionGroupNumber: sourceTransaction?.groupNumber || null,
      sourceTransactionDate: sourceTransaction?.transactionDate || null,
      sourceTransactionAmount: sourceTransaction?.totalAmount || null
    };
  });
};

// 計算借貸平衡
export const calculateBalance = (entries: any[]): {
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
} => {
  const totalDebit = entries.reduce((sum, e) => sum + e.debitAmount, 0);
  const totalCredit = entries.reduce((sum, e) => sum + e.creditAmount, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01; // 允許小數點誤差

  return { totalDebit, totalCredit, isBalanced };
};

// 格式化單一交易群組（用於列表）
export const formatTransactionGroupForList = async (
  groupObj: any,
  _userId: string
): Promise<any> => {
  // 格式化內嵌分錄
  const formattedEntries = formatEmbeddedEntries(groupObj.entries);

  // 計算借貸平衡
  const { totalDebit, isBalanced } = calculateBalance(formattedEntries);

  // 處理資金來源使用明細
  const fundingSourceUsages = await processFundingSourceUsages(groupObj);

  return {
    ...groupObj,
    entries: formattedEntries,
    isBalanced,
    totalAmount: totalDebit, // 使用借方總額作為交易總金額
    // 保留被引用情況資訊
    referencedByInfo: groupObj.referencedByInfo,
    referencedByCount: groupObj.referencedByCount,
    isReferenced: groupObj.isReferenced,
    // 添加資金來源使用明細
    fundingSourceUsages
  };
};

// 格式化交易群組列表
export const formatTransactionGroupsList = async (
  transactionGroups: any[],
  userId: string
): Promise<any[]> => {
  // 為每筆交易查詢被引用情況
  //businessLogger.info('開始查詢交易被引用情況');
  const transactionGroupsWithReferences = await Promise.all(
    transactionGroups.map(async (group) => {
      const referencedByInfo = await getReferencedByInfo(group._id, userId);
      
      businessLogger.debug('交易被引用情況', {
        groupNumber: group.groupNumber,
        referencedCount: referencedByInfo.length
      });

      return {
        ...group.toObject(),
        referencedByInfo,
        referencedByCount: referencedByInfo.length,
        isReferenced: referencedByInfo.length > 0
      };
    })
  );

  //businessLogger.info('被引用情況查詢完成');

  // 格式化回應資料
  const formattedTransactionGroups = await Promise.all(
    transactionGroupsWithReferences.map(groupObj => 
      formatTransactionGroupForList(groupObj, userId)
    )
  );

  return formattedTransactionGroups;
};

// 建立分頁回應資料
export const buildPaginatedResponse = (
  data: any[],
  pageNum: number,
  limitNum: number,
  total: number
): any => {
  return {
    success: true,
    data: {
      groups: data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }
  };
};

// 建立內嵌分錄資料
export const buildEmbeddedEntries = (
  entries: any[],
  description: string,
  organizationId?: string
): any[] => {
  return entries.map((entry: any, index: number) => {
    businessLogger.debug('處理分錄', {
      entryIndex: index + 1,
      accountId: entry.accountId,
      categoryId: entry.categoryId,
      debitAmount: entry.debitAmount,
      creditAmount: entry.creditAmount
    });

    // 驗證會計科目ID
    if (!entry.accountId || !mongoose.Types.ObjectId.isValid(entry.accountId)) {
      throw new Error(`分錄 ${index + 1} 會計科目ID格式錯誤: ${entry.accountId}`);
    }

    const validAccountId = new mongoose.Types.ObjectId(entry.accountId);
    const validCategoryId = entry.categoryId && mongoose.Types.ObjectId.isValid(entry.categoryId) 
      ? new mongoose.Types.ObjectId(entry.categoryId) 
      : undefined;
    const validOrganizationId = organizationId && mongoose.Types.ObjectId.isValid(organizationId)
      ? new mongoose.Types.ObjectId(organizationId)
      : undefined;
    const validSourceTransactionId = entry.sourceTransactionId && mongoose.Types.ObjectId.isValid(entry.sourceTransactionId)
      ? new mongoose.Types.ObjectId(entry.sourceTransactionId)
      : undefined;

    const entryData: any = {
      sequence: index + 1,
      accountId: validAccountId,
      debitAmount: parseFloat(entry.debitAmount) || 0,
      creditAmount: parseFloat(entry.creditAmount) || 0,
      description: entry.description || description
    };

    // 只有當有效時才加入可選欄位
    if (validCategoryId) {
      entryData.categoryId = validCategoryId;
      businessLogger.debug('分錄設定分類', {
        entryIndex: index + 1,
        categoryId: validCategoryId
      });
    }
    
    if (validOrganizationId) {
      entryData.organizationId = validOrganizationId;
      businessLogger.debug('分錄設定機構', {
        entryIndex: index + 1,
        organizationId: validOrganizationId
      });
    }

    // 處理分錄層級的資金來源
    if (validSourceTransactionId) {
      entryData.sourceTransactionId = validSourceTransactionId;
      businessLogger.debug('分錄設定資金來源', {
        entryIndex: index + 1,
        sourceTransactionId: validSourceTransactionId
      });
    }

    // 處理資金路徑（如果有提供）
    if (entry.fundingPath && Array.isArray(entry.fundingPath)) {
      entryData.fundingPath = entry.fundingPath;
      businessLogger.debug('分錄設定資金路徑', {
        entryIndex: index + 1,
        fundingPath: entry.fundingPath
      });
    }

    businessLogger.debug('分錄資料處理完成', {
      entryIndex: index + 1,
      sequence: entryData.sequence,
      accountId: entryData.accountId,
      debitAmount: entryData.debitAmount,
      creditAmount: entryData.creditAmount,
      hasCategoryId: !!entryData.categoryId,
      hasOrganizationId: !!entryData.organizationId,
      hasSourceTransactionId: !!entryData.sourceTransactionId
    });

    return entryData;
  });
};

// 驗證分錄資料完整性
export const validateEntriesIntegrity = (entries: any[]): boolean => {
  return entries.every(entry =>
    entry.accountId &&
    mongoose.Types.ObjectId.isValid(entry.accountId) &&
    (entry.debitAmount > 0 || entry.creditAmount > 0) &&
    !(entry.debitAmount > 0 && entry.creditAmount > 0)
  );
};

// 計算交易總金額
export const calculateTotalAmount = (entries: any[]): number => {
  return entries.reduce((sum: number, entry: any) => {
    const debitAmount = parseFloat(entry.debitAmount) || 0;
    return sum + debitAmount;
  }, 0);
};

// 建立交易群組基本資料
export const buildTransactionGroupData = (
  body: any,
  userId: string,
  groupNumber: string,
  embeddedEntries: any[],
  totalAmount: number
): any => {
  const {
    description,
    transactionDate,
    organizationId,
    receiptUrl,
    invoiceNo,
    linkedTransactionIds,
    sourceTransactionId,
    fundingType = 'original',
    status = 'draft'
  } = body;

  const transactionGroupData: any = {
    groupNumber,
    description,
    transactionDate: new Date(transactionDate),
    totalAmount,
    receiptUrl,
    invoiceNo,
    status: status, // 使用前端傳來的狀態，預設為 'draft'
    createdBy: userId,
    fundingType,
    entries: embeddedEntries,
    linkedTransactionIds: linkedTransactionIds ? linkedTransactionIds.map((id: string) => new mongoose.Types.ObjectId(id)) : [],
    sourceTransactionId: sourceTransactionId ? new mongoose.Types.ObjectId(sourceTransactionId) : undefined
  };

  // 處理 organizationId
  if (organizationId && mongoose.Types.ObjectId.isValid(organizationId)) {
    transactionGroupData.organizationId = new mongoose.Types.ObjectId(organizationId);
    businessLogger.debug('設定交易群組機構ID', { organizationId });
  } else {
    businessLogger.debug('個人記帳，不設定機構ID');
  }

  return transactionGroupData;
};
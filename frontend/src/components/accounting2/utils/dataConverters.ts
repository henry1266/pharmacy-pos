import { 
  EmbeddedAccountingEntryFormData,
  TransactionGroupWithEntriesFormData 
} from '@pharmacy-pos/shared';

/**
 * 後端資料轉換為表單資料
 */
export const convertBackendDataToFormData = (backendData: any): Partial<TransactionGroupWithEntriesFormData> => {
  if (!backendData) {
    console.warn('⚠️ convertBackendDataToFormData: 收到空的後端資料');
    return {};
  }
  
  console.log('🔍 convertBackendDataToFormData - 原始資料:', {
    hasData: !!backendData,
    description: backendData.description,
    transactionDate: backendData.transactionDate,
    organizationId: backendData.organizationId,
    hasEntries: !!backendData.entries,
    entriesCount: backendData.entries?.length || 0,
    dataKeys: Object.keys(backendData)
  });
  
  try {
    // 安全的日期轉換函數
    const safeDateConvert = (dateValue: any): Date => {
      if (!dateValue) return new Date();
      try {
        if (typeof dateValue === 'object' && dateValue.$date) {
          const converted = new Date(dateValue.$date);
          return isNaN(converted.getTime()) ? new Date() : converted;
        }
        const converted = new Date(dateValue);
        return isNaN(converted.getTime()) ? new Date() : converted;
      } catch {
        return new Date();
      }
    };

    // 轉換內嵌分錄
    const convertEntries = (entries: any[]): EmbeddedAccountingEntryFormData[] => {
      if (!Array.isArray(entries)) return [];
      
      return entries.map((entry, index) => ({
        _id: entry._id || undefined,
        sequence: entry.sequence || index + 1,
        accountId: entry.accountId || '',
        debitAmount: entry.debitAmount || 0,
        creditAmount: entry.creditAmount || 0,
        description: entry.description || '',
        sourceTransactionId: entry.sourceTransactionId || undefined,
        fundingPath: entry.fundingPath || undefined
      }));
    };
    
    const result: Partial<TransactionGroupWithEntriesFormData> = {
      description: backendData.description || '',
      transactionDate: safeDateConvert(backendData.transactionDate),
      organizationId: backendData.organizationId || undefined,
      receiptUrl: backendData.receiptUrl || '',
      invoiceNo: backendData.invoiceNo || '',
      entries: convertEntries(backendData.entries || []),
      linkedTransactionIds: backendData.linkedTransactionIds || undefined,
      sourceTransactionId: backendData.sourceTransactionId || undefined,
      fundingType: backendData.fundingType || 'original'
    };
    
    console.log('🎯 轉換後的表單資料:', {
      description: result.description,
      transactionDate: result.transactionDate,
      organizationId: result.organizationId,
      entriesCount: result.entries?.length || 0,
      fundingType: result.fundingType,
      hasDescription: !!result.description,
      hasValidDate: result.transactionDate instanceof Date && !isNaN(result.transactionDate.getTime())
    });
    
    return result;
  } catch (error) {
    console.error('❌ 資料轉換失敗:', error, backendData);
    
    // 嘗試直接從原始資料提取
    console.log('🔄 嘗試直接提取資料...');
    
    const safeDateConvert = (dateValue: any): Date => {
      if (!dateValue) return new Date();
      try {
        if (typeof dateValue === 'object' && dateValue.$date) {
          const converted = new Date(dateValue.$date);
          return isNaN(converted.getTime()) ? new Date() : converted;
        }
        const converted = new Date(dateValue);
        return isNaN(converted.getTime()) ? new Date() : converted;
      } catch {
        return new Date();
      }
    };
    
    const fallbackResult: Partial<TransactionGroupWithEntriesFormData> = {
      description: backendData.description || '',
      transactionDate: safeDateConvert(backendData.transactionDate),
      organizationId: backendData.organizationId || undefined,
      receiptUrl: backendData.receiptUrl || '',
      invoiceNo: backendData.invoiceNo || '',
      entries: [],
      linkedTransactionIds: undefined,
      sourceTransactionId: undefined,
      fundingType: 'original'
    };
    
    console.log('🆘 fallback 結果:', fallbackResult);
    return fallbackResult;
  }
};

/**
 * 建立預設的兩個空分錄
 */
export const createDefaultEntries = (presetAccountId?: string): EmbeddedAccountingEntryFormData[] => [
  {
    sequence: 1,
    accountId: presetAccountId || '',
    debitAmount: 0,
    creditAmount: 0,
    description: ''
  },
  {
    sequence: 2,
    accountId: '',
    debitAmount: 0,
    creditAmount: 0,
    description: ''
  }
];
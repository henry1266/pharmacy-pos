/**
 * 交易資料轉換工具 - 純函數，前後端共用
 */

export interface BackendTransactionData {
  transactionGroup?: any;
  entries?: any[];
  [key: string]: any;
}

export interface StandardTransactionData {
  description: string;
  transactionDate: Date;
  organizationId?: string;
  receiptUrl?: string;
  invoiceNo?: string;
  entries: StandardEntryData[];
  linkedTransactionIds?: string[];
  sourceTransactionId?: string;
  fundingType?: 'original' | 'extended' | 'transfer';
}

export interface StandardEntryData {
  accountId: string;
  debitAmount: number;
  creditAmount: number;
  description: string;
  sourceTransactionId?: string;
  fundingPath?: string[];
}

export class TransactionDataConverter {
  /**
   * 轉換後端交易資料為標準格式
   */
  static convertBackendToStandard(backendData: BackendTransactionData): Partial<StandardTransactionData> {
    if (!backendData) {
      console.warn('⚠️ convertBackendToStandard: 收到空的後端資料');
      return {};
    }

    // 處理後端 API 回應結構：檢查是否有 transactionGroup 包裝
    const transactionData = backendData.transactionGroup || backendData;
    const entriesData = backendData.entries || [];

    return {
      description: transactionData.description || '',
      transactionDate: transactionData.transactionDate ? new Date(transactionData.transactionDate) : new Date(),
      organizationId: transactionData.organizationId || undefined,
      receiptUrl: transactionData.receiptUrl || '',
      invoiceNo: transactionData.invoiceNo || '',
      entries: Array.isArray(entriesData)
        ? entriesData.map(this.convertBackendEntryToStandard)
        : [],
      // 資金來源追蹤欄位
      linkedTransactionIds: transactionData.linkedTransactionIds || undefined,
      sourceTransactionId: transactionData.sourceTransactionId || undefined,
      fundingType: transactionData.fundingType || 'original'
    };
  }

  /**
   * 轉換後端分錄資料為標準格式
   */
  static convertBackendEntryToStandard(backendEntry: any): StandardEntryData {
    return {
      accountId: backendEntry.accountId || '',
      debitAmount: backendEntry.debitAmount || 0,
      creditAmount: backendEntry.creditAmount || 0,
      description: backendEntry.description || '',
      sourceTransactionId: backendEntry.sourceTransactionId,
      fundingPath: backendEntry.fundingPath
    };
  }

  /**
   * 準備複製模式的資料
   */
  static prepareCopyModeData(originalData: Partial<StandardTransactionData>): Partial<StandardTransactionData> {
    const result: Partial<StandardTransactionData> = {
      ...originalData,
      description: '', // 複製時清空描述
      transactionDate: new Date(), // 使用今天的日期
      receiptUrl: '', // 清空憑證 URL
      invoiceNo: '', // 清空發票號碼
      fundingType: 'original',
      // 保留分錄但清空描述
      entries: originalData.entries?.map(entry => ({
        ...entry,
        description: ''
      })) || []
    };
    
    // 清空資金來源追蹤欄位
    delete result.linkedTransactionIds;
    delete result.sourceTransactionId;
    
    return result;
  }

  /**
   * 清理資料，準備提交到後端
   */
  static cleanForSubmission(data: StandardTransactionData): any {
    return {
      description: data.description?.trim(),
      transactionDate: data.transactionDate,
      receiptUrl: data.receiptUrl?.trim() || undefined,
      invoiceNo: data.invoiceNo?.trim() || undefined,
      // 處理 organizationId：空字串轉為 null
      organizationId: data.organizationId && data.organizationId.trim() !== ''
        ? data.organizationId
        : null,
      // 資金來源追蹤欄位
      linkedTransactionIds: data.linkedTransactionIds?.length ? data.linkedTransactionIds : undefined,
      sourceTransactionId: data.sourceTransactionId || undefined,
      fundingType: data.fundingType || 'original',
      // 分錄資料
      entries: data.entries?.map(entry => ({
        accountId: entry.accountId,
        debitAmount: entry.debitAmount || 0,
        creditAmount: entry.creditAmount || 0,
        description: entry.description?.trim() || data.description?.trim(),
        sourceTransactionId: entry.sourceTransactionId,
        fundingPath: entry.fundingPath
      }))
    };
  }

  /**
   * 安全地取得巢狀物件屬性
   */
  static safeGet<T>(obj: any, path: string, defaultValue: T): T {
    try {
      return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
    } catch {
      return defaultValue;
    }
  }

  /**
   * 檢查是否為有效的 ObjectId
   */
  static isValidObjectId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }
}
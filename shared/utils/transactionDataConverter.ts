/**
 * 交易資料轉換工具 - 純函數，前後端共用
 */
import { businessLogger } from './logger';

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
      businessLogger.warn('convertBackendToStandard: 收到空的後端資料');
      return {};
    }

    // 處理後端 API 回應結構：檢查是否有 transactionGroup 包裝
    const transactionData = backendData.transactionGroup || backendData;
    const entriesData = backendData.entries || [];

    businessLogger.debug('convertBackendToStandard - 處理資料', {
      hasTransactionData: !!transactionData,
      description: transactionData?.description,
      transactionDate: transactionData?.transactionDate,
      organizationId: transactionData?.organizationId,
      entriesCount: entriesData?.length || 0
    });

    // 使用安全的日期轉換方法
    const processedDate = this.safeDateConvert(transactionData.transactionDate);

    const result = {
      description: transactionData.description || '',
      transactionDate: processedDate,
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

    businessLogger.info('convertBackendToStandard - 轉換結果', {
      description: result.description,
      transactionDate: result.transactionDate,
      organizationId: result.organizationId,
      entriesCount: result.entries.length,
      isValidResult: this.validateConversionResult(result)
    });

    // 驗證轉換結果
    if (!this.validateConversionResult(result)) {
      businessLogger.error('轉換結果驗證失敗', result);
      return {};
    }

    return result;
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
   * 安全地轉換日期
   */
  static safeDateConvert(dateValue: any): Date {
    businessLogger.debug('safeDateConvert - 輸入值', {
      dateValue,
      type: typeof dateValue,
      isObject: typeof dateValue === 'object',
      hasDateProperty: dateValue && typeof dateValue === 'object' && '$date' in dateValue,
      stringValue: String(dateValue)
    });

    if (!dateValue) {
      businessLogger.warn('safeDateConvert - 空值，使用今天日期');
      return new Date();
    }

    try {
      // 處理 MongoDB 的日期格式 { $date: "..." }
      if (typeof dateValue === 'object' && dateValue.$date) {
        businessLogger.debug('safeDateConvert - 處理 MongoDB 格式', { date: dateValue.$date });
        const converted = new Date(dateValue.$date);
        const isValid = !isNaN(converted.getTime());
        businessLogger.info('safeDateConvert - MongoDB 轉換結果', { converted, isValid });
        return isValid ? converted : new Date();
      }
      
      // 處理 ISO 字串格式
      if (typeof dateValue === 'string') {
        businessLogger.debug('safeDateConvert - 處理字串格式', { dateValue });
        const converted = new Date(dateValue);
        const isValid = !isNaN(converted.getTime());
        businessLogger.info('safeDateConvert - 字串轉換結果', { converted, isValid });
        return isValid ? converted : new Date();
      }
      
      // 處理 Date 物件
      if (dateValue instanceof Date) {
        businessLogger.debug('safeDateConvert - 已是 Date 物件', { dateValue });
        const isValid = !isNaN(dateValue.getTime());
        businessLogger.info('safeDateConvert - Date 物件驗證', { dateValue, isValid });
        return isValid ? dateValue : new Date();
      }
      
      // 處理一般格式
      businessLogger.debug('safeDateConvert - 處理一般格式', { dateValue });
      const converted = new Date(dateValue);
      const isValid = !isNaN(converted.getTime());
      businessLogger.info('safeDateConvert - 一般轉換結果', { converted, isValid });
      return isValid ? converted : new Date();
      
    } catch (error) {
      businessLogger.error('safeDateConvert - 轉換失敗，使用今天日期', { error, dateValue });
      return new Date();
    }
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

  /**
   * 驗證轉換結果的完整性
   */
  static validateConversionResult(result: any): boolean {
    return !!(
      result &&
      typeof result === 'object' &&
      Object.keys(result).length > 0 &&
      result.hasOwnProperty('description') &&
      result.hasOwnProperty('transactionDate')
    );
  }
}
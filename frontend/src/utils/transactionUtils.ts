/**
 * 交易相關工具函數
 * 統一處理交易資料轉換和驗證
 */

import { TransactionGroupFormData, AccountingEntryFormData } from '../components/accounting2/TransactionGroupForm';

export interface BackendTransactionData {
  transactionGroup?: any;
  entries?: any[];
  [key: string]: any;
}

export interface TransactionStatus {
  status: 'draft' | 'confirmed' | 'cancelled';
  canEdit: boolean;
  canDelete: boolean;
  canConfirm: boolean;
}

export class TransactionUtils {
  /**
   * 轉換後端交易資料為前端表單格式
   */
  static convertBackendToFormData(backendData: BackendTransactionData): Partial<TransactionGroupFormData> {
    if (!backendData) {
      console.warn('⚠️ convertBackendToFormData: 收到空的後端資料');
      return {};
    }

    // 處理後端 API 回應結構：檢查是否有 transactionGroup 包裝
    const transactionData = backendData.transactionGroup || backendData;
    const entriesData = backendData.entries || [];

    console.log('🔍 convertBackendToFormData - 原始資料:', {
      hasTransactionGroup: !!backendData.transactionGroup,
      transactionDataKeys: Object.keys(transactionData),
      entriesCount: entriesData.length
    });

    return {
      description: transactionData.description || '',
      transactionDate: transactionData.transactionDate ? new Date(transactionData.transactionDate) : new Date(),
      organizationId: transactionData.organizationId || undefined,
      receiptUrl: transactionData.receiptUrl || '',
      invoiceNo: transactionData.invoiceNo || '',
      entries: Array.isArray(entriesData)
        ? entriesData.map(this.convertBackendEntryToFormData)
        : [],
      // 資金來源追蹤欄位
      linkedTransactionIds: transactionData.linkedTransactionIds || undefined,
      sourceTransactionId: transactionData.sourceTransactionId || undefined,
      fundingType: transactionData.fundingType || 'original'
    };
  }

  /**
   * 轉換後端分錄資料為前端表單格式
   */
  static convertBackendEntryToFormData(backendEntry: any): AccountingEntryFormData {
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
   * 準備複製模式的表單資料
   */
  static prepareCopyModeData(originalData: Partial<TransactionGroupFormData>): Partial<TransactionGroupFormData> {
    return {
      ...originalData,
      description: '', // 複製時清空描述
      transactionDate: new Date(), // 使用今天的日期
      receiptUrl: '', // 清空憑證 URL
      invoiceNo: '', // 清空發票號碼
      // 清空資金來源追蹤欄位
      linkedTransactionIds: undefined,
      sourceTransactionId: undefined,
      fundingType: 'original',
      // 保留分錄但清空描述
      entries: originalData.entries?.map(entry => ({
        ...entry,
        description: ''
      })) || []
    };
  }

  /**
   * 驗證交易狀態並返回操作權限
   */
  static getTransactionStatus(status?: string): TransactionStatus {
    const currentStatus = (status || 'draft') as 'draft' | 'confirmed' | 'cancelled';
    
    switch (currentStatus) {
      case 'confirmed':
        return {
          status: 'confirmed',
          canEdit: false,
          canDelete: false,
          canConfirm: false
        };
      case 'cancelled':
        return {
          status: 'cancelled',
          canEdit: false,
          canDelete: false,
          canConfirm: false
        };
      default:
        return {
          status: 'draft',
          canEdit: true,
          canDelete: true,
          canConfirm: true
        };
    }
  }

  /**
   * 驗證表單資料完整性
   */
  static validateFormData(formData: TransactionGroupFormData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 基本資訊驗證
    if (!formData.description?.trim()) {
      errors.push('請輸入交易描述');
    }

    if (!formData.transactionDate) {
      errors.push('請選擇交易日期');
    }

    // 分錄驗證
    if (!formData.entries || formData.entries.length < 2) {
      errors.push('複式記帳至少需要兩筆分錄');
    } else {
      // 檢查每筆分錄的完整性
      const invalidEntries = formData.entries.filter((entry, index) => {
        if (!entry.accountId) {
          errors.push(`分錄 ${index + 1}: 請選擇會計科目`);
          return true;
        }
        if (entry.debitAmount === 0 && entry.creditAmount === 0) {
          errors.push(`分錄 ${index + 1}: 請輸入借方或貸方金額`);
          return true;
        }
        if (entry.debitAmount > 0 && entry.creditAmount > 0) {
          errors.push(`分錄 ${index + 1}: 借方和貸方金額不能同時大於0`);
          return true;
        }
        return false;
      });

      // 檢查借貸平衡
      if (invalidEntries.length === 0) {
        const totalDebit = formData.entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
        const totalCredit = formData.entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
        const difference = Math.abs(totalDebit - totalCredit);

        if (difference > 0.01) {
          errors.push(`借貸不平衡，差額：NT$ ${difference.toFixed(2)}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 清理表單資料，準備提交到後端
   */
  static cleanFormDataForSubmission(formData: TransactionGroupFormData): any {
    return {
      description: formData.description?.trim(),
      transactionDate: formData.transactionDate,
      receiptUrl: formData.receiptUrl?.trim() || undefined,
      invoiceNo: formData.invoiceNo?.trim() || undefined,
      // 處理 organizationId：空字串轉為 null
      organizationId: formData.organizationId && formData.organizationId.trim() !== ''
        ? formData.organizationId
        : null,
      // 資金來源追蹤欄位
      linkedTransactionIds: formData.linkedTransactionIds?.length ? formData.linkedTransactionIds : undefined,
      sourceTransactionId: formData.sourceTransactionId || undefined,
      fundingType: formData.fundingType || 'original',
      // 分錄資料
      entries: formData.entries?.map(entry => ({
        accountId: entry.accountId,
        debitAmount: entry.debitAmount || 0,
        creditAmount: entry.creditAmount || 0,
        description: entry.description?.trim() || formData.description?.trim(),
        sourceTransactionId: entry.sourceTransactionId,
        fundingPath: entry.fundingPath
      }))
    };
  }

  /**
   * 格式化狀態顯示文字
   */
  static getStatusDisplayInfo(status: string) {
    switch (status) {
      case 'confirmed':
        return {
          label: '已確認',
          color: 'success' as const,
          bgColor: '#e8f5e8'
        };
      case 'cancelled':
        return {
          label: '已取消',
          color: 'error' as const,
          bgColor: '#ffeaea'
        };
      default:
        return {
          label: '草稿',
          color: 'warning' as const,
          bgColor: '#fff8e1'
        };
    }
  }

  /**
   * 檢查是否為有效的 ObjectId
   */
  static isValidObjectId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
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
   * 計算交易總金額（借方總額）
   */
  static calculateTotalAmount(entries: AccountingEntryFormData[]): number {
    return entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
  }

  /**
   * 檢查借貸平衡
   */
  static checkBalance(entries: AccountingEntryFormData[]): {
    isBalanced: boolean;
    totalDebit: number;
    totalCredit: number;
    difference: number;
  } {
    const totalDebit = entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
    const totalCredit = entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
    const difference = Math.abs(totalDebit - totalCredit);
    
    return {
      isBalanced: difference < 0.01,
      totalDebit,
      totalCredit,
      difference
    };
  }
}
import { TransactionGroupWithEntriesFormData } from '@pharmacy-pos/shared';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  balanceError: string;
}

/**
 * 驗證交易表單
 */
export const validateTransactionForm = (
  formData: TransactionGroupWithEntriesFormData,
  mode: 'create' | 'edit' | 'view' = 'create'
): ValidationResult => {
  try {
    // 準備驗證資料
    const transactionData = {
      description: formData.description,
      transactionDate: formData.transactionDate,
      entries: formData.entries || []
    };

    console.log('🔍 開始驗證交易資料:', transactionData);

    // 基本資訊驗證
    const errors: string[] = [];
    
    if (!transactionData.description || transactionData.description.trim() === '') {
      errors.push('請輸入交易描述');
    }
    
    if (!transactionData.transactionDate || (transactionData.transactionDate instanceof Date && isNaN(transactionData.transactionDate.getTime()))) {
      errors.push('請選擇有效的交易日期');
    }

    // 分錄驗證（如果有分錄）
    if (transactionData.entries && transactionData.entries.length > 0) {
      // 檢查分錄完整性
      const incompleteEntries = transactionData.entries.filter(entry => 
        !entry.accountId || 
        (entry.debitAmount === 0 && entry.creditAmount === 0) ||
        (entry.debitAmount > 0 && entry.creditAmount > 0)
      );
      
      if (incompleteEntries.length > 0) {
        errors.push('請完整填寫所有分錄資訊');
      }
      
      // 檢查借貸平衡
      const totalDebit = transactionData.entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
      const totalCredit = transactionData.entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
      
      if (Math.abs(totalDebit - totalCredit) >= 0.01) {
        errors.push(`借貸不平衡：借方總額 ${totalDebit}，貸方總額 ${totalCredit}`);
      }
      
      // 檢查序號唯一性
      const sequences = transactionData.entries.map(entry => entry.sequence).filter(seq => seq !== undefined);
      const uniqueSequences = new Set(sequences);
      if (sequences.length !== uniqueSequences.size) {
        errors.push('分錄序號不能重複');
      }
    } else if (mode === 'create') {
      // 建立模式必須有分錄
      errors.push('請至少新增兩筆分錄');
    }
    
    console.log('✅ 驗證結果:', { isValid: errors.length === 0, errors });

    if (errors.length === 0) {
      return {
        isValid: true,
        errors: {},
        balanceError: ''
      };
    } else {
      // 處理驗證錯誤
      const formErrors: Record<string, string> = {};
      let balanceErrorMessage = '';
      
      errors.forEach(errorMessage => {
        // 檢查是否為借貸平衡錯誤
        if (errorMessage.includes('借貸不平衡')) {
          balanceErrorMessage = errorMessage;
        } else if (errorMessage.includes('請輸入交易描述')) {
          formErrors.description = errorMessage;
        } else if (errorMessage.includes('請選擇')) {
          formErrors.transactionDate = errorMessage;
        } else {
          // 其他分錄相關錯誤
          formErrors.entries = errorMessage;
        }
      });

      return {
        isValid: false,
        errors: formErrors,
        balanceError: balanceErrorMessage
      };
    }
  } catch (error) {
    console.error('❌ 驗證過程發生錯誤:', error);
    return {
      isValid: false,
      errors: { general: '驗證過程發生錯誤' },
      balanceError: ''
    };
  }
};
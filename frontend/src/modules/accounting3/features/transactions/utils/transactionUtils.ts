import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { TRANSACTION_STATUS_3, FUNDING_TYPES_3 } from '@pharmacy-pos/shared/types/accounting3';

/**
 * 格式化金額為台幣顯示格式
 *
 * @param {number} amount - 要格式化的金額
 * @returns {string} 格式化後的金額字串，例如 "NT$1,234"
 * @example
 * formatAmount(1234.56); // 返回 "NT$1,235"
 */
export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * 格式化日期為台灣地區常用格式
 *
 * @param {string | Date} date - 要格式化的日期
 * @returns {string} 格式化後的日期字串，格式為 yyyy/MM/dd
 * @example
 * formatDate('2023-01-15'); // 返回 "2023/01/15"
 * formatDate(new Date(2023, 0, 15)); // 返回 "2023/01/15"
 */
export const formatDate = (date: string | Date): string => {
  return format(new Date(date), 'yyyy/MM/dd', { locale: zhTW });
};

/**
 * 格式化日期 - 僅年月日，不包含時間
 *
 * @param {string | Date} date - 要格式化的日期
 * @returns {string} 格式化後的日期字串，格式為 yyyy/MM/dd
 * @example
 * formatDateOnly('2023-01-15T12:30:45'); // 返回 "2023/01/15"
 */
export const formatDateOnly = (date: string | Date): string => {
  return format(new Date(date), 'yyyy/MM/dd', { locale: zhTW });
};

/**
 * 獲取交易狀態的顯示資訊
 *
 * 根據交易狀態代碼返回對應的顯示標籤和顏色。
 *
 * @param {string} status - 交易狀態代碼 ('draft', 'confirmed', 'cancelled' 等)
 * @returns {object} 包含標籤和顏色的物件
 * @returns {string} return.label - 狀態的顯示標籤
 * @returns {string} return.color - 狀態的顯示顏色 ('success', 'error', 'warning')
 * @example
 * getStatusInfo('confirmed'); // 返回 { label: '已確認', color: 'success' }
 * getStatusInfo('draft'); // 返回 { label: '草稿', color: 'warning' }
 */
export const getStatusInfo = (status: string) => {
  const statusConfig = TRANSACTION_STATUS_3.find(s => s.value === status);
  return {
    label: statusConfig?.label || status,
    color: status === 'confirmed' ? 'success' : status === 'cancelled' ? 'error' : 'warning'
  };
};

/**
 * 獲取資金類型的顯示資訊
 *
 * 根據資金類型代碼返回對應的顯示標籤和顏色。
 *
 * @param {string} fundingType - 資金類型代碼 ('original', 'extension', 'payment' 等)
 * @returns {object} 包含標籤和顏色的物件
 * @returns {string} return.label - 資金類型的顯示標籤
 * @returns {string} return.color - 資金類型的顯示顏色
 * @example
 * getFundingTypeInfo('original'); // 返回 { label: '原始資金', color: '#1976d2' }
 * getFundingTypeInfo('extension'); // 返回 { label: '延伸使用', color: '#2e7d32' }
 */
export const getFundingTypeInfo = (fundingType: string) => {
  const typeConfig = FUNDING_TYPES_3.find(t => t.value === fundingType);
  return {
    label: typeConfig?.label || fundingType,
    color: typeConfig?.color || '#666'
  };
};

/**
 * 提取 ObjectId 字串 - 處理完整交易物件
 *
 * 從各種可能的 MongoDB ObjectId 格式中提取字串形式的 ID。
 * 可以處理字串、物件、MongoDB ObjectId 等多種格式。
 *
 * @param {any} idValue - 要提取 ID 的值，可以是字串、物件或 MongoDB ObjectId
 * @returns {string} 提取出的 ID 字串，如果無法提取則返回空字串
 * @example
 * extractObjectId('60f1e5b3e6b1f83b3c7a1b5a'); // 返回 '60f1e5b3e6b1f83b3c7a1b5a'
 * extractObjectId({ _id: '60f1e5b3e6b1f83b3c7a1b5a' }); // 返回 '60f1e5b3e6b1f83b3c7a1b5a'
 * extractObjectId({ $oid: '60f1e5b3e6b1f83b3c7a1b5a' }); // 返回 '60f1e5b3e6b1f83b3c7a1b5a'
 */
export const extractObjectId = (idValue: any): string => {
  if (!idValue) return '';
  
  // 如果已經是字串，直接返回
  if (typeof idValue === 'string') {
    return idValue;
  }
  
  // 如果是物件，檢查各種可能的 ObjectId 格式
  if (typeof idValue === 'object' && idValue !== null) {
    // 優先檢查是否是完整的交易物件（有 _id 屬性）
    if (idValue._id) {
      // 如果 _id 是 MongoDB ObjectId 格式: {$oid: "actual_id"}
      if (typeof idValue._id === 'object' && idValue._id.$oid) {
        return idValue._id.$oid;
      }
      // 如果 _id 是直接的字串
      if (typeof idValue._id === 'string') {
        return idValue._id;
      }
    }
    
    // MongoDB 標準格式: {$oid: "actual_id"}
    if (idValue.$oid && typeof idValue.$oid === 'string') {
      return idValue.$oid;
    }
    
    // 檢查是否有 toHexString 方法（Mongoose ObjectId）
    if (typeof idValue.toHexString === 'function') {
      try {
        return idValue.toHexString();
      } catch (e) {
        console.warn('❌ toHexString() 失敗:', e);
      }
    }
    
    // 檢查是否有 toString 方法
    if (typeof idValue.toString === 'function') {
      try {
        const stringValue = idValue.toString();
        if (stringValue !== '[object Object]') {
          return stringValue;
        }
      } catch (e) {
        console.warn('❌ toString() 失敗:', e);
      }
    }
  }
  
  // 最後嘗試直接字串轉換
  const stringValue = String(idValue);
  if (stringValue !== '[object Object]') {
    return stringValue;
  }
  
  console.error('❌ 無法提取 ObjectId:', idValue);
  return '';
};

/**
 * 驗證 ID 是否為有效的 MongoDB ObjectId
 *
 * MongoDB ObjectId 應該是 24 個字符的十六進制字串。
 * 此函數檢查提供的 ID 是否符合此格式。
 *
 * @param {string} id - 要驗證的 ID 字串
 * @returns {boolean} 如果 ID 有效則返回 true，否則返回 false
 * @example
 * isValidObjectId('60f1e5b3e6b1f83b3c7a1b5a'); // 返回 true
 * isValidObjectId('invalid-id'); // 返回 false
 * isValidObjectId(''); // 返回 false
 */
export const isValidObjectId = (id: string): boolean => {
  return Boolean(id && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id));
};

/**
 * 清理和驗證交易 ID
 *
 * 處理各種格式的交易 ID 輸入，進行清理和驗證，返回標準化的結果。
 * 此函數可以處理字串、物件等多種輸入格式，並進行全面的驗證。
 *
 * @param {any} transactionId - 要清理和驗證的交易 ID
 * @returns {object} 包含清理和驗證結果的物件
 * @returns {string} return.cleanId - 清理後的 ID 字串
 * @returns {boolean} return.isValid - ID 是否有效
 * @returns {string} [return.error] - 如果 ID 無效，包含錯誤訊息
 * @example
 * cleanAndValidateTransactionId('60f1e5b3e6b1f83b3c7a1b5a');
 * // 返回 { cleanId: '60f1e5b3e6b1f83b3c7a1b5a', isValid: true }
 *
 * cleanAndValidateTransactionId({ _id: '60f1e5b3e6b1f83b3c7a1b5a' });
 * // 返回 { cleanId: '60f1e5b3e6b1f83b3c7a1b5a', isValid: true }
 *
 * cleanAndValidateTransactionId('invalid-id');
 * // 返回 { cleanId: 'invalid-id', isValid: false, error: '無效的交易ID' }
 */
export const cleanAndValidateTransactionId = (transactionId: any): { cleanId: string; isValid: boolean; error?: string } => {
  console.log('🔍 清理交易 ID - 原始:', transactionId);
  console.log('🔍 清理交易 ID - 類型:', typeof transactionId);
  
  let cleanTransactionId = transactionId;
  
  // 檢查是否是無效的 ID
  if (!transactionId || transactionId === '[object Object]' || transactionId === 'undefined' || transactionId === 'null') {
    console.error('❌ 無效的 transactionId:', transactionId);
    return { cleanId: '', isValid: false, error: '無效的交易ID' };
  }
  
  // 如果是物件，嘗試提取 ID
  if (typeof transactionId === 'object' && transactionId !== null) {
    console.log('🔍 處理物件類型的 transactionId');
    const idObj = transactionId as any;
    
    if (typeof idObj.toString === 'function') {
      cleanTransactionId = idObj.toString();
    } else if (idObj.$oid) {
      cleanTransactionId = idObj.$oid;
    } else if (idObj.toHexString && typeof idObj.toHexString === 'function') {
      cleanTransactionId = idObj.toHexString();
    } else {
      cleanTransactionId = String(transactionId);
    }
    
    console.log('✅ 清理後的 ID:', cleanTransactionId);
    
    // 再次檢查清理後的 ID
    if (cleanTransactionId === '[object Object]') {
      console.error('❌ 清理後仍然是無效 ID');
      return { cleanId: '', isValid: false, error: '無法解析交易ID' };
    }
  }
  
  const isValid = isValidObjectId(cleanTransactionId);
  console.log('🚀 最終 ID 驗證:', { cleanTransactionId, isValid });
  
  return { cleanId: cleanTransactionId, isValid };
};
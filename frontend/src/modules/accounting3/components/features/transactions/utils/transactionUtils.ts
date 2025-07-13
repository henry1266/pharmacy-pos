import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { TRANSACTION_STATUS_3, FUNDING_TYPES_3 } from '@pharmacy-pos/shared/types/accounting3';

/**
 * 格式化金額
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
 * 格式化日期
 */
export const formatDate = (date: string | Date): string => {
  return format(new Date(date), 'yyyy年MM月dd日 HH:mm', { locale: zhTW });
};

/**
 * 獲取狀態顯示資訊
 */
export const getStatusInfo = (status: string) => {
  const statusConfig = TRANSACTION_STATUS_3.find(s => s.value === status);
  return {
    label: statusConfig?.label || status,
    color: status === 'confirmed' ? 'success' : status === 'cancelled' ? 'error' : 'warning'
  };
};

/**
 * 獲取資金類型顯示資訊
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
 * 驗證 ID 是否有效（MongoDB ObjectId 應該是 24 個字符的十六進制字串）
 */
export const isValidObjectId = (id: string): boolean => {
  return id && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * 清理和驗證交易 ID
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
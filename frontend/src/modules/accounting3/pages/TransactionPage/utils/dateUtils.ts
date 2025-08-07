/**
 * 安全的日期轉換函數
 * 將各種格式的日期值轉換為 Date 對象
 * @param dateValue 日期值，可以是字符串、Date 對象或帶有 $date 屬性的對象
 * @returns 轉換後的 Date 對象，如果轉換失敗則返回當前日期
 */
export const safeDateConvert = (dateValue: any): Date => {
  if (!dateValue) return new Date();
  
  try {
    if (typeof dateValue === 'object' && dateValue.$date) {
      const converted = new Date(dateValue.$date);
      return !isNaN(converted.getTime()) ? converted : new Date();
    }
    
    const converted = new Date(dateValue);
    return !isNaN(converted.getTime()) ? converted : new Date();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ 日期轉換失敗:', error);
    }
    return new Date();
  }
};

/**
 * 將表單數據中的分錄轉換為 API 數據格式
 * @param entries 分錄數組
 * @returns 轉換後的分錄數組
 */
export const convertEntriesToFormData = (entries: any[]): any[] => {
  return Array.isArray(entries) ? entries.map(entry => ({
    _id: entry._id,
    sequence: entry.sequence || 1,
    accountId: typeof entry.accountId === 'string' ? entry.accountId : entry.accountId?._id || '',
    debitAmount: entry.debitAmount || 0,
    creditAmount: entry.creditAmount || 0,
    description: entry.description || '',
    sourceTransactionId: entry.sourceTransactionId || '',
    fundingPath: entry.fundingPath || []
  })) : [];
};

/**
 * 將日期格式化為字符串
 * @param date 日期對象
 * @param format 格式化字符串，默認為 'yyyy-MM-dd'
 * @returns 格式化後的日期字符串
 */
export const formatDateToString = (date: Date | null, format: string = 'yyyy-MM-dd'): string => {
  if (!date) return '';
  
  try {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    let result = format;
    result = result.replace('yyyy', String(year));
    result = result.replace('MM', month);
    result = result.replace('dd', day);
    
    return result;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ 日期格式化失敗:', error);
    }
    return '';
  }
};
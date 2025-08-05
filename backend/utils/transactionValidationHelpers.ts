import express from 'express';
import mongoose from 'mongoose';
import TransactionGroupWithEntries from '../models/TransactionGroupWithEntries';

/**
 * 交易驗證和查詢輔助函數
 */

// 擴展 Request 介面
export interface AuthenticatedRequest extends express.Request {
  user?: {
    id: string;
    userId?: string;
  };
  query: any;
  params: any;
  body: any;
}

// 標準化錯誤回應
export const sendErrorResponse = (
  res: express.Response,
  status: number,
  message: string,
  data?: any
): void => {
  res.status(status).json({
    success: false,
    message,
    ...(data && { data })
  });
};

// 標準化成功回應
export const sendSuccessResponse = (
  res: express.Response,
  data: any,
  message?: string,
  status: number = 200
): void => {
  res.status(status).json({
    success: true,
    data,
    ...(message && { message })
  });
};

// 驗證用戶授權
export const validateUserAuth = (req: AuthenticatedRequest, res: express.Response): string | null => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    sendErrorResponse(res, 401, '未授權的請求');
    return null;
  }
  return userId;
};

// 查詢並驗證交易群組存在性和所有權
export const findAndValidateTransactionGroup = async (
  id: string,
  userId: string,
  res: express.Response
): Promise<any | null> => {
  try {
    const transactionGroup = await TransactionGroupWithEntries.findOne({
      _id: id,
      createdBy: userId
    });

    if (!transactionGroup) {
      sendErrorResponse(res, 404, '找不到指定的交易群組');
      return null;
    }

    return transactionGroup;
  } catch (error) {
    console.error('查詢交易群組錯誤:', error);
    sendErrorResponse(res, 500, '查詢交易群組失敗');
    return null;
  }
};

// 驗證交易群組狀態
export const validateTransactionStatus = (
  transactionGroup: any,
  res: express.Response,
  allowedStatuses: string[] = ['draft']
): boolean => {
  if (!allowedStatuses.includes(transactionGroup.status)) {
    const statusMessages: { [key: string]: string } = {
      confirmed: '已確認的交易不能修改',
      cancelled: '已取消的交易不能操作'
    };
    
    const message = statusMessages[transactionGroup.status] || `交易狀態 ${transactionGroup.status} 不允許此操作`;
    sendErrorResponse(res, 400, message);
    return false;
  }
  return true;
};

// 驗證交易確認前的條件
export const validateTransactionForConfirmation = (
  transactionGroup: any,
  res: express.Response
): boolean => {
  // 檢查是否已確認
  if (transactionGroup.status === 'confirmed') {
    sendErrorResponse(res, 400, '交易已經確認過了');
    return false;
  }

  // 檢查是否已取消
  if (transactionGroup.status === 'cancelled') {
    sendErrorResponse(res, 400, '已取消的交易不能確認');
    return false;
  }

  // 驗證內嵌分錄存在
  if (!transactionGroup.entries || transactionGroup.entries.length === 0) {
    sendErrorResponse(res, 400, '交易群組沒有分錄，無法確認');
    return false;
  }

  return true;
};

// 驗證交易解鎖條件
export const validateTransactionForUnlock = async (
  transactionGroup: any,
  userId: string,
  res: express.Response
): Promise<boolean> => {
  // 檢查是否為已確認狀態
  if (transactionGroup.status !== 'confirmed') {
    sendErrorResponse(res, 400, '只有已確認的交易才能解鎖');
    return false;
  }

  // 檢查是否有其他交易依賴此交易作為資金來源
  const dependentTransactions = await TransactionGroupWithEntries.find({
    linkedTransactionIds: transactionGroup._id,
    status: { $ne: 'cancelled' },
    createdBy: userId
  });

  if (dependentTransactions.length > 0) {
    sendErrorResponse(res, 400, `無法解鎖此交易，因為有 ${dependentTransactions.length} 筆交易依賴此交易作為資金來源`, {
      dependentTransactions: dependentTransactions.map(tx => ({
        _id: tx._id,
        groupNumber: tx.groupNumber,
        description: tx.description,
        totalAmount: tx.totalAmount,
        status: tx.status
      }))
    });
    return false;
  }

  return true;
};

// 建立查詢過濾條件
export const buildQueryFilter = (
  userId: string,
  query: any
): any => {
  const {
    organizationId,
    status,
    startDate,
    endDate
  } = query;

  // 建立基本查詢條件
  const filter: any = {
    createdBy: userId
  };

  // 機構過濾
  if (organizationId && organizationId !== 'undefined' && organizationId !== '') {
    filter.organizationId = new mongoose.Types.ObjectId(organizationId as string);
    console.log('🏢 查詢機構交易群組:', organizationId);
  } else {
    console.log('👤 查詢所有交易群組（包含個人和機構）');
  }

  // 狀態過濾
  if (status && ['draft', 'confirmed', 'cancelled'].includes(status as string)) {
    filter.status = status;
  }

  // 日期範圍過濾
  if (startDate || endDate) {
    filter.transactionDate = {};
    if (startDate) {
      filter.transactionDate.$gte = new Date(startDate as string);
    }
    if (endDate) {
      filter.transactionDate.$lte = new Date(endDate as string);
    }
  }

  return filter;
};

// 建立分頁參數
export const buildPaginationParams = (query: any): {
  pageNum: number;
  limitNum: number;
  skip: number;
} => {
  const { page = 1, limit = 10000 } = query;  // 將默認 limit 設置為 10000，確保能獲取所有數據
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  return { pageNum, limitNum, skip };
};

// 驗證基本交易資料
export const validateBasicTransactionData = (
  body: any,
  res: express.Response
): boolean => {
  const { description, transactionDate, entries } = body;

  // 驗證描述
  if (!description || typeof description !== 'string' || description.trim() === '') {
    console.error('❌ 交易描述驗證失敗:', { description, type: typeof description });
    sendErrorResponse(res, 400, '交易描述不能為空');
    return false;
  }

  // 驗證日期
  if (!transactionDate) {
    console.error('❌ 交易日期驗證失敗:', { transactionDate });
    sendErrorResponse(res, 400, '交易日期不能為空');
    return false;
  }

  // 驗證日期格式
  const parsedDate = new Date(transactionDate);
  if (isNaN(parsedDate.getTime())) {
    console.error('❌ 交易日期格式錯誤:', { transactionDate, parsedDate });
    sendErrorResponse(res, 400, '交易日期格式錯誤');
    return false;
  }

  // 驗證分錄
  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    console.error('❌ 分錄資料驗證失敗:', {
      entries,
      isArray: Array.isArray(entries),
      length: entries?.length
    });
    sendErrorResponse(res, 400, '請至少提供一筆分錄');
    return false;
  }

  // 驗證分錄數量
  if (entries.length < 2) {
    console.error('❌ 分錄數量不足:', { entriesLength: entries.length });
    sendErrorResponse(res, 400, '複式記帳至少需要兩筆分錄');
    return false;
  }

  return true;
};

// 統一錯誤處理
export const handleRouteError = (
  error: any,
  res: express.Response,
  operation: string
): void => {
  console.error(`❌ ${operation}錯誤:`, error);
  console.error('❌ 錯誤堆疊:', error instanceof Error ? error.stack : 'Unknown error');
  console.error('❌ 錯誤詳情:', {
    name: error instanceof Error ? error.name : 'Unknown',
    message: error instanceof Error ? error.message : String(error),
    code: (error as any)?.code,
    keyPattern: (error as any)?.keyPattern,
    keyValue: (error as any)?.keyValue
  });
  
  res.status(500).json({
    success: false,
    message: `${operation}失敗`,
    error: process.env.NODE_ENV === 'development' ? {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    } : undefined
  });
};
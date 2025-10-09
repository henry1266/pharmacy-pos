import { Request, Response, NextFunction } from 'express';
import DoubleEntryValidator from '../utils/doubleEntryValidation';
import { IAccountingEntry } from '../models/AccountingEntry';

/**
 * 借貸平衡驗證中間件
 * 用於驗證交易群組中的記帳分錄是否符合複式記帳原理
 */

/**
 * 驗證請求體中的記帳分錄借貸平衡
 * 適用於建立或更新交易群組的 API
 */
export const validateDoubleEntryBalance = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { entries } = req.body;

    // 檢查是否有分錄資料
    if (!entries || !Array.isArray(entries)) {
      res.status(400).json({
        success: false,
        message: '缺少記帳分錄資料或格式錯誤',
        error: 'MISSING_ENTRIES'
      });
      return;
    }

    // 檢查分錄數量
    if (entries.length < 2) {
      res.status(400).json({
        success: false,
        message: '複式記帳至少需要兩筆分錄',
        error: 'INSUFFICIENT_ENTRIES'
      });
      return;
    }

    // 驗證借貸平衡
    const validation = DoubleEntryValidator.validateTransactionGroup(entries as IAccountingEntry[]);
    
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        message: '借貸不平衡',
        error: 'UNBALANCED_ENTRIES',
        details: {
          totalDebit: validation.balanceInfo.totalDebit,
          totalCredit: validation.balanceInfo.totalCredit,
          difference: validation.balanceInfo.difference,
          errors: validation.errors
        }
      });
      return;
    }

    // 驗證通過，繼續處理
    next();
  } catch (error) {
    console.error('借貸平衡驗證中間件錯誤:', error);
    res.status(500).json({
      success: false,
      message: '借貸平衡驗證失敗',
      error: 'VALIDATION_ERROR'
    });
  }
};

/**
 * 驗證單筆記帳分錄的基本格式
 * 適用於建立或更新單筆分錄的 API
 */
export const validateSingleEntry = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const entry = req.body;

    // 檢查必要欄位
    const requiredFields = ['accountId', 'description'];
    const missingFields = requiredFields.filter(field => !entry[field]);

    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        message: `缺少必要欄位: ${missingFields.join(', ')}`,
        error: 'MISSING_REQUIRED_FIELDS',
        details: { missingFields }
      });
      return;
    }

    // 檢查借方和貸方金額
    const debitAmount = parseFloat(entry.debitAmount || 0);
    const creditAmount = parseFloat(entry.creditAmount || 0);

    if (isNaN(debitAmount) || isNaN(creditAmount)) {
      res.status(400).json({
        success: false,
        message: '借方金額和貸方金額必須為有效數字',
        error: 'INVALID_AMOUNT_FORMAT'
      });
      return;
    }

    if (debitAmount < 0 || creditAmount < 0) {
      res.status(400).json({
        success: false,
        message: '借方金額和貸方金額不能為負數',
        error: 'NEGATIVE_AMOUNT'
      });
      return;
    }

    if (debitAmount === 0 && creditAmount === 0) {
      res.status(400).json({
        success: false,
        message: '借方金額或貸方金額至少要有一個大於0',
        error: 'ZERO_AMOUNTS'
      });
      return;
    }

    if (debitAmount > 0 && creditAmount > 0) {
      res.status(400).json({
        success: false,
        message: '借方金額和貸方金額不能同時大於0',
        error: 'BOTH_AMOUNTS_POSITIVE'
      });
      return;
    }

    // 驗證通過，繼續處理
    next();
  } catch (error) {
    console.error('單筆分錄驗證中間件錯誤:', error);
    res.status(500).json({
      success: false,
      message: '分錄驗證失敗',
      error: 'VALIDATION_ERROR'
    });
  }
};

/**
 * 驗證交易群組的基本格式
 * 適用於建立或更新交易群組的 API
 */
export const validateTransactionGroup = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { description, date, reference } = req.body;

    // 檢查必要欄位
    if (!description || description.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: '交易描述不能為空',
        error: 'MISSING_DESCRIPTION'
      });
      return;
    }

    // 檢查日期格式
    if (date && isNaN(Date.parse(date))) {
      res.status(400).json({
        success: false,
        message: '日期格式錯誤',
        error: 'INVALID_DATE_FORMAT'
      });
      return;
    }

    // 檢查參考號碼長度
    if (reference && reference.length > 50) {
      res.status(400).json({
        success: false,
        message: '參考號碼長度不能超過 50 字元',
        error: 'REFERENCE_TOO_LONG'
      });
      return;
    }

    // 驗證通過，繼續處理
    next();
  } catch (error) {
    console.error('交易群組驗證中間件錯誤:', error);
    res.status(500).json({
      success: false,
      message: '交易群組驗證失敗',
      error: 'VALIDATION_ERROR'
    });
  }
};

/**
 * 組合驗證中間件：交易群組 + 借貸平衡
 * 用於建立完整交易的 API 端點
 */
export const validateCompleteTransaction = [
  validateTransactionGroup,
  validateDoubleEntryBalance
];
/**
 * 會計系統 API 橋接層
 * 處理 Accounting2 介面與 Accounting3 資料結構之間的 API 相容性
 */

import { Request, Response, NextFunction } from 'express';
import { Account2, TransactionGroupWithEntries } from '../../shared/types/accounting2';
import { Accounting3To2Adapter, AccountManagementFormatter } from '../../shared/adapters/accounting3to2';

/**
 * API 橋接中介軟體
 * 自動處理請求和回應的資料格式轉換
 */
export class AccountingApiBridge {
  /**
   * 科目管理 API 橋接中介軟體
   * 將 Accounting2 介面請求轉換為 Accounting3 資料操作
   */
  static accountManagementBridge() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // 儲存原始的 res.json 方法
        const originalJson = res.json.bind(res);

        // 覆寫 res.json 以處理回應資料轉換
        res.json = function(data: any) {
          if (data && typeof data === 'object') {
            // 如果回應包含 TransactionGroupWithEntries 資料，進行轉換
            if (Array.isArray(data) && data.length > 0 && data[0].entries) {
              // 轉換為 Accounting2 格式
              const convertedData = data.map((transaction: TransactionGroupWithEntries) => 
                Accounting3To2Adapter.convertToLegacyTransactionGroup(transaction)
              );
              return originalJson(convertedData);
            }

            // 如果是科目餘額查詢，添加計算的餘額資訊
            if (data.accounts && Array.isArray(data.accounts)) {
              const enhancedAccounts = data.accounts.map((account: Account2) => {
                if (data.transactions) {
                  return AccountManagementFormatter.formatAccountBalance(
                    account,
                    data.transactions
                  );
                }
                return account;
              });
              return originalJson({ ...data, accounts: enhancedAccounts });
            }
          }

          return originalJson(data);
        };

        // 處理請求資料轉換
        if (req.body && typeof req.body === 'object') {
          // 如果是建立交易的請求，轉換為 Accounting3 格式
          if (req.body.entries && Array.isArray(req.body.entries)) {
            // 使用靜態方法處理請求資料
            req.body.entries = req.body.entries.map((entry: any) => ({
              ...entry,
              // 確保必要欄位存在
              debitAmount: entry.debitAmount || 0,
              creditAmount: entry.creditAmount || 0,
              sequence: entry.sequence || 1
            }));
          }
        }

        next();
      } catch (error) {
        console.error('API 橋接錯誤:', error);
        next(error);
      }
    };
  }

  /**
   * 科目統計 API 橋接
   * 提供科目管理介面需要的統計資料
   */
  static accountStatisticsBridge() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const originalJson = res.json.bind(res);

        res.json = function(data: any) {
          if (data && data.transactions && Array.isArray(data.transactions)) {
            const { accountId } = req.params;
            
            if (accountId) {
              // 計算科目統計資訊
              const statistics = AccountManagementFormatter.formatAccountStatistics(
                accountId,
                data.transactions
              );

              // 格式化分錄明細
              const entries = AccountManagementFormatter.formatEntriesForDataGrid(
                accountId,
                data.transactions
              );

              return originalJson({
                ...data,
                statistics,
                entries
              });
            }
          }

          return originalJson(data);
        };

        next();
      } catch (error) {
        console.error('科目統計橋接錯誤:', error);
        next(error);
      }
    };
  }

  /**
   * 資料驗證橋接
   * 確保轉換後的資料完整性
   */
  static dataValidationBridge() {
    return async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const originalJson = res.json.bind(res);

        res.json = function(data: any) {
          if (data && Array.isArray(data)) {
            // 驗證轉換後的資料
            const validationResults = data.map((item: any) => {
              if (item.entries && Array.isArray(item.entries)) {
                // 使用正確的參數調用驗證函數
                return Accounting3To2Adapter.validateConversion(
                  item.entries,
                  item.groupNumber || 'Unknown',
                  item.transactionDate || new Date()
                );
              }
              return { isValid: true, errors: [] };
            });

            // 如果有驗證錯誤，記錄但不阻止回應
            const hasErrors = validationResults.some(result => !result.isValid);
            if (hasErrors) {
              console.warn('資料轉換驗證警告:', validationResults.filter(r => !r.isValid));
            }
          }

          return originalJson(data);
        };

        next();
      } catch (error) {
        console.error('資料驗證橋接錯誤:', error);
        next(error);
      }
    };
  }

  /**
   * 錯誤處理橋接
   * 統一處理橋接過程中的錯誤
   */
  static errorHandlingBridge() {
    return (error: any, _req: Request, res: Response, next: NextFunction): void => {
      if (error.name === 'AccountingBridgeError') {
        res.status(400).json({
          error: '會計系統橋接錯誤',
          message: error.message,
          details: error.details || {}
        });
        return;
      }

      next(error);
    };
  }
}

/**
 * 橋接工具函數
 */
export class BridgeUtils {
  /**
   * 檢查請求是否需要橋接處理
   */
  static needsBridging(req: Request): boolean {
    // 檢查是否為科目管理相關的 API
    const accountManagementPaths = [
      '/api/accounts',
      '/api/account-management',
      '/api/transactions/by-account'
    ];

    return accountManagementPaths.some(path => req.path.includes(path));
  }

  /**
   * 檢查資料格式
   */
  static isAccounting3Format(data: any): boolean {
    return data && 
           typeof data === 'object' && 
           data.entries && 
           Array.isArray(data.entries) &&
           data.entries.length > 0 &&
           data.entries[0].accountId !== undefined;
  }

  /**
   * 檢查是否為 Accounting2 格式
   */
  static isAccounting2Format(data: any): boolean {
    return data && 
           Array.isArray(data) &&
           data.length > 0 &&
           data[0].accountId !== undefined &&
           data[0].transactionGroupId !== undefined;
  }
}

/**
 * 自訂錯誤類別
 */
export class AccountingBridgeError extends Error {
  public details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'AccountingBridgeError';
    this.details = details;
  }
}

/**
 * 橋接配置
 */
export interface BridgeConfig {
  enableValidation: boolean;
  enableLogging: boolean;
  enableErrorHandling: boolean;
  validationLevel: 'strict' | 'warning' | 'none';
}

/**
 * 預設橋接配置
 */
export const defaultBridgeConfig: BridgeConfig = {
  enableValidation: true,
  enableLogging: true,
  enableErrorHandling: true,
  validationLevel: 'warning'
};

/**
 * 橋接管理器
 * 統一管理所有橋接中介軟體
 */
export class BridgeManager {
  private config: BridgeConfig;

  constructor(config: BridgeConfig = defaultBridgeConfig) {
    this.config = config;
  }

  /**
   * 取得完整的橋接中介軟體堆疊
   */
  getMiddlewareStack() {
    const middlewares = [];

    // 主要橋接中介軟體
    middlewares.push(AccountingApiBridge.accountManagementBridge());

    // 統計橋接中介軟體
    middlewares.push(AccountingApiBridge.accountStatisticsBridge());

    // 資料驗證中介軟體（如果啟用）
    if (this.config.enableValidation) {
      middlewares.push(AccountingApiBridge.dataValidationBridge());
    }

    // 錯誤處理中介軟體（如果啟用）
    if (this.config.enableErrorHandling) {
      middlewares.push(AccountingApiBridge.errorHandlingBridge());
    }

    return middlewares;
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<BridgeConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * 匯出預設橋接管理器實例
 */
export const defaultBridgeManager = new BridgeManager();
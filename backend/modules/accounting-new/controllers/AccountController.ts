import { Request, Response } from 'express';
import { AccountService } from '../services/AccountService';
import { ValidationService } from '../services/ValidationService';
import { IAccount2 } from '../../accounting-old/models/Account2';
import logger from '../../../utils/logger';

/**
 * @description 擴展 Request 介面以支援已認證用戶的屬性
 * @interface AuthenticatedRequest
 * @extends {Request}
 */
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

/**
 * @description Accounting2 帳戶管理控制器
 * @class AccountController
 * @classdesc 處理帳戶相關的 HTTP 請求和回應，提供帳戶的CRUD操作和其他功能
 */
export class AccountController {

  /**
   * @description 建立新帳戶
   * @method createAccount
   * @static
   * @async
   * @param {AuthenticatedRequest} req - Express請求對象，包含帳戶數據和用戶ID
   * @param {Response} res - Express響應對象
   * @returns {Promise<void>} 無返回值，通過res發送JSON響應
   * @route POST /api/accounting2/accounts
   */
  static async createAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.body.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未提供使用者身份'
        });
        return;
      }

      const accountData = req.body as Partial<IAccount2>;
      
      // 驗證必要欄位
      if (!accountData.code || !accountData.name || !accountData.accountType) {
        res.status(400).json({
          success: false,
          message: '缺少必要欄位：code, name, accountType'
        });
        return;
      }

      const account = await AccountService.createAccount(accountData, userId);
      
      logger.info('帳戶建立成功', { code: account.code, name: account.name });
      
      res.status(201).json({
        success: true,
        message: '帳戶建立成功',
        data: account
      });
    } catch (error) {
      logger.error('建立帳戶錯誤', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '建立帳戶失敗'
      });
    }
  }

  /**
   * @description 更新帳戶資訊
   * @method updateAccount
   * @static
   * @async
   * @param {AuthenticatedRequest} req - Express請求對象，包含帳戶ID、更新數據和用戶ID
   * @param {Response} res - Express響應對象
   * @returns {Promise<void>} 無返回值，通過res發送JSON響應
   * @route PUT /api/accounting2/accounts/:id
   */
  static async updateAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.body.userId;
      
      if (!id) {
        res.status(400).json({
          success: false,
          message: '缺少帳戶ID'
        });
        return;
      }
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未提供使用者身份'
        });
        return;
      }

      const updateData = req.body as Partial<IAccount2>;
      const account = await AccountService.updateAccount(id, updateData, userId);
      
      if (!account) {
        res.status(404).json({
          success: false,
          message: '帳戶不存在或無權限修改'
        });
        return;
      }

      logger.info('帳戶更新成功', { code: account.code, name: account.name });
      
      res.json({
        success: true,
        message: '帳戶更新成功',
        data: account
      });
    } catch (error) {
      logger.error('更新帳戶錯誤', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '更新帳戶失敗'
      });
    }
  }

  /**
   * @description 刪除帳戶
   * @method deleteAccount
   * @static
   * @async
   * @param {AuthenticatedRequest} req - Express請求對象，包含帳戶ID和用戶ID
   * @param {Response} res - Express響應對象
   * @returns {Promise<void>} 無返回值，通過res發送JSON響應
   * @route DELETE /api/accounting2/accounts/:id
   */
  static async deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.body.userId;
      
      if (!id) {
        res.status(400).json({
          success: false,
          message: '缺少帳戶ID'
        });
        return;
      }
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未提供使用者身份'
        });
        return;
      }

      const success = await AccountService.deleteAccount(id, userId);
      
      if (!success) {
        res.status(404).json({
          success: false,
          message: '帳戶不存在或無權限刪除'
        });
        return;
      }

      logger.info('帳戶刪除成功', { id });
      
      res.json({
        success: true,
        message: '帳戶刪除成功'
      });
    } catch (error) {
      logger.error('刪除帳戶錯誤', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '刪除帳戶失敗'
      });
    }
  }

  /**
   * @description 取得單一帳戶
   * @method getAccountById
   * @static
   * @async
   * @param {AuthenticatedRequest} req - Express請求對象，包含帳戶ID和用戶ID
   * @param {Response} res - Express響應對象
   * @returns {Promise<void>} 無返回值，通過res發送JSON響應
   * @route GET /api/accounting2/accounts/:id
   */
  static async getAccountById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.query.userId as string;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未提供使用者身份'
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          message: '缺少帳戶ID'
        });
        return;
      }

      const account = await AccountService.getAccountById(id, userId);
      
      if (!account) {
        res.status(404).json({
          success: false,
          message: '帳戶不存在或無權限查看'
        });
        return;
      }

      res.json({
        success: true,
        data: account
      });
    } catch (error) {
      logger.error('取得帳戶錯誤', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '取得帳戶失敗'
      });
    }
  }

  /**
   * @description 取得使用者帳戶列表
   * @method getAccountsByUser
   * @static
   * @async
   * @param {AuthenticatedRequest} req - Express請求對象，包含用戶ID和查詢參數
   * @param {Response} res - Express響應對象
   * @returns {Promise<void>} 無返回值，通過res發送JSON響應
   * @route GET /api/accounting2/accounts
   */
  static async getAccountsByUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.query.userId as string;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未提供使用者身份'
        });
        return;
      }

      const {
        organizationId,
        accountType,
        isActive = 'true',
        page = '1',
        limit = '50',
        sortBy = 'code',
        sortOrder = 'asc'
      } = req.query;

      const options = {
        organizationId: organizationId as string,
        accountType: accountType as string,
        isActive: isActive === 'true',
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const accounts = await AccountService.getAccounts(userId, options.organizationId, {
        accountType: options.accountType,
        isActive: options.isActive
      });
      
      // 手動實現分頁
      const startIndex = (options.page - 1) * options.limit;
      const endIndex = startIndex + options.limit;
      const paginatedAccounts = accounts.slice(startIndex, endIndex);
      
      const result = {
        accounts: paginatedAccounts,
        page: options.page,
        limit: options.limit,
        total: accounts.length,
        totalPages: Math.ceil(accounts.length / options.limit)
      };
      
      res.json({
        success: true,
        data: result.accounts,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      logger.error('取得帳戶列表錯誤', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '取得帳戶列表失敗'
      });
    }
  }

  /**
   * @description 計算帳戶統計
   * @method getAccountStatistics
   * @static
   * @async
   * @param {AuthenticatedRequest} req - Express請求對象，包含用戶ID和組織ID
   * @param {Response} res - Express響應對象
   * @returns {Promise<void>} 無返回值，通過res發送JSON響應
   * @route GET /api/accounting2/accounts/:id/statistics
   */
  static async getAccountStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.query.userId as string;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未提供使用者身份'
        });
        return;
      }

      const statistics = await AccountService.getAccountTypeStatistics(
        userId,
        req.query.organizationId as string
      );
      
      if (!statistics) {
        res.status(404).json({
          success: false,
          message: '帳戶不存在或無權限查看'
        });
        return;
      }

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      logger.error('計算帳戶統計錯誤', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '計算帳戶統計失敗'
      });
    }
  }

  /**
   * @description 驗證帳戶完整性
   * @method validateAccounts
   * @static
   * @async
   * @param {AuthenticatedRequest} req - Express請求對象，包含用戶ID和組織ID
   * @param {Response} res - Express響應對象
   * @returns {Promise<void>} 無返回值，通過res發送JSON響應
   * @route POST /api/accounting2/accounts/validate
   */
  static async validateAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.body.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未提供使用者身份'
        });
        return;
      }

      const { organizationId } = req.body;
      
      const validation = await ValidationService.validateSystemIntegrity(
        userId,
        organizationId
      );
      
      res.json({
        success: true,
        data: validation
      });
    } catch (error) {
      logger.error('驗證帳戶錯誤', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '驗證帳戶失敗'
      });
    }
  }

  /**
   * @description 匯出帳戶資料
   * @method exportAccounts
   * @static
   * @async
   * @param {AuthenticatedRequest} req - Express請求對象，包含用戶ID和匯出格式選項
   * @param {Response} res - Express響應對象
   * @returns {Promise<void>} 無返回值，通過res發送JSON或CSV響應
   * @route GET /api/accounting2/accounts/export
   */
  static async exportAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.query.userId as string;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未提供使用者身份'
        });
        return;
      }

      const {
        organizationId,
        accountType,
        format = 'json'
      } = req.query;

      const options = {
        organizationId: organizationId as string,
        accountType: accountType as string,
        isActive: true,
        page: 1,
        limit: 10000, // 匯出時不限制數量
        sortBy: 'code',
        sortOrder: 'asc' as const
      };

      const accounts = await AccountService.getAccounts(userId, options.organizationId, {
        accountType: options.accountType,
        isActive: options.isActive
      });
      
      // 手動實現分頁
      const startIndex = (options.page - 1) * options.limit;
      const endIndex = startIndex + options.limit;
      const paginatedAccounts = accounts.slice(startIndex, endIndex);
      
      const result = {
        accounts: paginatedAccounts,
        page: options.page,
        limit: options.limit,
        total: accounts.length,
        totalPages: Math.ceil(accounts.length / options.limit)
      };
      
      if (format === 'csv') {
        // 設定 CSV 回應標頭
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=accounts.csv');
        
        // 生成 CSV 內容
        const csvHeader = 'Code,Name,Type,Balance,Currency,Description,Created\n';
        const csvRows = result.accounts.map((account: any) =>
          `"${account.code}","${account.name}","${account.accountType}",${account.balance || 0},"${account.currency || 'TWD'}","${account.description || ''}","${account.createdAt}"`
        ).join('\n');
        
        res.send(csvHeader + csvRows);
      } else {
        // JSON 格式
        res.json({
          success: true,
          data: result.accounts,
          exportedAt: new Date(),
          totalRecords: result.total
        });
      }
      
      logger.info('帳戶資料匯出完成', { recordCount: result.total });
    } catch (error) {
      logger.error('匯出帳戶錯誤', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '匯出帳戶失敗'
      });
    }
  }

  /**
   * @description 批次建立帳戶
   * @method batchCreateAccounts
   * @static
   * @async
   * @param {AuthenticatedRequest} req - Express請求對象，包含用戶ID和帳戶陣列
   * @param {Response} res - Express響應對象
   * @returns {Promise<void>} 無返回值，通過res發送JSON響應
   * @route POST /api/accounting2/accounts/batch
   */
  static async batchCreateAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.body.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未提供使用者身份'
        });
        return;
      }

      const { accounts } = req.body;
      
      if (!Array.isArray(accounts) || accounts.length === 0) {
        res.status(400).json({
          success: false,
          message: '請提供有效的帳戶陣列'
        });
        return;
      }

      const results = [];
      const errors = [];

      for (let i = 0; i < accounts.length; i++) {
        try {
          const account = await AccountService.createAccount(accounts[i], userId);
          results.push({
            index: i,
            success: true,
            data: account
          });
        } catch (error) {
          errors.push({
            index: i,
            success: false,
            error: error instanceof Error ? error.message : '建立失敗',
            data: accounts[i]
          });
        }
      }

      logger.info('批次建立帳戶完成', {
        successCount: results.length,
        failedCount: errors.length
      });
      
      res.json({
        success: errors.length === 0,
        message: `批次處理完成：成功 ${results.length} 筆，失敗 ${errors.length} 筆`,
        data: {
          successful: results,
          failed: errors,
          summary: {
            total: accounts.length,
            successful: results.length,
            failed: errors.length
          }
        }
      });
    } catch (error) {
      logger.error('批次建立帳戶錯誤', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '批次建立帳戶失敗'
      });
    }
  }
}

/**
 * @description 導出帳戶控制器
 */
export default AccountController;
import { Request, Response } from 'express';
import AccountType, { IAccountTypeDocument, IAccountTypeModel, initializeSystemAccountTypes } from '../../models/AccountType';
import { ApiResponse } from '@pharmacy-pos/shared/types/api';

// 擴展 Request 介面以包含用戶資訊
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

export class AccountTypeController {
  /**
   * 取得帳戶類型列表
   */
  static async getAccountTypes(req: AuthenticatedRequest, res: Response) {
    try {
      const { organizationId } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '未授權的請求'
        });
      }

      const accountTypes = await AccountType.getByOrganization(organizationId as string);

      const response: ApiResponse = {
        success: true,
        data: accountTypes
      };

      res.json(response);
    } catch (error) {
      console.error('取得帳戶類型失敗:', error);
      res.status(500).json({
        success: false,
        message: '取得帳戶類型失敗'
      });
    }
  }

  /**
   * 取得單一帳戶類型
   */
  static async getAccountTypeById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '未授權的請求'
        });
      }

      const accountType = await AccountType.findById(id);

      if (!accountType) {
        return res.status(404).json({
          success: false,
          message: '找不到指定的帳戶類型'
        });
      }

      const response: ApiResponse = {
        success: true,
        data: accountType
      };

      res.json(response);
    } catch (error) {
      console.error('取得帳戶類型失敗:', error);
      res.status(500).json({
        success: false,
        message: '取得帳戶類型失敗'
      });
    }
  }

  /**
   * 建立帳戶類型
   */
  static async createAccountType(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '未授權的請求'
        });
      }

      const {
        code,
        name,
        label,
        description,
        codePrefix,
        normalBalance,
        sortOrder,
        organizationId
      } = req.body;

      // 驗證必要欄位
      if (!code || !name || !label || !codePrefix || !normalBalance) {
        return res.status(400).json({
          success: false,
          message: '缺少必要欄位'
        });
      }

      // 檢查代碼是否已存在
      const isCodeAvailable = await AccountType.isCodeAvailable(code, organizationId);
      if (!isCodeAvailable) {
        return res.status(400).json({
          success: false,
          message: '帳戶類型代碼已存在'
        });
      }

      // 建立帳戶類型
      const accountType = new AccountType({
        code,
        name,
        label,
        description,
        codePrefix,
        normalBalance,
        sortOrder: sortOrder || 999,
        organizationId,
        createdBy: userId,
        isSystem: false,
        isActive: true
      });

      await accountType.save();

      const response: ApiResponse = {
        success: true,
        data: accountType,
        message: '帳戶類型建立成功'
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('建立帳戶類型失敗:', error);
      res.status(500).json({
        success: false,
        message: '建立帳戶類型失敗'
      });
    }
  }

  /**
   * 更新帳戶類型
   */
  static async updateAccountType(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '未授權的請求'
        });
      }

      const accountType = await AccountType.findById(id);

      if (!accountType) {
        return res.status(404).json({
          success: false,
          message: '找不到指定的帳戶類型'
        });
      }

      // 檢查是否可以編輯
      if (!accountType.canEdit()) {
        return res.status(403).json({
          success: false,
          message: '系統預設類型無法編輯'
        });
      }

      const {
        code,
        name,
        label,
        description,
        codePrefix,
        normalBalance,
        sortOrder,
        isActive
      } = req.body;

      // 如果更改代碼，檢查是否已存在
      if (code && code !== accountType.code) {
        const isCodeAvailable = await AccountType.isCodeAvailable(
          code, 
          accountType.organizationId?.toString(), 
          id
        );
        if (!isCodeAvailable) {
          return res.status(400).json({
            success: false,
            message: '帳戶類型代碼已存在'
          });
        }
      }

      // 更新欄位
      if (code) accountType.code = code;
      if (name) accountType.name = name;
      if (label) accountType.label = label;
      if (description !== undefined) accountType.description = description;
      if (codePrefix) accountType.codePrefix = codePrefix;
      if (normalBalance) accountType.normalBalance = normalBalance;
      if (sortOrder !== undefined) accountType.sortOrder = sortOrder;
      if (isActive !== undefined) accountType.isActive = isActive;

      accountType.updatedAt = new Date();

      await accountType.save();

      const response: ApiResponse = {
        success: true,
        data: accountType,
        message: '帳戶類型更新成功'
      };

      res.json(response);
    } catch (error) {
      console.error('更新帳戶類型失敗:', error);
      res.status(500).json({
        success: false,
        message: '更新帳戶類型失敗'
      });
    }
  }

  /**
   * 刪除帳戶類型
   */
  static async deleteAccountType(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '未授權的請求'
        });
      }

      const accountType = await AccountType.findById(id);

      if (!accountType) {
        return res.status(404).json({
          success: false,
          message: '找不到指定的帳戶類型'
        });
      }

      // 檢查是否可以刪除
      if (!accountType.canDelete()) {
        return res.status(403).json({
          success: false,
          message: '系統預設類型無法刪除'
        });
      }

      // TODO: 檢查是否有相關的帳戶使用此類型
      // const accountsUsingType = await Account.countDocuments({ accountType: accountType.code });
      // if (accountsUsingType > 0) {
      //   return res.status(400).json({
      //     success: false,
      //     message: '此帳戶類型正在使用中，無法刪除'
      //   });
      // }

      await AccountType.findByIdAndDelete(id);

      const response: ApiResponse = {
        success: true,
        message: '帳戶類型刪除成功'
      };

      res.json(response);
    } catch (error) {
      console.error('刪除帳戶類型失敗:', error);
      res.status(500).json({
        success: false,
        message: '刪除帳戶類型失敗'
      });
    }
  }

  /**
   * 重新排序帳戶類型
   */
  static async reorderAccountTypes(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '未授權的請求'
        });
      }

      const { items } = req.body; // [{ id: string, sortOrder: number }]

      if (!Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          message: '無效的排序資料'
        });
      }

      // 批次更新排序
      const updatePromises = items.map(item => 
        AccountType.findByIdAndUpdate(
          item.id,
          { sortOrder: item.sortOrder, updatedAt: new Date() },
          { new: true }
        )
      );

      await Promise.all(updatePromises);

      const response: ApiResponse = {
        success: true,
        message: '排序更新成功'
      };

      res.json(response);
    } catch (error) {
      console.error('重新排序失敗:', error);
      res.status(500).json({
        success: false,
        message: '重新排序失敗'
      });
    }
  }

  /**
   * 初始化系統預設類型
   */
  static async initializeSystemTypes(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '未授權的請求'
        });
      }

      await initializeSystemAccountTypes();

      const response: ApiResponse = {
        success: true,
        message: '系統預設類型初始化完成'
      };

      res.json(response);
    } catch (error) {
      console.error('初始化系統類型失敗:', error);
      res.status(500).json({
        success: false,
        message: '初始化系統類型失敗'
      });
    }
  }
}

export default AccountTypeController;
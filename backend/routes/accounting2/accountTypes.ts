import { Router, Request, Response } from 'express';
import AccountTypeController from '../../controllers/accounting2/AccountTypeController';

const router: Router = Router();

/**
 * 帳戶類型管理路由
 * 基礎路徑: /api/accounting2/account-types
 */

// 取得帳戶類型列表
router.get('/', AccountTypeController.getAccountTypes as any);

// 取得單一帳戶類型
router.get('/:id', AccountTypeController.getAccountTypeById as any);

// 建立新的帳戶類型
router.post('/', AccountTypeController.createAccountType as any);

// 更新帳戶類型
router.put('/:id', AccountTypeController.updateAccountType as any);

// 刪除帳戶類型
router.delete('/:id', AccountTypeController.deleteAccountType as any);

// 重新排序帳戶類型
router.post('/reorder', AccountTypeController.reorderAccountTypes as any);

// 初始化系統預設類型
router.post('/initialize', AccountTypeController.initializeSystemTypes as any);

export default router;
import express from 'express';
import { AccountController } from '../../controllers/accounting2';
import auth from '../../middleware/auth';

const router: express.Router = express.Router();

// 應用認證中介軟體
router.use(auth);

/**
 * 會計科目管理路由
 * 基於 Accounting2 介面層，相容 Accounting3 資料結構
 */

// GET /api/accounting2/accounts - 取得會計科目列表
router.get('/', AccountController.getAccountsByUser);

// GET /api/accounting2/accounts/export - 匯出帳戶資料
router.get('/export', AccountController.exportAccounts);

// GET /api/accounting2/accounts/:id - 取得單一會計科目
router.get('/:id', AccountController.getAccountById);

// GET /api/accounting2/accounts/:id/statistics - 取得會計科目統計
router.get('/:id/statistics', AccountController.getAccountStatistics);

// POST /api/accounting2/accounts - 建立會計科目
router.post('/', AccountController.createAccount);

// POST /api/accounting2/accounts/batch - 批次建立會計科目
router.post('/batch', AccountController.batchCreateAccounts);

// POST /api/accounting2/accounts/validate - 驗證帳戶完整性
router.post('/validate', AccountController.validateAccounts);

// PUT /api/accounting2/accounts/:id - 更新會計科目
router.put('/:id', AccountController.updateAccount);

// DELETE /api/accounting2/accounts/:id - 刪除會計科目
router.delete('/:id', AccountController.deleteAccount);

export default router;
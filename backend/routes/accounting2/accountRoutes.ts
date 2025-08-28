import express from 'express';
import { AccountController } from '../../controllers/accounting2';
import auth from '../../middleware/auth';
import rateLimit from 'express-rate-limit';

const router: express.Router = express.Router();

// 應用認證中介軟體
router.use(auth);
// Rate limiting (每個IP在15分鐘內最多100次請求)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分鐘
  max: 100, // 最大100次請求
  standardHeaders: true, // 返回RateLimit-標頭
  legacyHeaders: false,
});
router.use(limiter);

/**
 * @description 會計科目管理路由
 * @module routes/accounting2/accountRoutes
 * @requires express
 * @requires controllers/accounting2
 * @requires middleware/auth
 * @summary 基於 Accounting2 介面層，相容 Accounting3 資料結構
 */

/**
 * @description 取得會計科目列表
 * @name GET /api/accounting2/accounts
 * @function
 * @memberof module:routes/accounting2/accountRoutes
 * @param {Object} req - Express請求對象
 * @param {Object} res - Express響應對象
 * @returns {Object} 會計科目列表及分頁資訊
 */
router.get('/', AccountController.getAccountsByUser);

/**
 * @description 匯出帳戶資料
 * @name GET /api/accounting2/accounts/export
 * @function
 * @memberof module:routes/accounting2/accountRoutes
 * @param {Object} req - Express請求對象
 * @param {Object} res - Express響應對象
 * @returns {Object|CSV} 會計科目資料，格式由查詢參數決定
 */
router.get('/export', AccountController.exportAccounts);

/**
 * @description 取得單一會計科目
 * @name GET /api/accounting2/accounts/:id
 * @function
 * @memberof module:routes/accounting2/accountRoutes
 * @param {Object} req - Express請求對象
 * @param {Object} res - Express響應對象
 * @returns {Object} 單一會計科目詳細資料
 */
router.get('/:id', AccountController.getAccountById);

/**
 * @description 取得會計科目統計
 * @name GET /api/accounting2/accounts/:id/statistics
 * @function
 * @memberof module:routes/accounting2/accountRoutes
 * @param {Object} req - Express請求對象
 * @param {Object} res - Express響應對象
 * @returns {Object} 會計科目統計資料
 */
router.get('/:id/statistics', AccountController.getAccountStatistics);

/**
 * @description 建立會計科目
 * @name POST /api/accounting2/accounts
 * @function
 * @memberof module:routes/accounting2/accountRoutes
 * @param {Object} req - Express請求對象
 * @param {Object} res - Express響應對象
 * @returns {Object} 新建立的會計科目資料
 */
router.post('/', AccountController.createAccount);

/**
 * @description 批次建立會計科目
 * @name POST /api/accounting2/accounts/batch
 * @function
 * @memberof module:routes/accounting2/accountRoutes
 * @param {Object} req - Express請求對象
 * @param {Object} res - Express響應對象
 * @returns {Object} 批次建立結果，包含成功和失敗的資料
 */
router.post('/batch', AccountController.batchCreateAccounts);

/**
 * @description 驗證帳戶完整性
 * @name POST /api/accounting2/accounts/validate
 * @function
 * @memberof module:routes/accounting2/accountRoutes
 * @param {Object} req - Express請求對象
 * @param {Object} res - Express響應對象
 * @returns {Object} 驗證結果，包含是否有效和問題列表
 */
router.post('/validate', AccountController.validateAccounts);

/**
 * @description 更新會計科目
 * @name PUT /api/accounting2/accounts/:id
 * @function
 * @memberof module:routes/accounting2/accountRoutes
 * @param {Object} req - Express請求對象
 * @param {Object} res - Express響應對象
 * @returns {Object} 更新後的會計科目資料
 */
router.put('/:id', AccountController.updateAccount);

/**
 * @description 刪除會計科目
 * @name DELETE /api/accounting2/accounts/:id
 * @function
 * @memberof module:routes/accounting2/accountRoutes
 * @param {Object} req - Express請求對象
 * @param {Object} res - Express響應對象
 * @returns {Object} 刪除結果
 */
router.delete('/:id', AccountController.deleteAccount);

/**
 * @description 導出會計科目路由
 */
export default router;
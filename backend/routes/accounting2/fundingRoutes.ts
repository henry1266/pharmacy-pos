import express from 'express';
import { FundingController } from '../../controllers/accounting2';
import auth from '../../middleware/auth';

const router: express.Router = express.Router();

// 應用認證中介軟體
router.use(auth);

/**
 * 資金管理路由
 * 基於 Accounting2 介面層，相容 Accounting3 資料結構
 */

// GET /api/accounting2/funding/sources - 取得資金來源列表
router.get('/sources', FundingController.getFundingSources);

// GET /api/accounting2/funding/statistics - 取得資金統計
router.get('/statistics', FundingController.getFundingStatistics);

// GET /api/accounting2/funding/flow - 分析資金流向
router.get('/flow', FundingController.analyzeFundingFlow);

// GET /api/accounting2/funding/export - 匯出資金報告
router.get('/export', FundingController.exportFundingReport);

// GET /api/accounting2/funding/sources/:id - 取得單一資金來源
router.get('/sources/:id', FundingController.getFundingSourceById);

// POST /api/accounting2/funding/track - 追蹤資金使用情況
router.post('/track', FundingController.trackFundingUsage);

// POST /api/accounting2/funding/validate - 驗證資金分配
router.post('/validate', FundingController.validateFundingAllocation);

// POST /api/accounting2/funding/validate-general - 一般資金驗證
router.post('/validate-general', FundingController.validateFunding);

// POST /api/accounting2/funding/sources - 建立資金來源
router.post('/sources', FundingController.createFundingSource);

// PUT /api/accounting2/funding/sources/:id - 更新資金來源
router.put('/sources/:id', FundingController.updateFundingSource);

// DELETE /api/accounting2/funding/sources/:id - 刪除資金來源
router.delete('/sources/:id', FundingController.deleteFundingSource);

export default router;
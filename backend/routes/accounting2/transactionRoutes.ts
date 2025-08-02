import express from 'express';
import { TransactionController } from '../../controllers/accounting2';
import auth from '../../middleware/auth';

const router: express.Router = express.Router();

// 應用認證中介軟體
router.use(auth);

/**
 * 交易管理路由
 * 基於 Accounting2 介面層，相容 Accounting3 資料結構
 */

// GET /api/accounting2/transactions - 取得交易群組列表
router.get('/', TransactionController.getTransactionsByUser);

// GET /api/accounting2/transactions/export - 匯出交易資料
router.get('/export', TransactionController.exportTransactions);

// GET /api/accounting2/transactions/statistics - 取得交易統計
router.get('/statistics', TransactionController.getTransactionStatistics);

// GET /api/accounting2/transactions/account-statistics-aggregate - 取得科目統計聚合資料（高效能版本）
router.get('/account-statistics-aggregate', TransactionController.getAccountStatisticsAggregate);

// 🆕 GET /api/accounting2/transactions/payables - 取得可付款的應付帳款列表
router.get('/payables', TransactionController.getPayableTransactions);

// GET /api/accounting2/transactions/:id/balance - 計算交易餘額
router.get('/:id/balance', TransactionController.calculateTransactionBalance);

// 🆕 GET /api/accounting2/transactions/:id/payment-history - 取得應付帳款的付款歷史
router.get('/:id/payment-history', TransactionController.getPaymentHistory);

// GET /api/accounting2/transactions/:id - 取得單一交易群組
router.get('/:id', TransactionController.getTransactionById);

// POST /api/accounting2/transactions/calculate-balances - 批次計算交易餘額
router.post('/calculate-balances', TransactionController.calculateMultipleTransactionBalances);

// POST /api/accounting2/transactions - 建立交易群組
router.post('/', TransactionController.createTransaction);

// POST /api/accounting2/transactions/batch - 批次建立交易
router.post('/batch', TransactionController.batchCreateTransactions);

// 🆕 POST /api/accounting2/transactions/payment - 建立付款交易
router.post('/payment', TransactionController.createPaymentTransaction);

// POST /api/accounting2/transactions/validate - 驗證交易完整性
router.post('/validate', TransactionController.validateTransactions);

// PUT /api/accounting2/transactions/:id - 更新交易群組
router.put('/:id', TransactionController.updateTransaction);

// POST /api/accounting2/transactions/:id/confirm - 確認交易
router.post('/:id/confirm', TransactionController.confirmTransaction);

// POST /api/accounting2/transactions/:id/cancel - 取消交易
router.post('/:id/cancel', TransactionController.cancelTransaction);

// DELETE /api/accounting2/transactions/:id - 刪除交易群組
router.delete('/:id', TransactionController.deleteTransaction);

export default router;
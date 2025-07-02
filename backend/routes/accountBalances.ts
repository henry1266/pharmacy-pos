import express, { Request, Response, Router } from 'express';
import AccountBalanceService from '../services/accountBalanceService';
import auth from '../middleware/auth';

const router: Router = express.Router();

/**
 * 獲取單一會計科目餘額
 * GET /api/accounting2/balances/account/:accountId
 */
router.get('/account/:accountId', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { accountId } = req.params;
    const { endDate, organizationId } = req.query;
    const userId = (req as any).user.userId;

    // 解析結束日期
    const parsedEndDate = endDate ? new Date(endDate as string) : undefined;
    const parsedOrgId = organizationId as string || undefined;

    const balance = await AccountBalanceService.calculateAccountBalance(
      accountId,
      parsedEndDate,
      parsedOrgId
    );

    res.json({
      success: true,
      data: balance
    });
  } catch (error) {
    console.error('獲取會計科目餘額錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取會計科目餘額失敗',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
});

/**
 * 批量獲取多個會計科目餘額
 * POST /api/accounting2/balances/accounts/batch
 */
router.post('/accounts/batch', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { accountIds, endDate, organizationId } = req.body;
    const userId = (req as any).user.userId;

    if (!accountIds || !Array.isArray(accountIds)) {
      res.status(400).json({
        success: false,
        message: '請提供有效的會計科目ID陣列',
        error: 'INVALID_ACCOUNT_IDS'
      });
      return;
    }

    // 解析結束日期
    const parsedEndDate = endDate ? new Date(endDate) : undefined;

    const balances = await AccountBalanceService.calculateMultipleAccountBalances(
      accountIds,
      parsedEndDate,
      organizationId
    );

    res.json({
      success: true,
      data: balances
    });
  } catch (error) {
    console.error('批量獲取會計科目餘額錯誤:', error);
    res.status(500).json({
      success: false,
      message: '批量獲取會計科目餘額失敗',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
});

/**
 * 按科目類型獲取餘額匯總
 * GET /api/accounting2/balances/by-type/:accountType
 */
router.get('/by-type/:accountType', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { accountType } = req.params;
    const { endDate, organizationId } = req.query;
    const userId = (req as any).user.userId;

    // 驗證科目類型
    const validTypes = ['asset', 'liability', 'equity', 'revenue', 'expense'];
    if (!validTypes.includes(accountType)) {
      res.status(400).json({
        success: false,
        message: '無效的科目類型',
        error: 'INVALID_ACCOUNT_TYPE',
        validTypes
      });
      return;
    }

    // 解析結束日期
    const parsedEndDate = endDate ? new Date(endDate as string) : undefined;
    const parsedOrgId = organizationId as string || undefined;

    const balanceSummary = await AccountBalanceService.calculateBalanceByAccountType(
      accountType as 'asset' | 'liability' | 'equity' | 'revenue' | 'expense',
      parsedEndDate,
      parsedOrgId
    );

    res.json({
      success: true,
      data: balanceSummary
    });
  } catch (error) {
    console.error('按科目類型獲取餘額錯誤:', error);
    res.status(500).json({
      success: false,
      message: '按科目類型獲取餘額失敗',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
});

/**
 * 生成試算表
 * GET /api/accounting2/balances/trial-balance
 */
router.get('/trial-balance', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { endDate, organizationId } = req.query;
    const userId = (req as any).user.userId;

    // 解析結束日期
    const parsedEndDate = endDate ? new Date(endDate as string) : undefined;
    const parsedOrgId = organizationId as string || undefined;

    const trialBalance = await AccountBalanceService.generateTrialBalance(
      parsedEndDate,
      parsedOrgId
    );

    res.json({
      success: true,
      data: trialBalance
    });
  } catch (error) {
    console.error('生成試算表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '生成試算表失敗',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
});

/**
 * 獲取會計科目交易歷史
 * GET /api/accounting2/balances/account/:accountId/history
 */
router.get('/account/:accountId/history', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { accountId } = req.params;
    const { startDate, endDate, limit, organizationId } = req.query;
    const userId = (req as any).user.userId;

    // 解析參數
    const parsedStartDate = startDate ? new Date(startDate as string) : undefined;
    const parsedEndDate = endDate ? new Date(endDate as string) : undefined;
    const parsedLimit = limit ? parseInt(limit as string, 10) : 50;
    const parsedOrgId = organizationId as string || undefined;

    // 驗證限制數量
    if (parsedLimit > 1000) {
      res.status(400).json({
        success: false,
        message: '查詢限制不能超過 1000 筆',
        error: 'LIMIT_EXCEEDED'
      });
      return;
    }

    const history = await AccountBalanceService.getAccountTransactionHistory(
      accountId,
      parsedStartDate,
      parsedEndDate,
      parsedLimit,
      parsedOrgId
    );

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('獲取會計科目交易歷史錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取會計科目交易歷史失敗',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
});

/**
 * 獲取所有科目類型的餘額概覽
 * GET /api/accounting2/balances/overview
 */
router.get('/overview', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { endDate, organizationId } = req.query;
    const userId = (req as any).user.userId;

    // 解析結束日期
    const parsedEndDate = endDate ? new Date(endDate as string) : undefined;
    const parsedOrgId = organizationId as string || undefined;

    const accountTypes: Array<'asset' | 'liability' | 'equity' | 'revenue' | 'expense'> = 
      ['asset', 'liability', 'equity', 'revenue', 'expense'];

    // 並行計算所有科目類型的餘額
    const typeBalances = await Promise.all(
      accountTypes.map(async (type) => {
        const balance = await AccountBalanceService.calculateBalanceByAccountType(
          type,
          parsedEndDate,
          parsedOrgId
        );
        return {
          accountType: type,
          totalBalance: balance.totalBalance,
          accountCount: balance.accountCount
        };
      })
    );

    // 計算總資產、總負債、總權益
    const assets = typeBalances.find(b => b.accountType === 'asset')?.totalBalance || 0;
    const liabilities = typeBalances.find(b => b.accountType === 'liability')?.totalBalance || 0;
    const equity = typeBalances.find(b => b.accountType === 'equity')?.totalBalance || 0;
    const revenue = typeBalances.find(b => b.accountType === 'revenue')?.totalBalance || 0;
    const expense = typeBalances.find(b => b.accountType === 'expense')?.totalBalance || 0;

    // 計算淨利潤
    const netIncome = revenue - expense;

    // 檢查會計等式平衡
    const leftSide = assets; // 資產
    const rightSide = liabilities + equity + netIncome; // 負債 + 權益 + 淨利潤
    const isBalanced = Math.abs(leftSide - rightSide) < 0.01;

    res.json({
      success: true,
      data: {
        typeBalances,
        summary: {
          totalAssets: assets,
          totalLiabilities: liabilities,
          totalEquity: equity,
          totalRevenue: revenue,
          totalExpense: expense,
          netIncome,
          isBalanced,
          balanceDifference: Math.abs(leftSide - rightSide),
          generatedAt: new Date(),
          endDate: parsedEndDate || new Date()
        }
      }
    });
  } catch (error) {
    console.error('獲取餘額概覽錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取餘額概覽失敗',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
});

export default router;
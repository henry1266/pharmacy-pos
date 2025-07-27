import express, { Request, Response, NextFunction } from 'express';
import Account2 from '../models/Account2';
import AccountingEntry from '../models/AccountingEntry';
import auth from '../middleware/auth';

const router: express.Router = express.Router();

// 擴展 Request 介面
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

// 科目餘額摘要介面
interface AccountSummary {
  _id: string;
  code: string;
  name: string;
  initialBalance: number;
  actualBalance: number;
  entriesCount: number;
}

interface AccountTypeSummary {
  count: number;
  totalBalance: number;
  accounts: AccountSummary[];
}

// 取得機構的所有科目餘額摘要
router.get('/summary', auth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.query;

    console.log('📊 取得科目餘額摘要:', { organizationId });

    // 取得所有科目
    const accounts = await Account2.find({
      ...(organizationId && { organizationId }),
      isActive: true
    }).sort({ code: 1 });

    console.log('📋 找到科目數量:', accounts.length);

    // 按科目類型分組統計
    const summary: Record<string, AccountTypeSummary> = {
      asset: { count: 0, totalBalance: 0, accounts: [] },
      liability: { count: 0, totalBalance: 0, accounts: [] },
      equity: { count: 0, totalBalance: 0, accounts: [] },
      revenue: { count: 0, totalBalance: 0, accounts: [] },
      expense: { count: 0, totalBalance: 0, accounts: [] }
    };

    // 計算每個科目的實際餘額
    for (const account of accounts) {
      const entries = await AccountingEntry.find({
        accountId: account._id,
        ...(organizationId && { organizationId })
      });

      let debitTotal = 0;
      let creditTotal = 0;

      entries.forEach(entry => {
        debitTotal += entry.debitAmount;
        creditTotal += entry.creditAmount;
      });

      let actualBalance = account.initialBalance;
      if (account.normalBalance === 'debit') {
        actualBalance = account.initialBalance + debitTotal - creditTotal;
      } else {
        actualBalance = account.initialBalance + creditTotal - debitTotal;
      }

      const accountSummary: AccountSummary = {
        _id: account._id.toString(),
        code: account.code,
        name: account.name,
        initialBalance: account.initialBalance,
        actualBalance,
        entriesCount: entries.length
      };

      summary[account.accountType].count++;
      summary[account.accountType].totalBalance += actualBalance;
      summary[account.accountType].accounts.push(accountSummary);
    }

    console.log('✅ 科目餘額摘要計算完成');

    res.json({
      success: true,
      organizationId,
      totalAccounts: accounts.length,
      summary
    });

  } catch (error) {
    console.error('❌ 取得科目餘額摘要失敗:', error);
    res.status(500).json({
      message: '取得科目餘額摘要失敗',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
});

// 計算科目實際餘額
router.get('/:accountId', auth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { accountId } = req.params;
    const { organizationId } = req.query;

    console.log('🧮 開始計算科目餘額:', { accountId, organizationId });

    // 取得科目資訊
    const account = await Account2.findById(accountId);
    if (!account) {
      res.status(404).json({ message: '科目不存在' });
      return;
    }

    // 計算該科目的所有分錄總額
    const entries = await AccountingEntry.find({
      accountId: accountId,
      ...(organizationId && { organizationId })
    });

    console.log('📊 找到分錄數量:', entries.length);

    // 計算借方和貸方總額
    let debitTotal = 0;
    let creditTotal = 0;

    entries.forEach(entry => {
      debitTotal += entry.debitAmount;
      creditTotal += entry.creditAmount;
    });

    // 根據科目的正常餘額方向計算實際餘額
    let actualBalance = account.initialBalance;
    
    if (account.normalBalance === 'debit') {
      // 借方科目：初始餘額 + 借方 - 貸方
      actualBalance = account.initialBalance + debitTotal - creditTotal;
    } else {
      // 貸方科目：初始餘額 + 貸方 - 借方
      actualBalance = account.initialBalance + creditTotal - debitTotal;
    }

    console.log('💰 餘額計算結果:', {
      accountCode: account.code,
      accountName: account.name,
      initialBalance: account.initialBalance,
      debitTotal,
      creditTotal,
      actualBalance,
      normalBalance: account.normalBalance
    });

    res.json({
      accountId,
      accountCode: account.code,
      accountName: account.name,
      accountType: account.accountType,
      normalBalance: account.normalBalance,
      initialBalance: account.initialBalance,
      debitTotal,
      creditTotal,
      actualBalance,
      entriesCount: entries.length
    });

  } catch (error) {
    console.error('❌ 計算科目餘額失敗:', error);
    res.status(500).json({
      message: '計算科目餘額失敗',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
});

// 批量計算多個科目的餘額
router.post('/batch', auth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { accountIds, organizationId } = req.body;

    console.log('🧮 批量計算科目餘額:', { accountIds: accountIds?.length, organizationId });

    if (!accountIds || !Array.isArray(accountIds)) {
      res.status(400).json({ message: '請提供科目ID陣列' });
      return;
    }

    const results = [];

    for (const accountId of accountIds) {
      try {
        // 取得科目資訊
        const account = await Account2.findById(accountId);
        if (!account) {
          console.warn('⚠️ 科目不存在:', accountId);
          continue;
        }

        // 計算該科目的所有分錄總額
        const entries = await AccountingEntry.find({
          accountId: accountId,
          ...(organizationId && { organizationId })
        });

        // 計算借方和貸方總額
        let debitTotal = 0;
        let creditTotal = 0;

        entries.forEach(entry => {
          debitTotal += entry.debitAmount;
          creditTotal += entry.creditAmount;
        });

        // 根據科目的正常餘額方向計算實際餘額
        let actualBalance = account.initialBalance;
        
        if (account.normalBalance === 'debit') {
          actualBalance = account.initialBalance + debitTotal - creditTotal;
        } else {
          actualBalance = account.initialBalance + creditTotal - debitTotal;
        }

        results.push({
          accountId,
          accountCode: account.code,
          accountName: account.name,
          accountType: account.accountType,
          normalBalance: account.normalBalance,
          initialBalance: account.initialBalance,
          debitTotal,
          creditTotal,
          actualBalance,
          entriesCount: entries.length
        });

      } catch (error) {
        console.error('❌ 計算單一科目餘額失敗:', {
          accountId,
          error: error instanceof Error ? error.message : '未知錯誤'
        });
      }
    }

    console.log('✅ 批量計算完成，成功計算:', results.length);

    res.json({
      success: true,
      count: results.length,
      data: results
    });

  } catch (error) {
    console.error('❌ 批量計算科目餘額失敗:', error);
    res.status(500).json({
      message: '批量計算科目餘額失敗',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
});


export default router;
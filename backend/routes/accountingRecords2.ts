import express, { Router } from 'express';
import AccountingRecord2, { IAccountingRecord2 } from '../models/AccountingRecord2';
import Account2 from '../models/Account2';
import Category2 from '../models/Category2';
import auth from '../middleware/auth';

// 擴展 Request 介面
interface AuthenticatedRequest extends express.Request {
  user?: {
    id: string;
    userId?: string;
  };
}

const router: Router = express.Router();

// 獲取所有記帳記錄
router.get('/', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    const { 
      type, 
      categoryId, 
      accountId, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 20 
    } = req.query;

    const filter: any = { createdBy: userId };

    // 類型過濾
    if (type && ['income', 'expense', 'transfer'].includes(type as string)) {
      filter.type = type;
    }

    // 類別過濾
    if (categoryId) {
      filter.categoryId = categoryId;
    }

    // 帳戶過濾
    if (accountId) {
      filter.accountId = accountId;
    }

    // 日期範圍過濾
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate as string);
      }
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [records, total] = await Promise.all([
      AccountingRecord2.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AccountingRecord2.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('獲取記帳記錄錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '獲取記帳記錄失敗' 
    });
  }
});

// 獲取記帳摘要
router.get('/summary', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    const { startDate, endDate } = req.query;
    const filter: any = { createdBy: userId };

    // 日期範圍過濾
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate as string);
      }
    }

    const [incomeTotal, expenseTotal, recordCount] = await Promise.all([
      AccountingRecord2.aggregate([
        { $match: { ...filter, type: 'income' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      AccountingRecord2.aggregate([
        { $match: { ...filter, type: 'expense' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      AccountingRecord2.countDocuments(filter)
    ]);

    const income = incomeTotal[0]?.total || 0;
    const expense = expenseTotal[0]?.total || 0;
    const balance = income - expense;

    res.json({
      success: true,
      data: {
        income,
        expense,
        balance,
        recordCount
      }
    });
  } catch (error) {
    console.error('獲取記帳摘要錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '獲取記帳摘要失敗' 
    });
  }
});

// 獲取單一記帳記錄
router.get('/:id', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    const record = await AccountingRecord2.findOne({ 
      _id: id, 
      createdBy: userId 
    });

    if (!record) {
      res.status(404).json({ 
        success: false, 
        message: '找不到指定的記帳記錄' 
      });
      return;
    }

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('獲取記帳記錄詳情錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '獲取記帳記錄詳情失敗' 
    });
  }
});

// 新增記帳記錄
router.post('/', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    const { 
      type, 
      amount, 
      categoryId, 
      accountId, 
      date, 
      description, 
      tags, 
      attachments 
    } = req.body;

    // 驗證必填欄位
    if (!type || !amount || !categoryId || !accountId) {
      res.status(400).json({ 
        success: false, 
        message: '請填寫所有必填欄位' 
      });
      return;
    }

    if (!['income', 'expense', 'transfer'].includes(type)) {
      res.status(400).json({ 
        success: false, 
        message: '記錄類型必須是 income、expense 或 transfer' 
      });
      return;
    }

    if (amount <= 0) {
      res.status(400).json({ 
        success: false, 
        message: '金額必須大於 0' 
      });
      return;
    }

    // 驗證類別是否存在且屬於用戶
    const category = await Category2.findOne({
      _id: categoryId,
      createdBy: userId,
      isActive: true
    });

    if (!category) {
      res.status(400).json({ 
        success: false, 
        message: '指定的類別不存在' 
      });
      return;
    }

    // 驗證帳戶是否存在且屬於用戶
    const account = await Account2.findOne({
      _id: accountId,
      createdBy: userId,
      isActive: true
    });

    if (!account) {
      res.status(400).json({ 
        success: false, 
        message: '指定的帳戶不存在' 
      });
      return;
    }

    // 驗證類別類型與記錄類型是否匹配
    if (type !== 'transfer' && category.type !== type) {
      res.status(400).json({ 
        success: false, 
        message: '類別類型與記錄類型不匹配' 
      });
      return;
    }

    const newRecord = new AccountingRecord2({
      type,
      amount,
      categoryId,
      accountId,
      date: date ? new Date(date) : new Date(),
      description,
      tags: tags || [],
      attachments: attachments || [],
      createdBy: userId
    });

    const savedRecord = await newRecord.save();

    // 更新帳戶餘額
    if (type === 'income') {
      account.balance += amount;
    } else if (type === 'expense') {
      account.balance -= amount;
    }
    await account.save();

    res.status(201).json({
      success: true,
      data: savedRecord,
      message: '記帳記錄建立成功'
    });
  } catch (error) {
    console.error('建立記帳記錄錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '建立記帳記錄失敗' 
    });
  }
});

// 更新記帳記錄
router.put('/:id', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    const { 
      amount, 
      categoryId, 
      accountId, 
      date, 
      description, 
      tags, 
      attachments 
    } = req.body;

    // 檢查記錄是否存在
    const record = await AccountingRecord2.findOne({ 
      _id: id, 
      createdBy: userId 
    });

    if (!record) {
      res.status(404).json({ 
        success: false, 
        message: '找不到指定的記帳記錄' 
      });
      return;
    }

    const oldAmount = record.amount;
    const oldAccountId = record.accountId.toString();

    // 驗證新的類別（如果有提供）
    if (categoryId && categoryId !== record.categoryId.toString()) {
      const category = await Category2.findOne({
        _id: categoryId,
        createdBy: userId,
        isActive: true
      });

      if (!category) {
        res.status(400).json({ 
          success: false, 
          message: '指定的類別不存在' 
        });
        return;
      }

      if (record.type !== 'transfer' && category.type !== record.type) {
        res.status(400).json({ 
          success: false, 
          message: '類別類型與記錄類型不匹配' 
        });
        return;
      }
    }

    // 驗證新的帳戶（如果有提供）
    if (accountId && accountId !== oldAccountId) {
      const account = await Account2.findOne({
        _id: accountId,
        createdBy: userId,
        isActive: true
      });

      if (!account) {
        res.status(400).json({ 
          success: false, 
          message: '指定的帳戶不存在' 
        });
        return;
      }
    }

    // 更新記錄資訊
    const updateData: Partial<IAccountingRecord2> = {};
    if (amount !== undefined) updateData.amount = amount;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (accountId !== undefined) updateData.accountId = accountId;
    if (date !== undefined) updateData.date = new Date(date);
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = tags;
    if (attachments !== undefined) updateData.attachments = attachments;

    const updatedRecord = await AccountingRecord2.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // 更新帳戶餘額
    if (amount !== undefined || accountId !== undefined) {
      // 先從舊帳戶扣除舊金額
      const oldAccount = await Account2.findById(oldAccountId);
      if (oldAccount) {
        if (record.type === 'income') {
          oldAccount.balance -= oldAmount;
        } else if (record.type === 'expense') {
          oldAccount.balance += oldAmount;
        }
        await oldAccount.save();
      }

      // 再向新帳戶加入新金額
      const newAccountId = accountId || oldAccountId;
      const newAmount = amount || oldAmount;
      const newAccount = await Account2.findById(newAccountId);
      if (newAccount) {
        if (record.type === 'income') {
          newAccount.balance += newAmount;
        } else if (record.type === 'expense') {
          newAccount.balance -= newAmount;
        }
        await newAccount.save();
      }
    }

    res.json({
      success: true,
      data: updatedRecord,
      message: '記帳記錄更新成功'
    });
  } catch (error) {
    console.error('更新記帳記錄錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '更新記帳記錄失敗' 
    });
  }
});

// 刪除記帳記錄
router.delete('/:id', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    const record = await AccountingRecord2.findOne({ 
      _id: id, 
      createdBy: userId 
    });

    if (!record) {
      res.status(404).json({ 
        success: false, 
        message: '找不到指定的記帳記錄' 
      });
      return;
    }

    // 更新帳戶餘額（回復）
    const account = await Account2.findById(record.accountId);
    if (account) {
      if (record.type === 'income') {
        account.balance -= record.amount;
      } else if (record.type === 'expense') {
        account.balance += record.amount;
      }
      await account.save();
    }

    // 刪除記錄
    await AccountingRecord2.findByIdAndDelete(id);

    res.json({
      success: true,
      message: '記帳記錄刪除成功'
    });
  } catch (error) {
    console.error('刪除記帳記錄錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '刪除記帳記錄失敗' 
    });
  }
});

export default router;
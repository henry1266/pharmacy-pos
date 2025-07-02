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
      organizationId,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    console.log('🔍 GET /records - 查詢參數:', {
      type,
      categoryId,
      accountId,
      organizationId,
      startDate,
      endDate,
      page,
      limit,
      userId
    });

    const filter: any = { createdBy: userId };

    // 機構過濾
    if (organizationId) {
      filter.organizationId = organizationId;
      console.log('🏢 查詢機構記錄:', organizationId);
    } else {
      console.log('👤 查詢所有記錄（包含個人和機構）');
    }

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

    console.log('📋 最終查詢條件:', filter);

    const [records, total] = await Promise.all([
      AccountingRecord2.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AccountingRecord2.countDocuments(filter)
    ]);

    console.log('📊 查詢結果數量:', records.length, '/', total);

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

    const { startDate, endDate, organizationId } = req.query;
    
    console.log('🔍 GET /records/summary - 查詢參數:', {
      startDate,
      endDate,
      organizationId,
      userId
    });

    const filter: any = { createdBy: userId };

    // 機構過濾
    if (organizationId) {
      filter.organizationId = organizationId;
      console.log('🏢 查詢機構摘要:', organizationId);
    } else {
      console.log('👤 查詢所有摘要（包含個人和機構）');
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
      organizationId,
      date,
      description,
      tags,
      attachments
    } = req.body;

    console.log('🔍 POST /records - 建立記錄:', {
      type,
      amount,
      categoryId,
      accountId,
      organizationId,
      date,
      description,
      tags,
      attachments,
      userId
    });

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

    // 確保 ID 是字串格式
    const cleanCategoryId = typeof categoryId === 'string' ? categoryId : categoryId.toString();
    const cleanAccountId = typeof accountId === 'string' ? accountId : accountId.toString();

    console.log('🧹 清理後的 ID:', { cleanCategoryId, cleanAccountId });

    // 驗證類別是否存在且屬於用戶
    const category = await Category2.findOne({
      _id: cleanCategoryId,
      createdBy: userId,
      isActive: true
    });

    if (!category) {
      console.error('❌ 類別不存在:', cleanCategoryId);
      res.status(400).json({
        success: false,
        message: '指定的類別不存在'
      });
      return;
    }

    // 驗證帳戶是否存在且屬於用戶
    const account = await Account2.findOne({
      _id: cleanAccountId,
      createdBy: userId,
      isActive: true
    });

    if (!account) {
      console.error('❌ 帳戶不存在:', cleanAccountId);
      res.status(400).json({
        success: false,
        message: '指定的帳戶不存在'
      });
      return;
    }

    // 驗證類別類型與記錄類型是否匹配
    if (type !== 'transfer' && category.type !== type) {
      console.error('❌ 類別類型不匹配:', { categoryType: category.type, recordType: type });
      res.status(400).json({
        success: false,
        message: '類別類型與記錄類型不匹配'
      });
      return;
    }

    const newRecord = new AccountingRecord2({
      type,
      amount,
      categoryId: cleanCategoryId,
      accountId: cleanAccountId,
      organizationId: organizationId || undefined,
      date: date ? new Date(date) : new Date(),
      description,
      tags: tags || [],
      attachments: attachments || [],
      createdBy: userId
    });

    console.log('📝 建立記錄資料:', {
      type,
      amount,
      categoryId: cleanCategoryId,
      accountId: cleanAccountId,
      organizationId: organizationId || undefined,
      createdBy: userId
    });

    const savedRecord = await newRecord.save();
    console.log('✅ 記錄建立成功:', savedRecord._id);

    // 更新帳戶餘額
    if (type === 'income') {
      account.balance += amount;
      console.log('💰 帳戶收入 +', amount, '，新餘額:', account.balance);
    } else if (type === 'expense') {
      account.balance -= amount;
      console.log('💸 帳戶支出 -', amount, '，新餘額:', account.balance);
    }
    await account.save();

    res.status(201).json({
      success: true,
      data: savedRecord,
      message: '記帳記錄建立成功'
    });
  } catch (error) {
    console.error('建立記帳記錄錯誤:', error);
    
    // 檢查是否是 ObjectId 轉換錯誤
    if (error instanceof Error && error.message.includes('Cast to ObjectId failed')) {
      console.error('❌ ObjectId 轉換失敗:', error.message);
      res.status(400).json({
        success: false,
        message: 'ID 格式錯誤，請檢查類別或帳戶 ID'
      });
    } else {
      res.status(500).json({
        success: false,
        message: '建立記帳記錄失敗'
      });
    }
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

    console.log('🔍 PUT /records/:id - 更新記錄:', {
      id,
      amount,
      categoryId,
      accountId,
      date,
      description,
      userId
    });

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
    const oldAccountId = (record.accountId as any)?._id?.toString() || record.accountId.toString();

    // 驗證新的類別（如果有提供）
    if (categoryId && categoryId !== record.categoryId.toString()) {
      console.log('🔍 驗證新類別:', categoryId);
      const category = await Category2.findOne({
        _id: categoryId,
        createdBy: userId,
        isActive: true
      });

      if (!category) {
        console.error('❌ 類別不存在:', categoryId);
        res.status(400).json({
          success: false,
          message: '指定的類別不存在'
        });
        return;
      }

      if (record.type !== 'transfer' && category.type !== record.type) {
        console.error('❌ 類別類型不匹配:', { categoryType: category.type, recordType: record.type });
        res.status(400).json({
          success: false,
          message: '類別類型與記錄類型不匹配'
        });
        return;
      }
    }

    // 驗證新的帳戶（如果有提供）
    if (accountId && accountId !== oldAccountId) {
      console.log('🔍 驗證新帳戶:', accountId);
      const account = await Account2.findOne({
        _id: accountId,
        createdBy: userId,
        isActive: true
      });

      if (!account) {
        console.error('❌ 帳戶不存在:', accountId);
        res.status(400).json({
          success: false,
          message: '指定的帳戶不存在'
        });
        return;
      }
    }

    // 更新記錄資訊 - 確保 ObjectId 格式正確
    const updateData: Partial<IAccountingRecord2> = {};
    if (amount !== undefined) updateData.amount = amount;
    if (categoryId !== undefined) {
      // 確保 categoryId 是字串格式，不是物件
      updateData.categoryId = typeof categoryId === 'string' ? categoryId : categoryId.toString();
    }
    if (accountId !== undefined) {
      // 確保 accountId 是字串格式，不是物件
      updateData.accountId = typeof accountId === 'string' ? accountId : accountId.toString();
    }
    if (date !== undefined) updateData.date = new Date(date);
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = tags;
    if (attachments !== undefined) updateData.attachments = attachments;

    console.log('📝 更新資料:', updateData);

    const updatedRecord = await AccountingRecord2.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    console.log('✅ 記錄更新成功:', updatedRecord?._id);

    // 更新帳戶餘額
    if (amount !== undefined || accountId !== undefined) {
      console.log('💰 更新帳戶餘額...');
      
      // 先從舊帳戶扣除舊金額
      const oldAccount = await Account2.findById(oldAccountId);
      if (oldAccount) {
        if (record.type === 'income') {
          oldAccount.balance -= oldAmount;
          console.log('💸 舊帳戶扣除收入:', oldAmount, '新餘額:', oldAccount.balance);
        } else if (record.type === 'expense') {
          oldAccount.balance += oldAmount;
          console.log('💰 舊帳戶回復支出:', oldAmount, '新餘額:', oldAccount.balance);
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
          console.log('💰 新帳戶增加收入:', newAmount, '新餘額:', newAccount.balance);
        } else if (record.type === 'expense') {
          newAccount.balance -= newAmount;
          console.log('💸 新帳戶扣除支出:', newAmount, '新餘額:', newAccount.balance);
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
    
    // 檢查是否是 ObjectId 轉換錯誤
    if (error instanceof Error && error.message.includes('Cast to ObjectId failed')) {
      console.error('❌ ObjectId 轉換失敗:', error.message);
      res.status(400).json({
        success: false,
        message: 'ID 格式錯誤，請檢查類別或帳戶 ID'
      });
    } else {
      res.status(500).json({
        success: false,
        message: '更新記帳記錄失敗'
      });
    }
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
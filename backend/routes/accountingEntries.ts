import express, { Router } from 'express';
import mongoose from 'mongoose';
import AccountingEntry, { IAccountingEntry } from '../models/AccountingEntry';
import TransactionGroup from '../models/TransactionGroup';
import Account2 from '../models/Account2';
import Category2 from '../models/Category2';
import auth from '../middleware/auth';
import DoubleEntryValidator from '../utils/doubleEntryValidation';

// 擴展 Request 介面
interface AuthenticatedRequest extends express.Request {
  user?: {
    id: string;
    userId?: string;
  };
}

const router: Router = express.Router();

// 獲取所有記帳分錄
router.get('/', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    const {
      transactionGroupId,
      accountId,
      organizationId,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    console.log('🔍 GET /entries - 查詢參數:', {
      transactionGroupId,
      accountId,
      organizationId,
      startDate,
      endDate,
      page,
      limit,
      userId
    });

    // 建立查詢條件
    const filter: any = {
      createdBy: userId
    };

    // 交易群組過濾
    if (transactionGroupId) {
      filter.transactionGroupId = transactionGroupId;
    }

    // 會計科目過濾
    if (accountId) {
      filter.accountId = accountId;
    }

    // 機構過濾
    if (organizationId && organizationId !== 'undefined' && organizationId !== '') {
      filter.organizationId = new mongoose.Types.ObjectId(organizationId as string);
      console.log('🏢 查詢機構分錄:', organizationId);
    } else {
      console.log('👤 查詢所有分錄（包含個人和機構）');
    }

    // 日期範圍過濾（通過交易群組的交易日期）
    let transactionGroupFilter: any = {};
    if (startDate || endDate) {
      transactionGroupFilter.transactionDate = {};
      if (startDate) {
        transactionGroupFilter.transactionDate.$gte = new Date(startDate as string);
      }
      if (endDate) {
        transactionGroupFilter.transactionDate.$lte = new Date(endDate as string);
      }

      // 先找到符合日期條件的交易群組
      const matchingGroups = await TransactionGroup.find(transactionGroupFilter).select('_id');
      const groupIds = matchingGroups.map(group => group._id);
      
      if (groupIds.length > 0) {
        filter.transactionGroupId = { $in: groupIds };
      } else {
        // 沒有符合條件的交易群組，返回空結果
        res.json({
          success: true,
          data: {
            entries: [],
            pagination: {
              page: parseInt(page as string),
              limit: parseInt(limit as string),
              total: 0,
              pages: 0
            }
          }
        });
        return;
      }
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    console.log('📋 最終查詢條件:', filter);

    const [entries, total] = await Promise.all([
      AccountingEntry.find(filter)
        .populate('transactionGroupId', 'description transactionDate status')
        .populate('accountId', 'name code accountType')
        .populate('categoryId', 'name type')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AccountingEntry.countDocuments(filter)
    ]);

    console.log('📊 查詢結果數量:', entries.length, '/', total);

    res.json({
      success: true,
      data: {
        entries,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('獲取記帳分錄列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取記帳分錄列表失敗'
    });
  }
});

// 依交易群組查詢分錄
router.get('/by-group/:groupId', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { groupId } = req.params;

    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    console.log('🔍 GET /entries/by-group/:groupId - 查詢參數:', { groupId, userId });

    // 檢查交易群組是否存在且屬於用戶
    const transactionGroup = await TransactionGroup.findOne({
      _id: groupId,
      createdBy: userId
    });

    if (!transactionGroup) {
      res.status(404).json({
        success: false,
        message: '找不到指定的交易群組'
      });
      return;
    }

    // 獲取該交易群組的所有分錄
    const entries = await AccountingEntry.find({
      transactionGroupId: groupId
    })
      .populate('accountId', 'name code accountType normalBalance')
      .populate('categoryId', 'name type')
      .sort({ sequence: 1 });

    console.log('📊 查詢結果數量:', entries.length);

    // 驗證借貸平衡
    const balanceValidation = DoubleEntryValidator.validateDebitCreditBalance(entries);

    res.json({
      success: true,
      data: {
        transactionGroup,
        entries,
        balanceInfo: balanceValidation
      }
    });
  } catch (error) {
    console.error('依交易群組查詢分錄錯誤:', error);
    res.status(500).json({
      success: false,
      message: '依交易群組查詢分錄失敗'
    });
  }
});

// 獲取單一記帳分錄
router.get('/:id', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    const entry = await AccountingEntry.findOne({
      _id: id,
      createdBy: userId
    })
      .populate('transactionGroupId', 'description transactionDate status')
      .populate('accountId', 'name code accountType normalBalance')
      .populate('categoryId', 'name type');

    if (!entry) {
      res.status(404).json({
        success: false,
        message: '找不到指定的記帳分錄'
      });
      return;
    }

    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('獲取記帳分錄詳情錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取記帳分錄詳情失敗'
    });
  }
});

// 建立記帳分錄
router.post('/', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    const {
      transactionGroupId,
      accountId,
      debitAmount,
      creditAmount,
      categoryId,
      description,
      organizationId
    } = req.body;

    console.log('🔍 POST /entries - 建立記帳分錄:', {
      transactionGroupId,
      accountId,
      debitAmount,
      creditAmount,
      categoryId,
      description,
      organizationId,
      userId
    });

    // 驗證必填欄位
    if (!transactionGroupId || !accountId || (!debitAmount && !creditAmount)) {
      res.status(400).json({
        success: false,
        message: '請填寫所有必填欄位，借方金額或貸方金額至少要有一個'
      });
      return;
    }

    // 驗證交易群組是否存在且屬於用戶
    const transactionGroup = await TransactionGroup.findOne({
      _id: transactionGroupId,
      createdBy: userId
    });

    if (!transactionGroup) {
      res.status(400).json({
        success: false,
        message: '指定的交易群組不存在'
      });
      return;
    }

    // 檢查交易群組是否已確認（已確認的交易不能新增分錄）
    if (transactionGroup.status === 'confirmed') {
      res.status(400).json({
        success: false,
        message: '已確認的交易不能新增分錄'
      });
      return;
    }

    // 驗證會計科目是否存在且屬於用戶
    const account = await Account2.findOne({
      _id: accountId,
      createdBy: userId,
      isActive: true
    });

    if (!account) {
      res.status(400).json({
        success: false,
        message: '指定的會計科目不存在'
      });
      return;
    }

    // 驗證類別（如果提供）
    if (categoryId) {
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
    }

    // 獲取該交易群組的現有分錄數量，用於設定序號
    const existingEntriesCount = await AccountingEntry.countDocuments({
      transactionGroupId
    });

    // 建立分錄資料
    const entryData: any = {
      transactionGroupId,
      sequence: existingEntriesCount + 1,
      accountId,
      debitAmount: debitAmount || 0,
      creditAmount: creditAmount || 0,
      categoryId: categoryId || undefined,
      description: description || transactionGroup.description,
      organizationId: organizationId || transactionGroup.organizationId,
      createdBy: userId
    };

    console.log('📝 建立分錄資料:', entryData);

    // 驗證單筆分錄
    const entryValidation = DoubleEntryValidator.validateSingleEntry(entryData);
    if (!entryValidation.isValid) {
      res.status(400).json({
        success: false,
        message: `分錄驗證失敗：${entryValidation.errors.join(', ')}`
      });
      return;
    }

    const newEntry = new AccountingEntry(entryData);
    const savedEntry = await newEntry.save();

    console.log('✅ 記帳分錄建立成功:', savedEntry._id);

    // 重新計算交易群組的總金額
    const allEntries = await AccountingEntry.find({
      transactionGroupId
    });

    const totalAmount = allEntries.reduce((sum, entry) => sum + entry.debitAmount, 0);

    await TransactionGroup.findByIdAndUpdate(transactionGroupId, {
      totalAmount
    });

    console.log('💰 交易群組總金額已更新:', totalAmount);

    // 返回完整的分錄資訊
    const populatedEntry = await AccountingEntry.findById(savedEntry._id)
      .populate('transactionGroupId', 'description transactionDate status')
      .populate('accountId', 'name code accountType normalBalance')
      .populate('categoryId', 'name type');

    res.status(201).json({
      success: true,
      data: populatedEntry,
      message: '記帳分錄建立成功'
    });
  } catch (error) {
    console.error('建立記帳分錄錯誤:', error);
    res.status(500).json({
      success: false,
      message: '建立記帳分錄失敗'
    });
  }
});

// 更新記帳分錄
router.put('/:id', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    const {
      accountId,
      debitAmount,
      creditAmount,
      categoryId,
      description
    } = req.body;

    console.log('🔍 PUT /entries/:id - 更新記帳分錄:', {
      id,
      accountId,
      debitAmount,
      creditAmount,
      categoryId,
      description,
      userId
    });

    // 檢查分錄是否存在
    const entry = await AccountingEntry.findOne({
      _id: id,
      createdBy: userId
    });

    if (!entry) {
      res.status(404).json({
        success: false,
        message: '找不到指定的記帳分錄'
      });
      return;
    }

    // 檢查交易群組是否已確認
    const transactionGroup = await TransactionGroup.findById(entry.transactionGroupId);
    if (transactionGroup?.status === 'confirmed') {
      res.status(400).json({
        success: false,
        message: '已確認的交易分錄不能修改'
      });
      return;
    }

    // 驗證新的會計科目（如果有提供）
    if (accountId && accountId !== entry.accountId.toString()) {
      const account = await Account2.findOne({
        _id: accountId,
        createdBy: userId,
        isActive: true
      });

      if (!account) {
        res.status(400).json({
          success: false,
          message: '指定的會計科目不存在'
        });
        return;
      }
    }

    // 驗證新的類別（如果有提供）
    if (categoryId && categoryId !== entry.categoryId?.toString()) {
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
    }

    // 更新分錄資訊
    const updateData: Partial<IAccountingEntry> = {};
    if (accountId !== undefined) updateData.accountId = accountId;
    if (debitAmount !== undefined) updateData.debitAmount = debitAmount;
    if (creditAmount !== undefined) updateData.creditAmount = creditAmount;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (description !== undefined) updateData.description = description;

    console.log('📝 更新資料:', updateData);

    // 驗證更新後的分錄
    const entryObject = entry.toObject();
    const updatedEntryData = { ...entryObject, ...updateData };
    const entryValidation = DoubleEntryValidator.validateSingleEntry(updatedEntryData as any);
    if (!entryValidation.isValid) {
      res.status(400).json({
        success: false,
        message: `分錄驗證失敗：${entryValidation.errors.join(', ')}`
      });
      return;
    }

    const updatedEntry = await AccountingEntry.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('transactionGroupId', 'description transactionDate status')
      .populate('accountId', 'name code accountType normalBalance')
      .populate('categoryId', 'name type');

    console.log('✅ 記帳分錄更新成功:', updatedEntry?._id);

    // 重新計算交易群組的總金額
    const allEntries = await AccountingEntry.find({
      transactionGroupId: entry.transactionGroupId
    });

    const totalAmount = allEntries.reduce((sum, entry) => sum + entry.debitAmount, 0);

    await TransactionGroup.findByIdAndUpdate(entry.transactionGroupId, {
      totalAmount
    });

    console.log('💰 交易群組總金額已更新:', totalAmount);

    res.json({
      success: true,
      data: updatedEntry,
      message: '記帳分錄更新成功'
    });
  } catch (error) {
    console.error('更新記帳分錄錯誤:', error);
    res.status(500).json({
      success: false,
      message: '更新記帳分錄失敗'
    });
  }
});

// 刪除記帳分錄
router.delete('/:id', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    console.log('🔍 DELETE /entries/:id - 刪除記帳分錄:', { id, userId });

    // 檢查分錄是否存在
    const entry = await AccountingEntry.findOne({
      _id: id,
      createdBy: userId
    });

    if (!entry) {
      res.status(404).json({
        success: false,
        message: '找不到指定的記帳分錄'
      });
      return;
    }

    // 檢查交易群組是否已確認
    const transactionGroup = await TransactionGroup.findById(entry.transactionGroupId);
    if (transactionGroup?.status === 'confirmed') {
      res.status(400).json({
        success: false,
        message: '已確認的交易分錄不能刪除'
      });
      return;
    }

    // 刪除分錄
    await AccountingEntry.findByIdAndDelete(id);

    console.log('🗑️ 記帳分錄已刪除');

    // 重新排序剩餘分錄的序號
    const remainingEntries = await AccountingEntry.find({
      transactionGroupId: entry.transactionGroupId
    }).sort({ sequence: 1 });

    const updatePromises = remainingEntries.map((remainingEntry, index) => {
      return AccountingEntry.findByIdAndUpdate(remainingEntry._id, {
        sequence: index + 1
      });
    });

    await Promise.all(updatePromises);

    console.log('🔄 剩餘分錄序號已重新排序');

    // 重新計算交易群組的總金額
    const totalAmount = remainingEntries.reduce((sum, entry) => sum + entry.debitAmount, 0);

    await TransactionGroup.findByIdAndUpdate(entry.transactionGroupId, {
      totalAmount
    });

    console.log('💰 交易群組總金額已更新:', totalAmount);

    res.json({
      success: true,
      message: '記帳分錄刪除成功'
    });
  } catch (error) {
    console.error('刪除記帳分錄錯誤:', error);
    res.status(500).json({
      success: false,
      message: '刪除記帳分錄失敗'
    });
  }
});

export default router;
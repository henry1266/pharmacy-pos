import express, { Router } from 'express';
import mongoose from 'mongoose';
import TransactionGroup, { ITransactionGroup } from '../models/TransactionGroup';
import AccountingEntry from '../models/AccountingEntry';
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

// 獲取所有交易群組
router.get('/', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    const {
      organizationId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    console.log('🔍 GET /transaction-groups - 查詢參數:', {
      organizationId,
      status,
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

    // 機構過濾
    if (organizationId && organizationId !== 'undefined' && organizationId !== '') {
      filter.organizationId = new mongoose.Types.ObjectId(organizationId as string);
      console.log('🏢 查詢機構交易群組:', organizationId);
    } else {
      console.log('👤 查詢所有交易群組（包含個人和機構）');
    }

    // 狀態過濾
    if (status && ['draft', 'confirmed', 'cancelled'].includes(status as string)) {
      filter.status = status;
    }

    // 日期範圍過濾
    if (startDate || endDate) {
      filter.transactionDate = {};
      if (startDate) {
        filter.transactionDate.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.transactionDate.$lte = new Date(endDate as string);
      }
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    console.log('📋 最終查詢條件:', filter);

    const [transactionGroups, total] = await Promise.all([
      TransactionGroup.find(filter)
        .sort({ transactionDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      TransactionGroup.countDocuments(filter)
    ]);

    console.log('📊 查詢結果數量:', transactionGroups.length, '/', total);

    res.json({
      success: true,
      data: transactionGroups,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('獲取交易群組列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取交易群組列表失敗'
    });
  }
});

// 獲取單一交易群組（包含分錄）
router.get('/:id', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    const transactionGroup = await TransactionGroup.findOne({
      _id: id,
      createdBy: userId
    });

    if (!transactionGroup) {
      res.status(404).json({
        success: false,
        message: '找不到指定的交易群組'
      });
      return;
    }

    // 獲取相關的記帳分錄
    const entries = await AccountingEntry.find({
      transactionGroupId: id
    }).sort({ sequence: 1 });

    res.json({
      success: true,
      data: {
        transactionGroup,
        entries
      }
    });
  } catch (error) {
    console.error('獲取交易群組詳情錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取交易群組詳情失敗'
    });
  }
});

// 建立交易群組
router.post('/', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    const {
      description,
      transactionDate,
      organizationId,
      receiptUrl,
      invoiceNo,
      entries
    } = req.body;

    console.log('🔍 POST /transaction-groups - 建立交易群組:', {
      description,
      transactionDate,
      organizationId,
      receiptUrl,
      invoiceNo,
      entriesCount: entries?.length,
      userId
    });

    // 驗證必填欄位
    if (!description || !transactionDate || !entries || !Array.isArray(entries) || entries.length === 0) {
      res.status(400).json({
        success: false,
        message: '請填寫所有必填欄位，並至少提供一筆分錄'
      });
      return;
    }

    // 驗證借貸平衡
    const balanceValidation = DoubleEntryValidator.validateDebitCreditBalance(entries);
    if (!balanceValidation.isBalanced) {
      res.status(400).json({
        success: false,
        message: balanceValidation.message
      });
      return;
    }

    // 計算交易總金額（借方總額）
    const totalAmount = entries.reduce((sum: number, entry: any) => sum + (entry.debitAmount || 0), 0);

    // 建立交易群組資料
    const transactionGroupData: any = {
      description,
      transactionDate: new Date(transactionDate),
      totalAmount,
      receiptUrl,
      invoiceNo,
      status: 'draft',
      createdBy: userId
    };

    // 只有當 organizationId 有值且不是 null 時才加入
    if (organizationId && organizationId !== null && organizationId !== 'null' && organizationId.trim() !== '') {
      try {
        transactionGroupData.organizationId = new mongoose.Types.ObjectId(organizationId);
        console.log('✅ 設定 organizationId:', organizationId);
      } catch (error) {
        console.error('❌ organizationId 格式錯誤:', organizationId, error);
        res.status(400).json({
          success: false,
          message: '機構ID格式錯誤'
        });
        return;
      }
    } else {
      console.log('ℹ️ 個人記帳，不設定 organizationId');
    }

    console.log('📝 建立交易群組資料:', transactionGroupData);

    // 使用事務確保資料一致性
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 建立交易群組
      const newTransactionGroup = new TransactionGroup(transactionGroupData);
      const savedTransactionGroup = await newTransactionGroup.save({ session });

      console.log('✅ 交易群組建立成功:', savedTransactionGroup._id);

      // 建立記帳分錄
      const entryPromises = entries.map((entry: any, index: number) => {
        const entryData: any = {
          transactionGroupId: savedTransactionGroup._id,
          sequence: index + 1,
          accountId: entry.accountId,
          debitAmount: entry.debitAmount || 0,
          creditAmount: entry.creditAmount || 0,
          categoryId: entry.categoryId,
          description: entry.description || description,
          createdBy: userId
        };

        // 只有當 organizationId 有效時才加入
        if (organizationId && organizationId !== null && organizationId !== 'null' && organizationId.trim() !== '') {
          try {
            entryData.organizationId = new mongoose.Types.ObjectId(organizationId);
          } catch (error) {
            console.error('❌ 分錄 organizationId 格式錯誤:', organizationId, error);
          }
        }

        console.log(`📝 建立分錄 ${index + 1}:`, entryData);

        const newEntry = new AccountingEntry(entryData);
        return newEntry.save({ session });
      });

      const savedEntries = await Promise.all(entryPromises);
      console.log('✅ 所有分錄建立成功，數量:', savedEntries.length);

      await session.commitTransaction();

      res.status(201).json({
        success: true,
        data: {
          transactionGroup: savedTransactionGroup,
          entries: savedEntries
        },
        message: '交易群組建立成功'
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('建立交易群組錯誤:', error);
    res.status(500).json({
      success: false,
      message: '建立交易群組失敗'
    });
  }
});

// 更新交易群組
router.put('/:id', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    const {
      description,
      transactionDate,
      receiptUrl,
      invoiceNo,
      entries
    } = req.body;

    console.log('🔍 PUT /transaction-groups/:id - 更新交易群組:', {
      id,
      description,
      transactionDate,
      receiptUrl,
      invoiceNo,
      entriesCount: entries?.length,
      userId
    });

    // 檢查交易群組是否存在
    const transactionGroup = await TransactionGroup.findOne({
      _id: id,
      createdBy: userId
    });

    if (!transactionGroup) {
      res.status(404).json({
        success: false,
        message: '找不到指定的交易群組'
      });
      return;
    }

    // 檢查是否已確認（已確認的交易不能修改）
    if (transactionGroup.status === 'confirmed') {
      res.status(400).json({
        success: false,
        message: '已確認的交易不能修改'
      });
      return;
    }

    // 如果提供了分錄，驗證借貸平衡
    if (entries && Array.isArray(entries) && entries.length > 0) {
      const balanceValidation = DoubleEntryValidator.validateDebitCreditBalance(entries);
      if (!balanceValidation.isBalanced) {
        res.status(400).json({
          success: false,
          message: balanceValidation.message
        });
        return;
      }
    }

    // 使用事務確保資料一致性
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 更新交易群組基本資訊
      const updateData: Partial<ITransactionGroup> = {};
      if (description !== undefined) updateData.description = description;
      if (transactionDate !== undefined) updateData.transactionDate = new Date(transactionDate);
      if (receiptUrl !== undefined) updateData.receiptUrl = receiptUrl;
      if (invoiceNo !== undefined) updateData.invoiceNo = invoiceNo;

      // 如果有分錄更新，重新計算總金額
      if (entries && Array.isArray(entries) && entries.length > 0) {
        updateData.totalAmount = entries.reduce((sum: number, entry: any) => sum + (entry.debitAmount || 0), 0);
      }

      const updatedTransactionGroup = await TransactionGroup.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true, session }
      );

      console.log('✅ 交易群組更新成功:', updatedTransactionGroup?._id);

      let updatedEntries = null;

      // 如果提供了分錄，更新分錄
      if (entries && Array.isArray(entries) && entries.length > 0) {
        // 刪除舊分錄
        await AccountingEntry.deleteMany({
          transactionGroupId: id
        }, { session });

        console.log('🗑️ 舊分錄已刪除');

        // 建立新分錄
        const entryPromises = entries.map((entry: any, index: number) => {
          const entryData = {
            transactionGroupId: id,
            sequence: index + 1,
            accountId: entry.accountId,
            debitAmount: entry.debitAmount || 0,
            creditAmount: entry.creditAmount || 0,
            categoryId: entry.categoryId,
            description: entry.description || description,
            organizationId: transactionGroup.organizationId,
            createdBy: userId
          };

          console.log(`📝 建立新分錄 ${index + 1}:`, entryData);

          const newEntry = new AccountingEntry(entryData);
          return newEntry.save({ session });
        });

        updatedEntries = await Promise.all(entryPromises);
        console.log('✅ 新分錄建立成功，數量:', updatedEntries.length);
      }

      await session.commitTransaction();

      res.json({
        success: true,
        data: {
          transactionGroup: updatedTransactionGroup,
          entries: updatedEntries
        },
        message: '交易群組更新成功'
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('更新交易群組錯誤:', error);
    res.status(500).json({
      success: false,
      message: '更新交易群組失敗'
    });
  }
});

// 確認交易
router.post('/:id/confirm', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    console.log('🔍 POST /transaction-groups/:id/confirm - 確認交易:', { id, userId });

    // 檢查交易群組是否存在
    const transactionGroup = await TransactionGroup.findOne({
      _id: id,
      createdBy: userId
    });

    if (!transactionGroup) {
      res.status(404).json({
        success: false,
        message: '找不到指定的交易群組'
      });
      return;
    }

    // 檢查是否已確認
    if (transactionGroup.status === 'confirmed') {
      res.status(400).json({
        success: false,
        message: '交易已經確認過了'
      });
      return;
    }

    // 檢查是否已取消
    if (transactionGroup.status === 'cancelled') {
      res.status(400).json({
        success: false,
        message: '已取消的交易不能確認'
      });
      return;
    }

    // 獲取相關分錄並驗證借貸平衡
    const entries = await AccountingEntry.find({
      transactionGroupId: id
    });

    if (entries.length === 0) {
      res.status(400).json({
        success: false,
        message: '交易群組沒有分錄，無法確認'
      });
      return;
    }

    const balanceValidation = DoubleEntryValidator.validateDebitCreditBalance(entries);
    if (!balanceValidation.isBalanced) {
      res.status(400).json({
        success: false,
        message: balanceValidation.message
      });
      return;
    }

    // 確認交易
    const confirmedTransactionGroup = await TransactionGroup.findByIdAndUpdate(
      id,
      { status: 'confirmed' },
      { new: true, runValidators: true }
    );

    console.log('✅ 交易確認成功:', confirmedTransactionGroup?._id);

    res.json({
      success: true,
      data: confirmedTransactionGroup,
      message: '交易確認成功'
    });
  } catch (error) {
    console.error('確認交易錯誤:', error);
    res.status(500).json({
      success: false,
      message: '確認交易失敗'
    });
  }
});

// 刪除交易群組
router.delete('/:id', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    console.log('🔍 DELETE /transaction-groups/:id - 刪除交易群組:', { id, userId });

    // 檢查交易群組是否存在
    const transactionGroup = await TransactionGroup.findOne({
      _id: id,
      createdBy: userId
    });

    if (!transactionGroup) {
      res.status(404).json({
        success: false,
        message: '找不到指定的交易群組'
      });
      return;
    }

    // 檢查是否已確認（已確認的交易不能刪除）
    if (transactionGroup.status === 'confirmed') {
      res.status(400).json({
        success: false,
        message: '已確認的交易不能刪除'
      });
      return;
    }

    // 使用事務確保資料一致性
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 刪除相關分錄
      await AccountingEntry.deleteMany({
        transactionGroupId: id
      }, { session });

      console.log('🗑️ 相關分錄已刪除');

      // 刪除交易群組
      await TransactionGroup.findByIdAndDelete(id, { session });

      console.log('🗑️ 交易群組已刪除');

      await session.commitTransaction();

      res.json({
        success: true,
        message: '交易群組刪除成功'
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('刪除交易群組錯誤:', error);
    res.status(500).json({
      success: false,
      message: '刪除交易群組失敗'
    });
  }
});

export default router;
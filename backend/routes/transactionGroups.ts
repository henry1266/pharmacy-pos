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

// 輔助函數：驗證和轉換 ObjectId
const validateObjectId = (id: string, fieldName: string): mongoose.Types.ObjectId => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error(`${fieldName} 不能為空`);
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`無效的 ${fieldName} ID: ${id}`);
  }
  return new mongoose.Types.ObjectId(id);
};

// 輔助函數：安全轉換 ObjectId（可選欄位）
const safeObjectId = (id?: string): mongoose.Types.ObjectId | undefined => {
  if (!id || id === 'null' || id === 'undefined' || id.trim() === '') return undefined;
  if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
  return new mongoose.Types.ObjectId(id);
};

// 輔助函數：生成交易群組編號
const generateGroupNumber = async (session?: mongoose.ClientSession): Promise<string> => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // 查找今日最大序號
  const query = TransactionGroup.findOne({
    groupNumber: new RegExp(`^TXN-${dateStr}-`)
  }).sort({ groupNumber: -1 });
  
  if (session) {
    query.session(session);
  }
  
  const lastGroup = await query;
  
  let sequence = 1;
  if (lastGroup) {
    const parts = lastGroup.groupNumber.split('-');
    if (parts.length === 3) {
      const lastSequence = parseInt(parts[2]);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }
  }
  
  return `TXN-${dateStr}-${sequence.toString().padStart(3, '0')}`;
};

// 輔助函數：驗證分錄資料
const validateEntryData = (entry: any, index: number): void => {
  if (!entry.accountId) {
    throw new Error(`分錄 ${index + 1}: 會計科目不能為空`);
  }
  
  if (!mongoose.Types.ObjectId.isValid(entry.accountId)) {
    throw new Error(`分錄 ${index + 1}: 會計科目ID格式錯誤`);
  }
  
  const debitAmount = parseFloat(entry.debitAmount) || 0;
  const creditAmount = parseFloat(entry.creditAmount) || 0;
  
  if (debitAmount === 0 && creditAmount === 0) {
    throw new Error(`分錄 ${index + 1}: 借方金額或貸方金額至少要有一個大於0`);
  }
  
  if (debitAmount > 0 && creditAmount > 0) {
    throw new Error(`分錄 ${index + 1}: 借方金額和貸方金額不能同時大於0`);
  }
  
  if (debitAmount < 0 || creditAmount < 0) {
    throw new Error(`分錄 ${index + 1}: 金額不能為負數`);
  }
};

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

    // 為每個交易群組獲取分錄資料
    const transactionGroupsWithEntries = await Promise.all(
      transactionGroups.map(async (group) => {
        try {
          const entries = await AccountingEntry.find({
            transactionGroupId: group._id
          })
          .populate('accountId', 'name code accountType normalBalance')
          .populate('categoryId', 'name type color')
          .sort({ sequence: 1 });

          console.log(`📋 交易群組 ${group._id} 的分錄數量:`, entries.length);

          // 將分錄資料轉換為前端期望的格式
          const formattedEntries = entries.map((entry, index) => {
            const account = entry.accountId as any;
            const category = entry.categoryId as any;
            
            console.log(`  分錄 ${index + 1}:`, {
              accountId: account?._id,
              accountName: account?.name,
              accountCode: account?.code,
              categoryName: category?.name
            });

            return {
              _id: entry._id,
              accountId: account?._id || entry.accountId,
              accountName: account?.name || '未知科目',
              accountCode: account?.code || '',
              debitAmount: entry.debitAmount || 0,
              creditAmount: entry.creditAmount || 0,
              description: entry.description || '',
              categoryId: category?._id || entry.categoryId,
              categoryName: category?.name || ''
            };
          });

          // 計算借貸平衡
          const totalDebit = formattedEntries.reduce((sum, e) => sum + e.debitAmount, 0);
          const totalCredit = formattedEntries.reduce((sum, e) => sum + e.creditAmount, 0);
          const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01; // 允許小數點誤差

          return {
            ...group.toObject(),
            entries: formattedEntries,
            isBalanced,
            totalAmount: totalDebit // 使用借方總額作為交易總金額
          };
        } catch (error) {
          console.error(`❌ 處理交易群組 ${group._id} 的分錄時發生錯誤:`, error);
          return {
            ...group.toObject(),
            entries: [],
            isBalanced: false
          };
        }
      })
    );

    res.json({
      success: true,
      data: {
        transactionGroups: transactionGroupsWithEntries,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
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
      entries,
      linkedTransactionIds,
      sourceTransactionId,
      fundingType = 'original'
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

    // 驗證分錄數量
    if (entries.length < 2) {
      res.status(400).json({
        success: false,
        message: '複式記帳至少需要兩筆分錄'
      });
      return;
    }

    // 驗證每筆分錄的資料完整性
    try {
      entries.forEach((entry, index) => {
        validateEntryData(entry, index);
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '分錄資料驗證失敗'
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
      createdBy: userId,
      fundingType,
      linkedTransactionIds: linkedTransactionIds ? linkedTransactionIds.map((id: string) => new mongoose.Types.ObjectId(id)) : [],
      sourceTransactionId: sourceTransactionId ? new mongoose.Types.ObjectId(sourceTransactionId) : undefined
    };

    // 處理 organizationId
    try {
      const validOrganizationId = safeObjectId(organizationId);
      if (validOrganizationId) {
        transactionGroupData.organizationId = validOrganizationId;
        console.log('✅ 設定 organizationId:', organizationId);
      } else {
        console.log('ℹ️ 個人記帳，不設定 organizationId');
      }
    } catch (error) {
      console.error('❌ organizationId 處理錯誤:', organizationId, error);
      res.status(400).json({
        success: false,
        message: '機構ID格式錯誤'
      });
      return;
    }

    // 生成交易群組編號
    const groupNumber = await generateGroupNumber();
    transactionGroupData.groupNumber = groupNumber;
    
    console.log('📝 建立交易群組資料:', transactionGroupData);

    let savedTransactionGroup: any = null;
    
    try {
      // 建立交易群組
      const newTransactionGroup = new TransactionGroup(transactionGroupData);
      savedTransactionGroup = await newTransactionGroup.save();

      console.log('✅ 交易群組建立成功:', savedTransactionGroup._id);

      // 建立記帳分錄
      const entryPromises = entries.map((entry: any, index: number) => {
        try {
          // 驗證並轉換 accountId
          const validAccountId = validateObjectId(entry.accountId, `分錄 ${index + 1} 會計科目`);
          
          // 處理可選的 categoryId
          const validCategoryId = safeObjectId(entry.categoryId);
          
          // 處理可選的 organizationId
          const validOrganizationId = safeObjectId(organizationId);

          const entryData: any = {
            transactionGroupId: savedTransactionGroup._id,
            sequence: index + 1,
            accountId: validAccountId,
            debitAmount: parseFloat(entry.debitAmount) || 0,
            creditAmount: parseFloat(entry.creditAmount) || 0,
            description: entry.description || description,
            createdBy: userId
          };

          // 只有當有效時才加入可選欄位
          if (validCategoryId) {
            entryData.categoryId = validCategoryId;
          }
          
          if (validOrganizationId) {
            entryData.organizationId = validOrganizationId;
          }

          console.log(`📝 建立分錄 ${index + 1}:`, {
            ...entryData,
            accountId: entryData.accountId.toString(),
            categoryId: entryData.categoryId?.toString(),
            organizationId: entryData.organizationId?.toString()
          });

          const newEntry = new AccountingEntry(entryData);
          return newEntry.save();
        } catch (error) {
          console.error(`❌ 分錄 ${index + 1} 資料處理錯誤:`, error);
          throw error;
        }
      });

      const savedEntries = await Promise.all(entryPromises);
      console.log('✅ 所有分錄建立成功，數量:', savedEntries.length);

      res.status(201).json({
        success: true,
        data: {
          transactionGroup: savedTransactionGroup,
          entries: savedEntries
        },
        message: '交易群組建立成功'
      });
    } catch (error) {
      // 如果分錄建立失敗，嘗試清理已建立的交易群組
      if (savedTransactionGroup) {
        try {
          await TransactionGroup.findByIdAndDelete(savedTransactionGroup._id);
          console.log('🧹 已清理失敗的交易群組');
        } catch (cleanupError) {
          console.error('❌ 清理交易群組失敗:', cleanupError);
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ 建立交易群組錯誤:', error);
    console.error('❌ 錯誤堆疊:', error instanceof Error ? error.stack : 'Unknown error');
    console.error('❌ 錯誤詳情:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      keyPattern: (error as any)?.keyPattern,
      keyValue: (error as any)?.keyValue
    });
    
    res.status(500).json({
      success: false,
      message: '建立交易群組失敗',
      error: process.env.NODE_ENV === 'development' ? {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      } : undefined
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
      entries,
      linkedTransactionIds,
      sourceTransactionId,
      fundingType
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

    // 不使用事務，直接進行更新操作（適用於單機 MongoDB）
    try {
      // 更新交易群組基本資訊
      const updateData: Partial<ITransactionGroup> = {};
      if (description !== undefined) updateData.description = description;
      if (transactionDate !== undefined) updateData.transactionDate = new Date(transactionDate);
      if (receiptUrl !== undefined) updateData.receiptUrl = receiptUrl;
      if (invoiceNo !== undefined) updateData.invoiceNo = invoiceNo;
      if (fundingType !== undefined) updateData.fundingType = fundingType;
      if (linkedTransactionIds !== undefined) {
        updateData.linkedTransactionIds = linkedTransactionIds.map((id: string) => new mongoose.Types.ObjectId(id));
      }
      if (sourceTransactionId !== undefined) {
        updateData.sourceTransactionId = sourceTransactionId ? new mongoose.Types.ObjectId(sourceTransactionId) : undefined;
      }

      // 如果有分錄更新，重新計算總金額
      if (entries && Array.isArray(entries) && entries.length > 0) {
        updateData.totalAmount = entries.reduce((sum: number, entry: any) => sum + (entry.debitAmount || 0), 0);
      }

      const updatedTransactionGroup = await TransactionGroup.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      console.log('✅ 交易群組更新成功:', updatedTransactionGroup?._id);

      let updatedEntries = null;

      // 只有在明確提供了有效分錄且數量大於0時才更新分錄
      // 並且分錄資料必須是完整且有效的
      if (entries && Array.isArray(entries) && entries.length > 0) {
        // 驗證分錄資料完整性 - 更嚴格的驗證
        const hasValidEntries = entries.every(entry =>
          entry.accountId &&
          mongoose.Types.ObjectId.isValid(entry.accountId) &&
          (entry.debitAmount > 0 || entry.creditAmount > 0) &&
          !(entry.debitAmount > 0 && entry.creditAmount > 0) // 不能同時有借方和貸方
        );

        // 驗證借貸平衡
        const totalDebit = entries.reduce((sum: number, entry: any) => sum + (entry.debitAmount || 0), 0);
        const totalCredit = entries.reduce((sum: number, entry: any) => sum + (entry.creditAmount || 0), 0);
        const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

        if (hasValidEntries && isBalanced && entries.length >= 2) {
          console.log('🔄 開始更新分錄，新分錄數量:', entries.length);
          console.log('💰 借方總額:', totalDebit, '貸方總額:', totalCredit);
          
          // 刪除舊分錄
          await AccountingEntry.deleteMany({
            transactionGroupId: id
          });

          console.log('🗑️ 舊分錄已刪除');

          // 建立新分錄
          const entryPromises = entries.map((entry: any, index: number) => {
            const entryData = {
              transactionGroupId: id,
              sequence: index + 1,
              accountId: entry.accountId,
              debitAmount: entry.debitAmount || 0,
              creditAmount: entry.creditAmount || 0,
              categoryId: entry.categoryId || null,
              description: entry.description || description,
              organizationId: transactionGroup.organizationId,
              createdBy: userId
            };

            console.log(`📝 建立新分錄 ${index + 1}:`, entryData);

            const newEntry = new AccountingEntry(entryData);
            return newEntry.save();
          });

          updatedEntries = await Promise.all(entryPromises);
          console.log('✅ 新分錄建立成功，數量:', updatedEntries.length);
        } else {
          console.log('⚠️ 分錄資料驗證失敗，跳過分錄更新');
          console.log('📊 驗證結果:', {
            hasValidEntries,
            isBalanced,
            entriesLength: entries.length,
            totalDebit,
            totalCredit
          });
        }
      } else {
        console.log('ℹ️ 未提供分錄或分錄為空，僅更新交易群組基本資訊');
      }

      res.json({
        success: true,
        data: {
          transactionGroup: updatedTransactionGroup,
          entries: updatedEntries
        },
        message: '交易群組更新成功'
      });
    } catch (error) {
      throw error;
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

    // 不使用事務，直接進行刪除操作（適用於單機 MongoDB）
    try {
      // 刪除相關分錄
      await AccountingEntry.deleteMany({
        transactionGroupId: id
      });

      console.log('🗑️ 相關分錄已刪除');

      // 刪除交易群組
      await TransactionGroup.findByIdAndDelete(id);

      console.log('🗑️ 交易群組已刪除');

      res.json({
        success: true,
        message: '交易群組刪除成功'
      });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error('刪除交易群組錯誤:', error);
    res.status(500).json({
      success: false,
      message: '刪除交易群組失敗'
    });
  }
});

// 獲取可用的資金來源
router.get('/funding-sources/available', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    const { organizationId, minAmount = 0 } = req.query;

    console.log('🔍 GET /transaction-groups/funding-sources/available - 查詢可用資金來源:', {
      organizationId,
      minAmount,
      userId
    });

    // 建立查詢條件
    const filter: any = {
      createdBy: userId,
      status: 'confirmed', // 只有已確認的交易才能作為資金來源
      fundingType: { $in: ['original', 'extended'] }, // 原始資金或延伸使用的資金
      totalAmount: { $gt: parseFloat(minAmount as string) } // 金額大於最小要求
    };

    // 機構過濾
    if (organizationId && organizationId !== 'undefined' && organizationId !== '') {
      filter.organizationId = new mongoose.Types.ObjectId(organizationId as string);
    }

    // 查詢可用的資金來源
    const fundingSources = await TransactionGroup.find(filter)
      .sort({ transactionDate: -1, createdAt: -1 })
      .limit(50); // 限制返回數量

    // 計算每個資金來源的已使用金額
    const sourcesWithUsage = await Promise.all(
      fundingSources.map(async (source) => {
        // 查找所有使用此資金來源的交易
        const linkedTransactions = await TransactionGroup.find({
          linkedTransactionIds: source._id,
          status: { $ne: 'cancelled' },
          createdBy: userId
        });

        const usedAmount = linkedTransactions.reduce((sum, tx) => sum + (tx.totalAmount || 0), 0);
        const availableAmount = (source.totalAmount || 0) - usedAmount;

        return {
          _id: source._id,
          groupNumber: source.groupNumber,
          description: source.description,
          transactionDate: source.transactionDate,
          totalAmount: source.totalAmount || 0,
          usedAmount,
          availableAmount,
          fundingType: source.fundingType,
          receiptUrl: source.receiptUrl,
          invoiceNo: source.invoiceNo,
          isAvailable: availableAmount > 0
        };
      })
    );

    // 只返回有可用金額的資金來源
    const availableSources = sourcesWithUsage.filter(source => source.isAvailable);

    res.json({
      success: true,
      data: {
        fundingSources: availableSources,
        total: availableSources.length
      }
    });
  } catch (error) {
    console.error('獲取可用資金來源錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取可用資金來源失敗'
    });
  }
});

// 獲取資金流向追蹤
router.get('/:id/funding-flow', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    console.log('🔍 GET /transaction-groups/:id/funding-flow - 查詢資金流向:', { id, userId });

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

    // 建立資金流向追蹤結果
    const fundingFlow: any = {
      sourceTransaction: transactionGroup,
      linkedTransactions: [],
      fundingPath: [],
      totalUsedAmount: 0
    };

    // 如果這是延伸使用的資金，追蹤其來源
    if (transactionGroup.sourceTransactionId) {
      const sourceTransaction = await TransactionGroup.findById(transactionGroup.sourceTransactionId);
      if (sourceTransaction) {
        fundingFlow.originalSource = sourceTransaction;
        
        // 遞歸追蹤完整的資金路徑
        const buildFundingPath = async (txId: mongoose.Types.ObjectId | string, path: any[] = []): Promise<any[]> => {
          const tx = await TransactionGroup.findById(txId);
          if (!tx) return path;
          
          path.unshift({
            _id: tx._id,
            groupNumber: tx.groupNumber,
            description: tx.description,
            transactionDate: tx.transactionDate,
            totalAmount: tx.totalAmount,
            fundingType: tx.fundingType
          });
          
          if (tx.sourceTransactionId) {
            return buildFundingPath(tx.sourceTransactionId, path);
          }
          
          return path;
        };
        
        fundingFlow.fundingPath = await buildFundingPath(transactionGroup.sourceTransactionId);
      }
    }

    // 查找所有使用此交易作為資金來源的交易
    const linkedTransactions = await TransactionGroup.find({
      linkedTransactionIds: transactionGroup._id,
      createdBy: userId
    }).sort({ transactionDate: 1, createdAt: 1 });

    fundingFlow.linkedTransactions = linkedTransactions.map(tx => ({
      _id: tx._id,
      groupNumber: tx.groupNumber,
      description: tx.description,
      transactionDate: tx.transactionDate,
      totalAmount: tx.totalAmount,
      fundingType: tx.fundingType,
      status: tx.status
    }));

    fundingFlow.totalUsedAmount = linkedTransactions
      .filter(tx => tx.status !== 'cancelled')
      .reduce((sum, tx) => sum + (tx.totalAmount || 0), 0);

    // 計算剩餘可用金額
    fundingFlow.availableAmount = (transactionGroup.totalAmount || 0) - fundingFlow.totalUsedAmount;

    res.json({
      success: true,
      data: fundingFlow
    });
  } catch (error) {
    console.error('獲取資金流向錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取資金流向失敗'
    });
  }
});

// 驗證資金來源可用性
router.post('/funding-sources/validate', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    const { sourceTransactionIds, requiredAmount } = req.body;

    console.log('🔍 POST /transaction-groups/funding-sources/validate - 驗證資金來源:', {
      sourceTransactionIds,
      requiredAmount,
      userId
    });

    if (!sourceTransactionIds || !Array.isArray(sourceTransactionIds) || sourceTransactionIds.length === 0) {
      res.status(400).json({
        success: false,
        message: '請提供有效的資金來源ID列表'
      });
      return;
    }

    const validationResults = await Promise.all(
      sourceTransactionIds.map(async (sourceId: string) => {
        try {
          // 檢查資金來源是否存在且已確認
          const sourceTransaction = await TransactionGroup.findOne({
            _id: sourceId,
            createdBy: userId,
            status: 'confirmed'
          });

          if (!sourceTransaction) {
            return {
              sourceId,
              isValid: false,
              error: '資金來源不存在或未確認'
            };
          }

          // 計算已使用金額
          const linkedTransactions = await TransactionGroup.find({
            linkedTransactionIds: sourceId,
            status: { $ne: 'cancelled' },
            createdBy: userId
          });

          const usedAmount = linkedTransactions.reduce((sum, tx) => sum + (tx.totalAmount || 0), 0);
          const availableAmount = (sourceTransaction.totalAmount || 0) - usedAmount;

          return {
            sourceId,
            isValid: availableAmount > 0,
            sourceTransaction: {
              _id: sourceTransaction._id,
              groupNumber: sourceTransaction.groupNumber,
              description: sourceTransaction.description,
              totalAmount: sourceTransaction.totalAmount,
              usedAmount,
              availableAmount
            },
            error: availableAmount <= 0 ? '資金來源已用完' : null
          };
        } catch (error) {
          return {
            sourceId,
            isValid: false,
            error: '驗證過程中發生錯誤'
          };
        }
      })
    );

    // 計算總可用金額
    const totalAvailableAmount = validationResults
      .filter(result => result.isValid)
      .reduce((sum, result) => sum + (result.sourceTransaction?.availableAmount || 0), 0);

    const isSufficient = totalAvailableAmount >= (requiredAmount || 0);

    res.json({
      success: true,
      data: {
        validationResults,
        totalAvailableAmount,
        requiredAmount: requiredAmount || 0,
        isSufficient,
        summary: {
          validSources: validationResults.filter(r => r.isValid).length,
          invalidSources: validationResults.filter(r => !r.isValid).length,
          totalSources: validationResults.length
        }
      }
    });
  } catch (error) {
    console.error('驗證資金來源錯誤:', error);
    res.status(500).json({
      success: false,
      message: '驗證資金來源失敗'
    });
  }
});

export default router;
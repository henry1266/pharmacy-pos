import express, { Router } from 'express';
import mongoose from 'mongoose';
import AccountingEntry from '../models/AccountingEntry';
import TransactionGroup from '../models/TransactionGroup';
import auth from '../middleware/auth';

// 擴展 Request 介面
interface AuthenticatedRequest extends express.Request {
  user?: {
    id: string;
    userId?: string;
  };
}

const router: Router = express.Router();

// 獲取特定科目的分錄記錄
router.get('/by-account/:accountId', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { accountId } = req.params;
    
    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      res.status(400).json({
        success: false,
        message: '無效的科目ID'
      });
      return;
    }

    const {
      organizationId,
      startDate,
      endDate,
      page = 1,
      limit = 100
    } = req.query;

    console.log('🔍 GET /accounting-entries/by-account - 查詢參數:', {
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
      accountId: new mongoose.Types.ObjectId(accountId),
      createdBy: userId
    };

    // 機構過濾
    if (organizationId && organizationId !== 'undefined' && organizationId !== '') {
      filter.organizationId = new mongoose.Types.ObjectId(organizationId as string);
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // 查詢分錄
    const entries = await AccountingEntry.find(filter)
      .populate('accountId', 'name code accountType normalBalance')
      .populate('categoryId', 'name type color')
      .populate('transactionGroupId', 'groupNumber description transactionDate status totalAmount receiptUrl invoiceNo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await AccountingEntry.countDocuments(filter);

    console.log('📊 查詢結果數量:', entries.length, '/', total);

    // 如果有日期範圍過濾，需要進一步過濾
    let filteredEntries = entries;
    if (startDate || endDate) {
      filteredEntries = entries.filter(entry => {
        const transactionGroup = entry.transactionGroupId as any;
        if (!transactionGroup || !transactionGroup.transactionDate) return false;
        
        const entryDate = new Date(transactionGroup.transactionDate);
        
        if (startDate && entryDate < new Date(startDate as string)) return false;
        if (endDate && entryDate > new Date(endDate as string)) return false;
        
        return true;
      });
    }

    // 格式化分錄資料並獲取對方科目資訊
    const formattedEntries = await Promise.all(filteredEntries.map(async entry => {
      const account = entry.accountId as any;
      const category = entry.categoryId as any;
      const transactionGroup = entry.transactionGroupId as any;

      // 獲取同一交易群組中的其他分錄（對方科目）
      let counterpartAccounts: string[] = [];
      if (transactionGroup?._id) {
        const otherEntries = await AccountingEntry.find({
          transactionGroupId: transactionGroup._id,
          accountId: { $ne: account?._id }, // 排除當前科目
          createdBy: userId
        }).populate('accountId', 'name code');

        counterpartAccounts = otherEntries
          .map(otherEntry => {
            const otherAccount = otherEntry.accountId as any;
            return otherAccount?.name || '未知科目';
          })
          .filter(name => name !== '未知科目');
      }

      return {
        _id: entry._id,
        transactionGroupId: transactionGroup?._id,
        groupNumber: transactionGroup?.groupNumber,
        transactionDate: transactionGroup?.transactionDate,
        groupDescription: transactionGroup?.description,
        status: transactionGroup?.status,
        receiptUrl: transactionGroup?.receiptUrl,
        invoiceNo: transactionGroup?.invoiceNo,
        sequence: entry.sequence,
        accountId: account?._id,
        accountName: account?.name,
        accountCode: account?.code,
        accountType: account?.accountType,
        debitAmount: entry.debitAmount || 0,
        creditAmount: entry.creditAmount || 0,
        description: entry.description,
        categoryId: category?._id,
        categoryName: category?.name,
        counterpartAccounts, // 對方科目列表
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt
      };
    }));

    // 計算統計資料
    const totalDebit = formattedEntries.reduce((sum, entry) => sum + entry.debitAmount, 0);
    const totalCredit = formattedEntries.reduce((sum, entry) => sum + entry.creditAmount, 0);
    const balance = totalDebit - totalCredit;

    res.json({
      success: true,
      data: {
        entries: formattedEntries,
        statistics: {
          totalDebit,
          totalCredit,
          balance,
          recordCount: formattedEntries.length
        },
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: filteredEntries.length,
          pages: Math.ceil(filteredEntries.length / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('獲取科目分錄失敗:', error);
    res.status(500).json({
      success: false,
      message: '獲取科目分錄失敗'
    });
  }
});

// 獲取特定類別的分錄記錄
router.get('/by-category/:categoryId', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { categoryId } = req.params;
    
    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      res.status(400).json({
        success: false,
        message: '無效的類別ID'
      });
      return;
    }

    const {
      organizationId,
      startDate,
      endDate,
      page = 1,
      limit = 100
    } = req.query;

    console.log('🔍 GET /accounting-entries/by-category - 查詢參數:', {
      categoryId,
      organizationId,
      startDate,
      endDate,
      page,
      limit,
      userId
    });

    // 建立查詢條件
    const filter: any = {
      categoryId: new mongoose.Types.ObjectId(categoryId),
      createdBy: userId
    };

    // 機構過濾
    if (organizationId && organizationId !== 'undefined' && organizationId !== '') {
      filter.organizationId = new mongoose.Types.ObjectId(organizationId as string);
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // 查詢分錄
    const entries = await AccountingEntry.find(filter)
      .populate('accountId', 'name code accountType normalBalance')
      .populate('categoryId', 'name type color')
      .populate('transactionGroupId', 'groupNumber description transactionDate status totalAmount receiptUrl invoiceNo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await AccountingEntry.countDocuments(filter);

    console.log('📊 查詢結果數量:', entries.length, '/', total);

    // 如果有日期範圍過濾，需要進一步過濾
    let filteredEntries = entries;
    if (startDate || endDate) {
      filteredEntries = entries.filter(entry => {
        const transactionGroup = entry.transactionGroupId as any;
        if (!transactionGroup || !transactionGroup.transactionDate) return false;
        
        const entryDate = new Date(transactionGroup.transactionDate);
        
        if (startDate && entryDate < new Date(startDate as string)) return false;
        if (endDate && entryDate > new Date(endDate as string)) return false;
        
        return true;
      });
    }

    // 格式化分錄資料
    const formattedEntries = filteredEntries.map(entry => {
      const account = entry.accountId as any;
      const category = entry.categoryId as any;
      const transactionGroup = entry.transactionGroupId as any;

      return {
        _id: entry._id,
        transactionGroupId: transactionGroup?._id,
        groupNumber: transactionGroup?.groupNumber,
        transactionDate: transactionGroup?.transactionDate,
        groupDescription: transactionGroup?.description,
        status: transactionGroup?.status,
        receiptUrl: transactionGroup?.receiptUrl,
        invoiceNo: transactionGroup?.invoiceNo,
        sequence: entry.sequence,
        accountId: account?._id,
        accountName: account?.name,
        accountCode: account?.code,
        accountType: account?.accountType,
        debitAmount: entry.debitAmount || 0,
        creditAmount: entry.creditAmount || 0,
        description: entry.description,
        categoryId: category?._id,
        categoryName: category?.name,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt
      };
    });

    // 計算統計資料
    const totalDebit = formattedEntries.reduce((sum, entry) => sum + entry.debitAmount, 0);
    const totalCredit = formattedEntries.reduce((sum, entry) => sum + entry.creditAmount, 0);
    const balance = totalDebit - totalCredit;

    res.json({
      success: true,
      data: {
        entries: formattedEntries,
        statistics: {
          totalDebit,
          totalCredit,
          balance,
          recordCount: formattedEntries.length
        },
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: filteredEntries.length,
          pages: Math.ceil(filteredEntries.length / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('獲取類別分錄失敗:', error);
    res.status(500).json({
      success: false,
      message: '獲取類別分錄失敗'
    });
  }
});

export default router;
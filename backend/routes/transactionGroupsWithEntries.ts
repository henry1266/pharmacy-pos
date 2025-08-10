import express, { Router } from 'express';
import mongoose from 'mongoose';
import TransactionGroupWithEntries, { ITransactionGroupWithEntries } from '../models/TransactionGroupWithEntries';
import auth from '../middleware/auth';
import DoubleEntryValidator from '../utils/doubleEntryValidation';

// 導入重構後的輔助函數
import {
  formatFundingSourceInfo,
  // processFundingSourceUsages,
  calculateProportionalFundingUsage,
  getReferencedByInfo
} from '../utils/fundingSourceHelpers';

import {
  AuthenticatedRequest,
  validateUserAuth,
  findAndValidateTransactionGroup,
  validateTransactionStatus,
  validateTransactionForConfirmation,
  validateTransactionForUnlock,
  buildQueryFilter,
  buildPaginationParams,
  validateBasicTransactionData,
  sendSuccessResponse,
  sendErrorResponse,
  handleRouteError
} from '../utils/transactionValidationHelpers';

import {
  formatTransactionGroupsList,
  buildPaginatedResponse,
  buildEmbeddedEntries,
  calculateTotalAmount,
  buildTransactionGroupData,
  validateEntriesIntegrity
} from '../utils/transactionFormatHelpers';

const router: Router = express.Router();


// 輔助函數：生成交易群組編號
const generateGroupNumber = async (): Promise<string> => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // 查找今日最大序號
  const lastGroup = await TransactionGroupWithEntries.findOne({
    groupNumber: new RegExp(`^TXN-${dateStr}-`)
  }).sort({ groupNumber: -1 });
  
  let sequence = 1;
  if (lastGroup) {
    const parts = lastGroup.groupNumber.split('-');
    if (parts.length === 3 && parts[2]) {
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

// 獲取所有交易群組（包含內嵌分錄）
router.get('/', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = validateUserAuth(req, res);
    if (!userId) return;

    //console.log('🔍 GET /transaction-groups-with-entries - 查詢參數:', {
      //...req.query,
      //userId
    //});

    // 建立查詢條件和分頁參數
    const filter = buildQueryFilter(userId, req.query);
    const { pageNum, limitNum, skip } = buildPaginationParams(req.query);

    //console.log('📋 最終查詢條件:', filter);

    // 執行查詢 - 使用分頁參數限制返回數據筆數
    const [transactionGroups, total] = await Promise.all([
      TransactionGroupWithEntries.find(filter)
        .populate('entries.accountId', 'name code accountType normalBalance')
        .populate('entries.categoryId', 'name type color')
        .populate('entries.sourceTransactionId', 'groupNumber description transactionDate totalAmount')
        .sort({ transactionDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      TransactionGroupWithEntries.countDocuments(filter)
    ]);

    //console.log('📊 查詢結果數量:', transactionGroups.length, '/', total, `(分頁: ${pageNum}/${Math.ceil(total/limitNum)}, 每頁 ${limitNum} 筆)`);

    // 格式化交易群組列表
    const formattedTransactionGroups = await formatTransactionGroupsList(transactionGroups, userId);

    // 建立分頁回應
    const response = buildPaginatedResponse(formattedTransactionGroups, pageNum, limitNum, total);
    res.json(response);

  } catch (error) {
    handleRouteError(error, res, '獲取交易群組列表');
  }
});

// 獲取單一交易群組（包含內嵌分錄）
router.get('/:id', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = validateUserAuth(req, res);
    if (!userId) return;

    const { id } = req.params;

    if (!id) {
      sendErrorResponse(res, 400, '缺少交易群組ID參數');
      return;
    }

    // 移除 createdBy: userId 條件，讓所有人都能共用資料
    const transactionGroup = await TransactionGroupWithEntries.findOne({
      _id: id
    })
    .populate('entries.accountId', 'name code accountType normalBalance')
    .populate('entries.categoryId', 'name type color')
    .populate('linkedTransactionIds', 'groupNumber description transactionDate totalAmount fundingType status createdAt updatedAt');

    if (!transactionGroup) {
      sendErrorResponse(res, 404, '找不到指定的交易群組');
      return;
    }

    // 格式化回應資料，包含資金來源詳細資訊
    const transactionGroupObj = transactionGroup.toObject();
    const responseData: any = { ...transactionGroupObj };
    
    // 處理資金來源資訊
    if (transactionGroupObj.linkedTransactionIds && transactionGroupObj.linkedTransactionIds.length > 0) {
      //console.log('🔍 GET /:id - 處理資金來源資訊，linkedTransactionIds:', transactionGroupObj.linkedTransactionIds);
      
      responseData.fundingSourcesInfo = await Promise.all(
        transactionGroupObj.linkedTransactionIds.map((linkedTx: any) =>
          formatFundingSourceInfo(linkedTx, userId)
        )
      );
      
      //console.log('🎯 GET /:id - 最終資金來源資訊:', responseData.fundingSourcesInfo);
    } else {
      //console.log('ℹ️ GET /:id - 沒有資金來源需要處理');
      responseData.fundingSourcesInfo = [];
    }

    // 查詢被引用情況
    //console.log('🔍 GET /:id - 查詢被引用情況');
    responseData.referencedByInfo = await getReferencedByInfo(transactionGroup._id, userId);

    // 被引用情況已由 getReferencedByInfo 函數處理

    sendSuccessResponse(res, responseData);

  } catch (error) {
    handleRouteError(error, res, '獲取交易群組詳情');
  }
});

// 建立交易群組（包含內嵌分錄）
router.post('/', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = validateUserAuth(req, res);
    if (!userId) return;

    const { entries, linkedTransactionIds } = req.body;

    // 開始建立交易群組處理流程

    // 驗證基本交易資料
    if (!validateBasicTransactionData(req.body, res)) return;

    // 驗證每筆分錄的資料完整性
    try {
      // 驗證每筆分錄的資料完整性
      entries.forEach((entry: any, index: number) => {
        validateEntryData(entry, index);
      });
    } catch (error) {
      console.error('❌ [Backend] 分錄資料驗證失敗:', error);
      sendErrorResponse(res, 400, error instanceof Error ? error.message : '分錄資料驗證失敗');
      return;
    }

    // 驗證借貸平衡
    //console.log('🔍 [Backend] 開始驗證借貸平衡...');
    const balanceValidation = DoubleEntryValidator.validateDebitCreditBalance(entries);
    
    if (!balanceValidation.isBalanced) {
      console.error('❌ [Backend] 借貸平衡驗證失敗:', balanceValidation.message);
      sendErrorResponse(res, 400, balanceValidation.message);
      return;
    }
    
    //console.log('✅ [Backend] 借貸平衡驗證通過');

    // 計算交易總金額
    const totalAmount = calculateTotalAmount(entries);

    if (totalAmount <= 0) {
      console.error('❌ [Backend] 交易總金額必須大於0:', { totalAmount });
      sendErrorResponse(res, 400, '交易總金額必須大於0');
      return;
    }

    // 生成交易群組編號
    //console.log('🔍 [Backend] 生成交易群組編號...');
    let groupNumber: string;
    try {
      groupNumber = await generateGroupNumber();
    } catch (error) {
      console.error('❌ [Backend] 生成交易群組編號失敗:', error);
      sendErrorResponse(res, 500, '生成交易群組編號失敗');
      return;
    }

    // 建立內嵌分錄資料
    let embeddedEntries: any[];
    try {
      embeddedEntries = buildEmbeddedEntries(entries, req.body.description, req.body.organizationId);
    } catch (error) {
      console.error('❌ [Backend] 建立內嵌分錄資料失敗:', error);
      sendErrorResponse(res, 400, error instanceof Error ? error.message : '建立分錄資料失敗');
      return;
    }

    // 建立交易群組資料
    const transactionGroupData = buildTransactionGroupData(req.body, userId, groupNumber, embeddedEntries, totalAmount);

    // 處理精確資金來源使用追蹤
    if (req.body.fundingSourceUsages && Array.isArray(req.body.fundingSourceUsages)) {
      //console.log('🔍 處理精確資金來源使用明細:', req.body.fundingSourceUsages);
      
      transactionGroupData.fundingSourceUsages = req.body.fundingSourceUsages.map((usage: any) => ({
        sourceTransactionId: new mongoose.Types.ObjectId(usage.sourceTransactionId),
        usedAmount: parseFloat(usage.usedAmount) || 0,
        description: usage.description || ''
      }));
      
      //console.log('✅ 設定精確資金使用明細:', transactionGroupData.fundingSourceUsages);
    } else if (linkedTransactionIds && linkedTransactionIds.length > 0) {
      // 自動計算按比例分配
      const fundingSourceUsages = await calculateProportionalFundingUsage(linkedTransactionIds, totalAmount, userId);
      transactionGroupData.fundingSourceUsages = fundingSourceUsages;
    }
    
    //console.log('📝 建立交易群組資料:', transactionGroupData);

    // 建立交易群組（包含內嵌分錄）
    const newTransactionGroup = new TransactionGroupWithEntries(transactionGroupData);
    const savedTransactionGroup = await newTransactionGroup.save();

    //console.log('✅ 交易群組建立成功:', savedTransactionGroup._id);

    sendSuccessResponse(res, savedTransactionGroup, '交易群組建立成功', 201);

  } catch (error) {
    handleRouteError(error, res, '建立交易群組');
  }
});

// 更新交易群組（包含內嵌分錄）
router.put('/:id', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = validateUserAuth(req, res);
    if (!userId) return;

    const { id } = req.params;
    const { entries, linkedTransactionIds } = req.body;

    // 開始更新交易群組處理流程

    // 查詢並驗證交易群組
    const transactionGroup = await findAndValidateTransactionGroup(id, userId, res);
    if (!transactionGroup) return;

    // 驗證交易狀態
    if (!validateTransactionStatus(transactionGroup, res, ['draft'])) return;

    // 如果提供了分錄，驗證借貸平衡
    if (entries && Array.isArray(entries) && entries.length > 0) {
      const balanceValidation = DoubleEntryValidator.validateDebitCreditBalance(entries);
      if (!balanceValidation.isBalanced) {
        sendErrorResponse(res, 400, balanceValidation.message);
        return;
      }
    }

    // 準備更新資料
    const updateData: Partial<ITransactionGroupWithEntries> = {};
    const { description, transactionDate, receiptUrl, invoiceNo, fundingType, sourceTransactionId } = req.body;
    
    if (description !== undefined) updateData.description = description;
    if (transactionDate !== undefined) updateData.transactionDate = new Date(transactionDate);
    if (receiptUrl !== undefined) updateData.receiptUrl = receiptUrl;
    if (invoiceNo !== undefined) updateData.invoiceNo = invoiceNo;
    if (fundingType !== undefined) updateData.fundingType = fundingType;
    if (linkedTransactionIds !== undefined) {
      updateData.linkedTransactionIds = linkedTransactionIds.map((id: string) => new mongoose.Types.ObjectId(id));
    }
    if (sourceTransactionId !== undefined) {
      if (sourceTransactionId) {
        updateData.sourceTransactionId = new mongoose.Types.ObjectId(sourceTransactionId);
      }
    }

    // 處理精確資金來源使用追蹤更新
    if (req.body.fundingSourceUsages !== undefined) {
      if (Array.isArray(req.body.fundingSourceUsages)) {
        updateData.fundingSourceUsages = req.body.fundingSourceUsages.map((usage: any) => ({
          sourceTransactionId: new mongoose.Types.ObjectId(usage.sourceTransactionId),
          usedAmount: parseFloat(usage.usedAmount) || 0,
          description: usage.description || ''
        }));
      } else {
        updateData.fundingSourceUsages = [];
      }
    } else if (linkedTransactionIds !== undefined && linkedTransactionIds.length > 0) {
      // 重新計算按比例分配
      const currentTotalAmount = updateData.totalAmount || transactionGroup.totalAmount || 0;
      const fundingSourceUsages = await calculateProportionalFundingUsage(linkedTransactionIds, currentTotalAmount, userId);
      updateData.fundingSourceUsages = fundingSourceUsages;
    }

    // 如果有分錄更新，重新建立內嵌分錄
    if (entries && Array.isArray(entries) && entries.length > 0) {
      const hasValidEntries = validateEntriesIntegrity(entries);
      const totalDebit = entries.reduce((sum: number, entry: any) => sum + (entry.debitAmount || 0), 0);
      const totalCredit = entries.reduce((sum: number, entry: any) => sum + (entry.creditAmount || 0), 0);
      const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

      if (hasValidEntries && isBalanced && entries.length >= 2) {
        const embeddedEntries = buildEmbeddedEntries(entries, description, transactionGroup.organizationId?.toString());
        updateData.entries = embeddedEntries;
        updateData.totalAmount = totalDebit;
      }
    }

    const updatedTransactionGroup = await TransactionGroupWithEntries.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('linkedTransactionIds', 'groupNumber description transactionDate totalAmount fundingType status createdAt updatedAt');

    //console.log('✅ 交易群組更新成功:', updatedTransactionGroup?._id);

    // 重新格式化資金來源資訊
    let responseData: any = updatedTransactionGroup?.toObject();
    
    if (responseData && responseData.linkedTransactionIds && responseData.linkedTransactionIds.length > 0) {
      responseData.fundingSourcesInfo = await Promise.all(
        responseData.linkedTransactionIds.map((linkedTx: any) =>
          formatFundingSourceInfo(linkedTx, userId)
        )
      );
      
      //console.log('🎯 更新後最終資金來源資訊:', responseData.fundingSourcesInfo);
    }

    sendSuccessResponse(res, responseData || updatedTransactionGroup, '交易群組更新成功');

  } catch (error) {
    handleRouteError(error, res, '更新交易群組');
  }
});

// 確認交易
router.post('/:id/confirm', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = validateUserAuth(req, res);
    if (!userId) return;

    const { id } = req.params;
    //console.log('🔍 POST /transaction-groups-with-entries/:id/confirm - 確認交易:', { id, userId });

    // 查詢並驗證交易群組
    const transactionGroup = await findAndValidateTransactionGroup(id, userId, res);
    if (!transactionGroup) return;

    // 驗證交易確認條件
    if (!validateTransactionForConfirmation(transactionGroup, res)) return;

    // 直接使用內嵌分錄進行借貸平衡驗證
    const balanceValidation = DoubleEntryValidator.validateDebitCreditBalance(transactionGroup.entries);
    if (!balanceValidation.isBalanced) {
      sendErrorResponse(res, 400, balanceValidation.message);
      return;
    }

    // 確認交易
    const confirmedTransactionGroup = await TransactionGroupWithEntries.findByIdAndUpdate(
      id,
      { status: 'confirmed' },
      { new: true, runValidators: true }
    );

    //console.log('✅ 交易確認成功:', confirmedTransactionGroup?._id);
    sendSuccessResponse(res, confirmedTransactionGroup, '交易確認成功');

  } catch (error) {
    handleRouteError(error, res, '確認交易');
  }
});

// 解鎖交易（將已確認的交易回到草稿狀態）
router.post('/:id/unlock', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = validateUserAuth(req, res);
    if (!userId) return;

    const { id } = req.params;
    //console.log('🔍 POST /transaction-groups-with-entries/:id/unlock - 解鎖交易:', { id, userId });

    // 查詢並驗證交易群組
    const transactionGroup = await findAndValidateTransactionGroup(id, userId, res);
    if (!transactionGroup) return;

    // 驗證解鎖條件
    if (!await validateTransactionForUnlock(transactionGroup, userId, res)) return;

    // 解鎖交易（改回草稿狀態）
    const unlockedTransactionGroup = await TransactionGroupWithEntries.findByIdAndUpdate(
      id,
      { status: 'draft' },
      { new: true, runValidators: true }
    );

    //console.log('🔓 交易解鎖成功:', unlockedTransactionGroup?._id);
    sendSuccessResponse(res, unlockedTransactionGroup, '交易解鎖成功，已回到草稿狀態');

  } catch (error) {
    handleRouteError(error, res, '解鎖交易');
  }
});

// 刪除交易群組
router.delete('/:id', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = validateUserAuth(req, res);
    if (!userId) return;

    const { id } = req.params;
    //console.log('🔍 DELETE /transaction-groups-with-entries/:id - 刪除交易群組:', { id, userId });

    // 查詢並驗證交易群組
    const transactionGroup = await findAndValidateTransactionGroup(id, userId, res);
    if (!transactionGroup) return;

    // 驗證交易狀態（已確認的交易不能刪除）
    if (!validateTransactionStatus(transactionGroup, res, ['draft', 'cancelled'])) return;

    // 刪除交易群組（內嵌分錄會自動一起刪除）
    await TransactionGroupWithEntries.findByIdAndDelete(id);

    //console.log('🗑️ 交易群組已刪除（包含內嵌分錄）');
    sendSuccessResponse(res, null, '交易群組刪除成功');

  } catch (error) {
    handleRouteError(error, res, '刪除交易群組');
  }
});

// 獲取可用的資金來源
router.get('/funding/available-sources', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    const { organizationId, minAmount = 0 } = req.query;

    //console.log('🔍 GET /transaction-groups-with-entries/funding-sources/available - 查詢可用資金來源:', {
      //organizationId,
      //minAmount,
      //userId
    //});

    // 建立查詢條件
    const filter: any = {
      // 移除 createdBy: userId 條件，讓所有人都能共用資料
      status: 'confirmed', // 只有已確認的交易才能作為資金來源
      fundingType: { $in: ['original', 'extended'] }, // 原始資金或延伸使用的資金
      totalAmount: { $gt: parseFloat(minAmount as string) } // 金額大於最小要求
    };

    // 機構過濾
    if (organizationId && organizationId !== 'undefined' && organizationId !== '') {
      filter.organizationId = new mongoose.Types.ObjectId(organizationId as string);
    }

    // 查詢可用的資金來源
    const fundingSources = await TransactionGroupWithEntries.find(filter)
      .sort({ transactionDate: -1, createdAt: -1 })
      .limit(50); // 限制返回數量

    // 計算每個資金來源的已使用金額（按比例分配）
    const sourcesWithUsage = await Promise.all(
      fundingSources.map(async (source) => {
        // 查找所有使用此資金來源的交易
        const linkedTransactions = await TransactionGroupWithEntries.find({
          linkedTransactionIds: source._id,
          status: { $ne: 'cancelled' }
          // 移除 createdBy: userId 條件，讓所有人都能共用資料
        }).populate('linkedTransactionIds', 'totalAmount');

        // 🆕 按比例分配計算已使用金額
        let totalUsedAmount = 0;
        
        for (const tx of linkedTransactions) {
          // 獲取此交易的所有資金來源
          const allSources = tx.linkedTransactionIds as any[];
          if (allSources && allSources.length > 0) {
            // 計算所有資金來源的總金額
            const totalSourceAmount = allSources.reduce((sum, src) => {
              const srcAmount = typeof src === 'object' ? src.totalAmount : 0;
              return sum + (srcAmount || 0);
            }, 0);
            
            // 按比例分配此交易對當前資金來源的使用金額
            if (totalSourceAmount > 0) {
              const sourceRatio = (source.totalAmount || 0) / totalSourceAmount;
              const allocatedAmount = (tx.totalAmount || 0) * sourceRatio;
              totalUsedAmount += allocatedAmount;
              
              //console.log(`💰 資金來源 ${source.groupNumber} 在交易 ${tx.groupNumber} 中的分配:`, {
                //sourceAmount: source.totalAmount,
                //totalSourceAmount,
                //sourceRatio: sourceRatio.toFixed(4),
                //transactionAmount: tx.totalAmount,
                //allocatedAmount: allocatedAmount.toFixed(2)
              //});
            }
          } else {
            // 如果沒有多個資金來源，使用完整金額
            totalUsedAmount += (tx.totalAmount || 0);
          }
        }

        const availableAmount = (source.totalAmount || 0) - totalUsedAmount;

        return {
          _id: source._id,
          groupNumber: source.groupNumber,
          description: source.description,
          transactionDate: source.transactionDate,
          totalAmount: source.totalAmount || 0,
          usedAmount: totalUsedAmount,
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

    if (!id) {
      res.status(400).json({
        success: false,
        message: '缺少交易群組ID參數'
      });
      return;
    }

    //console.log('🔍 GET /transaction-groups-with-entries/:id/funding-flow - 查詢資金流向:', { id, userId });

    // 檢查交易群組是否存在
    const transactionGroup = await TransactionGroupWithEntries.findOne({
      _id: id
      // 移除 createdBy: userId 條件，讓所有人都能共用資料
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
      const sourceTransaction = await TransactionGroupWithEntries.findById(transactionGroup.sourceTransactionId);
      if (sourceTransaction) {
        fundingFlow.originalSource = sourceTransaction;
        
        // 遞歸追蹤完整的資金路徑
        const buildFundingPath = async (txId: mongoose.Types.ObjectId | string, path: any[] = []): Promise<any[]> => {
          const tx = await TransactionGroupWithEntries.findById(txId);
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
    const linkedTransactions = await TransactionGroupWithEntries.find({
      linkedTransactionIds: transactionGroup._id
      // 移除 createdBy: userId 條件，讓所有人都能共用資料
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

    //console.log('🔍 POST /transaction-groups-with-entries/funding-sources/validate - 驗證資金來源:', {
      //sourceTransactionIds,
      //requiredAmount,
      //userId
    //});

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
          const sourceTransaction = await TransactionGroupWithEntries.findOne({
            _id: sourceId,
            // 移除 createdBy: userId 條件，讓所有人都能共用資料
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
          const linkedTransactions = await TransactionGroupWithEntries.find({
            linkedTransactionIds: sourceId,
            status: { $ne: 'cancelled' }
            // 移除 createdBy: userId 條件，讓所有人都能共用資料
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
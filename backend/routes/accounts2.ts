import express, { Router } from 'express';
import mongoose from 'mongoose';
import Account2, { IAccount2 } from '../models/Account2';
import auth from '../middleware/auth';

// 擴展 Request 介面
interface AuthenticatedRequest extends express.Request {
  user?: {
    id: string;
    userId?: string;
  };
}

const router: Router = express.Router();

// ===== 共用工具函數 =====

// 輔助函數：驗證用戶授權
const validateAuth = (req: AuthenticatedRequest): string => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    throw new Error('未授權的請求');
  }
  return userId;
};

// 輔助函數：建立錯誤回應
const createErrorResponse = (message: string, statusCode: number = 500) => ({
  success: false,
  message,
  statusCode
});

// 輔助函數：建立成功回應
const createSuccessResponse = (data: any, message?: string) => ({
  success: true,
  data,
  ...(message && { message })
});

// 輔助函數：驗證 ObjectId 格式
const validateObjectId = (id: string, fieldName: string): mongoose.Types.ObjectId => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`無效的${fieldName}格式: ${id}`);
  }
  return new mongoose.Types.ObjectId(id);
};

// 輔助函數：建立查詢過濾條件
const buildQueryFilter = (userId: string, organizationId?: string): any => {
  const filter: any = {
    // 移除 createdBy 條件，讓所有人都能共用資料
    isActive: true
  };
  
  if (organizationId && organizationId !== 'undefined' && organizationId !== '') {
    filter.organizationId = validateObjectId(organizationId, '機構ID');
  }
  
  return filter;
};

// 輔助函數：建立重複檢查過濾條件
const buildDuplicateFilter = (userId: string, name: string, organizationId?: string, excludeId?: string): any => {
  const filter: any = {
    name,
    // 移除 createdBy 條件，讓所有人都能共用資料
    isActive: true
  };
  
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  
  if (organizationId) {
    filter.organizationId = new mongoose.Types.ObjectId(organizationId);
  } else {
    filter.$or = [
      { organizationId: { $exists: false } },
      { organizationId: null }
    ];
  }
  
  return filter;
};

// 輔助函數：處理錯誤回應
const handleErrorResponse = (res: express.Response, error: any, defaultMessage: string, statusCode: number = 500): void => {
  console.error(`❌ ${defaultMessage}:`, error);
  console.error('❌ 錯誤堆疊:', error instanceof Error ? error.stack : '無堆疊資訊');
  
  if (error.message === '未授權的請求') {
    res.status(401).json(createErrorResponse(error.message));
    return;
  }
  
  // 檢查 MongoDB 錯誤類型
  if (error instanceof Error) {
    if (error.name === 'ValidationError') {
      const validationError = error as any;
      res.status(400).json({
        ...createErrorResponse('資料驗證失敗', 400),
        error: error.message,
        details: validationError.errors
      });
      return;
    }
    
    if (error.name === 'CastError') {
      res.status(400).json(createErrorResponse('ID 格式錯誤', 400));
      return;
    }
    
    if (error.name === 'MongoServerError') {
      const mongoError = error as any;
      if (mongoError.code === 11000) {
        const duplicateField = error.message.match(/dup key: \{ (.+?) :/)?.[1] || 'unknown';
        res.status(400).json(createErrorResponse(
          `${duplicateField === 'code' ? '會計科目代碼' : '資料'}已存在，請重新嘗試`, 400
        ));
        return;
      }
    }
  }
  
  res.status(statusCode).json(createErrorResponse(
    error instanceof Error ? error.message : defaultMessage
  ));
};

// 輔助函數：帳戶類型映射
const ACCOUNT_TYPE_MAPPING = {
  cash: 'asset',
  bank: 'asset',
  investment: 'asset',
  credit: 'liability'
} as const;

const getAccountType = (type: string): string => {
  return ACCOUNT_TYPE_MAPPING[type as keyof typeof ACCOUNT_TYPE_MAPPING] || 'asset';
};

// 輔助函數：正常餘額映射
const NORMAL_BALANCE_MAPPING = {
  asset: 'debit',
  expense: 'debit',
  liability: 'credit',
  equity: 'credit',
  revenue: 'credit'
} as const;

const getNormalBalance = (accountType: string): 'debit' | 'credit' => {
  return NORMAL_BALANCE_MAPPING[accountType as keyof typeof NORMAL_BALANCE_MAPPING] || 'debit';
};

// 輔助函數：會計科目代碼前綴
const ACCOUNT_CODE_PREFIX = {
  asset: '1',
  liability: '2',
  equity: '3',
  revenue: '4',
  expense: '5'
} as const;

// 獲取所有帳戶
router.get('/', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = validateAuth(req);
    const { organizationId } = req.query;
    
    console.log('🔍 GET /accounts2 - 查詢參數:', { organizationId, userId });
    
    // 建立查詢條件
    const filter = buildQueryFilter(userId, organizationId as string);
    console.log('📋 最終查詢條件:', filter);

    const accounts = await Account2.find(filter).sort({ createdAt: -1 });
    console.log('📊 查詢結果數量:', accounts.length);

    res.json(createSuccessResponse(accounts));
  } catch (error) {
    handleErrorResponse(res, error, '獲取帳戶列表失敗');
  }
});

// 獲取單一帳戶
router.get('/:id', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = validateAuth(req);
    const { id } = req.params;

    if (!id) {
      res.status(400).json(createErrorResponse('缺少帳戶ID參數', 400));
      return;
    }

    const account = await Account2.findOne({
      _id: id
      // 移除 createdBy 條件，讓所有人都能共用資料
    });

    if (!account) {
      res.status(404).json(createErrorResponse('找不到指定的帳戶', 404));
      return;
    }

    res.json(createSuccessResponse(account));
  } catch (error) {
    handleErrorResponse(res, error, '獲取帳戶詳情失敗');
  }
});

// 新增帳戶
router.post('/', auth, async (req: AuthenticatedRequest, res: express.Response): Promise<void> => {
  try {
    const userId = validateAuth(req);
    const { name, type, accountType: requestedAccountType, initialBalance, currency, description, organizationId, parentId } = req.body;
    
    // 忽略前端發送的 code，我們會自動生成
    if (req.body.code) {
      console.log('⚠️ 忽略前端發送的 code:', req.body.code, '將自動生成新代碼');
    }

    // 除錯日誌
    console.log('🔍 POST /accounts2 - 接收到的資料:', {
      name, type, initialBalance, currency, description, organizationId,
      organizationIdType: typeof organizationId,
      organizationIdLength: organizationId ? organizationId.length : 'N/A',
      parentId, parentIdType: typeof parentId, body: req.body
    });

    // 驗證 organizationId 格式
    if (organizationId) {
      console.log('🔍 驗證 organizationId 格式:', organizationId);
      try {
        validateObjectId(organizationId, '機構ID');
        console.log('✅ organizationId 格式有效');
      } catch (error) {
        console.error('❌ organizationId 格式無效:', organizationId);
        res.status(400).json(createErrorResponse('機構ID格式無效', 400));
        return;
      }
    }

    // 驗證必填欄位
    if (!name || !type || initialBalance === undefined) {
      res.status(400).json(createErrorResponse('請填寫所有必填欄位', 400));
      return;
    }

    // 檢查重複名稱
    const duplicateFilter = buildDuplicateFilter(userId, name, organizationId);
    const existingAccount = await Account2.findOne(duplicateFilter);

    if (existingAccount) {
      res.status(400).json(createErrorResponse('帳戶名稱已存在', 400));
      return;
    }

    // 自動生成會計科目代碼
    const generateAccountCode = async (accountType: string, organizationId?: string): Promise<string> => {
      const prefix = ACCOUNT_CODE_PREFIX[accountType as keyof typeof ACCOUNT_CODE_PREFIX] || '1';

      console.log('🔍 generateAccountCode 開始 - accountType:', accountType, 'organizationId:', organizationId);

      // 查詢該類型下最大的代碼 - 移除 createdBy 條件，確保機構內代碼唯一性
      const filter: any = {
        accountType,
        code: { $regex: `^${prefix}` }
      };
      
      if (organizationId) {
        console.log('🔍 加入機構篩選條件');
        try {
          const objectId = new mongoose.Types.ObjectId(organizationId);
          console.log('✅ ObjectId 轉換成功:', objectId);
          filter.organizationId = objectId;
        } catch (objectIdError) {
          console.error('❌ ObjectId 轉換失敗:', objectIdError);
          throw new Error(`機構ID轉換失敗: ${objectIdError instanceof Error ? objectIdError.message : '未知錯誤'}`);
        }
      } else {
        console.log('⚠️ 沒有機構ID，查詢個人科目');
        // 查詢個人科目（沒有 organizationId 或為 null）
        filter.$or = [
          { organizationId: { $exists: false } },
          { organizationId: null }
        ];
      }

      console.log('🔍 查詢條件:', JSON.stringify(filter, null, 2));

      const lastAccount = await Account2.findOne(filter)
        .sort({ code: -1 })
        .limit(1);

      console.log('🔍 找到的最後科目:', lastAccount);

      let newCode: string;
      if (lastAccount) {
        const lastCode = parseInt(lastAccount.code);
        newCode = (lastCode + 1).toString().padStart(4, '0');
      } else {
        newCode = `${prefix}001`;
      }

      console.log('🔍 生成的新代碼:', newCode);

      // 檢查新代碼是否已存在（雙重確認）
      const duplicateCheckFilter = buildDuplicateFilter('', '', organizationId);
      duplicateCheckFilter.code = newCode;
      delete duplicateCheckFilter.name;
      delete duplicateCheckFilter.createdBy;

      const existingAccount = await Account2.findOne(duplicateCheckFilter);

      if (existingAccount) {
        console.error('❌ 生成的代碼已存在:', newCode, '現有科目:', existingAccount);
        throw new Error(`會計科目代碼 ${newCode} 已存在於該機構中`);
      }

      return newCode;
    };

    // 使用前端傳來的 accountType，如果沒有則使用自動推斷
    const accountType = requestedAccountType || getAccountType(type);
    
    let code: string;
    try {
      code = await generateAccountCode(accountType, organizationId);
      console.log('✅ 代碼生成成功:', code);
    } catch (codeGenError) {
      console.error('❌ 代碼生成失敗，使用時間戳後備方案:', codeGenError);
      // 使用時間戳作為後備方案
      const timestamp = Date.now().toString().slice(-4);
      const prefix = ACCOUNT_CODE_PREFIX[accountType as keyof typeof ACCOUNT_CODE_PREFIX] || '9';
      code = `${prefix}${timestamp}`;
      console.log('🔄 後備代碼:', code);
    }

    const normalBalance = getNormalBalance(accountType);
    console.log('🔧 自動生成資料:', { accountType, code, normalBalance });

    // 建立帳戶資料，包含會計科目必要欄位
    const accountData: any = {
      name,
      type,
      code,
      accountType,
      normalBalance,
      level: 1, // 預設為第一層，如果有父科目會在 pre-save hook 中自動調整
      balance: initialBalance,
      initialBalance,
      currency: currency || 'TWD',
      description,
      // 保留 createdBy 欄位以記錄創建者，但不用於查詢限制
      createdBy: userId
    };
    
    // 如果有父科目 ID，加入到資料中
    if (parentId && parentId !== null && parentId !== '' && parentId.trim() !== '') {
      console.log('✅ 設定父科目 ID:', parentId);
      
      // 檢查是否為虛擬節點 ID（包含底線的格式）
      if (parentId.includes('_')) {
        console.log('⚠️ 檢測到虛擬節點 ID，忽略 parentId:', parentId);
        // 不設定 parentId，讓它成為根節點
      } else {
        try {
          const parentObjectId = new mongoose.Types.ObjectId(parentId);
          console.log('✅ 父科目 ObjectId 轉換成功:', parentObjectId);
          accountData.parentId = parentObjectId;
        } catch (parentIdError) {
          console.error('❌ 父科目 ObjectId 轉換失敗:', parentIdError);
          res.status(400).json({
            success: false,
            message: '父科目ID格式無效'
          });
          return;
        }
      }
    } else {
      console.log('ℹ️ 無父科目 ID，建立為根節點');
    }
    
    // 只有當 organizationId 有值且不為 null 時才加入
    if (organizationId && organizationId !== null) {
      console.log('✅ 設定 organizationId:', organizationId);
      try {
        const finalObjectId = new mongoose.Types.ObjectId(organizationId);
        console.log('✅ 最終 ObjectId 轉換成功:', finalObjectId);
        accountData.organizationId = finalObjectId;
      } catch (finalObjectIdError) {
        console.error('❌ 最終 ObjectId 轉換失敗:', finalObjectIdError);
        res.status(400).json({
          success: false,
          message: '機構ID最終轉換失敗'
        });
        return;
      }
    } else {
      console.log('❌ organizationId 為空或 null，不設定該欄位');
    }

    console.log('📝 最終的 accountData:', accountData);

    const newAccount = new Account2(accountData);
    const savedAccount = await newAccount.save();
    
    console.log('✅ 會計科目建立成功:', {
      id: savedAccount._id,
      code: savedAccount.code,
      name: savedAccount.name,
      accountType: savedAccount.accountType,
      organizationId: savedAccount.organizationId
    });

    res.status(201).json(createSuccessResponse(savedAccount, '帳戶建立成功'));
  } catch (error) {
    console.error('❌ 請求資料:', req.body);
    handleErrorResponse(res, error, '建立帳戶失敗');
  }
});

// 更新帳戶
router.put('/:id', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = validateAuth(req);
    const { id } = req.params;

    if (!id) {
      res.status(400).json(createErrorResponse('缺少帳戶ID參數', 400));
      return;
    }

    const { name, type, accountType, currency, description, isActive, parentId, code, initialBalance } = req.body;

    console.log('🔍 PUT /accounts2/:id - 接收到的更新資料:', {
      id, name, type, accountType, currency, description, isActive,
      parentId, parentIdType: typeof parentId, code, initialBalance, body: req.body
    });

    // 檢查帳戶是否存在
    const account = await Account2.findOne({
      _id: id
      // 移除 createdBy 條件，讓所有人都能共用資料
    });

    if (!account) {
      res.status(404).json(createErrorResponse('找不到指定的帳戶', 404));
      return;
    }

    // 檢查帳戶名稱是否重複（排除自己）
    if (name && name !== account.name) {
      const organizationId = account.organizationId?.toString();
      const duplicateFilter = buildDuplicateFilter(userId, name, organizationId, id);
      const existingAccount = await Account2.findOne(duplicateFilter);

      if (existingAccount) {
        res.status(400).json(createErrorResponse('帳戶名稱已存在', 400));
        return;
      }
    }

    // 更新帳戶資訊
    const updateData: Partial<IAccount2> = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (accountType !== undefined) updateData.accountType = accountType;
    if (currency !== undefined) updateData.currency = currency;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (code !== undefined) updateData.code = code;
    if (initialBalance !== undefined) updateData.initialBalance = initialBalance;

    // 處理 parentId：過濾掉虛擬節點 ID
    if (parentId !== undefined) {
      if (parentId && parentId !== null && parentId !== '' && parentId.trim() !== '') {
        console.log('✅ 處理父科目 ID:', parentId);
        
        // 檢查是否為虛擬節點 ID（包含底線的格式）
        if (parentId.includes('_')) {
          console.log('⚠️ 檢測到虛擬節點 ID，清除 parentId:', parentId);
          updateData.parentId = null; // 清除父科目關係
        } else {
          try {
            const parentObjectId = new mongoose.Types.ObjectId(parentId);
            console.log('✅ 父科目 ObjectId 轉換成功:', parentObjectId);
            updateData.parentId = parentObjectId;
          } catch (parentIdError) {
            console.error('❌ 父科目 ObjectId 轉換失敗:', parentIdError);
            res.status(400).json(createErrorResponse('父科目ID格式無效', 400));
            return;
          }
        }
      } else {
        console.log('ℹ️ 清除父科目 ID');
        updateData.parentId = null;
      }
    }

    console.log('📝 最終的更新資料:', updateData);

    const updatedAccount = await Account2.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedAccount) {
      res.status(500).json(createErrorResponse('更新帳戶失敗'));
      return;
    }

    console.log('✅ 帳戶更新成功:', {
      id: updatedAccount._id,
      code: updatedAccount.code,
      name: updatedAccount.name,
      accountType: updatedAccount.accountType,
      parentId: updatedAccount.parentId
    });

    res.json(createSuccessResponse(updatedAccount, '帳戶更新成功'));
  } catch (error) {
    console.error('❌ 請求資料:', req.body);
    handleErrorResponse(res, error, '更新帳戶失敗');
  }
});

// 刪除帳戶（軟刪除）
router.delete('/:id', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = validateAuth(req);
    const { id } = req.params;

    if (!id) {
      res.status(400).json(createErrorResponse('缺少帳戶ID參數', 400));
      return;
    }

    console.log('🗑️ 開始刪除科目:', { id, userId });

    const account = await Account2.findOne({
      _id: id
      // 移除 createdBy 條件，讓所有人都能共用資料
    });

    if (!account) {
      console.log('❌ 找不到指定的科目:', id);
      res.status(404).json(createErrorResponse('找不到指定的帳戶', 404));
      return;
    }

    console.log('📋 找到科目:', {
      name: account.name,
      code: account.code,
      balance: account.balance,
      isActive: account.isActive
    });

    // 檢查是否已經被刪除
    if (!account.isActive) {
      console.log('⚠️ 科目已經被刪除');
      res.status(400).json(createErrorResponse('此科目已經被刪除', 400));
      return;
    }

    // 檢查是否有子科目
    const childAccounts = await Account2.find({
      parentId: id,
      // 移除 createdBy 條件，讓所有人都能共用資料
      isActive: true
    });

    if (childAccounts.length > 0) {
      console.log('❌ 科目有子科目，無法刪除:', {
        子科目數量: childAccounts.length,
        子科目名稱: childAccounts.map(child => child.name)
      });
      res.status(400).json({
        ...createErrorResponse(`此科目有 ${childAccounts.length} 個子科目，請先刪除子科目後再刪除此科目`, 400),
        details: {
          childAccounts: childAccounts.map(child => ({
            id: child._id,
            name: child.name,
            code: child.code
          }))
        }
      });
      return;
    }

    // 檢查是否有交易記錄（這裡可以加入檢查交易記錄的邏輯）
    // TODO: 檢查是否有相關的交易記錄

    // 軟刪除：設定為非活躍狀態
    const updatedAccount = await Account2.findByIdAndUpdate(
      id,
      {
        isActive: false,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedAccount) {
      res.status(500).json(createErrorResponse('刪除帳戶失敗'));
      return;
    }

    console.log('✅ 科目刪除成功:', {
      id: updatedAccount._id,
      name: updatedAccount.name,
      isActive: updatedAccount.isActive
    });

    res.json({
      ...createSuccessResponse({
        deletedAccount: {
          id: account._id,
          name: account.name,
          code: account.code,
          balance: account.balance
        }
      }),
      message: `科目「${account.name}」已成功刪除`
    });
  } catch (error) {
    handleErrorResponse(res, error, '刪除帳戶失敗');
  }
});

// 獲取帳戶餘額
router.get('/:id/balance', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = validateAuth(req);
    const { id } = req.params;

    if (!id) {
      res.status(400).json(createErrorResponse('缺少帳戶ID參數', 400));
      return;
    }

    const account = await Account2.findOne({
      _id: id,
      // 移除 createdBy 條件，讓所有人都能共用資料
      isActive: true
    });

    if (!account) {
      res.status(404).json(createErrorResponse('找不到指定的帳戶', 404));
      return;
    }

    res.json(createSuccessResponse({
      accountId: account._id,
      accountName: account.name,
      balance: account.balance,
      currency: account.currency
    }));
  } catch (error) {
    handleErrorResponse(res, error, '獲取帳戶餘額失敗');
  }
});

// 調整帳戶餘額
router.put('/:id/balance', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = validateAuth(req);
    const { id } = req.params;
    const { balance } = req.body;

    if (!id) {
      res.status(400).json(createErrorResponse('缺少帳戶ID參數', 400));
      return;
    }

    if (balance === undefined || typeof balance !== 'number') {
      res.status(400).json(createErrorResponse('請提供有效的餘額數值', 400));
      return;
    }

    const account = await Account2.findOne({
      _id: id,
      // 移除 createdBy 條件，讓所有人都能共用資料
      isActive: true
    });

    if (!account) {
      res.status(404).json(createErrorResponse('找不到指定的帳戶', 404));
      return;
    }

    account.balance = balance;
    await account.save();

    res.json(createSuccessResponse({
      accountId: account._id,
      accountName: account.name,
      balance: account.balance,
      currency: account.currency
    }, '帳戶餘額調整成功'));
  } catch (error) {
    handleErrorResponse(res, error, '調整帳戶餘額失敗');
  }
});

// 獲取會計科目樹狀結構
router.get('/tree/hierarchy', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = validateAuth(req);
    const { organizationId } = req.query;
    
    // 建立查詢條件
    const filter = buildQueryFilter(userId, organizationId as string);
    console.log('🌳 查詢機構樹狀結構:', organizationId);

    // 獲取所有科目並按層級排序
    const accounts = await Account2.find(filter)
      .sort({ level: 1, code: 1 });

    console.log('🌳 找到的科目數量:', accounts.length);
    console.log('🌳 科目層級分布:', accounts.reduce((acc, account) => {
      acc[account.level] = (acc[account.level] || 0) + 1;
      return acc;
    }, {} as Record<number, number>));

    // 建立樹狀結構 - 支援完整多層級並計算統計金額
    const buildTree = (accounts: IAccount2[], parentId: string | null = null): any[] => {
      const children = accounts
        .filter(account => {
          if (parentId === null) {
            return !account.parentId || account.parentId.toString() === '';
          }
          return account.parentId && account.parentId.toString() === parentId;
        })
        .map(account => {
          const accountObj = account.toObject();
          const childNodes = buildTree(accounts, (account._id as any).toString());
          
          // 計算統計金額：自身金額 + 所有子科目金額總和
          const calculateTotalBalance = (node: any, children: any[]): number => {
            const selfBalance = node.balance || 0;
            const childrenBalance = children.reduce((sum, child) => {
              return sum + (child.statistics?.totalBalance || child.balance || 0);
            }, 0);
            return selfBalance + childrenBalance;
          };
          
          const totalBalance = calculateTotalBalance(accountObj, childNodes);
          const childCount = childNodes.length;
          const descendantCount = childNodes.reduce((count, child) => {
            return count + 1 + (child.statistics?.descendantCount || 0);
          }, 0);
          
          //console.log(`🌳 建立樹狀節點 "${account.name}":`, {
            //ID: (account._id as any).toString(),
            //parentId: account.parentId?.toString() || null,
            //子節點數: childNodes.length,
            //子節點名稱: childNodes.map(child => child.name),
            //自身金額: accountObj.balance || 0,
            //子科目總金額: totalBalance - (accountObj.balance || 0),
            //統計總金額: totalBalance
          //});
          
          return {
            ...accountObj,
            children: childNodes,
            hasChildren: childNodes.length > 0,
            // 添加統計資訊
            statistics: {
              balance: accountObj.balance || 0,           // 自身餘額
              totalBalance: totalBalance,                 // 包含子科目的總餘額
              childCount: childCount,                     // 直接子科目數量
              descendantCount: descendantCount,           // 所有後代科目數量
              hasTransactions: false,                     // 是否有交易記錄（待實作）
              lastTransactionDate: null                   // 最後交易日期（待實作）
            }
          };
        });
      
      return children;
    };

    const tree = buildTree(accounts);
    
    //console.log('🌳 最終樹狀結構:', {
      //根節點數: tree.length,
      //根節點詳情: tree.map((node: any) => ({
        //名稱: node.name,
        //hasChildren: node.hasChildren,
        //子節點數: node.children?.length || 0,
        //子節點名稱: node.children?.map((child: any) => child.name) || []
      //}))
    //});

    res.json(createSuccessResponse(tree));
  } catch (error) {
    handleErrorResponse(res, error, '獲取科目樹狀結構失敗');
  }
});

// 依會計科目類型獲取科目
router.get('/by-type/:accountType', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = validateAuth(req);
    const { accountType } = req.params;
    const { organizationId } = req.query;
    
    // 建立查詢條件
    const filter = buildQueryFilter(userId, organizationId as string);
    filter.accountType = accountType;
    
    //console.log('📂 依類型查詢機構帳戶:', { accountType, organizationId });

    const accounts = await Account2.find(filter).sort({ code: 1 });

    res.json(createSuccessResponse(accounts));
  } catch (error) {
    handleErrorResponse(res, error, '依類型獲取科目失敗');
  }
});

// 建立標準會計科目表
router.post('/setup/standard-chart', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = validateAuth(req);
    const { organizationId } = req.body;

    // 標準會計科目表（台灣會計準則）
    const standardAccounts = [
      // 資產類 (1xxx)
      { code: '1101', name: '現金', accountType: 'asset', level: 1 },
      { code: '1102', name: '銀行存款', accountType: 'asset', level: 1 },
      { code: '1103', name: '零用金', accountType: 'asset', level: 1 },
      { code: '1201', name: '應收帳款', accountType: 'asset', level: 1 },
      { code: '1301', name: '存貨', accountType: 'asset', level: 1 },
      { code: '1401', name: '預付費用', accountType: 'asset', level: 1 },
      { code: '1501', name: '固定資產', accountType: 'asset', level: 1 },
      { code: '1502', name: '累計折舊', accountType: 'asset', level: 1 },
      
      // 負債類 (2xxx)
      { code: '2101', name: '應付帳款', accountType: 'liability', level: 1 },
      { code: '2102', name: '應付薪資', accountType: 'liability', level: 1 },
      { code: '2103', name: '應付稅款', accountType: 'liability', level: 1 },
      { code: '2201', name: '短期借款', accountType: 'liability', level: 1 },
      { code: '2301', name: '長期借款', accountType: 'liability', level: 1 },
      
      // 權益類 (3xxx)
      { code: '3101', name: '資本', accountType: 'equity', level: 1 },
      { code: '3201', name: '保留盈餘', accountType: 'equity', level: 1 },
      { code: '3301', name: '本期損益', accountType: 'equity', level: 1 },
      
      // 收入類 (4xxx)
      { code: '4101', name: '銷貨收入', accountType: 'revenue', level: 1 },
      { code: '4201', name: '服務收入', accountType: 'revenue', level: 1 },
      { code: '4301', name: '其他收入', accountType: 'revenue', level: 1 },
      
      // 費用類 (5xxx)
      { code: '5101', name: '銷貨成本', accountType: 'expense', level: 1 },
      { code: '5201', name: '薪資費用', accountType: 'expense', level: 1 },
      { code: '5202', name: '租金費用', accountType: 'expense', level: 1 },
      { code: '5203', name: '水電費', accountType: 'expense', level: 1 },
      { code: '5204', name: '電話費', accountType: 'expense', level: 1 },
      { code: '5205', name: '文具用品', accountType: 'expense', level: 1 },
      { code: '5206', name: '交通費', accountType: 'expense', level: 1 },
      { code: '5207', name: '廣告費', accountType: 'expense', level: 1 },
      { code: '5208', name: '折舊費用', accountType: 'expense', level: 1 },
      { code: '5301', name: '利息費用', accountType: 'expense', level: 1 },
      { code: '5401', name: '雜項費用', accountType: 'expense', level: 1 }
    ];

    const createdAccounts = [];
    
    for (const accountData of standardAccounts) {
      // 檢查科目是否已存在
      const existingAccount = await Account2.findOne({
        code: accountData.code,
        // 移除 createdBy 條件，讓所有人都能共用資料
        ...(organizationId ? { organizationId: new mongoose.Types.ObjectId(organizationId) } : {})
      });

      if (!existingAccount) {
        const newAccountData: any = {
          ...accountData,
          type: 'other', // 預設類型
          initialBalance: 0,
          balance: 0,
          currency: 'TWD',
          createdBy: userId
        };

        if (organizationId) {
          newAccountData.organizationId = new mongoose.Types.ObjectId(organizationId);
        }

        const newAccount = new Account2(newAccountData);
        const savedAccount = await newAccount.save();
        createdAccounts.push(savedAccount);
      }
    }

    res.json(createSuccessResponse(createdAccounts, `成功建立 ${createdAccounts.length} 個標準會計科目`));
  } catch (error) {
    handleErrorResponse(res, error, '建立標準科目表失敗');
  }
});

// 搜尋會計科目
router.get('/search', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = validateAuth(req);
    const { q, organizationId, accountType } = req.query;
    
    if (!q || typeof q !== 'string') {
      res.status(400).json(createErrorResponse('請提供搜尋關鍵字', 400));
      return;
    }

    // 建立查詢條件
    const filter = buildQueryFilter(userId, organizationId as string);
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { code: { $regex: q, $options: 'i' } }
    ];

    if (accountType && accountType !== '') {
      filter.accountType = accountType;
    }

    console.log('🔍 搜尋機構帳戶:', { q, organizationId });

    const accounts = await Account2.find(filter)
      .sort({ code: 1 })
      .limit(50); // 限制搜尋結果數量

    res.json(createSuccessResponse(accounts));
  } catch (error) {
    handleErrorResponse(res, error, '搜尋科目失敗');
  }
});

export default router;
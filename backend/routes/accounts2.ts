import express, { Router } from 'express';
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

// 獲取所有帳戶
router.get('/', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    const { organizationId } = req.query;
    
    // 建立查詢條件
    const filter: any = {
      createdBy: userId,
      isActive: true
    };
    
    // 如果指定機構 ID，則過濾機構帳戶；否則顯示個人帳戶
    if (organizationId) {
      filter.organizationId = organizationId;
    } else {
      filter.organizationId = { $exists: false };
    }

    const accounts = await Account2.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    console.error('獲取帳戶列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取帳戶列表失敗'
    });
  }
});

// 獲取單一帳戶
router.get('/:id', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    const account = await Account2.findOne({ 
      _id: id, 
      createdBy: userId 
    });

    if (!account) {
      res.status(404).json({ 
        success: false, 
        message: '找不到指定的帳戶' 
      });
      return;
    }

    res.json({
      success: true,
      data: account
    });
  } catch (error) {
    console.error('獲取帳戶詳情錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '獲取帳戶詳情失敗' 
    });
  }
});

// 新增帳戶
router.post('/', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    const { name, type, initialBalance, currency, description, organizationId } = req.body;

    // 驗證必填欄位
    if (!name || !type || initialBalance === undefined) {
      res.status(400).json({
        success: false,
        message: '請填寫所有必填欄位'
      });
      return;
    }

    // 建立查詢條件檢查重複名稱
    const duplicateFilter: any = {
      name,
      createdBy: userId,
      isActive: true
    };
    
    // 在相同範圍內檢查重複（個人或機構）
    if (organizationId) {
      duplicateFilter.organizationId = organizationId;
    } else {
      duplicateFilter.organizationId = { $exists: false };
    }

    const existingAccount = await Account2.findOne(duplicateFilter);

    if (existingAccount) {
      res.status(400).json({
        success: false,
        message: '帳戶名稱已存在'
      });
      return;
    }

    const newAccount = new Account2({
      name,
      type,
      balance: initialBalance,
      initialBalance,
      currency: currency || 'TWD',
      description,
      organizationId: organizationId || undefined,
      createdBy: userId
    });

    const savedAccount = await newAccount.save();

    res.status(201).json({
      success: true,
      data: savedAccount,
      message: '帳戶建立成功'
    });
  } catch (error) {
    console.error('建立帳戶錯誤:', error);
    res.status(500).json({
      success: false,
      message: '建立帳戶失敗'
    });
  }
});

// 更新帳戶
router.put('/:id', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    const { name, type, currency, description, isActive } = req.body;

    // 檢查帳戶是否存在
    const account = await Account2.findOne({ 
      _id: id, 
      createdBy: userId 
    });

    if (!account) {
      res.status(404).json({ 
        success: false, 
        message: '找不到指定的帳戶' 
      });
      return;
    }

    // 檢查帳戶名稱是否重複（排除自己）
    if (name && name !== account.name) {
      const existingAccount = await Account2.findOne({ 
        name, 
        createdBy: userId,
        isActive: true,
        _id: { $ne: id }
      });

      if (existingAccount) {
        res.status(400).json({ 
          success: false, 
          message: '帳戶名稱已存在' 
        });
        return;
      }
    }

    // 更新帳戶資訊
    const updateData: Partial<IAccount2> = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (currency !== undefined) updateData.currency = currency;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedAccount = await Account2.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedAccount,
      message: '帳戶更新成功'
    });
  } catch (error) {
    console.error('更新帳戶錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '更新帳戶失敗' 
    });
  }
});

// 刪除帳戶（軟刪除）
router.delete('/:id', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    const account = await Account2.findOne({ 
      _id: id, 
      createdBy: userId 
    });

    if (!account) {
      res.status(404).json({ 
        success: false, 
        message: '找不到指定的帳戶' 
      });
      return;
    }

    // 軟刪除：設定為非活躍狀態
    await Account2.findByIdAndUpdate(id, { isActive: false });

    res.json({
      success: true,
      message: '帳戶刪除成功'
    });
  } catch (error) {
    console.error('刪除帳戶錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '刪除帳戶失敗' 
    });
  }
});

// 獲取帳戶餘額
router.get('/:id/balance', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    const account = await Account2.findOne({ 
      _id: id, 
      createdBy: userId,
      isActive: true 
    });

    if (!account) {
      res.status(404).json({ 
        success: false, 
        message: '找不到指定的帳戶' 
      });
      return;
    }

    res.json({
      success: true,
      data: {
        accountId: account._id,
        accountName: account.name,
        balance: account.balance,
        currency: account.currency
      }
    });
  } catch (error) {
    console.error('獲取帳戶餘額錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '獲取帳戶餘額失敗' 
    });
  }
});

// 調整帳戶餘額
router.put('/:id/balance', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;
    const { balance } = req.body;

    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    if (balance === undefined || typeof balance !== 'number') {
      res.status(400).json({ 
        success: false, 
        message: '請提供有效的餘額數值' 
      });
      return;
    }

    const account = await Account2.findOne({ 
      _id: id, 
      createdBy: userId,
      isActive: true 
    });

    if (!account) {
      res.status(404).json({ 
        success: false, 
        message: '找不到指定的帳戶' 
      });
      return;
    }

    account.balance = balance;
    await account.save();

    res.json({
      success: true,
      data: {
        accountId: account._id,
        accountName: account.name,
        balance: account.balance,
        currency: account.currency
      },
      message: '帳戶餘額調整成功'
    });
  } catch (error) {
    console.error('調整帳戶餘額錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '調整帳戶餘額失敗' 
    });
  }
});

export default router;
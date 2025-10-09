import express, { Router } from 'express';
import Category2, { ICategory2 } from '../../models/Category2';
import auth from '../../middleware/auth';

// 擴展 Request 介面
interface AuthenticatedRequest extends express.Request {
  user?: {
    id: string;
    userId?: string;
  };
}

const router: Router = express.Router();

// 獲取所有類別
router.get('/', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    const { type, organizationId } = req.query;
    console.log('🔍 GET /categories2 - 查詢參數:', { type, organizationId, userId });

    // 建立查詢條件
    const filter: any = {
      createdBy: userId,
      isActive: true
    };

    // 處理機構查詢
    if (organizationId === 'personal') {
      // 查詢個人類別
      filter.organizationId = null;
      console.log('👤 查詢個人類別');
    } else if (organizationId && organizationId !== 'undefined') {
      // 查詢特定機構類別
      filter.organizationId = organizationId;
      console.log('🏢 查詢機構類別:', organizationId);
    } else {
      // 查詢所有類別（個人和機構）
      console.log('📋 查詢所有類別（包含個人和機構）');
    }

    if (type && (type === 'income' || type === 'expense')) {
      filter.type = type;
    }

    console.log('📋 最終查詢條件:', filter);

    const categories = await Category2.find(filter)
      .populate('children')
      .sort({ sortOrder: 1, createdAt: -1 });

    console.log('📊 查詢結果數量:', categories.length);

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('獲取類別列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取類別列表失敗'
    });
  }
});

// 獲取收入類別
router.get('/income', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    const categories = await Category2.find({ 
      createdBy: userId,
      type: 'income',
      isActive: true 
    }).sort({ sortOrder: 1, createdAt: -1 });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('獲取收入類別錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '獲取收入類別失敗' 
    });
  }
});

// 獲取支出類別
router.get('/expense', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    const categories = await Category2.find({ 
      createdBy: userId,
      type: 'expense',
      isActive: true 
    }).sort({ sortOrder: 1, createdAt: -1 });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('獲取支出類別錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '獲取支出類別失敗' 
    });
  }
});

// 獲取單一類別
router.get('/:id', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    const category = await Category2.findOne({ 
      _id: id, 
      createdBy: userId 
    }).populate('children');

    if (!category) {
      res.status(404).json({ 
        success: false, 
        message: '找不到指定的類別' 
      });
      return;
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('獲取類別詳情錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '獲取類別詳情失敗' 
    });
  }
});

// 新增類別
router.post('/', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    const { name, type, parentId, icon, color, description, sortOrder, organizationId } = req.body;
    console.log('🔍 POST /categories2 - 建立類別:', { name, type, organizationId, userId });

    // 驗證必填欄位
    if (!name || !type) {
      res.status(400).json({
        success: false,
        message: '請填寫類別名稱和類型'
      });
      return;
    }

    if (!['income', 'expense'].includes(type)) {
      res.status(400).json({
        success: false,
        message: '類型必須是 income 或 expense'
      });
      return;
    }

    // 處理機構 ID
    let processedOrganizationId = null;
    if (organizationId && organizationId !== 'personal' && organizationId !== 'undefined') {
      processedOrganizationId = organizationId;
      console.log('🏢 建立機構類別:', organizationId);
    } else {
      console.log('👤 建立個人類別');
    }

    // 檢查類別名稱是否重複（同類型、同機構下）
    const duplicateFilter: any = {
      name,
      type,
      createdBy: userId,
      isActive: true,
      organizationId: processedOrganizationId
    };

    const existingCategory = await Category2.findOne(duplicateFilter);

    if (existingCategory) {
      res.status(400).json({
        success: false,
        message: '類別名稱已存在'
      });
      return;
    }

    // 如果有父類別，檢查父類別是否存在且類型相同
    if (parentId) {
      const parentCategory = await Category2.findOne({
        _id: parentId,
        createdBy: userId,
        type: type,
        organizationId: processedOrganizationId,
        isActive: true
      });

      if (!parentCategory) {
        res.status(400).json({
          success: false,
          message: '父類別不存在或類型不匹配'
        });
        return;
      }
    }

    const newCategory = new Category2({
      name,
      type,
      parentId: parentId || null,
      icon,
      color,
      description,
      sortOrder: sortOrder || 0,
      organizationId: processedOrganizationId,
      createdBy: userId
    });

    const savedCategory = await newCategory.save();
    console.log('✅ 類別建立成功:', savedCategory._id);

    res.status(201).json({
      success: true,
      data: savedCategory,
      message: '類別建立成功'
    });
  } catch (error) {
    console.error('建立類別錯誤:', error);
    res.status(500).json({
      success: false,
      message: '建立類別失敗'
    });
  }
});

// 更新類別
router.put('/:id', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    const { name, parentId, icon, color, description, sortOrder, isActive } = req.body;

    // 檢查類別是否存在
    const category = await Category2.findOne({ 
      _id: id, 
      createdBy: userId 
    });

    if (!category) {
      res.status(404).json({ 
        success: false, 
        message: '找不到指定的類別' 
      });
      return;
    }

    // 檢查類別名稱是否重複（排除自己）
    if (name && name !== category.name) {
      const existingCategory = await Category2.findOne({ 
        name, 
        type: category.type,
        createdBy: userId,
        isActive: true,
        _id: { $ne: id }
      });

      if (existingCategory) {
        res.status(400).json({ 
          success: false, 
          message: '類別名稱已存在' 
        });
        return;
      }
    }

    // 如果有父類別，檢查父類別是否存在且類型相同
    if (parentId && parentId !== category.parentId?.toString()) {
      const parentCategory = await Category2.findOne({
        _id: parentId,
        createdBy: userId,
        type: category.type,
        isActive: true
      });

      if (!parentCategory) {
        res.status(400).json({ 
          success: false, 
          message: '父類別不存在或類型不匹配' 
        });
        return;
      }

      // 防止循環引用
      if (parentId === id) {
        res.status(400).json({ 
          success: false, 
          message: '不能將自己設為父類別' 
        });
        return;
      }
    }

    // 更新類別資訊
    const updateData: Partial<ICategory2> = {};
    if (name !== undefined) updateData.name = name;
    if (parentId !== undefined) updateData.parentId = parentId || null;
    if (icon !== undefined) updateData.icon = icon;
    if (color !== undefined) updateData.color = color;
    if (description !== undefined) updateData.description = description;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedCategory = await Category2.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('children');

    res.json({
      success: true,
      data: updatedCategory,
      message: '類別更新成功'
    });
  } catch (error) {
    console.error('更新類別錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '更新類別失敗' 
    });
  }
});

// 刪除類別（軟刪除）
router.delete('/:id', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    const category = await Category2.findOne({ 
      _id: id, 
      createdBy: userId 
    });

    if (!category) {
      res.status(404).json({ 
        success: false, 
        message: '找不到指定的類別' 
      });
      return;
    }

    // 檢查是否有子類別
    const childCategories = await Category2.find({
      parentId: id,
      createdBy: userId,
      isActive: true
    });

    if (childCategories.length > 0) {
      res.status(400).json({ 
        success: false, 
        message: '此類別下還有子類別，請先刪除子類別' 
      });
      return;
    }

    // 軟刪除：設定為非活躍狀態
    await Category2.findByIdAndUpdate(id, { isActive: false });

    res.json({
      success: true,
      message: '類別刪除成功'
    });
  } catch (error) {
    console.error('刪除類別錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '刪除類別失敗' 
    });
  }
});

// 重新排序類別
router.put('/reorder', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    const { categories } = req.body;

    if (!Array.isArray(categories)) {
      res.status(400).json({ 
        success: false, 
        message: '請提供有效的類別排序陣列' 
      });
      return;
    }

    // 批量更新排序
    const updatePromises = categories.map((item: any, index: number) => {
      return Category2.findOneAndUpdate(
        { _id: item.id, createdBy: userId },
        { sortOrder: index },
        { new: true }
      );
    });

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: '類別排序更新成功'
    });
  } catch (error) {
    console.error('重新排序類別錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '重新排序類別失敗' 
    });
  }
});

export default router;
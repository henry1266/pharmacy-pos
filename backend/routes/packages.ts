import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Package } from '../models/Package';
import { Product, Medicine } from '../models/BaseProduct';
import {
  // Package as IPackage,
  PackageFilters,
  PackageCreateRequest,
  PackageUpdateRequest,
  PackageStats
} from '@pharmacy-pos/shared/types/package';

const router: express.Router = express.Router();

// 獲取所有套餐（支援篩選）
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const filters: PackageFilters = req.query;
    const query: any = {};

    // 搜尋關鍵字篩選
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { code: { $regex: filters.search, $options: 'i' } },
        { shortCode: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } }
      ];
    }

    // 分類篩選
    if (filters.category) {
      query.category = filters.category;
    }

    // 啟用狀態篩選
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    // 價格範圍篩選
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.totalPrice = {};
      if (filters.minPrice !== undefined) {
        query.totalPrice.$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        query.totalPrice.$lte = filters.maxPrice;
      }
    }

    // 標籤篩選
    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    const packages = await Package.find(query).sort({ createdAt: -1 });
    res.json(packages);
  } catch (error) {
    console.error('獲取套餐列表錯誤:', error);
    res.status(500).json({
      message: '獲取套餐列表失敗',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
});

// 根據 ID 獲取單一套餐
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // 驗證 ID 格式
    if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: '無效的套餐 ID' });
      return;
    }

    const packageDoc = await Package.findById(id);
    if (!packageDoc) {
      res.status(404).json({ message: '找不到指定的套餐' });
      return;
    }
    res.json(packageDoc);
  } catch (error) {
    console.error('獲取套餐詳情錯誤:', error);
    res.status(500).json({
      message: '獲取套餐詳情失敗',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
});

// 建立新套餐
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const packageData: PackageCreateRequest = req.body;

    // 驗證必要欄位
    if (!packageData.name || !packageData.items || packageData.items.length === 0) {
      res.status(400).json({ 
        message: '套餐名稱和產品項目為必填欄位，且至少需要一個產品項目' 
      });
      return;
    }


    // 生成套餐代碼
    const code = await (Package as any).generateNextCode();

    // 驗證並補充產品資訊
    const enrichedItems = [];
    for (const item of packageData.items) {
      // 先從 Product 集合查找
      let product = await Product.findById(item.productId);
      
      // 如果在 Product 中找不到，再從 Medicine 集合查找
      if (!product) {
        product = await Medicine.findById(item.productId);
      }

      if (!product) {
        res.status(400).json({ 
          message: `找不到產品 ID: ${item.productId}` 
        });
        return;
      }

      enrichedItems.push({
        productId: item.productId,
        productCode: product.code,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.sellingPrice || 0,
        unit: product.unit || '個',
        subtotal: item.subtotal || (item.quantity * (product.sellingPrice || 0)),
        priceMode: item.priceMode || 'unit'
      });
    }

    // 建立套餐
    const newPackage = new Package({
      code,
      shortCode: packageData.shortCode,
      name: packageData.name,
      description: packageData.description,
      items: enrichedItems,
      tags: packageData.tags || [],
      isActive: packageData.isActive !== undefined ? packageData.isActive : true,
      createdBy: req.body.createdBy || 'system'
    });

    const savedPackage = await newPackage.save();
    res.status(201).json(savedPackage);
  } catch (error) {
    console.error('建立套餐錯誤:', error);
    const mongoError = error as any;
    if (mongoError.code === 11000) {
      res.status(400).json({ message: '套餐代碼已存在' });
    } else {
      res.status(500).json({
        message: '建立套餐失敗',
        error: error instanceof Error ? error.message : '未知錯誤'
      });
    }
  }
});

// 更新套餐
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const packageData: PackageUpdateRequest = req.body;

    // 驗證 ID 格式
    if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: '無效的套餐 ID' });
      return;
    }

    // 驗證必要欄位
    if (!packageData.name || !packageData.items || packageData.items.length === 0) {
      res.status(400).json({
        message: '套餐名稱和產品項目為必填欄位，且至少需要一個產品項目'
      });
      return;
    }


    // 驗證並補充產品資訊
    const enrichedItems = [];
    for (const item of packageData.items) {
      // 先從 Product 集合查找
      let product = await Product.findById(item.productId);
      
      // 如果在 Product 中找不到，再從 Medicine 集合查找
      if (!product) {
        product = await Medicine.findById(item.productId);
      }

      if (!product) {
        res.status(400).json({ 
          message: `找不到產品 ID: ${item.productId}` 
        });
        return;
      }

      enrichedItems.push({
        productId: item.productId,
        productCode: product.code,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.sellingPrice || 0,
        unit: product.unit || '個',
        subtotal: item.subtotal || (item.quantity * (product.sellingPrice || 0)),
        priceMode: item.priceMode || 'unit'
      });
    }

    const updatedPackage = await Package.findByIdAndUpdate(
      id,
      {
        shortCode: packageData.shortCode,
        name: packageData.name,
        description: packageData.description,
        items: enrichedItems,
        tags: packageData.tags || [],
        isActive: packageData.isActive !== undefined ? packageData.isActive : true,
        updatedBy: req.body.updatedBy || 'system'
      },
      { new: true, runValidators: true }
    );

    if (!updatedPackage) {
      res.status(404).json({ message: '找不到指定的套餐' });
      return;
    }

    res.json(updatedPackage);
  } catch (error) {
    console.error('更新套餐錯誤:', error);
    res.status(500).json({
      message: '更新套餐失敗',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
});

// 刪除套餐
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // 驗證 ID 格式
    if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: '無效的套餐 ID' });
      return;
    }

    const deletedPackage = await Package.findByIdAndDelete(id);
    if (!deletedPackage) {
      res.status(404).json({ message: '找不到指定的套餐' });
      return;
    }
    res.json({ message: '套餐已成功刪除', package: deletedPackage });
  } catch (error) {
    console.error('刪除套餐錯誤:', error);
    res.status(500).json({
      message: '刪除套餐失敗',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
});

// 切換套餐啟用狀態
router.patch('/:id/toggle-active', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // 驗證 ID 格式
    if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: '無效的套餐 ID' });
      return;
    }

    const packageDoc = await Package.findById(id);
    if (!packageDoc) {
      res.status(404).json({ message: '找不到指定的套餐' });
      return;
    }

    packageDoc.isActive = !packageDoc.isActive;
    packageDoc.updatedBy = req.body.updatedBy || 'system';
    
    const updatedPackage = await packageDoc.save();
    res.json(updatedPackage);
  } catch (error) {
    console.error('切換套餐狀態錯誤:', error);
    res.status(500).json({
      message: '切換套餐狀態失敗',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
});

// 獲取套餐統計資訊
router.get('/stats/summary', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [totalPackages, activePackages, inactivePackages] = await Promise.all([
      Package.countDocuments(),
      Package.countDocuments({ isActive: true }),
      Package.countDocuments({ isActive: false })
    ]);

    const packages = await Package.find();
    const totalValue = packages.reduce((sum, pkg) => sum + pkg.totalPrice, 0);

    const stats: PackageStats = {
      totalPackages,
      activePackages,
      inactivePackages,
      totalValue,
      averageDiscount: 0 // 移除折扣功能，固定為 0
    };

    res.json(stats);
  } catch (error) {
    console.error('獲取套餐統計錯誤:', error);
    res.status(500).json({
      message: '獲取套餐統計失敗',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
});

// 獲取所有套餐分類
router.get('/categories/list', async (_req: Request, res: Response): Promise<void> => {
  try {
    const packages = await Package.find({
      category: { $exists: true, $ne: null },
      $and: [{ category: { $ne: '' } }]
    }, { category: 1 });
    
    const categories = [...new Set(packages.map(pkg => pkg.category).filter(Boolean))];
    res.json(categories.sort());
  } catch (error) {
    console.error('獲取套餐分類錯誤:', error);
    res.status(500).json({
      message: '獲取套餐分類失敗',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
});

// 獲取所有套餐標籤
router.get('/tags/list', async (_req: Request, res: Response): Promise<void> => {
  try {
    const packages = await Package.find({
      tags: { $exists: true, $ne: [] }
    }, { tags: 1 });
    
    const allTags = packages.flatMap(pkg => pkg.tags || []);
    const uniqueTags = [...new Set(allTags)];
    res.json(uniqueTags.sort());
  } catch (error) {
    console.error('獲取套餐標籤錯誤:', error);
    res.status(500).json({
      message: '獲取套餐標籤失敗',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
});

export default router;
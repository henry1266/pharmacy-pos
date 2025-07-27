import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import Inventory from '../models/Inventory';
import BaseProduct from '../models/BaseProduct';
import { Inventory as SharedInventory } from '@pharmacy-pos/shared/types/entities';
import {
  sendSuccessResponse,
  sendValidationErrorResponse,
  sendInvalidRequestResponse,
  sendNotFoundResponse,
  sendServerErrorResponse,
  handleObjectIdError,
  validateRequestId
} from '../utils/responseHelpers';

const router: express.Router = express.Router();

// 型別定義
interface InventoryCreationRequest {
  product: string;
  quantity: number;
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  type?: 'purchase' | 'sale' | 'return' | 'adjustment' | 'ship';
  saleId?: string;
  saleNumber?: string;
  shippingOrderId?: string;
  shippingOrderNumber?: string;
  accountingId?: string;
  totalAmount?: number;
  notes?: string;
}

interface InventoryUpdateRequest extends Partial<InventoryCreationRequest> {}

// 輔助函數：轉換 Mongoose Document 到 SharedInventory
function convertToSharedInventory(inv: any): SharedInventory {
  const invObj = inv.toObject ? inv.toObject() : inv;
  
  return {
    _id: inv._id.toString(),
    product: typeof invObj.product === 'object' && invObj.product !== null
      ? invObj.product
      : invObj.product?.toString() ?? '',
    quantity: inv.quantity ?? 0,
    totalAmount: invObj.totalAmount ?? 0,
    type: (invObj.type as SharedInventory['type']) ?? 'purchase',
    referenceId: invObj.referenceId?.toString(),
    // 保持 MongoDB ObjectId 格式，讓前端處理
    purchaseOrderId: invObj.purchaseOrderId ? invObj.purchaseOrderId : undefined,
    purchaseOrderNumber: invObj.purchaseOrderNumber ?? '',
    saleId: invObj.saleId ? invObj.saleId : undefined,
    saleNumber: invObj.saleNumber ?? '',
    shippingOrderId: invObj.shippingOrderId ? invObj.shippingOrderId : undefined,
    shippingOrderNumber: invObj.shippingOrderNumber ?? '',
    accountingId: invObj.accountingId?.toString(),
    date: invObj.date ?? inv.lastUpdated ?? new Date(),
    lastUpdated: invObj.lastUpdated ?? new Date(),
    notes: invObj.notes ?? '',
    batchNumber: invObj.batchNumber ?? '', // 加入批號欄位
    createdBy: invObj.createdBy?.toString(),
    createdAt: invObj.createdAt ?? inv.createdAt ?? new Date(),
    updatedAt: invObj.updatedAt ?? inv.updatedAt ?? new Date()
  };
}

// @route   GET api/inventory
// @desc    Get all inventory items
// @access  Public
router.get('/', async (_req: Request, res: Response) => {
  try {
    const inventory = await Inventory.find()
      .populate('product')
      .populate('purchaseOrderId', 'poid orderNumber pobill');
    
    // 轉換 Mongoose Document 到 shared 類型
    const inventoryList: SharedInventory[] = inventory.map(inv => convertToSharedInventory(inv));

    sendSuccessResponse(res, '庫存項目獲取成功', inventoryList);
  } catch (err: any) {
    sendServerErrorResponse(res, err);
  }
});

// @route   GET api/inventory/:id
// @desc    Get inventory item by ID
// @access  Public
router.get('/:id', async (req: Request, res: Response) => {
  try {
    // 驗證 ID 參數
    if (!validateRequestId(res, req.params.id, '無效的庫存記錄ID')) {
      return;
    }
    
    // 修正：使用 findOne 替代 findById，並將 id 轉換為字串
    const inventory = await Inventory.findOne({ _id: req.params.id.toString() })
      .populate('product')
      .populate('purchaseOrderId', 'poid orderNumber pobill');
    
    if (!inventory) {
      sendNotFoundResponse(res, '庫存記錄不存在');
      return;
    }
    
    // 轉換 Mongoose Document 到 shared 類型
    const inventoryData: SharedInventory = convertToSharedInventory(inventory);

    sendSuccessResponse(res, '庫存項目獲取成功', inventoryData);
  } catch (err: any) {
    handleObjectIdError(res, err, '庫存記錄不存在');
  }
});

// @route   POST api/inventory
// @desc    Create an inventory item
// @access  Public
router.post(
  '/',
  [
    check('product', '藥品ID為必填項').not().isEmpty(),
    check('quantity', '數量為必填項').isNumeric()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendValidationErrorResponse(res, errors.array());
      return;
    }
    
    try {
      const requestBody = req.body as InventoryCreationRequest;
      const {
        product,
        quantity,
        purchaseOrderId,
        purchaseOrderNumber,
        type = 'purchase',
        totalAmount = 0
      } = requestBody;
      
      // 檢查藥品是否存在
      const productExists = await BaseProduct.findOne({ _id: product.toString() });
      if (!productExists) {
        sendNotFoundResponse(res, '藥品不存在');
        return;
      }
      
      // 檢查是否已有該藥品的庫存記錄
      let existingInventory: any = null;
      if (purchaseOrderId) {
        existingInventory = await Inventory.findOne({
          product: product.toString(),
          purchaseOrderId: purchaseOrderId.toString()
        });
      } else {
        existingInventory = await Inventory.findOne({ product: product.toString() });
      }
      
      if (existingInventory) {
        // 更新現有庫存
        existingInventory.quantity += parseInt(quantity.toString());
        existingInventory.lastUpdated = new Date();
        
        await existingInventory.save();
        
        const inventoryData: SharedInventory = convertToSharedInventory(existingInventory);
        sendSuccessResponse(res, '庫存項目更新成功', inventoryData);
        return;
      }
      
      // 建立新庫存記錄
      const inventoryFields: any = {
        product: new Types.ObjectId(product),
        quantity,
        type,
        totalAmount,
        date: new Date(),
        lastUpdated: new Date()
      };
      
      if (purchaseOrderId) {
        inventoryFields.purchaseOrderId = new Types.ObjectId(purchaseOrderId);
      }
      
      if (purchaseOrderNumber) {
        inventoryFields.purchaseOrderNumber = purchaseOrderNumber;
      }

      const inventory = new Inventory(inventoryFields);
      await inventory.save();
      
      const inventoryData: SharedInventory = convertToSharedInventory(inventory);
      sendSuccessResponse(res, '庫存項目創建成功', inventoryData);
    } catch (err: any) {
      sendServerErrorResponse(res, err);
    }
  }
);

// @route   PUT api/inventory/:id
// @desc    Update an inventory item
// @access  Public
router.put('/:id', async (req: Request, res: Response) => {
  try {
    // 驗證 ID 參數
    if (!validateRequestId(res, req.params.id, '無效的庫存記錄ID')) {
      return;
    }
    
    const requestBody = req.body as InventoryUpdateRequest;
    const {
      product,
      quantity,
      purchaseOrderId,
      purchaseOrderNumber
    } = requestBody;
    
    // 建立更新欄位物件
    const inventoryFields: any = {
      lastUpdated: new Date()
    };
    
    if (product) {
      inventoryFields.product = new Types.ObjectId(product);
    }
    
    if (quantity !== undefined) {
      inventoryFields.quantity = quantity;
    }
    
    if (purchaseOrderId) {
      inventoryFields.purchaseOrderId = new Types.ObjectId(purchaseOrderId);
    }
    
    if (purchaseOrderNumber) {
      inventoryFields.purchaseOrderNumber = purchaseOrderNumber;
    }
    
    // 查找庫存記錄
    let inventory = await Inventory.findOne({ _id: req.params.id.toString() });
    if (!inventory) {
      sendNotFoundResponse(res, '庫存記錄不存在');
      return;
    }
    
    // 如果更改了藥品，檢查新藥品是否存在
    if (product && product !== inventory.product.toString()) {
      const productExists = await BaseProduct.findOne({ _id: product.toString() });
      if (!productExists) {
        sendNotFoundResponse(res, '藥品不存在');
        return;
      }
    }
    
    // 更新庫存記錄
    inventory = await Inventory.findOneAndUpdate(
      { _id: req.params.id.toString() },
      { $set: inventoryFields },
      { new: true }
    );
    
    const inventoryData: SharedInventory = convertToSharedInventory(inventory);
    sendSuccessResponse(res, '庫存項目更新成功', inventoryData);
  } catch (err: any) {
    handleObjectIdError(res, err, '庫存記錄不存在');
  }
});

// @route   DELETE api/inventory/:id
// @desc    Delete an inventory item
// @access  Public
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    // 驗證 ID 參數
    if (!validateRequestId(res, req.params.id, '無效的庫存記錄ID')) {
      return;
    }
    
    // 查找庫存記錄
    const inventory = await Inventory.findOne({ _id: req.params.id.toString() });
    if (!inventory) {
      sendNotFoundResponse(res, '庫存記錄不存在');
      return;
    }
    
    await inventory.deleteOne();
    
    sendSuccessResponse(res, '庫存記錄已刪除', null);
  } catch (err: any) {
    handleObjectIdError(res, err, '庫存記錄不存在');
  }
});

// @route   GET api/inventory/product/:productId
// @desc    Get inventory by product ID
// @access  Public
router.get('/product/:productId', async (req: Request, res: Response) => {
  try {
    if (!req.params.productId) {
      sendInvalidRequestResponse(res, '缺少產品ID參數');
      return;
    }

    // 驗證產品 ID 參數
    if (!validateRequestId(res, req.params.productId, '無效的產品ID')) {
      return;
    }
    
    const inventory = await Inventory.find({ product: req.params.productId.toString() })
      .populate('product') // 包含完整產品資訊，包括 excludeFromStock
      .populate('purchaseOrderId', 'poid orderNumber pobill')
      .populate('saleId', 'saleNumber');
    
    // 轉換 Mongoose Document 到 shared 類型
    const inventoryList: SharedInventory[] = inventory.map(inv => convertToSharedInventory(inv));

    sendSuccessResponse(res, '產品庫存項目獲取成功', inventoryList);
  } catch (err: any) {
    sendServerErrorResponse(res, err);
  }
});

// @route   POST api/inventory/batch
// @desc    Create multiple inventory items
// @access  Public
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { items } = req.body as { items: InventoryCreationRequest[] };
    
    if (!Array.isArray(items) || items.length === 0) {
      sendInvalidRequestResponse(res, '批量創建項目不能為空');
      return;
    }
    
    const createdItems: SharedInventory[] = [];
    
    for (const item of items) {
      const {
        product,
        quantity,
        purchaseOrderId,
        purchaseOrderNumber,
        type = 'purchase',
        totalAmount = 0,
        notes
      } = item;
      
      // 檢查藥品是否存在
      const productExists = await BaseProduct.findOne({ _id: product.toString() });
      if (!productExists) {
        sendNotFoundResponse(res, `藥品 ${product} 不存在`);
        return;
      }
      
      // 建立庫存記錄
      const inventoryFields: any = {
        product: new Types.ObjectId(product),
        quantity,
        type,
        totalAmount,
        date: new Date(),
        lastUpdated: new Date(),
        notes
      };
      
      if (purchaseOrderId) {
        inventoryFields.purchaseOrderId = new Types.ObjectId(purchaseOrderId);
      }
      
      if (purchaseOrderNumber) {
        inventoryFields.purchaseOrderNumber = purchaseOrderNumber;
      }
      
      const inventory = new Inventory(inventoryFields);
      await inventory.save();
      
      createdItems.push(convertToSharedInventory(inventory));
    }
    
    sendSuccessResponse(res, `成功創建 ${createdItems.length} 個庫存項目`, createdItems);
  } catch (err: any) {
    sendServerErrorResponse(res, err);
  }
});

// @route   GET api/inventory/stats
// @desc    Get inventory statistics
// @access  Public
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, productId } = req.query;
    
    // 建立查詢條件
    const matchConditions: any = {};
    
    if (startDate || endDate) {
      matchConditions.date = {};
      if (startDate) {
        matchConditions.date.$gte = new Date(startDate as string);
      }
      if (endDate) {
        matchConditions.date.$lte = new Date(endDate as string);
      }
    }
    
    if (productId) {
      matchConditions.product = new Types.ObjectId(productId as string);
    }
    
    // 聚合查詢統計數據
    const stats = await Inventory.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalAmount: { $sum: '$totalAmount' },
          byType: {
            $push: {
              type: '$type',
              quantity: '$quantity',
              amount: '$totalAmount'
            }
          }
        }
      }
    ]);
    
    // 按類型統計
    const typeStats = await Inventory.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          quantity: { $sum: '$quantity' },
          amount: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    const byType: Record<string, { count: number; quantity: number; amount: number }> = {};
    typeStats.forEach(stat => {
      byType[stat._id] = {
        count: stat.count,
        quantity: stat.quantity,
        amount: stat.amount
      };
    });
    
    const result = {
      totalRecords: stats[0]?.totalRecords || 0,
      totalQuantity: stats[0]?.totalQuantity || 0,
      totalAmount: stats[0]?.totalAmount || 0,
      byType
    };
    
    sendSuccessResponse(res, '庫存統計獲取成功', result);
  } catch (err: any) {
    sendServerErrorResponse(res, err);
  }
});

// @route   GET api/inventory/history/:productId
// @desc    Get inventory history for a product
// @access  Public
router.get('/history/:productId', async (req: Request, res: Response) => {
  try {
    if (!req.params.productId) {
      sendInvalidRequestResponse(res, '缺少產品ID參數');
      return;
    }

    // 驗證產品 ID 參數
    if (!validateRequestId(res, req.params.productId, '無效的產品ID')) {
      return;
    }
    
    const { startDate, endDate, limit = 50, offset = 0 } = req.query;
    
    // 建立查詢條件
    const matchConditions: any = {
      product: new Types.ObjectId(req.params.productId)
    };
    
    if (startDate || endDate) {
      matchConditions.date = {};
      if (startDate) {
        matchConditions.date.$gte = new Date(startDate as string);
      }
      if (endDate) {
        matchConditions.date.$lte = new Date(endDate as string);
      }
    }
    
    const inventory = await Inventory.find(matchConditions)
      .populate('product')
      .populate('purchaseOrderId', 'poid orderNumber pobill')
      .populate('saleId', 'saleNumber')
      .sort({ date: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string));
    
    // 轉換 Mongoose Document 到 shared 類型
    const inventoryList: SharedInventory[] = inventory.map(inv => convertToSharedInventory(inv));
    
    sendSuccessResponse(res, '產品庫存歷史獲取成功', inventoryList);
  } catch (err: any) {
    sendServerErrorResponse(res, err);
  }
});

export default router;
import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import { Types } from 'mongoose';

import Inventory from '../models/Inventory';
// 使用 ES6 import 導入
import BaseProduct, { Product } from '../models/BaseProduct';
import { ApiResponse, ErrorResponse } from '@pharmacy-pos/shared/types/api';
import { Inventory as SharedInventory } from '@pharmacy-pos/shared/types/entities';
import { API_CONSTANTS, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';

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
}

interface InventoryUpdateRequest extends Partial<InventoryCreationRequest> {}

// @route   GET api/inventory
// @desc    Get all inventory items
// @access  Public
router.get('/', async (req: Request, res: Response) => {
  try {
    const inventory = await Inventory.find()
      .populate('product')
      .populate('purchaseOrderId', 'poid orderNumber pobill');
    
    // 轉換 Mongoose Document 到 shared 類型
    const inventoryList: SharedInventory[] = inventory.map(inv => {
      const invAny = inv as any;
      return {
        _id: inv._id.toString(),
        product: invAny.product,
        quantity: inv.quantity,
        totalAmount: invAny.totalAmount,
        type: invAny.type || 'purchase',
        referenceId: invAny.referenceId,
        purchaseOrderId: invAny.purchaseOrderId,
        purchaseOrderNumber: invAny.purchaseOrderNumber,
        saleId: invAny.saleId,
        saleNumber: invAny.saleNumber,
        shippingOrderId: invAny.shippingOrderId,
        shippingOrderNumber: invAny.shippingOrderNumber,
        accountingId: invAny.accountingId,
        date: invAny.date || new Date(),
        lastUpdated: invAny.lastUpdated,
        notes: invAny.notes,
        createdBy: invAny.createdBy,
        createdAt: invAny.createdAt,
        updatedAt: invAny.updatedAt
      };
    });

    const response: ApiResponse<SharedInventory[]> = {
      success: true,
      message: '庫存項目獲取成功',
      data: inventoryList,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err: any) {
    console.error(err.message);
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// @route   GET api/inventory/:id
// @desc    Get inventory item by ID
// @access  Public
router.get('/:id', async (req: Request, res: Response) => {
  try {
    // 確保id存在
    if (!req.params.id) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '無效的庫存記錄ID',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
    }
    
    // 修正：使用 findOne 替代 findById，並將 id 轉換為字串
    const inventory = await Inventory.findOne({ _id: req.params.id.toString() })
      .populate('product')
      .populate('purchaseOrderId', 'poid orderNumber pobill');
    
    if (!inventory) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '庫存記錄不存在',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }
    
    // 轉換 Mongoose Document 到 shared 類型
    const invAny = inventory as any;
    const inventoryData: SharedInventory = {
      _id: inventory._id.toString(),
      product: invAny.product,
      quantity: inventory.quantity,
      totalAmount: invAny.totalAmount,
      type: invAny.type || 'purchase',
      referenceId: invAny.referenceId,
      purchaseOrderId: invAny.purchaseOrderId,
      purchaseOrderNumber: invAny.purchaseOrderNumber,
      saleId: invAny.saleId,
      saleNumber: invAny.saleNumber,
      shippingOrderId: invAny.shippingOrderId,
      shippingOrderNumber: invAny.shippingOrderNumber,
      accountingId: invAny.accountingId,
      date: invAny.date || new Date(),
      lastUpdated: invAny.lastUpdated,
      notes: invAny.notes,
      createdBy: invAny.createdBy,
      createdAt: invAny.createdAt,
      updatedAt: invAny.updatedAt
    };

    const response: ApiResponse<SharedInventory> = {
      success: true,
      message: '庫存項目獲取成功',
      data: inventoryData,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err: any) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '庫存記錄不存在',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
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
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
        error: JSON.stringify(errors.array()),
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
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
      // 修正：使用 findOne 替代 findById，並將 product 轉換為字串
      const productExists = await BaseProduct.findOne({ _id: product.toString() });
      if (!productExists) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: '藥品不存在',
          timestamp: new Date()
        };
        res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
      }
      
      // 檢查是否已有該藥品的庫存記錄
      let existingInventory: any = null;
      if (purchaseOrderId) {
        // 修正：將 product 和 purchaseOrderId 參數轉換為字串
        existingInventory = await Inventory.findOne({ 
          product: product.toString(), 
          purchaseOrderId: purchaseOrderId.toString() 
        });
      } else {
        // 修正：將 product 參數轉換為字串
        existingInventory = await Inventory.findOne({ product: product.toString() });
      }
      
      if (existingInventory) {
        // 更新現有庫存
        existingInventory.quantity += parseInt(quantity.toString());
        existingInventory.lastUpdated = new Date();
        
        await existingInventory.save();
        
        // 轉換 Mongoose Document 到 shared 類型
        const existingInvAny = existingInventory as any;
        const inventoryData: SharedInventory = {
          _id: existingInventory._id.toString(),
          product: existingInvAny.product,
          quantity: existingInventory.quantity,
          totalAmount: existingInvAny.totalAmount,
          type: existingInvAny.type || 'purchase',
          referenceId: existingInvAny.referenceId,
          purchaseOrderId: existingInvAny.purchaseOrderId,
          purchaseOrderNumber: existingInvAny.purchaseOrderNumber,
          saleId: existingInvAny.saleId,
          saleNumber: existingInvAny.saleNumber,
          shippingOrderId: existingInvAny.shippingOrderId,
          shippingOrderNumber: existingInvAny.shippingOrderNumber,
          accountingId: existingInvAny.accountingId,
          date: existingInvAny.date || new Date(),
          lastUpdated: existingInvAny.lastUpdated,
          notes: existingInvAny.notes,
          createdBy: existingInvAny.createdBy,
          createdAt: existingInvAny.createdAt,
          updatedAt: existingInvAny.updatedAt
        };

        const response: ApiResponse<SharedInventory> = {
          success: true,
          message: '庫存項目更新成功',
          data: inventoryData,
          timestamp: new Date()
        };
        
        res.json(response);
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
      
      // 轉換 Mongoose Document 到 shared 類型
      const savedInvAny = inventory as any;
      const inventoryData: SharedInventory = {
        _id: inventory._id.toString(),
        product: savedInvAny.product,
        quantity: inventory.quantity,
        totalAmount: savedInvAny.totalAmount,
        type: savedInvAny.type || 'purchase',
        referenceId: savedInvAny.referenceId,
        purchaseOrderId: savedInvAny.purchaseOrderId,
        purchaseOrderNumber: savedInvAny.purchaseOrderNumber,
        saleId: savedInvAny.saleId,
        saleNumber: savedInvAny.saleNumber,
        shippingOrderId: savedInvAny.shippingOrderId,
        shippingOrderNumber: savedInvAny.shippingOrderNumber,
        accountingId: savedInvAny.accountingId,
        date: savedInvAny.date || new Date(),
        lastUpdated: savedInvAny.lastUpdated,
        notes: savedInvAny.notes,
        createdBy: savedInvAny.createdBy,
        createdAt: savedInvAny.createdAt as Date,
        updatedAt: savedInvAny.updatedAt as Date
      };

      const response: ApiResponse<SharedInventory> = {
        success: true,
        message: '庫存項目創建成功',
        data: inventoryData,
        timestamp: new Date()
      };
      
      res.json(response);
    } catch (err: any) {
      console.error(err.message);
      
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
        timestamp: new Date()
      };
      
      res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
    }
  }
);

// @route   PUT api/inventory/:id
// @desc    Update an inventory item
// @access  Public
router.put('/:id', async (req: Request, res: Response) => {
  try {
    // 確保id存在
    if (!req.params.id) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '無效的庫存記錄ID',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
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
    
    // 修正：使用 findOne 替代 findById，並將 id 轉換為字串
    let inventory = await Inventory.findOne({ _id: req.params.id.toString() });
    if (!inventory) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '庫存記錄不存在',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }
    
    // 如果更改了藥品，檢查新藥品是否存在
    if (product && product !== inventory.product.toString()) {
      // 修正：使用 findOne 替代 findById，並將 product 轉換為字串
      const productExists = await BaseProduct.findOne({ _id: product.toString() });
      if (!productExists) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: '藥品不存在',
          timestamp: new Date()
        };
        res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
      }
    }
    
    // 更新
    // 修正：使用 findOneAndUpdate 替代 findByIdAndUpdate，並將 id 轉換為字串
    inventory = await Inventory.findOneAndUpdate(
      { _id: req.params.id.toString() },
      { $set: inventoryFields },
      { new: true }
    );
    
    // 轉換 Mongoose Document 到 shared 類型
    const updatedInvAny = inventory as any;
    const inventoryData: SharedInventory = {
      _id: inventory!._id.toString(),
      product: updatedInvAny.product,
      quantity: inventory!.quantity,
      totalAmount: updatedInvAny.totalAmount,
      type: updatedInvAny.type || 'purchase',
      referenceId: updatedInvAny.referenceId,
      purchaseOrderId: updatedInvAny.purchaseOrderId,
      purchaseOrderNumber: updatedInvAny.purchaseOrderNumber,
      saleId: updatedInvAny.saleId,
      saleNumber: updatedInvAny.saleNumber,
      shippingOrderId: updatedInvAny.shippingOrderId,
      shippingOrderNumber: updatedInvAny.shippingOrderNumber,
      accountingId: updatedInvAny.accountingId,
      date: updatedInvAny.date || new Date(),
      lastUpdated: updatedInvAny.lastUpdated,
      notes: updatedInvAny.notes,
      createdBy: updatedInvAny.createdBy,
      createdAt: updatedInvAny.createdAt,
      updatedAt: updatedInvAny.updatedAt
    };

    const response: ApiResponse<SharedInventory> = {
      success: true,
      message: '庫存項目更新成功',
      data: inventoryData,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err: any) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '庫存記錄不存在',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// @route   DELETE api/inventory/:id
// @desc    Delete an inventory item
// @access  Public
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    // 確保id存在
    if (!req.params.id) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '無效的庫存記錄ID',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
    }
    
    // 修正：使用 findOne 替代 findById，並將 id 轉換為字串
    const inventory = await Inventory.findOne({ _id: req.params.id.toString() });
    if (!inventory) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '庫存記錄不存在',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }
    
    await inventory.deleteOne();
    
    const response: ApiResponse<null> = {
      success: true,
      message: '庫存記錄已刪除',
      data: null,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err: any) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '庫存記錄不存在',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// @route   GET api/inventory/product/:productId
// @desc    Get inventory by product ID
// @access  Public
router.get('/product/:productId', async (req: Request, res: Response) => {
  try {
    // 確保productId存在
    if (!req.params.productId) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '無效的產品ID',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
    }
    
    const inventory = await Inventory.find({ product: req.params.productId.toString() })
      .populate('product')
      .populate('purchaseOrderId', 'poid orderNumber pobill')
      .populate('saleId', 'saleNumber');
    
    // 轉換 Mongoose Document 到 shared 類型
    const inventoryList: SharedInventory[] = inventory.map(inv => {
      const invAny = inv as any;
      return {
        _id: inv._id.toString(),
        product: invAny.product,
        quantity: inv.quantity,
        totalAmount: invAny.totalAmount,
        type: invAny.type || 'purchase',
        referenceId: invAny.referenceId,
        purchaseOrderId: invAny.purchaseOrderId,
        purchaseOrderNumber: invAny.purchaseOrderNumber,
        saleId: invAny.saleId,
        saleNumber: invAny.saleNumber,
        shippingOrderId: invAny.shippingOrderId,
        shippingOrderNumber: invAny.shippingOrderNumber,
        accountingId: invAny.accountingId,
        date: invAny.date || new Date(),
        lastUpdated: invAny.lastUpdated,
        notes: invAny.notes,
        createdBy: invAny.createdBy,
        createdAt: invAny.createdAt,
        updatedAt: invAny.updatedAt
      };
    });

    const response: ApiResponse<SharedInventory[]> = {
      success: true,
      message: '產品庫存項目獲取成功',
      data: inventoryList,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err: any) {
    console.error(err.message);
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

export default router;
import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import { Types } from 'mongoose';

import Inventory from '../models/Inventory';
// 使用require語法導入
const BaseProductModule = require('../models/BaseProduct');
const BaseProduct = BaseProductModule.BaseProduct;
import PurchaseOrder from '../models/PurchaseOrder';
import { ApiResponse, ErrorResponse } from '../src/types/api';
import { IInventory, IInventoryDocument } from '../src/types/models';

const router = express.Router();

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
    
    const response: ApiResponse<IInventoryDocument[]> = {
      success: true,
      message: 'Inventory items retrieved successfully',
      data: inventory,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err: any) {
    console.error(err.message);
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Server Error',
      timestamp: new Date()
    };
    
    res.status(500).json(errorResponse);
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
      return res.status(400).json(errorResponse);
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
      return res.status(404).json(errorResponse);
    }
    
    const response: ApiResponse<IInventoryDocument> = {
      success: true,
      message: 'Inventory item retrieved successfully',
      data: inventory,
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
      return res.status(404).json(errorResponse);
    }
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Server Error',
      timestamp: new Date()
    };
    
    res.status(500).json(errorResponse);
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
        message: 'Validation failed',
        error: JSON.stringify(errors.array()),
        timestamp: new Date()
      };
      return res.status(400).json(errorResponse);
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
        return res.status(404).json(errorResponse);
      }
      
      // 檢查是否已有該藥品的庫存記錄
      let existingInventory: IInventoryDocument | null = null;
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
        
        const response: ApiResponse<IInventoryDocument> = {
          success: true,
          message: 'Inventory item updated successfully',
          data: existingInventory,
          timestamp: new Date()
        };
        
        return res.json(response);
      }
      
      // 建立新庫存記錄
      const inventoryFields: Partial<IInventory> = {
        product: new Types.ObjectId(product),
        quantity,
        type,
        totalAmount,
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
      
      const response: ApiResponse<IInventoryDocument> = {
        success: true,
        message: 'Inventory item created successfully',
        data: inventory,
        timestamp: new Date()
      };
      
      res.json(response);
    } catch (err: any) {
      console.error(err.message);
      
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Server Error',
        timestamp: new Date()
      };
      
      res.status(500).json(errorResponse);
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
      return res.status(400).json(errorResponse);
    }
    
    const requestBody = req.body as InventoryUpdateRequest;
    const {
      product,
      quantity,
      purchaseOrderId,
      purchaseOrderNumber
    } = requestBody;
    
    // 建立更新欄位物件
    const inventoryFields: Partial<IInventory> = {
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
      return res.status(404).json(errorResponse);
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
        return res.status(404).json(errorResponse);
      }
    }
    
    // 更新
    // 修正：使用 findOneAndUpdate 替代 findByIdAndUpdate，並將 id 轉換為字串
    inventory = await Inventory.findOneAndUpdate(
      { _id: req.params.id.toString() },
      { $set: inventoryFields },
      { new: true }
    );
    
    const response: ApiResponse<IInventoryDocument> = {
      success: true,
      message: 'Inventory item updated successfully',
      data: inventory!,
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
      return res.status(404).json(errorResponse);
    }
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Server Error',
      timestamp: new Date()
    };
    
    res.status(500).json(errorResponse);
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
      return res.status(400).json(errorResponse);
    }
    
    // 修正：使用 findOne 替代 findById，並將 id 轉換為字串
    const inventory = await Inventory.findOne({ _id: req.params.id.toString() });
    if (!inventory) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '庫存記錄不存在',
        timestamp: new Date()
      };
      return res.status(404).json(errorResponse);
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
      return res.status(404).json(errorResponse);
    }
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Server Error',
      timestamp: new Date()
    };
    
    res.status(500).json(errorResponse);
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
      return res.status(400).json(errorResponse);
    }
    
    const inventory = await Inventory.find({ product: req.params.productId.toString() })
      .populate('product')
      .populate('purchaseOrderId', 'poid orderNumber pobill')
      .populate('saleId', 'saleNumber');
    
    const response: ApiResponse<IInventoryDocument[]> = {
      success: true,
      message: 'Inventory items retrieved successfully',
      data: inventory,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err: any) {
    console.error(err.message);
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Server Error',
      timestamp: new Date()
    };
    
    res.status(500).json(errorResponse);
  }
});

export default router;
import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
// 使用 ES6 import 導入模型
import Sale from '../models/Sale';
import BaseProduct, { Product, Medicine } from '../models/BaseProduct';
import Inventory from '../models/Inventory';
import Customer from '../models/Customer';
import { AuthenticatedRequest } from '../src/types/express';
import { ApiResponse, ErrorResponse } from '../src/types/api';
import { ISaleDocument, ICustomerDocument, IBaseProductDocument, IInventoryDocument } from '../src/types/models';

// 引入通用訂單單號生成服務
const OrderNumberService = require('../utils/OrderNumberService');

const router = express.Router();

// 型別定義
interface SaleCreationRequest {
  saleNumber?: string;
  customer?: string;
  items: Array<{
    product: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    discount?: number;
  }>;
  totalAmount: number;
  discountAmount?: number;
  finalAmount?: number;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'other';
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  note?: string;
  cashier?: string;
  discount?: number;
}

interface ValidationResult {
  success: boolean;
  statusCode?: number;
  message?: string;
  sale?: ISaleDocument;
}

interface CustomerCheckResult {
  exists: boolean;
  error?: ValidationResult;
}

interface ProductCheckResult {
  exists: boolean;
  product?: IBaseProductDocument;
  error?: ValidationResult;
}

interface InventoryCheckResult {
  success: boolean;
  error?: ValidationResult;
}

// @route   GET api/sales
// @desc    Get all sales
// @access  Public
router.get('/', async (req: Request, res: Response) => {
  try {
    const sales = await Sale.find()
      .populate('customer')
      .populate('items.product')
      .populate('cashier')
      .sort({ saleNumber: -1 });
    
    const response: ApiResponse<ISaleDocument[]> = {
      success: true,
      message: 'Sales retrieved successfully',
      data: sales,
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

// @route   GET api/sales/:id
// @desc    Get sale by ID
// @access  Public
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id })
      .populate('customer')
      .populate({
        path: 'items.product',
        model: 'baseproduct'
      })
      .populate('cashier');
      
    if (!sale) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '銷售記錄不存在',
        timestamp: new Date()
      };
      return res.status(404).json(errorResponse);
    }
    
    const response: ApiResponse<ISaleDocument> = {
      success: true,
      message: 'Sale retrieved successfully',
      data: sale,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err: any) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '銷售記錄不存在',
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

// @route   POST api/sales
// @desc    Create a sale
// @access  Public
router.post(
  '/',
  [
    check('items', '至少需要一個銷售項目').isArray({ min: 1 }),
    check('totalAmount', '總金額為必填項').isNumeric()
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
      // 1. 驗證請求和檢查記錄
      const validationResult = await validateSaleCreationRequest(req.body as SaleCreationRequest);
      if (!validationResult.success) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: validationResult.message || 'Validation failed',
          timestamp: new Date()
        };
        return res.status(validationResult.statusCode || 400).json(errorResponse);
      }
      
      // 2. 創建銷售記錄
      const sale = await createSaleRecord(req.body as SaleCreationRequest);
      
      // 3. 處理庫存變更
      await handleInventoryForNewSale(sale);
      
      // 4. 處理客戶積分
      await updateCustomerPoints(sale);
      
      const response: ApiResponse<ISaleDocument> = {
        success: true,
        message: 'Sale created successfully',
        data: sale,
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

// 檢查客戶是否存在
async function checkCustomerExists(customerId?: string): Promise<CustomerCheckResult> {
  if (!customerId) return { exists: true };
  
  const customerExists = await Customer.findOne({ _id: customerId });
  if (!customerExists) {
    return { 
      exists: false, 
      error: { 
        success: false, 
        statusCode: 404, 
        message: '客戶不存在' 
      }
    };
  }
  
  return { exists: true };
}

// 檢查產品是否存在
async function checkProductExists(productId: string): Promise<ProductCheckResult> {
  const product = await BaseProduct.findOne({ _id: productId });
  if (!product) {
    return { 
      exists: false, 
      error: { 
        success: false, 
        statusCode: 404, 
        message: `產品ID ${productId} 不存在` 
      }
    };
  }
  
  return { exists: true, product };
}

// 檢查產品庫存
async function checkProductInventory(product: IBaseProductDocument, quantity: number): Promise<InventoryCheckResult> {
  try {
    // 獲取所有庫存記錄
    const inventories = await Inventory.find({ product: product._id }).lean();
    console.log(`找到 ${inventories.length} 個庫存記錄`);
    
    // 計算總庫存量
    let totalQuantity = calculateTotalInventory(inventories);
    
    console.log(`產品 ${product.name} 總庫存量: ${totalQuantity}，銷售數量: ${quantity}`);
    
    // 不再檢查庫存是否足夠，允許負庫存
    if (totalQuantity < quantity) {
      console.log(`警告: 產品 ${product.name} 庫存不足，當前總庫存: ${totalQuantity}，需求: ${quantity}，將允許負庫存`);
    }
    
    return { success: true };
  } catch (err: any) {
    console.error(`庫存檢查錯誤:`, err);
    return { 
      success: false, 
      error: { 
        success: false, 
        statusCode: 500, 
        message: `庫存檢查錯誤: ${err.message}` 
      }
    };
  }
}

// 計算總庫存量
function calculateTotalInventory(inventories: any[]): number {
  let totalQuantity = 0;
  for (const inv of inventories) {
    totalQuantity += inv.quantity;
    console.log(`庫存記錄: ${inv._id}, 類型: ${inv.type || 'purchase'}, 數量: ${inv.quantity}`);
  }
  return totalQuantity;
}

// 驗證銷售創建請求
async function validateSaleCreationRequest(requestBody: SaleCreationRequest): Promise<ValidationResult> {
  const { customer, items } = requestBody;
  
  // 檢查客戶是否存在
  const customerCheck = await checkCustomerExists(customer);
  if (!customerCheck.exists) {
    return customerCheck.error!;
  }
  
  // 檢查所有產品是否存在
  for (const item of items) {
    // 檢查產品是否存在
    const productCheck = await checkProductExists(item.product);
    if (!productCheck.exists) {
      return productCheck.error!;
    }
    
    // 記錄當前庫存量，但不限制負庫存
    console.log(`檢查產品ID: ${item.product}, 名稱: ${productCheck.product!.name}`);
    
    // 檢查產品庫存
    const inventoryCheck = await checkProductInventory(productCheck.product!, item.quantity);
    if (!inventoryCheck.success) {
      return inventoryCheck.error!;
    }
  }
  
  return { success: true };
}

// 創建銷售記錄
async function createSaleRecord(requestBody: SaleCreationRequest): Promise<ISaleDocument> {
  // 生成銷貨單號（如果未提供）
  const finalSaleNumber = await generateSaleNumber(requestBody.saleNumber);
  
  // 確保銷貨單號不為空
  if (!finalSaleNumber) {
    console.error('Error: Failed to generate valid sale number');
    throw new Error('無法生成有效的銷貨單號');
  }
  
  // 建立銷售記錄
  const saleData = {
    saleNumber: finalSaleNumber,
    customer: requestBody.customer,
    items: requestBody.items,
    totalAmount: requestBody.totalAmount,
    discount: requestBody.discount,
    paymentMethod: requestBody.paymentMethod,
    paymentStatus: requestBody.paymentStatus,
    note: requestBody.note,
    cashier: requestBody.cashier
  };
  
  const saleFields = buildSaleFields(saleData);

  const sale = new Sale(saleFields);
  await sale.save();
  return sale;
}

// 生成銷貨單號
async function generateSaleNumber(saleNumber?: string): Promise<string> {
  // 如果提供了有效的銷貨單號，直接使用
  if (saleNumber && saleNumber.trim() !== '') return saleNumber;
  
  // 使用通用訂單單號生成服務
  const generatedNumber = await OrderNumberService.generateSaleOrderNumber();
  
  // 確保生成的銷貨單號不為空
  if (!generatedNumber || generatedNumber.trim() === '') {
    console.error('Error: OrderNumberService returned empty sale number');
    throw new Error('系統無法生成銷貨單號，請稍後再試或手動指定銷貨單號');
  }
  
  return generatedNumber;
}

// 建立銷售記錄欄位
function buildSaleFields(saleData: any): any {
  // Ensure saleNumber is never empty to prevent duplicate key errors
  if (!saleData.saleNumber) {
    console.error('Warning: Attempted to create sale with empty saleNumber');
    throw new Error('Sale number cannot be empty');
  }
  
  const saleFields: any = {
    saleNumber: saleData.saleNumber,
    items: saleData.items,
    totalAmount: saleData.totalAmount,
  };
  
  if (saleData.customer) saleFields.customer = saleData.customer;
  if (saleData.discount) saleFields.discountAmount = saleData.discount;
  if (saleData.paymentMethod) saleFields.paymentMethod = saleData.paymentMethod;
  if (saleData.paymentStatus) saleFields.paymentStatus = saleData.paymentStatus;
  if (saleData.note) saleFields.notes = saleData.note;
  if (saleData.cashier) saleFields.cashier = saleData.cashier;
  
  // 計算最終金額
  saleFields.finalAmount = saleFields.totalAmount - (saleFields.discountAmount || 0);
  
  return saleFields;
}

// 處理新銷售的庫存變更
async function handleInventoryForNewSale(sale: ISaleDocument): Promise<void> {
  // 為每個銷售項目創建負數庫存記錄
  for (const item of sale.items) {
    await createInventoryRecord(item, sale);
  }
}

// 創建庫存記錄
async function createInventoryRecord(item: any, sale: ISaleDocument): Promise<void> {
  const inventoryRecord = new Inventory({
    product: item.product,
    quantity: -item.quantity, // 負數表示庫存減少
    totalAmount: Number(item.subtotal), // 添加totalAmount字段
    saleNumber: sale.saleNumber, // 添加銷貨單號
    type: 'sale',
    saleId: sale._id,
    lastUpdated: new Date()
  });
  
  await inventoryRecord.save();
  console.log(`為產品 ${item.product} 創建銷售庫存記錄，數量: -${item.quantity}, 總金額: ${item.subtotal}`);
}

// 更新客戶積分
async function updateCustomerPoints(sale: ISaleDocument): Promise<void> {
  // 如果有客戶，更新客戶積分
  if (!sale.customer) return;
  
  const customerToUpdate = await Customer.findOne({ _id: sale.customer });
  if (!customerToUpdate) return;
  
  // 假設每消費100元獲得1點積分
  const pointsToAdd = Math.floor(sale.totalAmount / 100);
  customerToUpdate.totalPurchases = (customerToUpdate.totalPurchases || 0) + sale.totalAmount;
  customerToUpdate.lastPurchaseDate = new Date();
  await customerToUpdate.save();
  
  console.log(`為客戶 ${customerToUpdate._id} 更新購買記錄，金額: ${sale.totalAmount}`);
}

export default router;
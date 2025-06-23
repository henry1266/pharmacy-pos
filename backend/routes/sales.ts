import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import mongoose from 'mongoose';
// 使用 ES6 import 導入模型
import Sale from '../models/Sale';
import BaseProduct from '../models/BaseProduct';
import Inventory from '../models/Inventory';
import Customer from '../models/Customer';
// 使用 shared 架構的 API 類型
import { ApiResponse, ErrorResponse, SaleCreateRequest } from '@pharmacy-pos/shared/types/api';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@pharmacy-pos/shared/constants';

// 引入通用訂單單號生成服務
import OrderNumberService from '../utils/OrderNumberService';

const router: express.Router = express.Router();

/**
 * 驗證 MongoDB ObjectId 是否有效
 * 防止 NoSQL 注入攻擊
 */
function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

// 型別定義
// 使用 shared 的 SaleCreateRequest，並擴展本地需要的欄位
interface SaleCreationRequest extends SaleCreateRequest {
  productName?: string; // 向後兼容
  finalAmount?: number;
  cashier?: string;
}

// 定義更具體的型別
// 使用 Record<string, any> 來避免 _id 型別衝突
type SaleDocument = mongoose.Document & Record<string, any>;

interface ValidationResult {
  success: boolean;
  statusCode?: number;
  message?: string;
  sale?: SaleDocument;
}

interface CustomerCheckResult {
  exists: boolean;
  error?: ValidationResult;
}

interface ProductCheckResult {
  exists: boolean;
  product?: mongoose.Document;
  error?: ValidationResult;
}

interface InventoryCheckResult {
  success: boolean;
  error?: ValidationResult;
}

// 定義錯誤型別
interface MongooseError extends Error {
  kind?: string;
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
    
    // 使用型別斷言解決型別不匹配問題
    const response: ApiResponse<any[]> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      data: sales.map(sale => ({
        ...sale.toObject(),
        _id: sale._id.toString(),
        createdAt: sale.createdAt,
        updatedAt: sale.updatedAt
      })),
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err: unknown) {
    console.error(err instanceof Error ? err.message : 'Unknown error');
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
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
    // 驗證 ID 格式，防止 NoSQL 注入
    if (!isValidObjectId(req.params.id)) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(404).json(errorResponse);
      return;
    }

    const sale = await Sale.findById(req.params.id)
      .populate('customer')
      .populate({
        path: 'items.product',
        model: 'baseproduct'
      })
      .populate('cashier');
      
    if (!sale) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(404).json(errorResponse);
      return;
    }
    
    // 使用型別斷言解決型別不匹配問題
    const response: ApiResponse<any> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      data: {
        ...sale.toObject(),
        _id: sale._id.toString(),
        createdAt: sale.createdAt,
        updatedAt: sale.updatedAt
      },
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err: unknown) {
    console.error(err instanceof Error ? err.message : 'Unknown error');
    if (err instanceof Error && err.name === 'CastError') {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(404).json(errorResponse);
      return;
    }
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
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
        message: ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
        error: JSON.stringify(errors.array()),
        timestamp: new Date()
      };
      res.status(400).json(errorResponse);
      return;
    }
    
    try {
      // 1. 驗證請求和檢查記錄
      const validationResult = await validateSaleCreationRequest(req.body as SaleCreationRequest);
      if (!validationResult.success) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: validationResult.message || ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
          timestamp: new Date()
        };
        res.status(validationResult.statusCode || 400).json(errorResponse);
      return;
      }
      
      // 2. 創建銷售記錄
      const sale = await createSaleRecord(req.body as SaleCreationRequest);
      
      // 3. 處理庫存變更
      await handleInventoryForNewSale(sale);
      
      // 4. 處理客戶積分
      await updateCustomerPoints(sale);
      
      // 使用型別斷言解決型別不匹配問題
      const response: ApiResponse<any> = {
        success: true,
        message: SUCCESS_MESSAGES.GENERIC.CREATED,
        data: {
          ...sale.toObject(),
          _id: sale._id.toString(),
          createdAt: sale.createdAt,
          updatedAt: sale.updatedAt
        },
        timestamp: new Date()
      };
      
      res.json(response);
    } catch (err: unknown) {
      console.error(err instanceof Error ? err.message : 'Unknown error');
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
        timestamp: new Date()
      };
      res.status(500).json(errorResponse);
    }
  }
);

// 檢查客戶是否存在
async function checkCustomerExists(customerId?: string): Promise<CustomerCheckResult> {
  if (!customerId) return { exists: true };
  
  // 驗證 ID 格式，防止 NoSQL 注入
  if (!isValidObjectId(customerId)) {
    return {
      exists: false,
      error: {
        success: false,
        statusCode: 404,
        message: '客戶ID格式無效'
      }
    };
  }
  
  const customerExists = await Customer.findById(customerId);
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
  // 驗證 ID 格式，防止 NoSQL 注入
  if (!isValidObjectId(productId)) {
    return {
      exists: false,
      error: {
        success: false,
        statusCode: 404,
        message: `產品ID ${productId} 格式無效`
      }
    };
  }
  
  const product = await BaseProduct.findById(productId);
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
async function checkProductInventory(product: mongoose.Document, quantity: number): Promise<InventoryCheckResult> {
  try {
    // 獲取所有庫存記錄
    // 確保 _id 是有效的 ObjectId
    if (!isValidObjectId(product._id.toString())) {
      return {
        success: false,
        error: {
          success: false,
          statusCode: 400,
          message: '產品ID格式無效'
        }
      };
    }
    
    const inventories = await Inventory.find({ product: product._id }).lean();
    console.log(`找到 ${inventories.length} 個庫存記錄`);
    
    // 計算總庫存量
    let totalQuantity = calculateTotalInventory(inventories);
    
    // 安全地訪問產品屬性
    const productDoc = product as any;
    console.log(`產品 ${productDoc.name ?? '未知'} 總庫存量: ${totalQuantity}，銷售數量: ${quantity}`);
    
    // 不再檢查庫存是否足夠，允許負庫存
    if (totalQuantity < quantity) {
      console.log(`警告: 產品 ${(product as any).name ?? '未知'} 庫存不足，當前總庫存: ${totalQuantity}，需求: ${quantity}，將允許負庫存`);
    }
    
    return { success: true };
  } catch (err: unknown) {
    console.error(`庫存檢查錯誤:`, err);
    return {
      success: false,
      error: {
        success: false,
        statusCode: 500,
        message: `庫存檢查錯誤: ${err instanceof Error ? err.message : '未知錯誤'}`
      }
    };
  }
}

// 計算總庫存量
interface InventoryRecord {
  _id: mongoose.Types.ObjectId | string;
  quantity: number;
  type?: string;
}

function calculateTotalInventory(inventories: any[]): number {
  let totalQuantity = 0;
  for (const inv of inventories) {
    totalQuantity += inv.quantity;
    // 安全地處理 _id，可能是 ObjectId 或字串
    let recordId = '未知';
    if (inv._id) {
      // 提取三元運算符為獨立語句，提高可讀性
      if (typeof inv._id === 'object') {
        recordId = inv._id.toString();
      } else {
        recordId = inv._id;
      }
    }
    console.log(`庫存記錄: ${recordId}, 類型: ${inv.type ?? 'purchase'}, 數量: ${inv.quantity}`);
  }
  return totalQuantity;
}

// 驗證銷售創建請求
async function validateSaleCreationRequest(requestBody: SaleCreationRequest): Promise<ValidationResult> {
  const { customer, items } = requestBody;
  
  // 檢查客戶是否存在
  const customerCheck = await checkCustomerExists(customer);
  if (!customerCheck.exists) {
    return customerCheck.error;
  }
  
  // 檢查所有產品是否存在
  for (const item of items) {
    // 檢查產品是否存在
    const productCheck = await checkProductExists(item.product);
    if (!productCheck.exists) {
      return productCheck.error;
    }
    
    // 記錄當前庫存量，但不限制負庫存
    // 安全地訪問產品名稱，避免使用非空斷言
    const productName = productCheck.product && 'name' in productCheck.product
      ? (productCheck.product as any).name
      : '未知產品';
    console.log(`檢查產品ID: ${item.product}, 名稱: ${productName}`);
    
    // 檢查產品庫存
    const inventoryCheck = await checkProductInventory(productCheck.product, item.quantity);
    if (!inventoryCheck.success) {
      return inventoryCheck.error;
    }
  }
  
  return { success: true };
}

// 創建銷售記錄
async function createSaleRecord(requestBody: SaleCreationRequest): Promise<SaleDocument> {
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
    notes: requestBody.notes,
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
// 更靈活的銷售項目型別
interface SaleItemInput {
  product: string;
  quantity: number;
  price?: number;
  unitPrice?: number;
  discount?: number;
  subtotal?: number;
  notes?: string;
}

interface SaleFieldsInput {
  saleNumber: string;
  customer?: string;
  items: SaleItemInput[];
  totalAmount: number;
  discount?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  notes?: string;
  cashier?: string;
}

function buildSaleFields(saleData: SaleFieldsInput): Record<string, any> {
  // Ensure saleNumber is never empty to prevent duplicate key errors
  if (!saleData.saleNumber) {
    console.error('Warning: Attempted to create sale with empty saleNumber');
    throw new Error('Sale number cannot be empty');
  }
  
  const saleFields: Record<string, any> = {
    saleNumber: saleData.saleNumber,
    items: saleData.items,
    totalAmount: saleData.totalAmount,
  };
  
  if (saleData.customer) saleFields.customer = saleData.customer;
  if (saleData.discount) saleFields.discount = saleData.discount;
  if (saleData.paymentMethod) saleFields.paymentMethod = saleData.paymentMethod as any;
  if (saleData.paymentStatus) saleFields.paymentStatus = saleData.paymentStatus as any;
  if (saleData.notes) saleFields.notes = saleData.notes;
  if (saleData.cashier) saleFields.cashier = saleData.cashier;
  
  // 計算最終金額
  saleFields.finalAmount = saleFields.totalAmount - (saleFields.discount ?? 0);
  
  return saleFields;
}

// 處理新銷售的庫存變更
async function handleInventoryForNewSale(sale: SaleDocument): Promise<void> {
  // 為每個銷售項目創建負數庫存記錄
  if (!sale.items || !Array.isArray(sale.items)) {
    console.error('銷售記錄缺少有效的項目陣列');
    return;
  }
  
  const items = sale.items as any[];
  for (const item of items) {
    try {
      await createInventoryRecord(item, sale);
    } catch (err) {
      console.error(`處理庫存記錄時出錯: ${err instanceof Error ? err.message : '未知錯誤'}`);
      // 繼續處理其他項目，不中斷流程
    }
  }
}

// 創建庫存記錄
interface SaleItem {
  product: string | mongoose.Types.ObjectId;
  quantity: number;
  subtotal?: number;
}

async function createInventoryRecord(item: SaleItem, sale: SaleDocument): Promise<void> {
  // 確保產品ID有效
  if (!item.product) {
    console.error('銷售項目缺少產品ID');
    return;
  }
  
  // 確保數量有效
  if (typeof item.quantity !== 'number') {
    console.error(`產品 ${item.product} 的數量無效`);
    return;
  }
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
  console.log(`為產品 ${item.product} 創建銷售庫存記錄，數量: -${item.quantity}, 總金額: ${item.subtotal || 0}`);
}

// 更新客戶積分
async function updateCustomerPoints(sale: SaleDocument): Promise<void> {
  // 如果有客戶，更新客戶積分
  if (!sale.customer) return;
  
  // 驗證客戶ID格式，防止 NoSQL 注入
  if (!isValidObjectId(sale.customer.toString())) {
    console.error(`客戶ID格式無效: ${sale.customer}`);
    return;
  }
  
  const customerToUpdate = await Customer.findOne({ _id: sale.customer });
  if (!customerToUpdate) return;
  
  // 更新客戶總購買金額
  customerToUpdate.totalPurchases = (customerToUpdate.totalPurchases ?? 0) + sale.totalAmount;
  customerToUpdate.lastPurchaseDate = new Date();
  await customerToUpdate.save();
  
  console.log(`為客戶 ${customerToUpdate._id} 更新購買記錄，金額: ${sale.totalAmount}`);
}

export default router;
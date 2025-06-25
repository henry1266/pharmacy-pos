import express, { Request, Response } from 'express';
import { Types } from 'mongoose';
import { check, validationResult } from 'express-validator';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import ShippingOrder from '../models/ShippingOrder';
import BaseProduct from '../models/BaseProduct';
import Inventory from '../models/Inventory';
import Customer from '../models/Customer';
import Supplier from '../models/Supplier';
import OrderNumberService from '../utils/OrderNumberService';

// 使用 shared 架構的類型
import { ApiResponse, ErrorResponse } from '@pharmacy-pos/shared/types/api';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@pharmacy-pos/shared/constants';

// 定義產品介面
interface ProductDocument {
  _id: Types.ObjectId;
  code: string;
  name: string;
  healthInsuranceCode?: string;
}

// 定義介面
interface ShippingOrderItem {
  did: string;
  dname: string;
  dquantity: number;
  dtotalCost: number;
  product?: Types.ObjectId | ProductDocument;
  healthInsuranceCode?: string;
}

interface ShippingOrderDocument {
  _id: Types.ObjectId;
  soid: string;
  orderNumber: string;
  sosupplier: string;
  supplier?: Types.ObjectId;
  items: ShippingOrderItem[];
  notes?: string;
  status: 'pending' | 'completed' | 'cancelled';
  paymentStatus: string;
  totalAmount?: number;
  createdAt: Date;
  toObject(): any;
}

interface ShippingOrderRequest {
  soid?: string;
  sosupplier: string;
  supplier?: Types.ObjectId | string;
  items: ShippingOrderItem[];
  notes?: string;
  status?: 'pending' | 'completed';
  paymentStatus?: string;
  sobill?: string;
  socustomer?: string;
  customer?: Types.ObjectId;
}

interface SearchQuery {
  soid?: string | { $regex: string, $options: string };
  sosupplier?: string | { $regex: string, $options: string };
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
}

// 設置文件上傳
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    // 確保上傳目錄存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

const router: express.Router = express.Router();

// 通用輔助函數
/**
 * 處理產品的 healthInsuranceCode
 * @param orders - 出貨單數組
 */
function processHealthInsuranceCode(orders: ShippingOrderDocument[]): void {
  if (!orders || orders.length === 0) return;
  
  orders.forEach((order: ShippingOrderDocument) => {
    if (order.items && order.items.length > 0) {
      order.items.forEach((item: ShippingOrderItem) => {
        if (typeof item.product !== 'string' && item.product && 'healthInsuranceCode' in item.product) {
          item.healthInsuranceCode = item.product.healthInsuranceCode;
        }
      });
    }
  });
}

/**
 * 創建標準 API 成功響應
 * @param data - 響應數據
 * @param message - 響應消息
 */
function createSuccessResponse<T>(data: T, message: string = SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    timestamp: new Date()
  };
}

/**
 * 創建標準錯誤響應
 * @param message - 錯誤消息
 * @param errors - 驗證錯誤數組（可選）
 */
function createErrorResponse(message: string, errors?: any[]): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    message,
    timestamp: new Date()
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return response;
}

/**
 * 處理數據庫錯誤並發送響應
 * @param res - Express 響應對象
 * @param err - 錯誤對象
 * @param customMessage - 自定義錯誤消息（可選）
 */
function handleDatabaseError(res: Response, err: Error, customMessage?: string): void {
  console.error(err.message);
  
  if (err.name === 'CastError') {
    res.status(404).json(createErrorResponse(customMessage || ERROR_MESSAGES.GENERIC.NOT_FOUND));
    return;
  }
  
  res.status(500).json(createErrorResponse(ERROR_MESSAGES.GENERIC.SERVER_ERROR));
}

// @route   GET api/shipping-orders
// @desc    獲取所有出貨單
// @access  Public
router.get('/', async (req: Request, res: Response) => {
  try {
    const shippingOrders = await ShippingOrder.find()
      .sort({ soid: -1 })
      .populate('supplier', 'name')
      .populate('items.product', 'name code healthInsuranceCode');
    
    processHealthInsuranceCode(shippingOrders);
    res.json(createSuccessResponse(shippingOrders));
  } catch (err) {
    handleDatabaseError(res, err as Error);
  }
});

// @route   GET api/shipping-orders/:id
// @desc    獲取單個出貨單
// @access  Public
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const shippingOrder = await ShippingOrder.findById(req.params.id)
      .populate('supplier', 'name')
      .populate('items.product', 'name code healthInsuranceCode');
    
    if (!shippingOrder) {
      res.status(404).json(createErrorResponse(ERROR_MESSAGES.GENERIC.NOT_FOUND));
      return;
    }
    
    processHealthInsuranceCode([shippingOrder]);
    res.json(createSuccessResponse(shippingOrder));
  } catch (err) {
    handleDatabaseError(res, err as Error);
  }
});

// 生成唯一訂單號的輔助函數
async function generateUniqueOrderNumber(soid: string): Promise<string> {
  // 基本訂單號使用soid
  let orderNumber = soid;
  let counter = 1;
  let isUnique = false;
  
  // 檢查訂單號是否已存在，如果存在則添加計數器
  while (!isUnique) {
    const existingOrder = await ShippingOrder.findOne({ orderNumber });
    if (!existingOrder) {
      isUnique = true;
    } else {
      // 如果訂單號已存在，添加計數器後綴
      orderNumber = `${soid}-${counter}`;
      counter++;
    }
  }
  
  return orderNumber;
}

/**
 * 檢查出貨單號是否已存在
 * @param {string} soid - 出貨單號
 * @returns {Promise<boolean>} - 是否存在
 */
async function checkShippingOrderExists(soid: string): Promise<boolean> {
  if (!soid || soid.trim() === '') {
    return false;
  }
  
  // 安全處理：確保soid是字符串並去除任何可能的惡意字符
  const sanitizedSoid = String(soid).trim();
  
  // 使用嚴格相等查詢而非正則表達式
  const existingSO = await ShippingOrder.findOne({ soid: sanitizedSoid });
  return !!existingSO;
}

// 處理出貨單號的輔助函數
async function handleShippingOrderId(soid?: string): Promise<{ soid?: string; error?: string }> {
  if (!soid || soid.trim() === '') {
    return {
      soid: await OrderNumberService.generateShippingOrderNumber()
    };
  }
  
  // 檢查出貨單號是否已存在
  if (await checkShippingOrderExists(soid)) {
    return {
      error: '該出貨單號已存在'
    };
  }
  
  return { soid };
}

// 驗證產品項目並檢查庫存的輔助函數
async function validateProductsAndInventory(items: ShippingOrderItem[]): Promise<{ valid: boolean; error?: string; items?: ShippingOrderItem[] }> {
  for (const item of items) {
    // 檢查項目完整性
    if (!item.did || !item.dname || !item.dquantity || !item.dtotalCost) {
      return {
        valid: false,
        error: '藥品項目資料不完整'
      };
    }

    // 驗證藥品代碼格式
    const regexResult = /^[A-Za-z0-9_-]+$/.exec(item.did);
    if (typeof item.did !== 'string' || !regexResult) {
      return {
        valid: false,
        error: `無效的藥品代碼格式: ${item.did}`
      };
    }
    
    // 查找產品 - 安全處理：確保did是字符串並去除任何可能的惡意字符
    const sanitizedCode = String(item.did).trim();
    const product = await BaseProduct.findOne({ code: sanitizedCode });
    if (!product) {
      return {
        valid: false,
        error: `找不到藥品: ${sanitizedCode}`
      };
    }
    
    item.product = product._id as Types.ObjectId;
    
    // 檢查庫存
    const inventorySum = await Inventory.aggregate([
      { $match: { product: product._id } },
      { $group: { _id: null, total: { $sum: "$quantity" } } }
    ]);
    
    const availableQuantity = inventorySum.length > 0 ? inventorySum[0].total : 0;
    
    if (availableQuantity < item.dquantity) {
      return {
        valid: false,
        error: `藥品 ${item.dname} (${item.did}) 庫存不足，目前庫存: ${availableQuantity}，需要: ${item.dquantity}`
      };
    }
  }
  
  return { valid: true, items };
}

/**
 * 查找供應商的輔助函數
 * @param {string|ObjectId} supplier - 供應商ID
 * @param {string} sosupplier - 供應商名稱
 * @returns {Promise<string|null>} - 供應商ID或null
 */
async function findSupplier(supplier?: Types.ObjectId | string, sosupplier?: string): Promise<string | null> {
  if (supplier) {
    // 確保返回字符串格式的ID
    return String(supplier);
  }
  
  if (!sosupplier || typeof sosupplier !== 'string') {
    return null;
  }
  
  // 安全處理：確保sosupplier是字符串並去除任何可能的惡意字符
  const sanitizedName = sosupplier.trim();
  
  const supplierDoc = await Supplier.findOne({ name: sanitizedName });
  return supplierDoc ? supplierDoc._id.toString() : null;
}

// @route   POST api/shipping-orders
// @desc    創建新出貨單
// @access  Public
router.post('/', [
  check('sosupplier', '供應商為必填項').not().isEmpty(),
  check('items', '至少需要一個藥品項目').isArray().not().isEmpty()
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(createErrorResponse(ERROR_MESSAGES.GENERIC.VALIDATION_FAILED, errors.array()));
    return;
  }

  try {
    let { soid, sosupplier, supplier, items, notes, status, paymentStatus } = req.body as ShippingOrderRequest;

    // 處理出貨單號
    const soidResult = await handleShippingOrderId(soid);
    if (soidResult.error) {
      res.status(400).json(createErrorResponse(soidResult.error));
      return;
    }
    soid = soidResult.soid;

    // 生成唯一訂單號
    const orderNumber = await OrderNumberService.generateUniqueOrderNumber('shipping', soid);

    // 驗證產品並檢查庫存
    const productsResult = await validateProductsAndInventory(items);
    if (!productsResult.valid) {
      res.status(400).json(createErrorResponse(productsResult.error || ERROR_MESSAGES.GENERIC.VALIDATION_FAILED));
      return;
    }
    items = productsResult.items!;

    // 查找供應商
    const supplierId = await findSupplier(supplier, sosupplier);

    // 創建新出貨單
    const shippingOrder = new ShippingOrder({
      soid,
      orderNumber,
      sosupplier,
      supplier: supplierId,
      items,
      notes,
      status: status || 'pending',
      paymentStatus: paymentStatus || '未收'
    });

    await shippingOrder.save();

    // 如果狀態為已完成，則創建ship類型庫存記錄
    if (shippingOrder.status === 'completed') {
      await createShippingInventoryRecords(shippingOrder);
    }

    res.json(createSuccessResponse(shippingOrder, SUCCESS_MESSAGES.GENERIC.CREATED));
  } catch (err) {
    handleDatabaseError(res, err as Error, '創建出貨單錯誤');
  }
});

// 驗證出貨單項目的輔助函數
async function validateOrderItems(items: ShippingOrderItem[]): Promise<{ valid: boolean; message?: string }> {
  for (const item of items) {
    if (!item.did || !item.dname || !item.dquantity || !item.dtotalCost) {
      return {
        valid: false,
        message: '藥品項目資料不完整'
      };
    }

    // 嘗試查找藥品
    const product = await BaseProduct.findOne({ code: item.did.toString() });
    if (product) {
      item.product = product._id as Types.ObjectId;
    }
  }
  
  return { valid: true };
}

/**
 * 處理出貨單號變更的輔助函數
 * @param {string} newSoid - 新出貨單號
 * @param {string} currentSoid - 當前出貨單號
 * @param {string} orderId - 出貨單ID
 * @returns {Promise<Object>} - 處理結果
 */
async function handleOrderNumberChange(newSoid?: string, currentSoid?: string, orderId?: string): Promise<{ changed: boolean; error?: string; orderNumber?: string }> {
  // 驗證輸入
  if (!newSoid || newSoid === currentSoid) {
    return { changed: false };
  }
  
  if (!orderId || typeof orderId !== 'string') {
    return {
      changed: false,
      error: '無效的訂單ID'
    };
  }
  
  // 安全處理：確保soid是字符串並去除任何可能的惡意字符
  const sanitizedSoid = String(newSoid).trim();
  
  // 檢查新出貨單號是否已存在
  // 使用安全的方式查詢所有出貨單
  const allOrders = await ShippingOrder.find({}, { _id: 1, soid: 1 });
  
  // 在應用層面過濾，而不是直接在數據庫查詢中使用用戶輸入
  const existingSO = allOrders.find((order: any) =>
    order.soid === sanitizedSoid && order._id.toString() !== orderId
  );
  
  if (existingSO) {
    return {
      changed: false,
      error: '該出貨單號已存在'
    };
  }
  
  // 使用安全的方式生成唯一訂單號
  const orderNumber = await generateUniqueOrderNumber(sanitizedSoid);
  return {
    changed: true,
    orderNumber
  };
}

// 處理狀態變更的輔助函數
async function handleStatusChange(newStatus?: string, oldStatus?: string, orderId?: Types.ObjectId): Promise<{ changed: boolean; needCreateInventory?: boolean }> {
  if (!newStatus || newStatus === oldStatus) {
    return { changed: false };
  }
  
  // 如果狀態從已完成改為其他狀態，刪除相關的ship類型庫存記錄
  if (oldStatus === 'completed' && newStatus !== 'completed') {
    await deleteShippingInventoryRecords(orderId);
  }
  
  return {
    changed: true,
    needCreateInventory: oldStatus !== 'completed' && newStatus === 'completed'
  };
}

// 準備更新數據的輔助函數
function prepareUpdateData(requestBody: ShippingOrderRequest, orderNumberResult?: { orderNumber?: string }): Record<string, any> {
  const { soid, sosupplier, supplier, notes, paymentStatus, status } = requestBody;
  
  const updateData: Record<string, any> = {};
  if (soid) updateData.soid = soid;
  if (orderNumberResult?.orderNumber) {
    updateData.orderNumber = orderNumberResult.orderNumber;
  }
  if (sosupplier) updateData.sosupplier = sosupplier;
  if (supplier) updateData.supplier = supplier;
  if (notes !== undefined) updateData.notes = notes;
  if (paymentStatus) updateData.paymentStatus = paymentStatus;
  if (status) updateData.status = status;
  
  return updateData;
}

// @route   PUT api/shipping-orders/:id
// @desc    更新出貨單
// @access  Public
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { soid, items, status } = req.body as ShippingOrderRequest;

    // 檢查出貨單是否存在
    let shippingOrder = await ShippingOrder.findById(req.params.id);
    if (!shippingOrder) {
      res.status(404).json(createErrorResponse('找不到該出貨單'));
      return;
    }

    // 處理出貨單號變更
    const orderNumberResult = await handleOrderNumberChange(soid, shippingOrder.soid, req.params.id);
    if (orderNumberResult.error) {
      res.status(400).json(createErrorResponse(orderNumberResult.error));
      return;
    }

    // 處理項目更新
    if (items && items.length > 0) {
      const itemsValidation = await validateOrderItems(items);
      if (!itemsValidation.valid) {
        res.status(400).json(createErrorResponse(itemsValidation.message || ERROR_MESSAGES.GENERIC.VALIDATION_FAILED));
        return;
      }
    }

    // 處理狀態變更
    const oldStatus = shippingOrder.status;
    const statusChangeResult = await handleStatusChange(status, oldStatus, shippingOrder._id);

    // 準備更新數據
    const updateData = prepareUpdateData(req.body, orderNumberResult);
    if (items && items.length > 0) {
      updateData.items = items;
    }

    // 更新出貨單
    shippingOrder = await ShippingOrder.findById(req.params.id);
    
    // 應用更新
    Object.keys(updateData).forEach(key => {
      // 使用索引簽名訪問屬性
      (shippingOrder as any)[key] = updateData[key];
    });
    
    // 手動計算總金額以確保正確
    shippingOrder.totalAmount = shippingOrder.items.reduce(
      (total: number, item: ShippingOrderItem) => total + Number(item.dtotalCost), 0
    );
    
    // 保存更新後的出貨單
    await shippingOrder.save();

    // 如果需要創建庫存記錄
    if (statusChangeResult.needCreateInventory) {
      await createShippingInventoryRecords(shippingOrder);
    }

    res.json(createSuccessResponse(shippingOrder, SUCCESS_MESSAGES.GENERIC.UPDATED));
  } catch (err) {
    handleDatabaseError(res, err as Error, '更新出貨單錯誤');
  }
});

// @route   DELETE api/shipping-orders/:id
// @desc    刪除出貨單
// @access  Public
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const shippingOrder = await ShippingOrder.findById(req.params.id);
    if (!shippingOrder) {
      res.status(404).json(createErrorResponse('找不到該出貨單'));
      return;
    }

    // 如果出貨單已完成，刪除相關的ship類型庫存記錄
    if (shippingOrder.status === 'completed') {
      await deleteShippingInventoryRecords(shippingOrder._id);
    }

    await shippingOrder.deleteOne();
    res.json(createSuccessResponse(null, '出貨單已刪除'));
  } catch (err) {
    handleDatabaseError(res, err as Error);
  }
});

// @route   GET api/shipping-orders/supplier/:supplierId
// @desc    獲取特定供應商的出貨單
// @access  Public
router.get('/supplier/:supplierId', async (req: Request, res: Response) => {
  try {
    const shippingOrders = await ShippingOrder.find({ supplier: req.params.supplierId.toString() })
      .sort({ createdAt: -1 })
      .populate('supplier', 'name')
      .populate('items.product', 'name code healthInsuranceCode');
    
    processHealthInsuranceCode(shippingOrders);
    res.json(createSuccessResponse(shippingOrders));
  } catch (err) {
    handleDatabaseError(res, err as Error);
  }
});

// @route   GET api/shipping-orders/search
// @desc    搜索出貨單
// @access  Public
router.get('/search/query', async (req: Request, res: Response) => {
  try {
    const { soid, sosupplier, startDate, endDate } = req.query;
    
    const query: SearchQuery = {};
    if (soid) query.soid = { $regex: soid.toString(), $options: 'i' };
    if (sosupplier) query.sosupplier = { $regex: sosupplier.toString(), $options: 'i' };
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate.toString());
      if (endDate) query.createdAt.$lte = new Date(endDate.toString());
    }
    
    const shippingOrders = await ShippingOrder.find(query)
      .sort({ createdAt: -1 })
      .populate('supplier', 'name')
      .populate('items.product', 'name code healthInsuranceCode');
    
    processHealthInsuranceCode(shippingOrders);
    res.json(createSuccessResponse(shippingOrders));
  } catch (err) {
    handleDatabaseError(res, err as Error);
  }
});

// @route   GET api/shipping-orders/product/:productId
// @desc    獲取特定產品的出貨單
// @access  Public
router.get('/product/:productId', async (req: Request, res: Response) => {
  try {
    // 安全處理：驗證和清理productId
    if (!req.params.productId || typeof req.params.productId !== 'string') {
      res.status(400).json(createErrorResponse('無效的產品ID'));
      return;
    }
    
    const sanitizedProductId = req.params.productId.trim();
    
    // 使用安全的方式構建查詢條件
    const query = {
      'status': 'completed'
    };
    
    // 使用安全的方式查詢所有出貨單
    const allOrders = await ShippingOrder.find(query)
      .populate('supplier', 'name')
      .populate('items.product', 'name code healthInsuranceCode');
    
    // 在應用層面過濾產品，而不是直接在數據庫查詢中使用用戶輸入
    const shippingOrders = allOrders.filter((order: any) => {
      if (!order.items || !Array.isArray(order.items)) return false;
      
      return order.items.some((item: any) =>
        item.product?._id?.toString() === sanitizedProductId
      );
    });
    
    processHealthInsuranceCode(shippingOrders);
    res.json(createSuccessResponse(shippingOrders));
  } catch (err) {
    handleDatabaseError(res, err as Error);
  }
});

// @route   GET api/shipping-orders/recent
// @desc    獲取最近的出貨單
// @access  Public
router.get('/recent/list', async (req: Request, res: Response) => {
  try {
    const shippingOrders = await ShippingOrder.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('supplier', 'name')
      .populate('items.product', 'name code healthInsuranceCode');
    
    processHealthInsuranceCode(shippingOrders);
    res.json(createSuccessResponse(shippingOrders));
  } catch (err) {
    handleDatabaseError(res, err as Error);
  }
});

// 為出貨單創建新的ship類型庫存記錄的輔助函數
async function createShippingInventoryRecords(shippingOrder: ShippingOrderDocument): Promise<void> {
  try {
    for (const item of shippingOrder.items) {
      if (!item.product) continue;
      
      // 為每個出貨單項目創建新的庫存記錄
      const inventory = new Inventory({
        product: item.product,
        quantity: -parseInt(item.dquantity.toString()), // 負數表示庫存減少
        totalAmount: Number(item.dtotalCost),
        shippingOrderId: shippingOrder._id, // 使用出貨單ID
        shippingOrderNumber: shippingOrder.orderNumber, // 使用出貨單號
        type: 'ship' // 設置類型為'ship'
      });
      
      await inventory.save();
      console.log(`已為產品 ${item.product} 創建新庫存記錄，出貨單號: ${shippingOrder.orderNumber}, 數量: -${item.dquantity}, 總金額: ${item.dtotalCost}, 類型: ship`);
    }
    
    console.log(`已成功為出貨單 ${shippingOrder._id} 創建所有ship類型庫存記錄`);
  } catch (err) {
    console.error(`創建ship類型庫存記錄時出錯: ${(err as Error).message}`);
    throw err; // 重新拋出錯誤，讓調用者知道出了問題
  }
}

// 刪除與出貨單相關的ship類型庫存記錄
// 刪除與出貨單相關的ship類型庫存記錄
async function deleteShippingInventoryRecords(shippingOrderId?: Types.ObjectId): Promise<any> {
  try {
    const result = await Inventory.deleteMany({ shippingOrderId: shippingOrderId, type: 'ship' });
    console.log(`已刪除 ${result.deletedCount} 筆與出貨單 ${shippingOrderId} 相關的ship類型庫存記錄`);
    return result;
  } catch (err) {
    console.error(`刪除ship類型庫存記錄時出錯: ${(err as Error).message}`);
    throw err;
  }
}

// @route   POST api/shipping-orders/import/basic
// @desc    導入出貨單基本資訊CSV
// @access  Public
router.post('/import/basic', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json(createErrorResponse('請上傳CSV文件'));
      return;
    }

    const results: any[] = [];
    const errors: string[] = [];
    let successCount = 0;

    // 讀取並解析CSV文件
    // 在這裡導入 csv-parser，只在需要時使用
    const csv = require('csv-parser');
    
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data: any) => results.push(data))
      .on('end', async () => {
        // 刪除上傳的文件
        fs.unlinkSync(req.file!.path);

        // 處理每一行數據
        for (const row of results) {
          try {
            // 檢查必要字段
            if (!row['出貨單號'] || !row['客戶']) {
              errors.push(`行 ${results.indexOf(row) + 1}: 出貨單號和客戶為必填項`);
              continue;
            }

            // 檢查出貨單號是否已存在
            if (await checkShippingOrderExists(row['出貨單號'])) {
              errors.push(`行 ${results.indexOf(row) + 1}: 出貨單號 ${row['出貨單號']} 已存在`);
              continue;
            }

            // 準備出貨單數據
            const shippingOrderData: any = {
              soid: row['出貨單號'],
              sobill: row['發票號'] ?? '',
              socustomer: row['客戶'],
              paymentStatus: row['付款狀態'] ?? '未收',
              items: [],
              status: 'pending'
            };

            // 嘗試查找客戶
            const customerDoc = await Customer.findOne({ name: row['客戶'] });
            if (customerDoc) {
              shippingOrderData.customer = customerDoc._id;
            }

            // 創建出貨單
            const shippingOrder = new ShippingOrder(shippingOrderData);
            await shippingOrder.save();
            successCount++;
          } catch (err) {
            console.error(`處理行 ${results.indexOf(row) + 1} 時出錯:`, (err as Error).message);
            errors.push(`行 ${results.indexOf(row) + 1}: ${(err as Error).message}`);
          }
        }

        // 返回結果
        res.json({
          msg: `成功導入 ${successCount} 筆出貨單基本資訊${errors.length > 0 ? '，但有部分錯誤' : ''}`,
          success: successCount,
          errors: errors
        });
      });
  } catch (err) {
    handleDatabaseError(res, err as Error, 'CSV導入錯誤');
  }
});

export default router;
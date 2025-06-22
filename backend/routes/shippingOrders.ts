import express, { Request, Response, Router } from 'express';
import { check, validationResult, ValidationError } from 'express-validator';
import mongoose, { Types } from 'mongoose';
import ShippingOrder from '../models/ShippingOrder';
import BaseProduct, { IBaseProduct } from '../models/BaseProduct';
import Supplier from '../models/Supplier';
import Inventory from '../models/Inventory';
import multer, { StorageEngine } from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import OrderNumberService from '../utils/OrderNumberService';

const router: Router = express.Router();

// 定義介面
interface ShippingOrderItem {
  did: string;
  dname: string;
  dquantity: number;
  dtotalCost: number;
  product?: Types.ObjectId;
  healthInsuranceCode?: string;
}

interface ShippingOrderRequest {
  soid?: string;
  sosupplier: string;
  supplier?: string | Types.ObjectId;
  items: ShippingOrderItem[];
  notes?: string;
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus?: string;
}

interface ShippingOrderUpdateRequest {
  soid?: string;
  sosupplier?: string;
  supplier?: string | Types.ObjectId;
  items?: ShippingOrderItem[];
  notes?: string;
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus?: string;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  items?: ShippingOrderItem[];
}

interface OrderNumberResult {
  changed: boolean;
  orderNumber?: string;
  error?: string;
}

interface StatusChangeResult {
  changed: boolean;
  needCreateInventory?: boolean;
}

interface SoidResult {
  soid?: string;
  error?: string;
}

interface CSVRow {
  [key: string]: string;
}

// 設置文件上傳
const storage: StorageEngine = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    const uploadDir = path.join(__dirname, '../uploads');
    // 確保上傳目錄存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

// @route   GET api/shipping-orders
// @desc    獲取所有出貨單
// @access  Public
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const shippingOrders = await ShippingOrder.find()
      .sort({ orderNumber: -1 })
      .populate('supplier', 'name')
      .populate('items.product', 'productName productCode healthInsuranceCode');
    
    // 將產品的healthInsuranceCode添加到items中
    if (shippingOrders && shippingOrders.length > 0) {
      shippingOrders.forEach(order => {
        if (order.items && order.items.length > 0) {
          order.items.forEach((item: any) => {
            item.healthInsuranceCode = item.product?.healthInsuranceCode;
          });
        }
      });
    }
    
    res.json(shippingOrders);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
});

// @route   GET api/shipping-orders/:id
// @desc    獲取單個出貨單
// @access  Public
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const shippingOrder = await ShippingOrder.findById(req.params.id)
      .populate('supplier', 'name')
      .populate('items.product', 'productName productCode healthInsuranceCode');
    
    if (!shippingOrder) {
      res.status(404).json({ msg: '找不到該出貨單' });
      return;
    }
    
    // 將產品的healthInsuranceCode添加到items中
    if (shippingOrder.items && shippingOrder.items.length > 0) {
      shippingOrder.items.forEach((item: any) => {
        item.healthInsuranceCode = item.product?.healthInsuranceCode;
      });
    }
    
    res.json(shippingOrder);
  } catch (err: any) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      res.status(404).json({ msg: '找不到該出貨單' });
      return;
    }
    res.status(500).send('伺服器錯誤');
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
 * @param soid - 出貨單號
 * @returns 是否存在
 */
async function checkShippingOrderExists(soid: string): Promise<boolean> {
  if (!soid || soid.trim() === '') {
    return false;
  }
  
  // 安全處理：確保soid是字符串並去除任何可能的惡意字符
  const sanitizedSoid = String(soid).trim();
  
  // 使用嚴格相等查詢而非正則表達式
  const existingSO = await ShippingOrder.findOne({ orderNumber: sanitizedSoid });
  return !!existingSO;
}

// 處理出貨單號的輔助函數
async function handleShippingOrderId(soid?: string): Promise<SoidResult> {
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
async function validateProductsAndInventory(items: ShippingOrderItem[]): Promise<ValidationResult> {
  for (const item of items) {
    // 檢查項目完整性
    if (!item.did || !item.dname || !item.dquantity || !item.dtotalCost) {
      return {
        valid: false,
        error: '藥品項目資料不完整'
      };
    }

    // 驗證藥品代碼格式
    if (typeof item.did !== 'string' || !item.did.match(/^[A-Za-z0-9_-]+$/)) {
      return {
        valid: false,
        error: `無效的藥品代碼格式: ${item.did}`
      };
    }
    
    // 查找產品 - 安全處理：確保did是字符串並去除任何可能的惡意字符
    const sanitizedCode = String(item.did).trim();
    const product = await BaseProduct.findOne({ productCode: sanitizedCode });
    if (!product) {
      return {
        valid: false,
        error: `找不到藥品: ${sanitizedCode}`
      };
    }
    
    item.product = product._id;
    
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
 * @param supplier - 供應商ID
 * @param sosupplier - 供應商名稱
 * @returns 供應商ID或null
 */
async function findSupplier(supplier?: string | Types.ObjectId, sosupplier?: string): Promise<string | null> {
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
], async (req: Request<{}, {}, ShippingOrderRequest>, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    let { soid, sosupplier, supplier, items, notes, status, paymentStatus } = req.body;

    // 處理出貨單號
    const soidResult = await handleShippingOrderId(soid);
    if (soidResult.error) {
      res.status(400).json({ msg: soidResult.error });
      return;
    }
    soid = soidResult.soid!;

    // 生成唯一訂單號
    const orderNumber = await OrderNumberService.generateUniqueOrderNumber('shipping', soid);

    // 驗證產品並檢查庫存
    const productsResult = await validateProductsAndInventory(items);
    if (!productsResult.valid) {
      res.status(400).json({ msg: productsResult.error });
      return;
    }
    items = productsResult.items!;

    // 查找供應商
    const supplierId = await findSupplier(supplier, sosupplier);

    // 創建新出貨單
    const shippingOrder = new ShippingOrder({
      orderNumber: soid,
      customerName: sosupplier,
      customer: supplierId,
      items: items.map(item => ({
        product: item.product,
        productName: item.dname,
        quantity: item.dquantity,
        unitPrice: item.dtotalCost / item.dquantity,
        subtotal: item.dtotalCost
      })),
      notes,
      status: status || 'pending',
      createdBy: new Types.ObjectId() // 這裡應該從認證中間件獲取用戶ID
    });

    await shippingOrder.save();

    // 如果狀態為已完成，則創建ship類型庫存記錄
    if (shippingOrder.status === 'delivered') {
      await createShippingInventoryRecords(shippingOrder);
    }

    res.json(shippingOrder);
  } catch (err: any) {
    console.error('創建出貨單錯誤:', err.message);
    res.status(500).send('伺服器錯誤');
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
    const product = await BaseProduct.findOne({ productCode: item.did.toString() });
    if (product) {
      item.product = product._id;
    }
  }
  
  return { valid: true };
}

/**
 * 處理出貨單號變更的輔助函數
 * @param newSoid - 新出貨單號
 * @param currentSoid - 當前出貨單號
 * @param orderId - 出貨單ID
 * @returns 處理結果
 */
async function handleOrderNumberChange(newSoid?: string, currentSoid?: string, orderId?: string): Promise<OrderNumberResult> {
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
  const allOrders = await ShippingOrder.find({}, { _id: 1, orderNumber: 1 });
  
  // 在應用層面過濾，而不是直接在數據庫查詢中使用用戶輸入
  const existingSO = allOrders.find(order =>
    order.orderNumber === sanitizedSoid && order._id.toString() !== orderId
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
async function handleStatusChange(newStatus?: string, oldStatus?: string, orderId?: Types.ObjectId): Promise<StatusChangeResult> {
  if (!newStatus || newStatus === oldStatus) {
    return { changed: false };
  }
  
  // 如果狀態從已完成改為其他狀態，刪除相關的ship類型庫存記錄
  if (oldStatus === 'delivered' && newStatus !== 'delivered') {
    await deleteShippingInventoryRecords(orderId!);
  }
  
  return {
    changed: true,
    needCreateInventory: oldStatus !== 'delivered' && newStatus === 'delivered'
  };
}

// 準備更新數據的輔助函數
function prepareUpdateData(requestBody: ShippingOrderUpdateRequest, orderNumberResult?: OrderNumberResult): Record<string, any> {
  const { soid, sosupplier, supplier, notes, paymentStatus, status } = requestBody;
  
  const updateData: Record<string, any> = {};
  if (soid) updateData.orderNumber = soid;
  if (orderNumberResult?.orderNumber) {
    updateData.orderNumber = orderNumberResult.orderNumber;
  }
  if (sosupplier) updateData.customerName = sosupplier;
  if (supplier) updateData.customer = supplier;
  if (notes !== undefined) updateData.notes = notes;
  if (status) updateData.status = status;
  
  return updateData;
}

// @route   PUT api/shipping-orders/:id
// @desc    更新出貨單
// @access  Public
router.put('/:id', async (req: Request<{ id: string }, {}, ShippingOrderUpdateRequest>, res: Response): Promise<void> => {
  try {
    const { soid, items, status } = req.body;

    // 檢查出貨單是否存在
    let shippingOrder = await ShippingOrder.findById(req.params.id);
    if (!shippingOrder) {
      res.status(404).json({ msg: '找不到該出貨單' });
      return;
    }

    // 處理出貨單號變更
    const orderNumberResult = await handleOrderNumberChange(soid, shippingOrder.orderNumber, req.params.id);
    if (orderNumberResult.error) {
      res.status(400).json({ msg: orderNumberResult.error });
      return;
    }

    // 處理項目更新
    if (items && items.length > 0) {
      const itemsValidation = await validateOrderItems(items);
      if (!itemsValidation.valid) {
        res.status(400).json({ msg: itemsValidation.message });
        return;
      }
    }

    // 處理狀態變更
    const oldStatus = shippingOrder.status;
    const statusChangeResult = await handleStatusChange(status, oldStatus, shippingOrder._id);

    // 準備更新數據
    const updateData = prepareUpdateData(req.body, orderNumberResult);
    if (items && items.length > 0) {
      updateData.items = items.map(item => ({
        product: item.product,
        productName: item.dname,
        quantity: item.dquantity,
        unitPrice: item.dtotalCost / item.dquantity,
        subtotal: item.dtotalCost
      }));
    }

    // 更新出貨單
    shippingOrder = await ShippingOrder.findById(req.params.id);
    if (!shippingOrder) {
      res.status(404).json({ msg: '找不到該出貨單' });
      return;
    }
    
    // 應用更新
    Object.keys(updateData).forEach(key => {
      (shippingOrder as any)[key] = updateData[key];
    });
    
    // 保存更新後的出貨單
    await shippingOrder.save();

    // 如果需要創建庫存記錄
    if (statusChangeResult.needCreateInventory) {
      await createShippingInventoryRecords(shippingOrder);
    }

    res.json(shippingOrder);
  } catch (err: any) {
    console.error('更新出貨單錯誤:', err.message);
    if (err.kind === 'ObjectId') {
      res.status(404).json({ msg: '找不到該出貨單' });
      return;
    }
    res.status(500).send('伺服器錯誤');
  }
});

// @route   DELETE api/shipping-orders/:id
// @desc    刪除出貨單
// @access  Public
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const shippingOrder = await ShippingOrder.findById(req.params.id);
    if (!shippingOrder) {
      res.status(404).json({ msg: '找不到該出貨單' });
      return;
    }

    // 如果出貨單已完成，刪除相關的ship類型庫存記錄
    if (shippingOrder.status === 'delivered') {
      await deleteShippingInventoryRecords(shippingOrder._id);
    }

    await shippingOrder.deleteOne();
    res.json({ msg: '出貨單已刪除' });
  } catch (err: any) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      res.status(404).json({ msg: '找不到該出貨單' });
      return;
    }
    res.status(500).send('伺服器錯誤');
  }
});

// @route   GET api/shipping-orders/supplier/:supplierId
// @desc    獲取特定供應商的出貨單
// @access  Public
router.get('/supplier/:supplierId', async (req: Request, res: Response): Promise<void> => {
  try {
    const supplierId = req.params.supplierId;
    if (!supplierId) {
      res.status(400).json({ message: '供應商ID為必填項目' });
      return;
    }
    
    const shippingOrders = await ShippingOrder.find({ customer: supplierId.toString() })
      .sort({ createdAt: -1 })
      .populate('customer', 'name')
      .populate('items.product', 'productName productCode healthInsuranceCode');
    
    // 將產品的healthInsuranceCode添加到items中
    if (shippingOrders && shippingOrders.length > 0) {
      shippingOrders.forEach(order => {
        if (order.items && order.items.length > 0) {
          order.items.forEach((item: any) => {
            item.healthInsuranceCode = item.product?.healthInsuranceCode;
          });
        }
      });
    }
    
    res.json(shippingOrders);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
});

// @route   GET api/shipping-orders/search
// @desc    搜索出貨單
// @access  Public
router.get('/search/query', async (req: Request, res: Response): Promise<void> => {
  try {
    const { soid, sosupplier, startDate, endDate } = req.query;
    
    const query: Record<string, any> = {};
    if (soid) query.orderNumber = { $regex: soid.toString(), $options: 'i' };
    if (sosupplier) query.customerName = { $regex: sosupplier.toString(), $options: 'i' };
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }
    
    const shippingOrders = await ShippingOrder.find(query)
      .sort({ createdAt: -1 })
      .populate('customer', 'name')
      .populate('items.product', 'productName productCode healthInsuranceCode');
    
    // 將產品的healthInsuranceCode添加到items中
    if (shippingOrders && shippingOrders.length > 0) {
      shippingOrders.forEach(order => {
        if (order.items && order.items.length > 0) {
          order.items.forEach((item: any) => {
            item.healthInsuranceCode = item.product?.healthInsuranceCode;
          });
        }
      });
    }
    
    res.json(shippingOrders);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
});

// @route   GET api/shipping-orders/product/:productId
// @desc    獲取特定產品的出貨單
// @access  Public
router.get('/product/:productId', async (req: Request, res: Response): Promise<void> => {
  try {
    // 安全處理：驗證和清理productId
    if (!req.params.productId || typeof req.params.productId !== 'string') {
      res.status(400).json({ msg: '無效的產品ID' });
      return;
    }
    
    const sanitizedProductId = req.params.productId.trim();
    
    // 使用安全的方式構建查詢條件
    const query = {
      'status': 'delivered'
    };
    
    // 使用安全的方式查詢所有出貨單
    const allOrders = await ShippingOrder.find(query)
      .populate('customer', 'name')
      .populate('items.product', 'productName productCode healthInsuranceCode');
    
    // 在應用層面過濾產品，而不是直接在數據庫查詢中使用用戶輸入
    const shippingOrders = allOrders.filter(order => {
      if (!order.items || !Array.isArray(order.items)) return false;
      
      return order.items.some((item: any) =>
        item.product?._id?.toString() === sanitizedProductId
      );
    });
    
    // 將產品的healthInsuranceCode添加到items中
    if (shippingOrders && shippingOrders.length > 0) {
      shippingOrders.forEach(order => {
        if (order.items && order.items.length > 0) {
          order.items.forEach((item: any) => {
            item.healthInsuranceCode = item.product?.healthInsuranceCode;
          });
        }
      });
    }
    
    res.json(shippingOrders);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
});

// @route   GET api/shipping-orders/recent
// @desc    獲取最近的出貨單
// @access  Public
router.get('/recent/list', async (req: Request, res: Response): Promise<void> => {
  try {
    const shippingOrders = await ShippingOrder.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('customer', 'name')
      .populate('items.product', 'productName productCode healthInsuranceCode');
    
    // 將產品的healthInsuranceCode添加到items中
    if (shippingOrders && shippingOrders.length > 0) {
      shippingOrders.forEach(order => {
        if (order.items && order.items.length > 0) {
          order.items.forEach((item: any) => {
            item.healthInsuranceCode = item.product?.healthInsuranceCode;
          });
        }
      });
    }
    
    res.json(shippingOrders);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
});

// 為出貨單創建新的ship類型庫存記錄的輔助函數
async function createShippingInventoryRecords(shippingOrder: any): Promise<void> {
  try {
    for (const item of shippingOrder.items) {
      if (!item.product) continue;
      
      // 為每個出貨單項目創建新的庫存記錄
      const inventory = new Inventory({
        product: item.product,
        quantity: -item.quantity, // 負數表示庫存減少
        totalAmount: Number(item.subtotal),
        shippingOrderId: shippingOrder._id, // 使用出貨單ID
        shippingOrderNumber: shippingOrder.orderNumber, // 使用出貨單號
        type: 'ship' // 設置類型為'ship'
      });
      
      await inventory.save();
      console.log(`已為產品 ${item.product} 創建新庫存記錄，出貨單號: ${shippingOrder.orderNumber}, 數量: -${item.quantity}, 總金額: ${item.subtotal}, 類型: ship`);
    }
    
    console.log(`已成功為出貨單 ${shippingOrder._id} 創建所有ship類型庫存記錄`);
  } catch (err: any) {
    console.error(`創建ship類型庫存記錄時出錯: ${err.message}`);
    throw err; // 重新拋出錯誤，讓調用者知道出了問題
  }
}

// 刪除與出貨單相關的ship類型庫存記錄
async function deleteShippingInventoryRecords(shippingOrderId: Types.ObjectId): Promise<any> {
  try {
    const result = await Inventory.deleteMany({ shippingOrderId: shippingOrderId, type: 'ship' });
    console.log(`已刪除 ${result.deletedCount} 筆與出貨單 ${shippingOrderId} 相關的ship類型庫存記錄`);
    return result;
  } catch (err: any) {
    console.error(`刪除ship類型庫存記錄時出錯: ${err.message}`);
    throw err;
  }
}

// @route   POST api/shipping-orders/import/basic
// @desc    導入出貨單基本資訊CSV
// @access  Public
router.post('/import/basic', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ msg: '請上傳CSV文件' });
      return;
    }

    const results: CSVRow[] = [];
    const errors: string[] = [];
    let successCount = 0;

    // 讀取並解析CSV文件
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data: CSVRow) => results.push(data))
      .on('end', async () => {
        // 刪除上傳的文件
        fs.unlinkSync(req.file!.path);

        // 處理每一行數據
        for (const row of results) {
          try {
            // 檢查必要字段
            if (!row['出貨單號'] || !row['供應商'] || !row['狀態']) {
              errors.push(`第 ${results.indexOf(row) + 1} 行：缺少必要字段`);
              continue;
            }

            // 檢查出貨單號是否已存在
            const existingOrder = await ShippingOrder.findOne({ orderNumber: row['出貨單號'] });
            if (existingOrder) {
              errors.push(`第 ${results.indexOf(row) + 1} 行：出貨單號 ${row['出貨單號']} 已存在`);
              continue;
            }

            // 查找供應商
            const supplier = await Supplier.findOne({ name: row['供應商'] });
            if (!supplier) {
              errors.push(`第 ${results.indexOf(row) + 1} 行：找不到供應商 ${row['供應商']}`);
              continue;
            }

            // 創建出貨單
            const shippingOrder = new ShippingOrder({
              orderNumber: row['出貨單號'],
              customerName: row['供應商'],
              customer: supplier._id,
              items: [], // 基本導入不包含項目
              status: row['狀態'] as any || 'pending',
              notes: row['備註'] || '',
              createdBy: new Types.ObjectId() // 這裡應該從認證中間件獲取用戶ID
            });

            await shippingOrder.save();
            successCount++;

          } catch (error: any) {
            errors.push(`第 ${results.indexOf(row) + 1} 行：${error.message}`);
          }
        }

        // 返回結果
        res.json({
          message: `導入完成，成功 ${successCount} 筆，失敗 ${errors.length} 筆`,
          successCount,
          errorCount: errors.length,
          errors: errors.slice(0, 10) // 只返回前10個錯誤
        });
      })
      .on('error', (error: Error) => {
        // 刪除上傳的文件
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        console.error('CSV解析錯誤:', error);
        res.status(500).json({ msg: 'CSV文件解析失敗' });
      });

  } catch (err: any) {
    // 刪除上傳的文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('導入出貨單錯誤:', err.message);
    res.status(500).send('伺服器錯誤');
  }
});

export default router;
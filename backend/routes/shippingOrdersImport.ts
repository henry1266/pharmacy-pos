import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import mongoose, { Types } from 'mongoose';
import ShippingOrder, { IShippingOrderDocument } from '../models/ShippingOrder';
import BaseProduct, { Medicine } from '../models/BaseProduct';
import Supplier from '../models/Supplier';
import Inventory from '../models/Inventory';
import multer from 'multer';
import csv from 'csv-parser';
import * as fs from 'fs';
import * as path from 'path';
import OrderNumberService from '../utils/OrderNumberService';

const router = express.Router();

// 定義 CSV 處理相關介面
interface CsvItem {
  rawDate: string;
  date: string | null;
  nhCode: string;
  quantity: number;
  nhPrice: number;
}

interface CsvProcessResult {
  results: CsvItem[];
  errors: string[];
  failCount: number;
  totalItems: number;
  firstValidDate: string | null;
}

interface ShippingOrderItem {
  product: string;
  did?: string;
  dname?: string;
  dquantity: number;
  dtotalCost: number;
  unitPrice: number;
}

interface PrepareOrderItemsResult {
  items: ShippingOrderItem[];
  successCount: number;
  failCount: number;
}

interface SupplierInfo {
  supplierId: string | null;
  supplierName: string;
}

// 設置文件上傳
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads");
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

// 設置上傳限制為 8MB，符合安全編碼實踐建議
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 8000000 // 8MB 限制
  }
});

/**
 * 為出貨單創建庫存記錄
 * @param shippingOrder - 出貨單對象
 */
async function createShippingInventoryRecords(shippingOrder: IShippingOrderDocument): Promise<void> {
  try {
    // 檢查是否已經存在該出貨單的庫存記錄
    const existingRecords = await Inventory.find({ 
      shippingOrderId: shippingOrder._id.toString() 
    });
    
    if (existingRecords.length > 0) {
      console.log(`出貨單 ${shippingOrder.orderNumber} 的庫存記錄已存在，跳過創建`);
      return;
    }
    
    // 為每個藥品項目創建庫存記錄
    for (const item of shippingOrder.items) {
      if (!item.product || !item.quantity) continue;
      
      // 創建出貨庫存記錄（負數表示出貨）
      const inventory = new Inventory({
        product: item.product.toString(), // 確保轉換為字串
        quantity: -item.quantity, // 負數表示出貨減少庫存
        totalAmount: item.subtotal || 0,
        type: "ship", // 設置類型為ship
        shippingOrderId: shippingOrder._id.toString(), // 確保轉換為字串
        shippingOrderNumber: shippingOrder.orderNumber.toString(), // 確保轉換為字串
        accountingId: null, // 預設為null
        lastUpdated: new Date() // 設置最後更新時間
      });
      
      await inventory.save();
      console.log(`為產品 ${item.productName} 創建了庫存記錄，數量: ${-item.quantity}`);
    }
    
    console.log(`成功為出貨單 ${shippingOrder.orderNumber} 創建庫存記錄`);
  } catch (error) {
    console.error(`創建出貨單庫存記錄時出錯:`, error);
    throw error;
  }
}

/**
 * 將民國年日期轉換為西元年日期
 * @param dateStr - 日期字符串，可能是民國年格式(YYYMMDD)或西元年格式(YYYY-MM-DD)
 * @returns 轉換後的西元年日期，格式為YYYY-MM-DD
 */
function convertToWesternDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  
  // 如果已經是西元年格式 YYYY-MM-DD，直接返回
  const westernDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const westernDateMatch = westernDateRegex.exec(dateStr);
  if (westernDateMatch) {
    return dateStr;
  }
  
  // 檢查是否是民國年格式 YYYMMDD (例如1140407)
  const rocDateRegex = /^\d{7}$/;
  const rocDateMatch = rocDateRegex.exec(dateStr);
  if (rocDateMatch) {
    try {
      // 提取民國年、月、日
      const rocYear = parseInt(dateStr.substring(0, 3), 10);
      const month = parseInt(dateStr.substring(3, 5), 10);
      const day = parseInt(dateStr.substring(5, 7), 10);
      
      // 檢查月份和日期是否有效
      if (month < 1 || month > 12 || day < 1 || day > 31) {
        console.warn(`無效的民國年日期格式: ${dateStr}`);
        return null;
      }
      
      // 民國年轉西元年 (民國年+1911=西元年)
      const westernYear = rocYear + 1911;
      
      // 格式化為 YYYY-MM-DD
      return `${westernYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    } catch (error) {
      console.error(`轉換民國年日期時出錯: ${dateStr}`, error);
      return null;
    }
  }
  
  // 其他格式嘗試解析
  try {
    const dateObj = new Date(dateStr);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().split("T")[0]; // 返回YYYY-MM-DD格式
    }
  } catch (error) {
    console.error(`解析日期時出錯: ${dateStr}`, error);
  }
  
  return null;
}

/**
 * 解析日期並返回日期物件
 * @param dateStr - 日期字符串
 * @returns 解析後的日期物件或null
 */
function parseDateString(dateStr: string): Date | null {
  // 先將日期轉換為西元年格式
  const westernDateStr = convertToWesternDate(dateStr);
  
  // 解析日期
  if (westernDateStr && /^\d{4}-\d{2}-\d{2}$/.test(westernDateStr)) {
    const dateObj = new Date(westernDateStr);
    if (!isNaN(dateObj.getTime())) {
      return dateObj;
    }
  }
  
  return null;
}

/**
 * 格式化日期為YYYYMMDD格式
 * @param dateObj - 日期物件
 * @returns 格式化後的日期字串
 */
function formatDateToYYYYMMDD(dateObj: Date): string {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * 查找指定前綴的最大訂單序號
 * @param prefix - 訂單號前綴
 * @param suffix - 訂單號後綴
 * @returns 最大序號
 */
async function findMaxOrderSequence(prefix: string, suffix: string): Promise<number> {
  const regex = new RegExp(`^${prefix}\\d{3}${suffix}$`);
  const existingOrders = await ShippingOrder.find({ 
    orderNumber: regex 
  }).sort({ orderNumber: -1 });
  
  let sequence = 1; // 默認從001開始
  
  if (existingOrders.length > 0) {
    const lastOrderNumber = existingOrders[0].orderNumber;
    // 提取序號部分 (去掉日期前綴和D後綴)
    const lastSequence = parseInt(lastOrderNumber.substring(prefix.length, lastOrderNumber.length - suffix.length), 10);
    sequence = lastSequence + 1;
  }
  
  return sequence;
}

/**
 * 根據日期生成訂單號
 * @param dateStr - 日期字符串，格式為YYYY-MM-DD或民國年格式YYYMMDD
 * @returns 生成的訂單號
 */
async function generateOrderNumberByDate(dateStr: string): Promise<string> {
  try {
    // 解析日期
    const dateObj = parseDateString(dateStr);
    if (!dateObj) {
      throw new Error(`無效的日期格式: ${dateStr}`);
    }
    
    // 格式化日期為YYYYMMDD
    const dateFormat = formatDateToYYYYMMDD(dateObj);
    
    // 訂單號格式: YYYYMMDD+序號+D
    const prefix = dateFormat;
    const suffix = "D";
    
    // 查找當天最大序號
    const sequence = await findMaxOrderSequence(prefix, suffix);
    
    // 生成新訂單號，序號部分固定3位數
    return `${prefix}${String(sequence).padStart(3, "0")}${suffix}`;
  } catch (error) {
    console.error("根據日期生成訂單號時出錯:", error);
    throw error;
  }
}

/**
 * 檢查訂單號是否存在，如存在則生成新的
 * @param soid - 訂單號
 * @param dateStr - 日期字符串
 * @returns 唯一的訂單號
 */
async function ensureUniqueOrderNumber(soid: string, dateStr: string): Promise<string> {
  // 檢查出貨單號是否已存在
  const existingSO = await ShippingOrder.findOne({ 
    orderNumber: soid.toString() 
  });
  
  if (!existingSO) {
    return soid;
  }
  
  // 如果已存在，嘗試生成新的訂單號
  const newSoid = await generateOrderNumberByDate(dateStr);
  
  // 再次檢查
  const existingSO2 = await ShippingOrder.findOne({ 
    orderNumber: newSoid.toString() 
  });
  
  if (existingSO2) {
    throw new Error(`訂單號 ${newSoid} 已存在，無法生成唯一的出貨單號，請檢查數據或稍後再試`);
  }
  
  return newSoid;
}

/**
 * 處理CSV行數據
 * @param data - CSV行數據
 * @param lineIndex - 行索引
 * @param result - 處理結果
 * @returns 處理結果
 */
function processCsvLine(data: Record<string, string>, lineIndex: number, result: CsvProcessResult): CsvProcessResult {
  const { results, errors, failCount, totalItems, firstValidDate } = result;
  const keys = Object.keys(data);
  
  // 如果CSV沒有標題行，則使用索引位置
  if (keys.length < 4) {
    errors.push(`行 ${lineIndex + 1}: CSV格式不正確，應為"日期,健保碼,數量,健保價"`);
    return { ...result, failCount: failCount + 1 };
  }
  
  const rawDate = data[keys[0]] || "";
  const nhCode = data[keys[1]] || "";
  const quantity = parseInt(data[keys[2]], 10) || 0;
  const nhPrice = parseFloat(data[keys[3]]) || 0;

  // 轉換日期格式（支持民國年和西元年）
  const date = convertToWesternDate(rawDate);
  
  // 記錄第一個有效的日期
  let updatedFirstValidDate = firstValidDate;
  if (updatedFirstValidDate === null && date) {
    updatedFirstValidDate = date;
    console.log(`首個有效日期已轉換: ${rawDate} -> ${date}`);
  }

  if (nhCode && quantity > 0 && nhPrice > 0) {
    results.push({
      rawDate,
      date,
      nhCode: nhCode.toString(),
      quantity,
      nhPrice
    });
    return { 
      results, 
      errors, 
      failCount, 
      totalItems: totalItems + 1,
      firstValidDate: updatedFirstValidDate
    };
  } else {
    errors.push(`行 ${lineIndex + 1}: 資料不完整或格式錯誤 (健保碼: ${nhCode}, 數量: ${quantity}, 健保價: ${nhPrice})`);
    return { 
      results, 
      errors, 
      failCount: failCount + 1, 
      totalItems: totalItems + 1,
      firstValidDate: updatedFirstValidDate
    };
  }
}

/**
 * 準備出貨單項目
 * @param results - CSV處理結果
 * @param productMap - 健保碼到藥品的映射
 * @param errors - 錯誤信息數組
 * @returns 處理結果
 */
function prepareOrderItems(
  results: CsvItem[], 
  productMap: Record<string, any>, 
  errors: string[]
): PrepareOrderItemsResult {
  const items: ShippingOrderItem[] = [];
  let successCount = 0;
  let failCount = 0;
  
  for (const item of results) {
    const product = productMap[item.nhCode.toString()];
    
    if (!product) {
      errors.push(`找不到健保碼為 ${item.nhCode} 的藥品`);
      failCount++;
      continue;
    }

    // 計算總成本
    const totalCost = item.quantity * item.nhPrice;
    
    items.push({
      product: product._id.toString(),
      did: product.code?.toString() || "",
      dname: product.name?.toString() || "",
      dquantity: item.quantity,
      dtotalCost: totalCost,
      unitPrice: item.nhPrice
    });
    
    successCount++;
  }
  
  return { items, successCount, failCount };
}

/**
 * 查找或設置供應商
 * @param defaultSupplier - 預設供應商
 * @returns 供應商信息
 */
async function findOrSetSupplier(defaultSupplier: any): Promise<SupplierInfo> {
  let supplierId: string | null = null;
  let supplierName = "預設供應商";
  
  if (defaultSupplier) {
    supplierId = defaultSupplier._id?.toString() || null;
    supplierName = defaultSupplier.name?.toString() || supplierName;
  } else {
    // 嘗試查找名為"調劑"的供應商
    const supplier = await Supplier.findOne({ 
      name: "調劑" 
    });
    
    if (supplier) {
      supplierId = supplier._id.toString();
      supplierName = supplier.name;
    }
  }
  
  return { supplierId, supplierName };
}

// @route   GET api/shipping-orders/generate-number
// @desc    生成新的出貨單號
// @access  Public
router.get("/generate-number", async (req: Request, res: Response) => {
  try {
    // **注意：此API現在需要日期參數，否則會報錯**
    // 如果需要一個不依賴CSV日期的生成方式，需要另行處理
    // 暫時使用當前日期，但這可能與CSV匯入邏輯不一致
    const todayStr = new Date().toISOString().split("T")[0];
    const orderNumber = await generateOrderNumberByDate(todayStr);
    res.json({ orderNumber });
  } catch (err) {
    console.error("生成出貨單號時出錯:", (err as Error).message);
    res.status(500).json({ msg: "伺服器錯誤", error: (err as Error).message });
  }
});

// @route   POST api/shipping-orders/import/medicine
// @desc    導入藥品明細CSV (日期,健保碼,數量,健保價)
// @access  Public
router.post("/import/medicine", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "請上傳CSV文件" });
    }

    // 獲取請求中的出貨單號和預設供應商
    const { orderNumber } = req.body;
    let defaultSupplier = null;
    
    try {
      if (req.body.defaultSupplier) {
        defaultSupplier = JSON.parse(req.body.defaultSupplier);
      }
    } catch (error) {
      console.error("解析預設供應商數據時出錯:", error);
    }

    // 初始化處理結果
    const result: CsvProcessResult = {
      results: [],
      errors: [],
      failCount: 0,
      totalItems: 0,
      firstValidDate: null
    };

    // 讀取並解析CSV文件
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(req.file!.path)
        .pipe(csv())
        .on("data", (data: Record<string, string>) => {
          const updatedResult = processCsvLine(data, result.totalItems, result);
          Object.assign(result, updatedResult);
        })
        .on("end", resolve)
        .on("error", reject);
    });

    // 刪除上傳的文件
    fs.unlinkSync(req.file.path);

    if (result.results.length === 0) {
      return res.status(400).json({ 
        msg: "CSV文件中沒有有效的藥品明細數據",
        errors: result.errors
      });
    }
    
    // 如果CSV中沒有找到任何有效日期，則返回錯誤
    if (!result.firstValidDate) {
      return res.status(400).json({ 
        msg: "CSV文件中缺少有效的日期欄位",
        errors: result.errors
      });
    }

    // 根據CSV首行日期生成訂單號
    let soid = orderNumber;
    if (!soid) {
      try {
        soid = await generateOrderNumberByDate(result.firstValidDate);
      } catch (genError) {
        return res.status(500).json({ msg: "生成訂單號時出錯", error: (genError as Error).message });
      }
    }

    // 確保訂單號唯一
    try {
      soid = await ensureUniqueOrderNumber(soid, result.firstValidDate);
    } catch (uniqueError) {
      return res.status(400).json({ msg: (uniqueError as Error).message });
    }

    // 查找所有健保碼對應的藥品
    const nhCodes = result.results.map(item => item.nhCode.toString());
    
    const products = await BaseProduct.find({ 
      healthInsuranceCode: { $in: nhCodes } 
    });
    
    // 建立健保碼到藥品的映射
    const productMap: Record<string, any> = {};
    products.forEach(product => {
      const productAny = product as any;
      if (productAny.healthInsuranceCode) {
        productMap[productAny.healthInsuranceCode.toString()] = product;
      }
    });

    // 準備出貨單項目
    const { items, successCount, failCount } = prepareOrderItems(
      result.results, 
      productMap, 
      result.errors
    );

    if (items.length === 0) {
      return res.status(400).json({ 
        msg: "無法匹配任何有效的藥品",
        errors: result.errors
      });
    }

    // 確定供應商
    const { supplierId, supplierName } = await findOrSetSupplier(defaultSupplier);

    // 創建新出貨單
    const shippingOrder = new ShippingOrder({
      orderNumber: soid.toString(),
      soid: soid.toString(), // 保留舊欄位以兼容
      sosupplier: supplierName.toString(), // 保留舊欄位以兼容
      supplier: supplierId,
      items: items.map(item => ({
        product: item.product,
        productName: item.dname || '',
        quantity: item.dquantity,
        unitPrice: item.unitPrice,
        subtotal: item.dtotalCost
      })),
      status: "shipped", // 根據新需求設置為shipped (原為completed)
      paymentStatus: "已收款", // 保留舊欄位以兼容
      notes: `從CSV匯入 (${new Date().toLocaleDateString()})`,
      createdBy: new Types.ObjectId() // 臨時使用空ID，實際應使用當前用戶ID
    });

    // 保存出貨單
    const savedOrder = await shippingOrder.save();
    console.log(`出貨單 ${savedOrder.orderNumber} 已保存，狀態: ${savedOrder.status}`);
    
    // 創建庫存記錄
    await createShippingInventoryRecords(savedOrder);
    console.log(`已為出貨單 ${savedOrder.orderNumber} 創建庫存記錄`);

    res.json({
      msg: "藥品明細CSV匯入成功",
      shippingOrder: {
        _id: savedOrder._id.toString(),
        orderNumber: savedOrder.orderNumber,
        soid: savedOrder.orderNumber, // 保留舊欄位以兼容
        supplier: supplierName,
        itemCount: items.length,
        totalAmount: savedOrder.totalAmount,
        paymentStatus: "已收款", // 保留舊欄位以兼容
        status: savedOrder.status
      },
      summary: {
        totalItems: result.totalItems,
        successCount,
        failCount,
        errors: result.errors.length > 0 ? result.errors : null
      }
    });
  } catch (err) {
    console.error("匯入藥品明細CSV時出錯:", (err as Error).message);
    res.status(500).json({ 
      msg: "伺服器錯誤", 
      error: (err as Error).message,
      stack: process.env.NODE_ENV === "production" ? null : (err as Error).stack
    });
  }
});

export default router;
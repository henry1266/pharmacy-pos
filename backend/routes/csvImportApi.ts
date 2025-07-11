/**
 * CSV匯入REST API
 * 提供標準化的CSV檔案匯入功能
 * 
 * @module csvImportApi
 * @author AI Assistant
 * @version 1.0.0
 */

import express, { Request, Response } from "express";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";
import path from "path";
import BaseProduct from "../models/BaseProduct";
import ShippingOrder from "../models/ShippingOrder";
import Supplier from "../models/Supplier";
import Inventory from "../models/Inventory";
// 移除未使用的類型導入
import "../src/types/models";

const router: express.Router = express.Router();

interface CSVItem {
  rawDate: string;
  date: string | null;
  nhCode: string;
  quantity: number;
  nhPrice: number;
}

interface ShippingItem {
  product: string;
  did: string;
  dname: string;
  dquantity: number;
  dtotalCost: number;
  unitPrice: number;
}

interface ProcessResult {
  items: ShippingItem[];
  errors: string[];
  successCount: number;
  failCount: number;
}

interface SupplierInfo {
  supplierId: string | null;
  supplierName: string;
}

interface ImportSummary {
  totalItems: number;
  successCount: number;
  failCount: number;
  errors: string[] | null;
}

interface FileUploadRequest extends Request {
  file?: Express.Multer.File;
  body: {
    defaultSupplierId?: string;
  };
}

// 設置文件上傳
const storage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    const uploadDir = path.join(__dirname, "../uploads");
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
async function createShippingInventoryRecords(shippingOrder: any): Promise<void> {
  try {
    // 檢查是否已經存在該出貨單的庫存記錄
    const existingRecords = await Inventory.find({ 
      shippingOrderId: shippingOrder._id 
    });
    
    if (existingRecords.length > 0) {
      console.log(`出貨單 ${shippingOrder.soid} 的庫存記錄已存在，跳過創建`);
      return;
    }
    
    // 為每個藥品項目創建庫存記錄
    for (const item of shippingOrder.items) {
      if (!item.product || !item.dquantity) continue;
      
      // 創建出貨庫存記錄（負數表示出貨）
      const inventory = new Inventory({
        product: item.product,
        quantity: -item.dquantity, // 負數表示出貨減少庫存
        totalAmount: item.dtotalCost ?? 0,
        type: "ship", // 設置類型為ship
        shippingOrderId: shippingOrder._id, // 關聯到出貨單ID
        shippingOrderNumber: shippingOrder.soid, // 設置出貨單號
        accountingId: null, // 預設為null
        lastUpdated: new Date() // 設置最後更新時間
      });
      
      await inventory.save();
      console.log(`為產品 ${item.dname} 創建了庫存記錄，數量: ${-item.dquantity}`);
    }
    
    console.log(`成功為出貨單 ${shippingOrder.soid} 創建庫存記錄`);
  } catch (error) {
    console.error(`創建出貨單庫存記錄時出錯:`, error);
    throw error;
  }
}

/**
 * 將民國年日期轉換為西元年日期
 * @param dateStr - 日期字符串，可能是民國年格式(YYYMMDD)或西元年格式(YYYY-MM-DD)
 * @returns 轉換後的西元年日期，格式為YYYY-MM-DD，如果轉換失敗則返回null
 */
function convertToWesternDate(dateStr: string): string | null {
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
 * 根據日期生成訂單號
 * @param dateStr - 日期字符串，格式為YYYY-MM-DD或民國年格式YYYMMDD
 * @returns 生成的訂單號
 */
async function generateOrderNumberByDate(dateStr: string): Promise<string> {
  try {
    // 先將日期轉換為西元年格式
    const westernDateStr = convertToWesternDate(dateStr);
    
    // 解析日期
    let dateObj: Date;
    const validDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (westernDateStr && validDateRegex.exec(westernDateStr)) {
      dateObj = new Date(westernDateStr);
      if (isNaN(dateObj.getTime())) {
        throw new Error(`無效的日期格式: ${dateStr}`);
      }
    } else {
      throw new Error(`無法從CSV獲取有效日期: ${dateStr}`);
    }
    
    // 格式化日期為YYYYMMDD
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const dateFormat = `${year}${month}${day}`;
    
    // 訂單號格式: YYYYMMDD+序號+D
    const prefix = `${dateFormat}`;
    const suffix = "D";
    
    // 查找當天最大序號
    const regex = new RegExp(`^${prefix}\\d{3}${suffix}$`);
    const existingOrders = await ShippingOrder.find({ soid: regex }).sort({ soid: -1 });
    
    let sequence = 1; // 默認從001開始
    
    if (existingOrders.length > 0) {
      const lastOrderNumber = (existingOrders[0] as any).soid;
      // 提取序號部分 (去掉日期前綴和D後綴)
      const lastSequence = parseInt(lastOrderNumber.substring(prefix.length, lastOrderNumber.length - suffix.length), 10);
      sequence = lastSequence + 1;
    }
    
    // 生成新訂單號，序號部分固定3位數
    return `${prefix}${String(sequence).padStart(3, "0")}${suffix}`;
  } catch (error) {
    console.error("根據日期生成訂單號時出錯:", error);
    throw error;
  }
}

/**
 * 處理CSV數據並準備出貨單項目
 * @param results - CSV解析結果
 * @param productMap - 健保碼到藥品的映射
 * @returns 處理結果，包含items和errors
 */
function processShippingItems(results: CSVItem[], productMap: { [key: string]: any }): ProcessResult {
  const items: ShippingItem[] = [];
  const errors: string[] = [];
  let successCount = 0;
  let failCount = 0;
  
  for (const item of results) {
    const product = productMap[item.nhCode];
    
    if (!product) {
      errors.push(`找不到健保碼為 ${item.nhCode} 的藥品`);
      failCount++;
      continue;
    }

    // 計算總成本
    const totalCost = item.quantity * item.nhPrice;
    
    items.push({
      product: product._id.toString(),
      did: product.code ?? "",
      dname: product.name ?? "",
      dquantity: item.quantity,
      dtotalCost: totalCost,
      unitPrice: item.nhPrice
    });
    
    successCount++;
  }
  
  return { items, errors, successCount, failCount };
}

/**
 * 查找或確定供應商
 * @param defaultSupplierId - 預設供應商ID
 * @returns 供應商信息
 */
async function determineSupplier(defaultSupplierId?: string): Promise<SupplierInfo> {
  let supplierId: string | null = null;
  let supplierName = "預設供應商";
  
  if (defaultSupplierId) {
    // 嘗試查找指定的供應商
    const supplier = await Supplier.findById(defaultSupplierId);
    if (supplier) {
      supplierId = supplier._id.toString();
      supplierName = supplier.name;
    }
  } else {
    // 嘗試查找名為"調劑"的供應商
    const supplier = await Supplier.findOne({ name: "調劑" });
    if (supplier) {
      supplierId = supplier._id.toString();
      supplierName = supplier.name;
    }
  }
  
  return { supplierId, supplierName };
}

/**
 * @api {post} /api/csv-import/shipping-orders 匯入出貨單CSV
 * @apiName ImportShippingOrderCSV
 * @apiGroup CSV匯入
 * @apiVersion 1.0.0
 * 
 * @apiDescription 匯入藥品出貨單CSV檔案，自動生成訂單號並建立出貨單與庫存記錄
 * 
 * @apiParam {File} file 要上傳的CSV檔案，格式為：日期,健保碼,數量,健保價
 * @apiParam {String} [defaultSupplierId] 預設供應商ID
 * 
 * @apiSuccess {String} msg 成功訊息
 * @apiSuccess {Object} shippingOrder 創建的出貨單資訊
 * @apiSuccess {Object} summary 匯入摘要
 * 
 * @apiError {String} msg 錯誤訊息
 * @apiError {String} error 詳細錯誤資訊
 */
router.post("/shipping-orders", upload.single("file"), async (req: FileUploadRequest, res: Response) => {
  try {
    // 驗證請求
    if (!req.file) {
      res.status(400).json({
        success: false,
        msg: "請上傳CSV文件",
        error: "未找到上傳的文件"
      });
      return;
    }

    // 獲取請求中的預設供應商ID
    const { defaultSupplierId } = req.body;
    
    // 處理結果與錯誤收集
    const results: CSVItem[] = [];
    const errors: string[] = [];
    let successCount = 0;
    let failCount = 0;
    let totalItems = 0;
    let firstValidDate: string | null = null;

    // 讀取並解析CSV文件
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(req.file!.path)
        .pipe(csv())
        .on("data", (data: any) => {
          // 檢查CSV格式是否符合要求
          const keys = Object.keys(data);
          // 如果CSV沒有標題行，則使用索引位置
          if (keys.length >= 4) {
            const rawDate = data[keys[0]] ?? "";
            const nhCode = data[keys[1]] ?? "";
            const quantity = parseInt(data[keys[2]], 10) ?? 0;
            const nhPrice = parseFloat(data[keys[3]]) ?? 0;

            // 轉換日期格式（支持民國年和西元年）
            const date = convertToWesternDate(rawDate);
            
            // 記錄第一個有效的日期
            if (firstValidDate === null && date) {
              firstValidDate = date;
              console.log(`首個有效日期已轉換: ${rawDate} -> ${date}`);
            }

            if (nhCode && quantity > 0 && nhPrice > 0) {
              results.push({
                rawDate,
                date,
                nhCode,
                quantity,
                nhPrice
              });
              totalItems++;
            } else {
              errors.push(`行 ${totalItems + 1}: 資料不完整或格式錯誤 (健保碼: ${nhCode}, 數量: ${quantity}, 健保價: ${nhPrice})`);
              failCount++;
            }
          } else {
            errors.push(`行 ${totalItems + 1}: CSV格式不正確，應為"日期,健保碼,數量,健保價"`);
            failCount++;
          }
        })
        .on("end", resolve)
        .on("error", reject);
    });

    // 刪除上傳的文件
    fs.unlinkSync(req.file.path);

    // 驗證解析結果
    if (results.length === 0) {
      res.status(400).json({ 
        success: false,
        msg: "CSV文件中沒有有效的藥品明細數據",
        errors
      });
      return;
    }
    
    // 如果CSV中沒有找到任何有效日期，則返回錯誤
    if (!firstValidDate) {
      res.status(400).json({ 
        success: false,
        msg: "CSV文件中缺少有效的日期欄位",
        errors
      });
      return;
    }

    // 根據CSV首行日期生成訂單號
    let soid: string;
    try {
      soid = await generateOrderNumberByDate(firstValidDate);
    } catch (genError) {
      const error = genError as Error;
      res.status(500).json({ 
        success: false,
        msg: "生成訂單號時出錯", 
        error: error.message 
      });
      return;
    }

    // 檢查出貨單號是否已存在
    const existingSO = await ShippingOrder.findOne({ soid });
    if (existingSO) {
      // 如果已存在，嘗試生成新的訂單號
      try {
        soid = await generateOrderNumberByDate(firstValidDate);
      } catch (genError) {
        const error = genError as Error;
        res.status(500).json({ 
          success: false,
          msg: "生成訂單號時出錯", 
          error: error.message 
        });
      return;
      }
      
      // 再次檢查
      const existingSO2 = await ShippingOrder.findOne({ soid });
      if (existingSO2) {
        res.status(400).json({ 
          success: false,
          msg: `訂單號 ${soid} 已存在，無法生成唯一的出貨單號，請檢查數據或稍後再試` 
        });
      return;
      }
    }

    // 查找所有健保碼對應的藥品
    const nhCodes = results.map(item => item.nhCode);
    const products = await BaseProduct.find({ healthInsuranceCode: { $in: nhCodes } });
    
    // 建立健保碼到藥品的映射
    const productMap: { [key: string]: any } = {};
    products.forEach(product => {
      // 需要類型斷言因為 BaseProduct 模型的 TypeScript 定義中缺少 healthInsuranceCode 屬性
      const productWithHealthCode = product as unknown as { healthInsuranceCode?: string };
      if (productWithHealthCode.healthInsuranceCode) {
        productMap[productWithHealthCode.healthInsuranceCode] = product;
      }
    });

    // 處理出貨單項目
    const processResult = processShippingItems(results, productMap);
    const items = processResult.items;
    errors.push(...processResult.errors);
    successCount += processResult.successCount;
    failCount += processResult.failCount;

    if (items.length === 0) {
      res.status(400).json({ 
        success: false,
        msg: "無法匹配任何有效的藥品",
        errors
      });
      return;
    }

    // 確定供應商
    const supplierInfo = await determineSupplier(defaultSupplierId);
    const { supplierId, supplierName } = supplierInfo;

    // 創建新出貨單
    const shippingOrder = new ShippingOrder({
      soid,
      orderNumber: soid, // 使用相同的編號作為orderNumber
      sosupplier: supplierName,
      supplier: supplierId,
      items,
      status: "completed", // 設置為completed
      paymentStatus: "已收款", // 設置為已收款
      notes: `從CSV匯入API匯入 (${new Date().toLocaleDateString()})`
    });

    // 保存出貨單
    const savedOrder = await shippingOrder.save();
    console.log(`出貨單 ${savedOrder.soid} 已保存，狀態: ${savedOrder.status}`);
    
    // 創建庫存記錄
    await createShippingInventoryRecords(savedOrder);
    console.log(`已為出貨單 ${savedOrder.soid} 創建庫存記錄`);

    // 返回標準化的成功回應
    res.status(201).json({
      success: true,
      msg: "藥品明細CSV匯入成功",
      shippingOrder: {
        _id: savedOrder._id,
        soid: savedOrder.soid,
        orderNumber: savedOrder.orderNumber,
        supplier: supplierName,
        itemCount: items.length,
        totalAmount: savedOrder.totalAmount,
        paymentStatus: savedOrder.paymentStatus,
        status: savedOrder.status,
        createdAt: savedOrder.createdAt
      },
      summary: {
        totalItems,
        successCount,
        failCount,
        errors: errors.length > 0 ? errors : null
      } as ImportSummary
    });
  } catch (err) {
    const error = err as Error;
    console.error("匯入藥品明細CSV時出錯:", error.message);
    
    // 返回標準化的錯誤回應
    res.status(500).json({ 
      success: false,
      msg: "伺服器錯誤", 
      error: error.message,
      stack: process.env.NODE_ENV === "production" ? null : error.stack
    });
  }
});

export default router;
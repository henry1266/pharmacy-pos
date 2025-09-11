import { Types } from 'mongoose';
import ShippingOrder from '../../../models/ShippingOrder';
import BaseProduct from '../../../models/BaseProduct';
import Supplier from '../../../models/Supplier';
import Inventory from '../../../models/Inventory';
import OrderNumberService from '../../../utils/OrderNumberService';
import logger from '../../../utils/logger';
import { ShippingOrderDocument, ShippingOrderItem, ShippingOrderRequest } from '../types';

/**
 * 處理產品的 healthInsuranceCode
 * @param orders - 出貨單數組
 */
export function processHealthInsuranceCode(orders: ShippingOrderDocument[]): void {
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
 * 檢查出貨單號是否已存在
 * @param {string} soid - 出貨單號
 * @returns {Promise<boolean>} - 是否存在
 */
export async function checkShippingOrderExists(soid: string): Promise<boolean> {
  if (!soid || soid.trim() === '') {
    return false;
  }
  
  // 安全處理：確保soid是字符串並去除任何可能的惡意字符
  const sanitizedSoid = String(soid).trim();
  
  // 使用嚴格相等查詢而非正則表達式
  const existingSO = await ShippingOrder.findOne({ soid: sanitizedSoid });
  return !!existingSO;
}

/**
 * 處理出貨單號的輔助函數
 * @param soid - 出貨單號
 * @returns 處理結果
 */
export async function handleShippingOrderId(soid?: string): Promise<{ soid?: string; error?: string }> {
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

/**
 * 驗證產品項目並檢查庫存的輔助函數
 * @param items - 出貨單項目
 * @param allowNegativeInventory - 是否允許負庫存
 * @returns 驗證結果
 */
export async function validateProductsAndInventory(
  items: ShippingOrderItem[], 
  allowNegativeInventory: boolean = true
): Promise<{ valid: boolean; error?: string; items?: ShippingOrderItem[] }> {
  for (const item of items) {
    // 檢查項目完整性 - 修正：允許 dtotalCost 為 0
    if (!item.did || !item.dname ||
        item.dquantity === null || item.dquantity === undefined || !item.dquantity ||
        item.dtotalCost === null || item.dtotalCost === undefined) {
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
    
    item.product = product._id as any;
    
    // 檢查產品是否設定為「不扣庫存」
    const productDoc = product as any;
    if (productDoc.excludeFromStock === true) {
      logger.debug(`產品 ${item.dname} (${item.did}) 設定為不扣庫存，跳過庫存檢查`);
    } else {
      // 檢查庫存
      const inventorySum = await Inventory.aggregate([
        { $match: { product: product._id } },
        { $group: { _id: null, total: { $sum: "$quantity" } } }
      ]);
      
      const availableQuantity = inventorySum.length > 0 ? inventorySum[0].total : 0;
      
      // 新增：允許負庫存的邏輯
      if (!allowNegativeInventory && availableQuantity < item.dquantity) {
        return {
          valid: false,
          error: `藥品 ${item.dname} (${item.did}) 庫存不足，目前庫存: ${availableQuantity}，需要: ${item.dquantity}`
        };
      } else if (allowNegativeInventory && availableQuantity < item.dquantity) {
        logger.info(`產品 ${item.dname} (${item.did}) 允許負庫存，目前庫存: ${availableQuantity}，需要: ${item.dquantity}，將產生負庫存: ${availableQuantity - item.dquantity}`);
      }
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
export async function findSupplier(
  supplier?: Types.ObjectId | string, 
  sosupplier?: string
): Promise<string | null> {
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
  return supplierDoc ? (supplierDoc._id as any).toString() : null;
}

/**
 * 驗證出貨單項目的輔助函數
 * @param items - 出貨單項目
 * @returns 驗證結果
 */
export async function validateOrderItems(
  items: ShippingOrderItem[]
): Promise<{ valid: boolean; message?: string; processedItems?: ShippingOrderItem[] }> {
  for (const item of items) {
    // 修正：允許 dtotalCost 為 0，但不允許為 null、undefined
    // 使用嚴格檢查，確保欄位存在且不為空值
    if (!item.did || !item.dname ||
        item.dquantity === null || item.dquantity === undefined || !item.dquantity ||
        item.dtotalCost === null || item.dtotalCost === undefined) {
      return {
        valid: false,
        message: '藥品項目資料不完整'
      };
    }

    // 嘗試查找藥品
    const product = await BaseProduct.findOne({ code: item.did.toString() });
    if (product) {
      item.product = product._id as any;
    }
    
    // 處理大包裝相關屬性 - 完全參照進貨單的 processItemsUpdate 函數
    // 使用條件運算符處理空字符串，將其轉換為 undefined
    // 使用 as any 避免 TypeScript 類型錯誤
    (item as any).packageQuantity = item.packageQuantity ? Number(item.packageQuantity) : undefined;
    (item as any).boxQuantity = item.boxQuantity ? Number(item.boxQuantity) : undefined;
    (item as any).unit = item.unit ? item.unit : undefined;
  }
  
  return { valid: true, processedItems: items };
}

/**
 * 處理出貨單號變更的輔助函數
 * @param newSoid - 新出貨單號
 * @param currentSoid - 當前出貨單號
 * @param orderId - 出貨單ID
 * @returns 處理結果
 */
export async function handleOrderNumberChange(
  newSoid?: string, 
  currentSoid?: string, 
  orderId?: string
): Promise<{ changed: boolean; error?: string; orderNumber?: string }> {
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
  const orderNumber = await OrderNumberService.generateUniqueOrderNumber('shipping', sanitizedSoid);
  return {
    changed: true,
    orderNumber
  };
}

/**
 * 準備更新數據的輔助函數
 * @param requestBody - 請求體
 * @param orderNumberResult - 訂單號處理結果
 * @returns 更新數據
 */
export function prepareUpdateData(
  requestBody: ShippingOrderRequest, 
  orderNumberResult?: { orderNumber?: string }
): Record<string, any> {
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
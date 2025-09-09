import mongoose from 'mongoose';
import Customer from '../../../models/Customer';
import BaseProduct from '../../../models/BaseProduct';
import Inventory from '../../../models/Inventory';
import logger from '../../../utils/logger';
import { 
  ValidationResult, 
  CustomerCheckResult, 
  ProductCheckResult, 
  InventoryCheckResult,
  SaleCreationRequest
} from '../sales.types';

/**
 * 驗證 MongoDB ObjectId 是否有效
 * 防止 NoSQL 注入攻擊
 */
export function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

// 檢查客戶是否存在
export async function checkCustomerExists(customerId?: string): Promise<CustomerCheckResult> {
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
export async function checkProductExists(productId: string): Promise<ProductCheckResult> {
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
export async function checkProductInventory(product: mongoose.Document, quantity: number): Promise<InventoryCheckResult> {
  try {
    // 確保 _id 是有效的 ObjectId
    if (!isValidObjectId((product._id as any).toString())) {
      return {
        success: false,
        error: {
          success: false,
          statusCode: 400,
          message: '產品ID格式無效'
        }
      };
    }
    
    // 安全地訪問產品屬性
    const productDoc = product as any;
    
    // 檢查產品是否設定為「不扣庫存」
    if (productDoc.excludeFromStock === true) {
      logger.debug(`產品 ${productDoc.name ?? '未知'} 設定為不扣庫存，跳過庫存檢查`);
      return { success: true };
    }
    
    // 獲取所有庫存記錄
    const inventories = await Inventory.find({ product: product._id }).lean();
    logger.debug(`找到 ${inventories.length} 個庫存記錄`);
    
    // 計算總庫存量
    let totalQuantity = calculateTotalInventory(inventories);
    
    logger.debug(`產品 ${productDoc.name ?? '未知'} 總庫存量: ${totalQuantity}，銷售數量: ${quantity}`);
    
    // 不再檢查庫存是否足夠，允許負庫存
    if (totalQuantity < quantity) {
      logger.warn(`產品 ${(product as any).name ?? '未知'} 庫存不足，當前總庫存: ${totalQuantity}，需求: ${quantity}，將允許負庫存`);
    }
    
    return { success: true };
  } catch (err: unknown) {
    logger.error(`庫存檢查錯誤: ${err instanceof Error ? err.message : '未知錯誤'}`);
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
    logger.debug(`庫存記錄: ${recordId}, 類型: ${inv.type ?? 'purchase'}, 數量: ${inv.quantity}`);
  }
  return totalQuantity;
}

// 驗證銷售創建請求
export async function validateSaleCreationRequest(requestBody: SaleCreationRequest): Promise<ValidationResult> {
  const { customer, items } = requestBody;
  
  // 檢查客戶是否存在
  const customerCheck = await checkCustomerExists(customer);
  if (!customerCheck.exists && customerCheck.error) {
    return customerCheck.error;
  }
  
  // 檢查所有產品是否存在
  for (const item of items) {
    // 檢查產品是否存在
    const productCheck = await checkProductExists(item.product);
    if (!productCheck.exists && productCheck.error) {
      return productCheck.error;
    }
    
    // 記錄當前庫存量，但不限制負庫存
    // 安全地訪問產品名稱，避免使用非空斷言
    const productName = productCheck.product && 'name' in productCheck.product
      ? (productCheck.product as any).name
      : '未知產品';
    logger.debug(`檢查產品ID: ${item.product}, 名稱: ${productName}`);
    
    // 檢查產品庫存
    if (productCheck.product) {
      const inventoryCheck = await checkProductInventory(productCheck.product, item.quantity);
      if (!inventoryCheck.success && inventoryCheck.error) {
        return inventoryCheck.error;
      }
    }
  }
  
  return { success: true };
}

// 驗證銷售更新請求
export async function validateSaleUpdateRequest(requestBody: SaleCreationRequest): Promise<ValidationResult> {
  const { customer, items } = requestBody;
  
  // 檢查客戶是否存在
  const customerCheck = await checkCustomerExists(customer);
  if (!customerCheck.exists && customerCheck.error) {
    return customerCheck.error;
  }
  
  // 檢查所有產品是否存在
  for (const item of items) {
    const productCheck = await checkProductExists(item.product);
    if (!productCheck.exists && productCheck.error) {
      return productCheck.error;
    }
  }
  
  return { success: true };
}
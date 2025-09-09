import { Types } from 'mongoose';
import BaseProduct from '../../../models/BaseProduct';
import PurchaseOrder from '../../../models/PurchaseOrder';
import Supplier from '../../../models/Supplier';
import OrderNumberService from '../../../utils/OrderNumberService';
import logger from '../../../utils/logger';
import {
  ValidationResult,
  PurchaseOrderIdChangeResult,
  StatusChangeResult,
  PurchaseOrderValidationResult,
  IPurchaseOrderDocument,
  PurchaseOrderRequest,
  PurchaseOrderStatus,
  ModelPaymentStatus
} from '../purchaseOrders.types';
import AccountingIntegrationService from '../../../services/AccountingIntegrationService';
import { deleteInventoryRecords } from './inventory.service';

/**
 * 檢查進貨單號是否已存在
 * @param {string} poid - 進貨單號
 * @returns {Promise<boolean>} - 是否存在
 */
export async function checkPurchaseOrderExists(poid: string | undefined): Promise<boolean> {
  if (!poid || poid.trim() === '') {
    return false;
  }
  
  const existingPO = await PurchaseOrder.findOne({ poid: poid.toString() });
  return !!existingPO;
}

/**
 * 驗證藥品項目並設置產品ID
 * @param {Array} items - 藥品項目列表
 * @returns {Promise<ValidationResult>} - 驗證結果
 */
export async function validateAndSetProductIds(items: PurchaseOrderRequest['items']): Promise<ValidationResult> {
  for (const item of items) {
    if (!item.did || !item.dname || 
        item.dquantity === undefined || item.dquantity === null || 
        item.dtotalCost === undefined || item.dtotalCost === null) {
      return { valid: false, message: '藥品項目資料不完整' };
    }

    // 嘗試查找藥品
    const product = await BaseProduct.findOne({ code: item.did.toString() });
    if (product) {
      item.product = (product._id as any).toString();
    }
  }
  
  return { valid: true };
}

/**
 * 查找供應商ID
 * @param {string} posupplier - 供應商名稱
 * @param {string} supplier - 供應商ID
 * @returns {Promise<string|null>} - 供應商ID
 */
export async function findSupplierId(posupplier: string, supplier?: string): Promise<string | null> {
  if (supplier) {
    return supplier.toString();
  }
  
  if (posupplier) {
    const supplierDoc = await Supplier.findOne({ name: posupplier.toString() });
    if (supplierDoc) {
      return (supplierDoc._id as any).toString();
    }
  }
  
  return null;
}

/**
 * 檢查進貨單號變更並處理
 * @param {string} poid - 新進貨單號
 * @param {Object} purchaseOrder - 進貨單對象
 * @returns {Promise<PurchaseOrderIdChangeResult>} - 處理結果
 */
export async function handlePurchaseOrderIdChange(
  poid: string | undefined, 
  purchaseOrder: IPurchaseOrderDocument
): Promise<PurchaseOrderIdChangeResult> {
  if (!poid || poid === purchaseOrder.poid) {
    return { success: true };
  }
  
  // 檢查新號碼是否已存在
  const existingPO = await PurchaseOrder.findOne({ poid: poid.toString() });
  if (existingPO && existingPO._id.toString() !== purchaseOrder._id.toString()) {
    return { 
      success: false, 
      error: '該進貨單號已存在'
    };
  }
  
  // 生成新的唯一訂單號
  const orderNumber = await OrderNumberService.generateUniqueOrderNumber('purchase', poid.toString());
  return {
    success: true,
    orderNumber
  };
}

/**
 * 處理進貨單狀態變更
 * @param {string} newStatus - 新狀態
 * @param {string} oldStatus - 舊狀態
 * @param {string} purchaseOrderId - 進貨單ID
 * @param {IPurchaseOrderDocument} purchaseOrder - 進貨單文檔
 * @returns {Promise<StatusChangeResult>} - 處理結果
 */
export async function handleStatusChange(
  newStatus: PurchaseOrderStatus | undefined,
  oldStatus: string,
  purchaseOrderId: string,
  purchaseOrder?: IPurchaseOrderDocument
): Promise<StatusChangeResult> {
  if (!newStatus || newStatus === oldStatus) {
    return { statusChanged: false };
  }
  
  const result: StatusChangeResult = {
    statusChanged: true,
    status: newStatus.toString()
  };
  
  // 如果狀態從已完成改為其他狀態，刪除相關庫存記錄和會計分錄
  if (oldStatus === 'completed' && newStatus !== 'completed') {
    logger.info(`進貨單 ${purchaseOrderId} 狀態從完成變為 ${newStatus}，執行解鎖操作`);
    
    // 刪除庫存記錄
    await deleteInventoryRecords(purchaseOrderId);
    result.inventoryDeleted = true;
    
    // 刪除會計分錄
    if (purchaseOrder) {
      try {
        await AccountingIntegrationService.handlePurchaseOrderUnlock(purchaseOrder);
        
        // 清除進貨單的關聯交易群組ID
        if (purchaseOrder.relatedTransactionGroupId) {
          (purchaseOrder as any).relatedTransactionGroupId = undefined;
          await purchaseOrder.save();
          logger.info(`已清除進貨單 ${purchaseOrder.poid} 的關聯交易群組ID`);
        }
        
        result.accountingEntriesDeleted = true;
      } catch (err) {
        logger.error(`刪除會計分錄時出錯: ${(err as Error).message}`);
        // 不拋出錯誤，避免影響其他操作
      }
    }
  }
  
  // 如果狀態從非完成變為完成，標記需要更新庫存
  if (oldStatus !== 'completed' && newStatus === 'completed') {
    result.needUpdateInventory = true;
  }
  
  return result;
}

/**
 * 驗證進貨單ID並獲取進貨單
 * @param {string} id - 進貨單ID
 * @returns {Promise<PurchaseOrderValidationResult>} - 驗證結果
 */
export async function validateAndGetPurchaseOrder(id: string): Promise<PurchaseOrderValidationResult> {
  if (!id) {
    return { valid: false, error: '進貨單ID為必填項' };
  }

  const purchaseOrder = await PurchaseOrder.findById(id);
  if (!purchaseOrder) {
    return { valid: false, error: '找不到該進貨單' };
  }

  return { valid: true, purchaseOrder };
}

/**
 * 處理項目更新
 * @param {Array} items - 藥品項目列表
 * @returns {Promise<ValidationResult>} - 處理結果
 */
export async function processItemsUpdate(items: PurchaseOrderRequest['items']): Promise<ValidationResult> {
  if (!items || items.length === 0) {
    return { valid: true };
  }

  // 驗證所有藥品ID是否存在
  const validationResult = await validateAndSetProductIds(items);
  if (!validationResult.valid) {
    const errorResponse = {
      valid: false as const
    } as { valid: false; error?: string };
    
    if (validationResult.message !== undefined) {
      errorResponse.error = validationResult.message;
    }
    
    return errorResponse;
  }

  // 正確處理 items 的型別轉換 - 使用 any 來避免 Document 型別衝突
  const processedItems = items.map((item: any) => ({
    ...item,
    product: item.product ? new Types.ObjectId(item.product.toString()) : new Types.ObjectId(),
    unitPrice: item.unitPrice ?? (item.dquantity > 0 ? item.dtotalCost / item.dquantity : 0),
    batchNumber: item.batchNumber || undefined,
    packageQuantity: item.packageQuantity || undefined,
    boxQuantity: item.boxQuantity || undefined
  })) as any;

  return { valid: true, processedItems };
}

/**
 * 準備進貨單更新數據
 * @param {Object} data - 請求數據
 * @param {Object} purchaseOrder - 進貨單對象
 * @returns {Object} - 更新數據
 */
export function prepareUpdateData(data: PurchaseOrderRequest, purchaseOrder: IPurchaseOrderDocument): Partial<IPurchaseOrderDocument> {
  const { poid, pobill, pobilldate, posupplier, supplier, organizationId, transactionType, selectedAccountIds, accountingEntryType, notes, paymentStatus } = data;
  
  const updateData: Partial<IPurchaseOrderDocument> = {};
  if (poid) updateData.poid = poid.toString();
  if (purchaseOrder.orderNumber) updateData.orderNumber = purchaseOrder.orderNumber.toString();
  if (pobill) updateData.pobill = pobill.toString();
  if (pobilldate) updateData.pobilldate = pobilldate;
  if (posupplier) updateData.posupplier = posupplier.toString();
  if (supplier) updateData.supplier = new Types.ObjectId(supplier.toString());
  if (organizationId) updateData.organizationId = new Types.ObjectId(organizationId.toString());
  if (transactionType) updateData.transactionType = transactionType.toString();
  if (selectedAccountIds !== undefined) {
    updateData.selectedAccountIds = selectedAccountIds && selectedAccountIds.length > 0
      ? selectedAccountIds.filter(id => id && Types.ObjectId.isValid(id.toString())).map(id => new Types.ObjectId(id.toString()))
      : [];
  }
  if (accountingEntryType) updateData.accountingEntryType = accountingEntryType.toString() as 'expense-asset' | 'asset-liability';
  if (notes !== undefined) updateData.notes = notes ? notes.toString() : '';
  if (paymentStatus) updateData.paymentStatus = paymentStatus as ModelPaymentStatus;
  
  return updateData;
}

/**
 * 應用更新到進貨單
 * @param {IPurchaseOrderDocument} purchaseOrder - 進貨單文檔
 * @param {Partial<IPurchaseOrderDocument>} updateData - 更新數據
 */
export function applyUpdatesToPurchaseOrder(purchaseOrder: IPurchaseOrderDocument, updateData: Partial<IPurchaseOrderDocument>): void {
  if (updateData.poid) purchaseOrder.poid = updateData.poid;
  if (updateData.orderNumber) purchaseOrder.orderNumber = updateData.orderNumber;
  if (updateData.pobill !== undefined) purchaseOrder.pobill = updateData.pobill;
  if (updateData.pobilldate) purchaseOrder.pobilldate = updateData.pobilldate;
  if (updateData.posupplier) purchaseOrder.posupplier = updateData.posupplier;
  if (updateData.supplier) purchaseOrder.supplier = updateData.supplier;
  if (updateData.organizationId) purchaseOrder.organizationId = updateData.organizationId;
  if (updateData.transactionType) purchaseOrder.transactionType = updateData.transactionType;
  if (updateData.selectedAccountIds !== undefined) purchaseOrder.selectedAccountIds = updateData.selectedAccountIds;
  if (updateData.accountingEntryType) purchaseOrder.accountingEntryType = updateData.accountingEntryType;
  if (updateData.notes !== undefined) purchaseOrder.notes = updateData.notes;
  if (updateData.paymentStatus) purchaseOrder.paymentStatus = updateData.paymentStatus;
  if (updateData.status) purchaseOrder.status = updateData.status;
  if (updateData.items) purchaseOrder.items = updateData.items;
  
  // 手動計算總金額以確保正確
  purchaseOrder.totalAmount = purchaseOrder.items.reduce(
    (total: number, item: any) => total + Number(item.dtotalCost || 0),
    0
  );
}
import { Types } from 'mongoose';
import PurchaseOrder from '../../models/PurchaseOrder';
import OrderNumberService from '../../utils/OrderNumberService';
import logger from '../../utils/logger';
import { PurchaseOrderTransactionType } from '@pharmacy-pos/shared/types/purchase-order';
import {
  IPurchaseOrderDocument,
  PurchaseOrderRequest,
  PurchaseOrderUpdateRequest
} from './purchaseOrders.types';
import { 
  checkPurchaseOrderExists, 
  validateAndSetProductIds, 
  findSupplierId,
  validateAndGetPurchaseOrder,
  handlePurchaseOrderIdChange,
  prepareUpdateData,
  handleStatusChange,
  processItemsUpdate,
  applyUpdatesToPurchaseOrder
} from './services/validation.service';
import { updateInventory } from './services/inventory.service';

const VALID_TRANSACTION_TYPES: readonly PurchaseOrderTransactionType[] = ['進貨', '退貨', '支出'];
const DEFAULT_TRANSACTION_TYPE: PurchaseOrderTransactionType = '進貨';

const normalizeTransactionType = (value?: string | null): PurchaseOrderTransactionType => {
  if (!value) {
    return DEFAULT_TRANSACTION_TYPE;
  }
  const candidate = value.trim();
  return (VALID_TRANSACTION_TYPES as readonly string[]).includes(candidate)
    ? candidate as PurchaseOrderTransactionType
    : DEFAULT_TRANSACTION_TYPE;
};

/**
 * 獲取所有進貨單
 * @returns 進貨單列表
 */
export async function getAllPurchaseOrders(): Promise<IPurchaseOrderDocument[]> {
  return await PurchaseOrder.find()
    .sort({ poid: -1 })
    .populate('supplier', 'name code')
    .populate('items.product', 'name code')
    .populate('selectedAccountIds', 'code name accountType');
}

/**
 * 根據ID獲取進貨單
 * @param id 進貨單ID
 * @returns 進貨單文檔
 */
export async function getPurchaseOrderById(id: string): Promise<IPurchaseOrderDocument | null> {
  return await PurchaseOrder.findById(id)
    .populate('supplier', 'name code')
    .populate('items.product', 'name code _id')
    .populate('selectedAccountIds', 'code name accountType parentAccount organizationId');
}

/**
 * 創建新進貨單
 * @param requestData 請求數據
 * @param userId 用戶ID
 * @returns 創建結果
 */
export async function createPurchaseOrder(
  requestData: PurchaseOrderRequest,
  userId?: string
): Promise<{ success: boolean; purchaseOrder?: IPurchaseOrderDocument; error?: string | undefined }> {
  try {
    const { poid, pobill, pobilldate, posupplier, supplier, items, notes, status, paymentStatus, organizationId, transactionType, selectedAccountIds, accountingEntryType } = requestData;

    const normalizedTransactionType = normalizeTransactionType(transactionType ?? null);

    
    logger.debug('創建進貨單 - selectedAccountIds:', selectedAccountIds);
    logger.debug('創建進貨單 - items:', JSON.stringify(items, null, 2));

    // 如果進貨單號為空，自動生成
    let finalPoid: string;
    if (!poid || poid.trim() === '') {
      finalPoid = await OrderNumberService.generatePurchaseOrderNumber();
    } else if (await checkPurchaseOrderExists(poid)) {
      return {
        success: false,
        error: '該進貨單號已存在'
      };
    } else {
      finalPoid = poid;
    }

    // 生成唯一訂單號
    const orderNumber = await OrderNumberService.generateUniqueOrderNumber('purchase', finalPoid);

    // 驗證所有藥品ID是否存在
    const validationResult = await validateAndSetProductIds(items);
    if (!validationResult.valid) {
      return {
        success: false,
        error: validationResult.message || '藥品項目驗證失敗'
      };
    }

    // 處理項目數據，確保批號欄位和大包裝數量欄位被正確處理
    const processedItems = items.map((item: any) => ({
      ...item,
      product: item.product ? new Types.ObjectId(item.product.toString()) : new Types.ObjectId(),
      unitPrice: item.unitPrice ?? (item.dquantity > 0 ? item.dtotalCost / item.dquantity : 0),
      batchNumber: item.batchNumber || undefined,
      packageQuantity: item.packageQuantity || undefined,
      boxQuantity: item.boxQuantity || undefined
    }));
    
    logger.debug('創建進貨單 - processedItems:', JSON.stringify(processedItems, null, 2));

    // 嘗試查找供應商
    const supplierId = await findSupplierId(posupplier, supplier);

    // 創建新進貨單
    const purchaseOrder = new PurchaseOrder({
      poid: finalPoid.toString(),
      orderNumber: orderNumber.toString(), // 設置唯一訂單號
      pobill: pobill ? pobill.toString() : '',
      pobilldate,
      posupplier: posupplier.toString(),
      supplier: supplierId && Types.ObjectId.isValid(supplierId) ? new Types.ObjectId(supplierId) : undefined,
      organizationId: organizationId ? new Types.ObjectId(organizationId.toString()) : undefined,
      transactionType: normalizedTransactionType,
      selectedAccountIds: selectedAccountIds && selectedAccountIds.length > 0
        ? selectedAccountIds.filter(id => id && Types.ObjectId.isValid(id.toString())).map(id => new Types.ObjectId(id.toString()))
        : undefined,
      accountingEntryType: accountingEntryType ? accountingEntryType.toString() as 'expense-asset' | 'asset-liability' : undefined,
      items: processedItems,
      notes: notes ? notes.toString() : '',
      status: status ?? 'pending',
      paymentStatus: paymentStatus ?? '未付'
    });

    await purchaseOrder.save();
    
    logger.debug('進貨單已儲存 - selectedAccountIds:', purchaseOrder.selectedAccountIds);

    // 如果狀態為已完成，則更新庫存
    if (purchaseOrder.status === 'completed') {
      if (!userId) {
        return {
          success: false,
          error: '用戶認證失敗'
        };
      }
      await updateInventory(purchaseOrder, userId);
    }

    return {
      success: true,
      purchaseOrder
    };
  } catch (error) {
    logger.error(`創建進貨單錯誤: ${(error as Error).message}`);
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

/**
 * 更新進貨單
 * @param id 進貨單ID
 * @param requestData 請求數據
 * @param userId 用戶ID
 * @returns 更新結果
 */
export async function updatePurchaseOrder(
  id: string,
  requestData: PurchaseOrderUpdateRequest,
  userId?: string
): Promise<{ success: boolean; purchaseOrder?: IPurchaseOrderDocument; error?: string | undefined }> {
  try {
    const { poid, status, items, selectedAccountIds } = requestData;
    
    logger.debug('更新進貨單 - selectedAccountIds:', selectedAccountIds);

    // 驗證進貨單ID並獲取進貨單
    const validation = await validateAndGetPurchaseOrder(id);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }
    let purchaseOrder = validation.purchaseOrder!;

    // 處理進貨單號變更
    const idChangeResult = await handlePurchaseOrderIdChange(poid, purchaseOrder);
    if (!idChangeResult.success) {
      return {
        success: false,
        error: idChangeResult.error
      };
    }
    if (idChangeResult.orderNumber) {
      purchaseOrder.orderNumber = idChangeResult.orderNumber;
    }

    // 準備更新數據
    const updateData = prepareUpdateData(requestData, purchaseOrder);
    
    // 處理狀態變更
    const oldStatus = purchaseOrder.status;
    const statusResult = await handleStatusChange(status, oldStatus, purchaseOrder._id.toString(), purchaseOrder);
    if (statusResult.statusChanged) {
      updateData.status = statusResult.status as any;
    }

    // 處理項目更新
    const itemsResult = await processItemsUpdate(items);
    if (!itemsResult.valid) {
      return {
        success: false,
        error: itemsResult.error
      };
    }
    if (itemsResult.processedItems) {
      updateData.items = itemsResult.processedItems;
    }

    // 重新獲取進貨單以確保最新狀態
    const updatedPurchaseOrder = await PurchaseOrder.findById(id);
    if (!updatedPurchaseOrder) {
      return {
        success: false,
        error: '找不到該進貨單'
      };
    }
    purchaseOrder = updatedPurchaseOrder;
    
    // 應用更新
    applyUpdatesToPurchaseOrder(purchaseOrder, updateData);
    
    // 保存更新後的進貨單，這樣會觸發pre-save中間件
    await purchaseOrder.save();
    
    logger.debug('進貨單已更新 - selectedAccountIds:', purchaseOrder.selectedAccountIds);

    // 如果需要更新庫存
    if (statusResult.needUpdateInventory) {
      if (!userId) {
        return {
          success: false,
          error: '用戶認證失敗'
        };
      }
      await updateInventory(purchaseOrder, userId);
    }

    return {
      success: true,
      purchaseOrder
    };
  } catch (error) {
    logger.error(`更新進貨單錯誤: ${(error as Error).message}`);
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

/**
 * 刪除進貨單
 * @param id 進貨單ID
 * @returns 刪除結果
 */
export async function deletePurchaseOrder(id: string): Promise<{ success: boolean; error?: string | undefined }> {
  try {
    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder) {
      return {
        success: false,
        error: '找不到該進貨單'
      };
    }

    // 如果進貨單已完成，不允許刪除
    if (purchaseOrder.status === 'completed') {
      return {
        success: false,
        error: '已完成的進貨單不能刪除'
      };
    }

    await purchaseOrder.deleteOne();
    
    return {
      success: true
    };
  } catch (error) {
    logger.error(`刪除進貨單錯誤: ${(error as Error).message}`);
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

/**
 * 獲取特定供應商的進貨單
 * @param supplierId 供應商ID
 * @returns 進貨單列表
 */
export async function getPurchaseOrdersBySupplier(supplierId: string): Promise<IPurchaseOrderDocument[]> {
  return await PurchaseOrder.find({ supplier: new Types.ObjectId(supplierId) })
    .sort({ createdAt: -1 })
    .populate('supplier', 'name code')
    .populate('items.product', 'name code');
}

/**
 * 獲取特定產品的進貨單
 * @param productId 產品ID
 * @returns 進貨單列表
 */
export async function getPurchaseOrdersByProduct(productId: string): Promise<IPurchaseOrderDocument[]> {
  return await PurchaseOrder.find({
    'items.product': new Types.ObjectId(productId),
    'status': 'completed'
  })
    .sort({ pobilldate: -1 })
    .populate('supplier', 'name code')
    .populate('items.product', 'name code');
}

/**
 * 獲取最近的進貨單
 * @param limit 限制數量
 * @returns 進貨單列表
 */
export async function getRecentPurchaseOrders(limit: number = 10): Promise<IPurchaseOrderDocument[]> {
  return await PurchaseOrder.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('supplier', 'name code')
    .populate('items.product', 'name code');
}




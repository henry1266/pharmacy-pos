import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import mongoose, { Types } from 'mongoose';
// import multer from 'multer';
// import fs from 'fs';
// import path from 'path';

// 使用 ES6 import 導入模型
import PurchaseOrder, { IPurchaseOrderDocument, IPurchaseOrderItemDocument, PurchaseOrderStatus as ModelPurchaseOrderStatus, PaymentStatus as ModelPaymentStatus } from '../models/PurchaseOrder';
import BaseProduct from '../models/BaseProduct';
import Inventory from '../models/Inventory';
import Supplier from '../models/Supplier';
import OrderNumberService from '../utils/OrderNumberService';
import AccountingIntegrationService from '../services/AccountingIntegrationService';
import logger from '../utils/logger';

// 導入認證中間件和類型
import auth from '../middleware/auth';
import { AuthenticatedRequest } from '../src/types/express';

// 使用 shared 架構的類型
import { ApiResponse, ErrorResponse } from '@pharmacy-pos/shared/types/api';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@pharmacy-pos/shared/constants';
import {
  PurchaseOrderRequest,
  PurchaseOrderStatus,
} from '@pharmacy-pos/shared/types/purchase-order';

// 設置文件上傳
// const storage = multer.diskStorage({
//   destination: function (_req: Express.Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
//     const uploadDir = path.join(__dirname, '../uploads');
//     // 確保上傳目錄存在
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: function (_req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   }
// });

// 設置上傳限制為 8MB，符合安全編碼實踐建議
// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 8000000 // 8MB 限制
//   }
// });

const router: express.Router = express.Router();

// @route   GET api/purchase-orders
// @desc    獲取所有進貨單
// @access  Public
router.get('/', async (_req: Request, res: Response) => {
  try {
    const purchaseOrders = await PurchaseOrder.find()
      .sort({ poid: -1 })
      .populate('supplier', 'name code')
      .populate('items.product', 'name code')
      .populate('selectedAccountIds', 'code name accountType');
    
    const response: ApiResponse<IPurchaseOrderDocument[]> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      data: purchaseOrders,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err) {
    logger.error(`獲取最近的進貨單錯誤: ${(err as Error).message}`);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(500).json(errorResponse);
  }
});

// @route   GET api/purchase-orders/:id
// @desc    獲取單個進貨單
// @access  Public
router.get('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '進貨單ID為必填項',
        timestamp: new Date()
      };
      res.status(400).json(errorResponse);
      return;
    }

    const purchaseOrder = await PurchaseOrder.findById(req.params.id)
      .populate('supplier', 'name code')
      .populate('items.product', 'name code _id')
      .populate('selectedAccountIds', 'code name accountType parentAccount organizationId');
    
    if (!purchaseOrder) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(404).json(errorResponse);
      return;
    }
    
    // 確保批號欄位被正確序列化
    const serializedPurchaseOrder = purchaseOrder.toObject();
    logger.debug('後端序列化後的進貨單資料:', JSON.stringify(serializedPurchaseOrder, null, 2));
    logger.debug('第一個項目的批號:', serializedPurchaseOrder.items?.[0]?.batchNumber);
    
    const response: ApiResponse<any> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      data: serializedPurchaseOrder,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err) {
    logger.error(`獲取單個進貨單錯誤: ${(err as Error).message}`);
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

// 注意：原本的 generateUniqueOrderNumber 函數已被 OrderNumberService.generateUniqueOrderNumber 替代

/**
 * 檢查進貨單號是否已存在
 * @param {string} poid - 進貨單號
 * @returns {Promise<boolean>} - 是否存在
 */
async function checkPurchaseOrderExists(poid: string | undefined): Promise<boolean> {
  if (!poid || poid.trim() === '') {
    return false;
  }
  
  const existingPO = await PurchaseOrder.findOne({ poid: poid.toString() });
  return !!existingPO;
}

/**
 * 驗證藥品項目並設置產品ID
 * @param {Array} items - 藥品項目列表
 * @returns {Promise<Object>} - 驗證結果
 */
async function validateAndSetProductIds(items: PurchaseOrderRequest['items']): Promise<{ valid: boolean; message?: string }> {
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
async function findSupplierId(posupplier: string, supplier?: string): Promise<string | null> {
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

// @route   POST api/purchase-orders
// @desc    創建新進貨單
// @access  Private
router.post('/', [
  auth,
  check('posupplier', '供應商為必填項').not().isEmpty(),
  check('items', '至少需要一個藥品項目').isArray().not().isEmpty()
], async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
      errors: errors.array(),
      timestamp: new Date()
    };
    res.status(400).json(errorResponse);
      return;
  }

  try {
    const { poid, pobill, pobilldate, posupplier, supplier, items, notes, status, paymentStatus, organizationId, transactionType, selectedAccountIds, accountingEntryType } = req.body as PurchaseOrderRequest;
    
    logger.debug('創建進貨單 - selectedAccountIds:', selectedAccountIds);
    logger.debug('創建進貨單 - items:', JSON.stringify(items, null, 2));

    // 如果進貨單號為空，自動生成
    let finalPoid: string;
    if (!poid || poid.trim() === '') {
      finalPoid = await OrderNumberService.generatePurchaseOrderNumber();
    } else if (await checkPurchaseOrderExists(poid)) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.DUPLICATE_ENTRY,
        timestamp: new Date()
      };
      res.status(400).json(errorResponse);
      return;
    } else {
      finalPoid = poid;
    }

    // 生成唯一訂單號
    const orderNumber = await OrderNumberService.generateUniqueOrderNumber('purchase', finalPoid);

    // 驗證所有藥品ID是否存在
    const validationResult = await validateAndSetProductIds(items);
    if (!validationResult.valid) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: validationResult.message || ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
        timestamp: new Date()
      };
      res.status(400).json(errorResponse);
      return;
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
      supplier: supplierId,
      organizationId: organizationId ? new Types.ObjectId(organizationId.toString()) : undefined,
      transactionType: transactionType ? transactionType.toString() : undefined,
      selectedAccountIds: selectedAccountIds && selectedAccountIds.length > 0
        ? selectedAccountIds.filter(id => id && Types.ObjectId.isValid(id.toString())).map(id => new Types.ObjectId(id.toString()))
        : undefined,
      accountingEntryType: accountingEntryType ? accountingEntryType.toString() as 'expense-asset' | 'asset-liability' : undefined,
      items: processedItems,
      notes: notes ? notes.toString() : '',
      status: status ? status.toString() : 'pending',
      paymentStatus: paymentStatus ? paymentStatus.toString() : '未付'
    });

    await purchaseOrder.save();
    
    logger.debug('進貨單已儲存 - selectedAccountIds:', purchaseOrder.selectedAccountIds);

    // 如果狀態為已完成，則更新庫存
    if (purchaseOrder.status === 'completed') {
      if (!authReq.user?.id) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: '用戶認證失敗',
          timestamp: new Date()
        };
        res.status(401).json(errorResponse);
        return;
      }
      const userId = authReq.user.id;
      await updateInventory(purchaseOrder, userId);
    }

    const response: ApiResponse<IPurchaseOrderDocument> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.CREATED,
      data: purchaseOrder,
      timestamp: new Date()
    };

    res.json(response);
  } catch (err) {
    logger.error(`創建進貨單錯誤: ${(err as Error).message}`);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(500).json(errorResponse);
  }
});

/**
 * 檢查進貨單號變更並處理
 * @param {string} poid - 新進貨單號
 * @param {Object} purchaseOrder - 進貨單對象
 * @returns {Promise<Object>} - 處理結果
 */
async function handlePurchaseOrderIdChange(
  poid: string | undefined, 
  purchaseOrder: IPurchaseOrderDocument
): Promise<{ success: boolean; error?: string; orderNumber?: string }> {
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
 * 準備進貨單更新數據
 * @param {Object} data - 請求數據
 * @param {Object} purchaseOrder - 進貨單對象
 * @returns {Object} - 更新數據
 */
function prepareUpdateData(data: PurchaseOrderRequest, purchaseOrder: IPurchaseOrderDocument): Partial<IPurchaseOrderDocument> {
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
 * 處理進貨單狀態變更
 * @param {string} newStatus - 新狀態
 * @param {string} oldStatus - 舊狀態
 * @param {string} purchaseOrderId - 進貨單ID
 * @param {IPurchaseOrderDocument} purchaseOrder - 進貨單文檔
 * @returns {Promise<Object>} - 處理結果
 */
async function handleStatusChange(
  newStatus: PurchaseOrderStatus | undefined,
  oldStatus: string,
  purchaseOrderId: string,
  purchaseOrder?: IPurchaseOrderDocument
): Promise<{ statusChanged: boolean; status?: string; inventoryDeleted?: boolean; needUpdateInventory?: boolean; accountingEntriesDeleted?: boolean }> {
  if (!newStatus || newStatus === oldStatus) {
    return { statusChanged: false };
  }
  
  const result: {
    statusChanged: boolean;
    status: string;
    inventoryDeleted?: boolean;
    needUpdateInventory?: boolean;
    accountingEntriesDeleted?: boolean;
  } = {
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
 */
const validateAndGetPurchaseOrder = async (id: string): Promise<{ valid: boolean; purchaseOrder?: IPurchaseOrderDocument; error?: string }> => {
  if (!id) {
    return { valid: false, error: '進貨單ID為必填項' };
  }

  const purchaseOrder = await PurchaseOrder.findById(id);
  if (!purchaseOrder) {
    return { valid: false, error: '找不到該進貨單' };
  }

  return { valid: true, purchaseOrder };
};

/**
 * 處理項目更新
 */
const processItemsUpdate = async (items: PurchaseOrderRequest['items']): Promise<{ valid: boolean; processedItems?: any; error?: string }> => {
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
};

/**
 * 應用更新到進貨單
 */
const applyUpdatesToPurchaseOrder = (purchaseOrder: IPurchaseOrderDocument, updateData: Partial<IPurchaseOrderDocument>): void => {
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
    (total: number, item: IPurchaseOrderItemDocument) => total + Number(item.dtotalCost || 0),
    0
  );
};

/**
 * 處理進貨單更新錯誤
 */
const handlePurchaseOrderUpdateError = (res: Response, err: Error): void => {
  logger.error(`更新進貨單錯誤: ${err.message}`);
  
  if (err.name === 'CastError') {
    res.status(404).json({ msg: '找不到該進貨單' });
    return;
  }
  
  const errorResponse: ErrorResponse = {
    success: false,
    message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
    timestamp: new Date()
  };
  res.status(500).json(errorResponse);
};

// @route   PUT api/purchase-orders/:id
// @desc    更新進貨單
// @access  Private
router.put('/:id', auth, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  try {
    if (!req.params.id) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '進貨單ID為必填項',
        timestamp: new Date()
      };
      res.status(400).json(errorResponse);
      return;
    }

    const { poid, status, items, selectedAccountIds } = req.body as PurchaseOrderRequest;
    const id = req.params.id;
    
    logger.debug('更新進貨單 - selectedAccountIds:', selectedAccountIds);

    // 驗證進貨單ID並獲取進貨單
    const validation = await validateAndGetPurchaseOrder(id);
    if (!validation.valid) {
      const statusCode = validation.error === '進貨單ID為必填項' ? 400 : 404;
      res.status(statusCode).json({ msg: validation.error });
      return;
    }
    let purchaseOrder = validation.purchaseOrder!;

    // 處理進貨單號變更
    const idChangeResult = await handlePurchaseOrderIdChange(poid, purchaseOrder);
    if (!idChangeResult.success) {
      res.status(400).json({ msg: idChangeResult.error });
      return;
    }
    if (idChangeResult.orderNumber) {
      purchaseOrder.orderNumber = idChangeResult.orderNumber;
    }

    // 準備更新數據
    const updateData = prepareUpdateData(req.body as PurchaseOrderRequest, purchaseOrder);
    
    // 處理狀態變更
    const oldStatus = purchaseOrder.status;
    const statusResult = await handleStatusChange(status, oldStatus, purchaseOrder._id.toString(), purchaseOrder);
    if (statusResult.statusChanged) {
      updateData.status = statusResult.status as ModelPurchaseOrderStatus;
    }

    // 處理項目更新
    const itemsResult = await processItemsUpdate(items);
    if (!itemsResult.valid) {
      res.status(400).json({ msg: itemsResult.error });
      return;
    }
    if (itemsResult.processedItems) {
      updateData.items = itemsResult.processedItems;
    }

    // 重新獲取進貨單以確保最新狀態
    const updatedPurchaseOrder = await PurchaseOrder.findById(id);
    if (!updatedPurchaseOrder) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '找不到該進貨單',
        timestamp: new Date()
      };
      res.status(404).json(errorResponse);
      return;
    }
    purchaseOrder = updatedPurchaseOrder;
    
    // 應用更新
    applyUpdatesToPurchaseOrder(purchaseOrder, updateData);
    
    // 保存更新後的進貨單，這樣會觸發pre-save中間件
    await purchaseOrder.save();
    
    logger.debug('進貨單已更新 - selectedAccountIds:', purchaseOrder.selectedAccountIds);

    // 如果需要更新庫存
    if (statusResult.needUpdateInventory) {
      if (!authReq.user?.id) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: '用戶認證失敗',
          timestamp: new Date()
        };
        res.status(401).json(errorResponse);
        return;
      }
      const userId = authReq.user.id;
      await updateInventory(purchaseOrder, userId);
    }

    const response: ApiResponse<IPurchaseOrderDocument> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.UPDATED,
      data: purchaseOrder,
      timestamp: new Date()
    };

    res.json(response);
  } catch (err) {
    handlePurchaseOrderUpdateError(res, err as Error);
  }
});

// @route   DELETE api/purchase-orders/:id
// @desc    刪除進貨單
// @access  Public
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '進貨單ID為必填項',
        timestamp: new Date()
      };
      res.status(400).json(errorResponse);
      return;
    }

    const id = req.params.id;

    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder) {
      res.status(404).json({ msg: '找不到該進貨單' });
      return;
    }

    // 如果進貨單已完成，不允許刪除
    if (purchaseOrder.status === 'completed') {
      res.status(400).json({ msg: '已完成的進貨單不能刪除' });
      return;
    }

    await purchaseOrder.deleteOne();
    
    const response: ApiResponse<null> = {
      success: true,
      message: '進貨單已刪除',
      data: null,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err) {
    logger.error(`刪除進貨單錯誤: ${(err as Error).message}`);
    if (err instanceof Error && err.name === 'CastError') {
      res.status(404).json({ msg: '找不到該進貨單' });
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

// @route   GET api/purchase-orders/supplier/:supplierId
// @desc    獲取特定供應商的進貨單
// @access  Public
router.get('/supplier/:supplierId', async (req: Request, res: Response) => {
  try {
    if (!req.params.supplierId) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '供應商ID為必填項',
        timestamp: new Date()
      };
      res.status(400).json(errorResponse);
      return;
    }

    const supplierId = req.params.supplierId;

    const purchaseOrders = await PurchaseOrder.find({ supplier: new Types.ObjectId(supplierId) })
      .sort({ createdAt: -1 })
      .populate('supplier', 'name code')
      .populate('items.product', 'name code');
    
    const response: ApiResponse<IPurchaseOrderDocument[]> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      data: purchaseOrders,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err) {
    logger.error(`獲取所有進貨單錯誤: ${(err as Error).message}`);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(500).json(errorResponse);
  }
});

// 搜索功能已移至前端實現，不再需要後端 API

// @route   GET api/purchase-orders/product/:productId
// @desc    獲取特定產品的進貨單
// @access  Public
router.get('/product/:productId', async (req: Request, res: Response) => {
  try {
    if (!req.params.productId) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '產品ID為必填項',
        timestamp: new Date()
      };
      res.status(400).json(errorResponse);
      return;
    }

    const productId = req.params.productId;

    const purchaseOrders = await PurchaseOrder.find({
      'items.product': new Types.ObjectId(productId),
      'status': 'completed'
    })
      .sort({ pobilldate: -1 })
      .populate('supplier', 'name code')
      .populate('items.product', 'name code');
    
    const response: ApiResponse<IPurchaseOrderDocument[]> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      data: purchaseOrders,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err) {
    logger.error(`獲取特定供應商的進貨單錯誤: ${(err as Error).message}`);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(500).json(errorResponse);
  }
});

// @route   GET api/purchase-orders/recent
// @desc    獲取最近的進貨單
// @access  Public
router.get('/recent/list', async (_req: Request, res: Response) => {
  try {
    const purchaseOrders = await PurchaseOrder.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('supplier', 'name code')
      .populate('items.product', 'name code');
    
    const response: ApiResponse<IPurchaseOrderDocument[]> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      data: purchaseOrders,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err) {
    logger.error(`獲取特定產品的進貨單錯誤: ${(err as Error).message}`);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(500).json(errorResponse);
  }
});

// 更新庫存的輔助函數
async function updateInventory(purchaseOrder: IPurchaseOrderDocument, userId?: string): Promise<void> {
  for (const item of purchaseOrder.items) {
    if (!item.product) continue;
    
    try {
      // 為每個進貨單項目創建新的庫存記錄，而不是更新現有記錄
      // 這樣可以保留每個批次的信息
      const inventory = new Inventory({
        product: item.product.toString(),
        quantity: parseInt(item.dquantity.toString()),
        totalAmount: Number(item.dtotalCost), // 添加totalAmount字段
        purchaseOrderId: purchaseOrder._id.toString(), // 保存進貨單ID
        purchaseOrderNumber: purchaseOrder.orderNumber.toString(), // 保存進貨單號
        batchNumber: item.batchNumber || undefined // 加入批號欄位
      });
      
      await inventory.save();
      logger.debug(`已為產品 ${item.product} 創建新庫存記錄，進貨單號: ${purchaseOrder.orderNumber}, 數量: ${item.dquantity}, 總金額: ${item.dtotalCost}`);
      
      // 更新藥品的採購價格
      await BaseProduct.findOne({ _id: item.product.toString() })
        .then((product) => {
          if (product) {
            product.purchasePrice = item.unitPrice ?? (item.dquantity > 0 ? item.dtotalCost / item.dquantity : 0);
            return product.save();
          }
          return null;
        });
    } catch (err) {
      logger.error(`更新庫存時出錯: ${(err as Error).message}`);
      // 繼續處理其他項目
    }
  }

  // 庫存更新完成後，處理會計整合（包含自動會計分錄）
  try {
    const transactionGroupId = await AccountingIntegrationService.handlePurchaseOrderCompletion(purchaseOrder, userId);
    
    // 如果創建了自動會計分錄，更新進貨單的關聯交易群組ID
    if (transactionGroupId) {
      purchaseOrder.relatedTransactionGroupId = transactionGroupId;
      await purchaseOrder.save();
      logger.info(`進貨單 ${purchaseOrder.poid} 已關聯交易群組 ${transactionGroupId}`);
    }
  } catch (err) {
    logger.error(`處理會計整合時出錯: ${(err as Error).message}`);
    // 不拋出錯誤，避免影響庫存更新流程
  }
}

// 刪除與進貨單相關的庫存記錄
async function deleteInventoryRecords(purchaseOrderId: string): Promise<mongoose.mongo.DeleteResult> {
  try {
    const result = await Inventory.deleteMany({ purchaseOrderId: purchaseOrderId.toString() });
    logger.info(`已刪除 ${result.deletedCount} 筆與進貨單 ${purchaseOrderId} 相關的庫存記錄`);
    return result;
  } catch (err) {
    logger.error(`刪除庫存記錄時出錯: ${(err as Error).message}`);
    throw err;
  }
}

/**
 * 驗證CSV基本資訊必填字段
 * @param {Object} row - CSV行數據
 * @param {number} rowIndex - 行索引
 * @returns {Object} - 驗證結果
 */
// function validateBasicInfoRow(row: Record<string, string | number | Date>, rowIndex: number): { valid: boolean; error?: string } {
//   if (!row['進貨單號'] || !row['廠商']) {
//     return {
//       valid: false,
//       error: `行 ${rowIndex + 1}: 進貨單號和廠商為必填項`
//     };
//   }
//   return { valid: true };
// }

/**
 * 創建進貨單數據對象
 * @param {Object} row - CSV行數據
 * @returns {Object} - 進貨單數據
 */
// function createPurchaseOrderData(row: Record<string, string | number | Date>): {
//   poid: string;
//   pobill: string;
//   pobilldate: Date | null;
//   posupplier: string;
//   paymentStatus: string;
//   items: never[];
//   status: string;
// } {
//   return {
//     poid: row['進貨單號'].toString(),
//     pobill: row['發票號'] ? row['發票號'].toString() : '',
//     pobilldate: row['發票日期'] ? new Date(row['發票日期']) : null,
//     posupplier: row['廠商'].toString(),
//     paymentStatus: row['付款狀態'] ? row['付款狀態'].toString() : '未付',
//     items: [],
//     status: 'pending'
//   };
// }

export default router;
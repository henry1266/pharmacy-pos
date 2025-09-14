import Sale from '../../models/Sale';
import { SaleCreationRequest, SaleDocument } from './sales.types';
import { validateSaleCreationRequest, validateSaleUpdateRequest } from './services/validation.service';
import { handleInventoryForNewSale, handleInventoryForUpdatedSale } from './services/inventory.service';
import { updateCustomerPoints } from './services/customer.service';
import { generateSaleNumber, buildSaleFields } from './utils/sales.utils';
import logger from '../../utils/logger';

// 獲取所有銷售記錄
export async function findAllSales(): Promise<SaleDocument[]> {
  return await Sale.find()
    .populate('customer')
    .populate('items.product')
    .populate('cashier')
    .sort({ saleNumber: -1 })
    .lean();
}

// 根據ID獲取銷售記錄
export async function findSaleById(id: string): Promise<SaleDocument | null> {
  return await Sale.findById(id)
    .populate('customer')
    .populate({
      path: 'items.product',
      model: 'baseproduct'
    })
    .populate('cashier');
}

// 取得今日銷售（以伺服器當地時區為基準）
export async function findTodaySales(): Promise<SaleDocument[]> {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return await Sale.find({ date: { $gte: start, $lte: end } })
    .populate('customer')
    .populate('items.product')
    .populate('cashier')
    .sort({ saleNumber: -1 })
    .lean();
}

// 創建銷售記錄
export async function createSaleRecord(requestBody: SaleCreationRequest): Promise<SaleDocument> {
  // 生成銷貨單號（如果未提供）
  const finalSaleNumber = await generateSaleNumber(requestBody.saleNumber);
  
  // 確保銷貨單號不為空
  if (!finalSaleNumber) {
    logger.error('無法生成有效的銷貨單號');
    throw new Error('無法生成有效的銷貨單號');
  }
  
  // 建立銷售記錄
  const saleData = {
    saleNumber: finalSaleNumber,
    customer: requestBody.customer,
    items: requestBody.items,
    totalAmount: requestBody.totalAmount || 0,
    discount: requestBody.discount,
    paymentMethod: requestBody.paymentMethod,
    paymentStatus: requestBody.paymentStatus,
    notes: requestBody.notes,
    cashier: requestBody.cashier
  };
  
  const saleFields = buildSaleFields({
    saleNumber: saleData.saleNumber,
    customer: saleData.customer || '',
    items: saleData.items,
    totalAmount: saleData.totalAmount,
    discount: saleData.discount || 0,
    paymentMethod: saleData.paymentMethod,
    paymentStatus: saleData.paymentStatus || 'pending',
    notes: saleData.notes || '',
    cashier: saleData.cashier || ''
  });

  const sale = new Sale(saleFields);
  await sale.save();
  return sale;
}

// 更新銷售記錄
export async function updateSaleRecord(saleId: string, requestBody: SaleCreationRequest, existingSale: SaleDocument): Promise<SaleDocument> {
  // 保持原有的銷貨單號
  const saleData = {
    saleNumber: existingSale.saleNumber, // 保持原有銷貨單號
    customer: requestBody.customer,
    items: requestBody.items,
    totalAmount: requestBody.totalAmount || 0,
    discount: requestBody.discount,
    paymentMethod: requestBody.paymentMethod,
    paymentStatus: requestBody.paymentStatus,
    notes: requestBody.notes,
    cashier: requestBody.cashier
  };
  
  const saleFields = buildSaleFields({
    saleNumber: saleData.saleNumber,
    customer: saleData.customer || '',
    items: saleData.items,
    totalAmount: saleData.totalAmount,
    discount: saleData.discount || 0,
    paymentMethod: saleData.paymentMethod,
    paymentStatus: saleData.paymentStatus || 'pending',
    notes: saleData.notes || '',
    cashier: saleData.cashier || ''
  });
  
  // 更新銷售記錄
  const updatedSale = await Sale.findByIdAndUpdate(
    saleId,
    { $set: saleFields },
    { new: true, runValidators: true }
  );
  
  if (!updatedSale) {
    throw new Error('更新銷售記錄失敗');
  }
  
  return updatedSale;
}

// 刪除銷售記錄
export async function deleteSaleRecord(saleId: string): Promise<void> {
  await Sale.findByIdAndDelete(saleId);
}

// 處理銷售創建的完整流程
export async function processSaleCreation(requestBody: SaleCreationRequest): Promise<SaleDocument> {
  // 1. 驗證請求和檢查記錄
  const validationResult = await validateSaleCreationRequest(requestBody);
  if (!validationResult.success) {
    throw new Error(validationResult.message || '驗證失敗');
  }
  
  // 2. 創建銷售記錄
  const sale = await createSaleRecord(requestBody);
  
  // 3. 處理庫存變更
  await handleInventoryForNewSale(sale);
  
  // 4. 處理客戶積分
  await updateCustomerPoints(sale);
  
  return sale;
}

// 處理銷售更新的完整流程
export async function processSaleUpdate(saleId: string, requestBody: SaleCreationRequest, existingSale: SaleDocument): Promise<SaleDocument> {
  // 1. 驗證更新請求
  const validationResult = await validateSaleUpdateRequest(requestBody);
  if (!validationResult.success) {
    throw new Error(validationResult.message || '驗證失敗');
  }

  // 2. 更新銷售記錄
  const updatedSale = await updateSaleRecord(saleId, requestBody, existingSale);

  // 3. 處理庫存變更（如果項目有變化）
  await handleInventoryForUpdatedSale(existingSale, updatedSale);

  return updatedSale;
}

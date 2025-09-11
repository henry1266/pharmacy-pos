import { Request, Response } from 'express';
import ShippingOrder from '../../../models/ShippingOrder';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  handleDatabaseError,
  validateOrderItems,
  handleOrderNumberChange,
  handleStatusChange,
  prepareUpdateData,
  createShippingInventoryRecords
} from '../services';
import { SUCCESS_MESSAGES } from '@pharmacy-pos/shared/constants';
import { ShippingOrderRequest } from '../types';

/**
 * 更新出貨單
 * @route PUT /api/shipping-orders/:id
 */
export async function updateShippingOrder(req: Request, res: Response) {
  try {
    const { soid, status } = req.body as ShippingOrderRequest;
    let { items } = req.body as ShippingOrderRequest;

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
        res.status(400).json(createErrorResponse(itemsValidation.message || '驗證失敗'));
        return;
      }
      
      // 使用處理後的項目
      if (itemsValidation.processedItems) {
        items = itemsValidation.processedItems;
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
    if (shippingOrder) {
      Object.keys(updateData).forEach(key => {
        // 使用索引簽名訪問屬性
        (shippingOrder as any)[key] = updateData[key];
      });
      
      // 手動計算總金額以確保正確
      shippingOrder.totalAmount = shippingOrder.items.reduce(
        (total: number, item: any) => total + Number(item.dtotalCost), 0
      );
      
      // 保存更新後的出貨單
      await shippingOrder.save();

      // 如果需要創建庫存記錄
      if (statusChangeResult.needCreateInventory) {
        await createShippingInventoryRecords(shippingOrder);
      }
    }

    res.json(createSuccessResponse(shippingOrder, SUCCESS_MESSAGES.GENERIC.UPDATED));
  } catch (err) {
    handleDatabaseError(res, err as Error, '更新出貨單錯誤');
  }
}
import { Request, Response } from 'express';
import ShippingOrder from '../../../models/ShippingOrder';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  handleDatabaseError,
  deleteShippingInventoryRecords
} from '../services';

/**
 * 刪除出貨單
 * @route DELETE /api/shipping-orders/:id
 */
export async function deleteShippingOrder(req: Request, res: Response) {
  try {
    const shippingOrder = await ShippingOrder.findById(req.params.id);
    if (!shippingOrder) {
      res.status(404).json(createErrorResponse('找不到該出貨單'));
      return;
    }

    // 如果出貨單已完成，刪除相關的ship類型庫存記錄
    if (shippingOrder.status === 'completed') {
      await deleteShippingInventoryRecords(shippingOrder._id);
    }

    await shippingOrder.deleteOne();
    res.json(createSuccessResponse(null, '出貨單已刪除'));
  } catch (err) {
    handleDatabaseError(res, err as Error);
  }
}
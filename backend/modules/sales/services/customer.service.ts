import Customer from '../../../models/Customer';
import logger from '../../../utils/logger';
import { SaleDocument } from '../sales.types';
import { isValidObjectId } from './validation.service';

// 更新客戶積分
export async function updateCustomerPoints(sale: SaleDocument): Promise<void> {
  // 如果有客戶，更新客戶積分
  if (!sale.customer) return;
  
  // 驗證客戶ID格式，防止 NoSQL 注入
  if (!isValidObjectId(sale.customer.toString())) {
    logger.error(`客戶ID格式無效: ${sale.customer}`);
    return;
  }
  
  const customerToUpdate = await Customer.findOne({ _id: sale.customer });
  if (!customerToUpdate) return;
  
  // 更新客戶總購買金額
  customerToUpdate.totalPurchases = (customerToUpdate.totalPurchases ?? 0) + sale.totalAmount;
  customerToUpdate.lastPurchaseDate = new Date();
  await customerToUpdate.save();
  
  logger.debug(`為客戶 ${customerToUpdate._id} 更新購買記錄，金額: ${sale.totalAmount}`);
}
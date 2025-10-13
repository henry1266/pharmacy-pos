import { SaleItem, SaleData } from '../types/edit';
import { Product } from '@pharmacy-pos/shared/types/entities';
import type { PaymentStatus } from '@pharmacy-pos/shared/schemas/zod/sale';
import { calculateSaleTotals } from './saleTotals';import {
  DEFAULT_PAYMENT_METHOD,
  DEFAULT_PAYMENT_STATUS,
  ensurePaymentMethod,
  ensurePaymentStatus,
} from '../constants/payment';

/**
 * 格式化銷售項目
 * 將後端返回的銷售項目格式化為前端使用的格式
 * 
 * @param item 後端返回的銷售項目
 * @returns 格式化後的銷售項目
 */
export const formatSaleItem = (item: any): SaleItem => {
  return {
    product: typeof item.product === 'object' ? item.product._id : item.product,
    productDetails: typeof item.product === 'object' ? item.product : undefined,
    name: typeof item.product === 'object' ? item.product.name : 'Unknown',
    code: typeof item.product === 'object' ? item.product.code : 'Unknown',
    price: item.price,
    quantity: item.quantity,
    subtotal: item.price * item.quantity,
    productType: typeof item.product === 'object' ? item.product.productType : undefined
  };
};

/**
 * 格式化銷售數據
 * 將後端返回的銷售數據格式化為前端使用的格式
 * 
 * @param saleData 後端返回的銷售數據
 * @returns 格式化後的銷售數據
 */
export const formatSaleData = (saleData: any): SaleData => {
  // 確定付款狀態
  const statusFromLifecycle: PaymentStatus | undefined = saleData.status === 'completed'
    ? 'paid'
    : saleData.status === 'cancelled'
      ? 'cancelled'
      : undefined;

  const paymentStatus = ensurePaymentStatus(
    statusFromLifecycle ?? saleData.paymentStatus,
    DEFAULT_PAYMENT_STATUS,
  );

  const formattedItems = saleData.items.map((item: any) => formatSaleItem(item));
  const { grossAmount, discountAmount, netAmount } = calculateSaleTotals(
    formattedItems,
    saleData.discount ?? 0,
  );

  return {
    customer: typeof saleData.customer === 'object' ? saleData.customer._id : (saleData.customer ?? ''),
    items: formattedItems,
    totalAmount: netAmount,
    discount: parseFloat(saleData.discount.toString()) || 0,
    ...(discountAmount > 0 ? { discountAmount } : {}),
    discountAmount,
    paymentMethod: ensurePaymentMethod(saleData.paymentMethod, DEFAULT_PAYMENT_METHOD),
    paymentStatus,
    notes: saleData.notes ?? ''
  };
};

/**
 * 準備銷售數據以便提交到後端
 * 將前端使用的銷售數據格式化為後端需要的格式
 * 
 * @param saleData 前端使用的銷售數據
 * @returns 格式化後的銷售數據，準備提交到後端
 */
export const prepareSaleDataForSubmission = (saleData: SaleData) => {
  const { grossAmount, discountAmount } = calculateSaleTotals(saleData.items, saleData.discount);
  return {
    customer: saleData.customer ?? null,
    items: saleData.items.map(item => ({
      product: item.product,
      quantity: item.quantity,
      price: parseFloat(item.price.toString()) ?? 0,
      subtotal: (parseFloat(item.price.toString()) ?? 0) * item.quantity
    })),
    totalAmount: grossAmount,
    discount: parseFloat(saleData.discount.toString()) || 0,
    ...(discountAmount > 0 ? { discountAmount } : {}),
    paymentMethod: saleData.paymentMethod,
    paymentStatus: saleData.paymentStatus,
    notes: saleData.notes,
  };
};

/**
 * 查找產品
 * 根據條碼、代碼、簡碼或健保碼查找產品
 * 
 * @param barcode 條碼、代碼、簡碼或健保碼
 * @param products 產品列表
 * @returns 找到的產品，如果沒有找到則返回 undefined
 */
export const findProductByCode = (barcode: string, products: Product[]): Product | undefined => {
  return products.find(p =>
    String(p.code) === barcode ||
    String(p.barcode) === barcode ||
    String((p as any).shortCode) === barcode ||
    String((p as any).healthInsuranceCode) === barcode
  );
};

/**
 * 計算總金額
 * 根據銷售項目和折扣計算總金額
 *
 * @param items 銷售項目列表
 * @param discount 折扣金額
 * @returns 計算後的總金額
 */
export const calculateTotalAmount = <T extends { price: number; quantity: number }>(
  items: T[],
  discount: number,
): number => {
  const subtotals = items.map(item => ({
    subtotal: parseFloat(item.price.toString()) * item.quantity,
  }));
  const { netAmount } = calculateSaleTotals(subtotals, parseFloat(discount.toString()) || 0);
  return netAmount;
};

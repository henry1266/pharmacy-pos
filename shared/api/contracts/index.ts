import { initContract } from '@ts-rest/core';
import { salesContract } from './sales';
import { customersContract } from './customers';
import { suppliersContract } from './suppliers';
import { purchaseOrdersContract } from './purchaseOrders';
import { shippingOrdersContract } from './shippingOrders';

const c = initContract();

export const pharmacyContract = c.router({
  sales: salesContract,
  customers: customersContract,
  suppliers: suppliersContract,
  purchaseOrders: purchaseOrdersContract,
  shippingOrders: shippingOrdersContract,
});

export type PharmacyContract = typeof pharmacyContract;
export { salesContract, customersContract, suppliersContract, purchaseOrdersContract, shippingOrdersContract };
export type { SalesContract } from './sales';
export type { CustomersContract } from './customers';
export type { SuppliersContract } from './suppliers';
export type { PurchaseOrdersContract } from './purchaseOrders';
export type { ShippingOrdersContract } from './shippingOrders';

import { salesContract } from './sales';
import type { SalesContract } from './sales';
import { customersContract } from './customers';
import type { CustomersContract } from './customers';
import { suppliersContract } from './suppliers';
import type { SuppliersContract } from './suppliers';
import { employeesContract } from './employees';
import type { EmployeesContract } from './employees';
import { purchaseOrdersContract } from './purchaseOrders';
import type { PurchaseOrdersContract } from './purchaseOrders';
import { shippingOrdersContract } from './shippingOrders';
import type { ShippingOrdersContract } from './shippingOrders';
import { dashboardContract } from './dashboard';
import type { DashboardContract } from './dashboard';
import { accountingContract } from './accounting';
import type { AccountingContract } from './accounting';
import { productsContract } from './products';
import type { ProductsContract } from './products';
import { fifoContract } from './fifo';
import type { FifoContract } from './fifo';

export type PharmacyContract = {
  sales: SalesContract;
  customers: CustomersContract;
  suppliers: SuppliersContract;
  employees: EmployeesContract;
  purchaseOrders: PurchaseOrdersContract;
  shippingOrders: ShippingOrdersContract;
  dashboard: DashboardContract;
  accounting: AccountingContract;
  products: ProductsContract;
  fifo: FifoContract;
};

export const pharmacyContract: PharmacyContract = {
  sales: salesContract,
  customers: customersContract,
  suppliers: suppliersContract,
  employees: employeesContract,
  purchaseOrders: purchaseOrdersContract,
  shippingOrders: shippingOrdersContract,
  dashboard: dashboardContract,
  accounting: accountingContract,
  products: productsContract,
  fifo: fifoContract,
};

export {
  salesContract,
  customersContract,
  suppliersContract,
  purchaseOrdersContract,
  shippingOrdersContract,
  accountingContract,
  dashboardContract,
  employeesContract,
  productsContract,
  fifoContract,
};

export type {
  SalesContract,
  CustomersContract,
  SuppliersContract,
  PurchaseOrdersContract,
  ShippingOrdersContract,
  AccountingContract,
  DashboardContract,
  EmployeesContract,
  ProductsContract,
  FifoContract,
};

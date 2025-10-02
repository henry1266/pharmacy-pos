import { initContract } from '@ts-rest/core';
import { salesContract } from './sales';
import { customersContract } from './customers';

const c = initContract();

export const pharmacyContract = c.router({
  sales: salesContract,
  customers: customersContract,
});

export type PharmacyContract = typeof pharmacyContract;
export { salesContract, customersContract };
export type { SalesContract } from './sales';
export type { CustomersContract } from './customers';

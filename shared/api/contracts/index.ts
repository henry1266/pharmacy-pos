import { initContract } from '@ts-rest/core';
import { salesContract } from './sales';

const c = initContract();

export const pharmacyContract = c.router({
  sales: salesContract,
});

export type PharmacyContract = typeof pharmacyContract;
export { salesContract };
export type { SalesContract } from './sales';

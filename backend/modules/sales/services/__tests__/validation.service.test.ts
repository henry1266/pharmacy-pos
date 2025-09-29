import mongoose from 'mongoose';
import Customer from '../../../../models/Customer';
import BaseProduct from '../../../../models/BaseProduct';
import Inventory from '../../../../models/Inventory';
import logger from '../../../../utils/logger';
import {
  isValidObjectId,
  checkCustomerExists,
  checkProductExists,
  checkProductInventory,
} from '../validation.service';
import { API_CONSTANTS, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';

jest.mock('../../../../models/Customer');
jest.mock('../../../../models/BaseProduct');
jest.mock('../../../../models/Inventory');
jest.mock('../../../../utils/logger');

describe('validation.service', () => {
  afterEach(() => jest.resetAllMocks());

  describe('isValidObjectId', () => {
    it('returns true for valid ObjectId', () => {
      const id = new mongoose.Types.ObjectId().toString();
      expect(isValidObjectId(id)).toBe(true);
    });

    it('returns false for invalid id', () => {
      expect(isValidObjectId('invalid-id')).toBe(false);
    });
  });

  describe('checkCustomerExists', () => {
    it('passes when customerId is undefined', async () => {
      const result = await checkCustomerExists();
      expect(result.exists).toBe(true);
    });

    it('returns error for invalid id', async () => {
      const result = await checkCustomerExists('bad-id');
      expect(result.exists).toBe(false);
      expect(result.error?.statusCode).toBe(API_CONSTANTS.HTTP_STATUS.NOT_FOUND);
    });

    it('returns error if not found', async () => {
      (Customer.findById as jest.Mock).mockResolvedValue(null);
      const id = new mongoose.Types.ObjectId().toString();
      const result = await checkCustomerExists(id);
      expect(result.exists).toBe(false);
      expect(result.error?.message).toBe(ERROR_MESSAGES.CUSTOMER.NOT_FOUND);
    });

    it('returns success if found', async () => {
      (Customer.findById as jest.Mock).mockResolvedValue({ _id: true });
      const id = new mongoose.Types.ObjectId().toString();
      const result = await checkCustomerExists(id);
      expect(result.exists).toBe(true);
    });
  });

  describe('checkProductExists', () => {
    it('returns error for invalid product id', async () => {
      const result = await checkProductExists('bad-id');
      expect(result.exists).toBe(false);
      expect(result.error?.message).toContain('產品ID bad-id 無效');
    });

    it('returns error if product not found', async () => {
      (BaseProduct.findById as jest.Mock).mockResolvedValue(null);
      const id = new mongoose.Types.ObjectId().toString();
      const result = await checkProductExists(id);
      expect(result.exists).toBe(false);
      expect(result.error?.message).toContain('不存在');
    });

    it('returns success if product exists', async () => {
      (BaseProduct.findById as jest.Mock).mockResolvedValue({ _id: true });
      const id = new mongoose.Types.ObjectId().toString();
      const result = await checkProductExists(id);
      expect(result.exists).toBe(true);
      expect(result.product).toBeDefined();
    });
  });

  describe('checkProductInventory', () => {
    const fakeProduct = { _id: new mongoose.Types.ObjectId().toString(), excludeFromStock: false, name: 'Test' };
    it('skips inventory for excludeFromStock true', async () => {
      const prod = { ...fakeProduct, excludeFromStock: true };
      const res = await checkProductInventory(prod as any, 5);
      expect(res.success).toBe(true);
    });

    it('calculates total and logs warning on low stock', async () => {
      (Inventory.find as jest.Mock).mockResolvedValue([{ quantity: 2 }, { quantity: 1 }]);
      const spy = jest.spyOn(logger, 'warn');
      const res = await checkProductInventory(fakeProduct as any, 5);
      expect(res.success).toBe(true);
      expect(spy).toHaveBeenCalled();
    });

    it('handles errors and returns failure', async () => {
      (Inventory.find as jest.Mock).mockImplementation(() => { throw new Error('fail'); });
      const res = await checkProductInventory(fakeProduct as any, 1);
      expect(res.success).toBe(false);
      expect(res.error?.statusCode).toBe(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    });
  });
});
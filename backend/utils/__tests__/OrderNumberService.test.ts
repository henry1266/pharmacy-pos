import mongoose from 'mongoose';
import OrderNumberService from '../OrderNumberService';

// 模擬 mongoose.model
jest.mock('mongoose', () => {
  const originalModule = jest.requireActual('mongoose');
  return {
    ...originalModule,
    model: jest.fn().mockImplementation((_modelName) => {
      // 模擬不同的模型
      return {
        findOne: jest.fn().mockImplementation(() => {
          return {
            sort: jest.fn().mockImplementation(() => {
              return {
                lean: jest.fn().mockResolvedValue(null)
              };
            }),
            lean: jest.fn().mockResolvedValue(null)
          };
        })
      };
    })
  };
});

describe('OrderNumberService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateUniqueOrderNumber', () => {
    it('應該為 purchase 類型生成唯一訂單號', async () => {
      const baseOrderNumber = 'PO20250805001';
      const result = await OrderNumberService.generateUniqueOrderNumber('purchase', baseOrderNumber);
      
      expect(result).toBe(baseOrderNumber);
      expect(mongoose.model).toHaveBeenCalledWith('purchaseorder');
    });

    it('應該為 shipping 類型生成唯一訂單號', async () => {
      const baseOrderNumber = 'SO20250805001';
      const result = await OrderNumberService.generateUniqueOrderNumber('shipping', baseOrderNumber);
      
      expect(result).toBe(baseOrderNumber);
      expect(mongoose.model).toHaveBeenCalledWith('shippingorder');
    });

    it('應該為 sale 類型生成唯一訂單號', async () => {
      const baseOrderNumber = 'SALE20250805001';
      const result = await OrderNumberService.generateUniqueOrderNumber('sale', baseOrderNumber);
      
      expect(result).toBe(baseOrderNumber);
      expect(mongoose.model).toHaveBeenCalledWith('sale');
    });

    it('應該在不支持的訂單類型時拋出錯誤', async () => {
      const baseOrderNumber = 'UNKNOWN20250805001';
      
      await expect(
        OrderNumberService.generateUniqueOrderNumber('unknown', baseOrderNumber)
      ).rejects.toThrow('不支持的訂單類型: unknown');
    });
  });
});
/**
 * 庫存服務 V2 測試
 * 驗證新的統一 API 客戶端架構
 */

// Jest globals are available in the test environment
declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;

// Jest mock types
interface MockedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T>;
  mockResolvedValue(value: any): MockedFunction<T>;
  mockRejectedValue(value: any): MockedFunction<T>;
  mockClear(): void;
}

interface MockedAxios {
  get: MockedFunction<typeof axios.get>;
  post: MockedFunction<typeof axios.post>;
  put: MockedFunction<typeof axios.put>;
  delete: MockedFunction<typeof axios.delete>;
}

// Mock jest object
const jest = {
  mock: (moduleName: string) => {},
  clearAllMocks: () => {}
};
import axios from 'axios';
import {
  getAllInventory,
  getInventoryById,
  getInventoryByProduct,
  createInventory,
  updateInventory,
  deleteInventory,
  createBatchInventory,
  getInventoryStats,
  getInventoryHistory
} from '../services/inventoryServiceV2';
import type { Inventory } from '@pharmacy-pos/shared/types/entities';

// Mock axios
const mockedAxios = axios as unknown as MockedAxios;

describe('庫存服務 V2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockInventory: Inventory = {
    _id: '507f1f77bcf86cd799439011',
    product: '507f1f77bcf86cd799439012',
    quantity: 100,
    totalAmount: 1000,
    type: 'purchase',
    date: new Date('2023-01-01'),
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };

  const mockApiResponse = {
    data: {
      success: true,
      message: '操作成功',
      data: mockInventory
    }
  };

  describe('getAllInventory', () => {
    it('應該成功獲取所有庫存記錄', async () => {
      const mockInventoryList = [mockInventory];
      mockedAxios.get.mockResolvedValue({
        data: {
          success: true,
          message: '庫存項目獲取成功',
          data: mockInventoryList
        }
      });

      const result = await getAllInventory();

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/inventory', { params: undefined });
      expect(result).toEqual(mockInventoryList);
    });

    it('應該支援查詢參數', async () => {
      const queryParams = { productId: '507f1f77bcf86cd799439012', type: 'purchase' as const };
      mockedAxios.get.mockResolvedValue({
        data: {
          success: true,
          data: [mockInventory]
        }
      });

      await getAllInventory(queryParams);

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/inventory', { params: queryParams });
    });
  });

  describe('getInventoryById', () => {
    it('應該成功根據ID獲取庫存記錄', async () => {
      mockedAxios.get.mockResolvedValue(mockApiResponse);

      const result = await getInventoryById('507f1f77bcf86cd799439011');

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/inventory/507f1f77bcf86cd799439011');
      expect(result).toEqual(mockInventory);
    });
  });

  describe('getInventoryByProduct', () => {
    it('應該成功根據產品ID獲取庫存記錄', async () => {
      const mockInventoryList = [mockInventory];
      mockedAxios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockInventoryList
        }
      });

      const result = await getInventoryByProduct('507f1f77bcf86cd799439012');

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/inventory/product/507f1f77bcf86cd799439012');
      expect(result).toEqual(mockInventoryList);
    });
  });

  describe('createInventory', () => {
    it('應該成功創建庫存記錄', async () => {
      const createData = {
        product: '507f1f77bcf86cd799439012',
        quantity: 100,
        type: 'purchase' as const,
        totalAmount: 1000
      };

      mockedAxios.post.mockResolvedValue(mockApiResponse);

      const result = await createInventory(createData);

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/inventory', createData);
      expect(result).toEqual(mockInventory);
    });
  });

  describe('updateInventory', () => {
    it('應該成功更新庫存記錄', async () => {
      const updateData = {
        quantity: 150,
        totalAmount: 1500
      };

      mockedAxios.put.mockResolvedValue(mockApiResponse);

      const result = await updateInventory('507f1f77bcf86cd799439011', updateData);

      expect(mockedAxios.put).toHaveBeenCalledWith('/api/inventory/507f1f77bcf86cd799439011', updateData);
      expect(result).toEqual(mockInventory);
    });
  });

  describe('deleteInventory', () => {
    it('應該成功刪除庫存記錄', async () => {
      mockedAxios.delete.mockResolvedValue({
        data: {
          success: true,
          message: '庫存記錄已刪除'
        }
      });

      const result = await deleteInventory('507f1f77bcf86cd799439011');

      expect(mockedAxios.delete).toHaveBeenCalledWith('/api/inventory/507f1f77bcf86cd799439011');
      expect(result).toEqual({ success: true, message: '庫存記錄已刪除' });
    });
  });

  describe('createBatchInventory', () => {
    it('應該成功批量創建庫存記錄', async () => {
      const batchData = [
        {
          product: '507f1f77bcf86cd799439012',
          quantity: 100,
          type: 'purchase' as const
        },
        {
          product: '507f1f77bcf86cd799439013',
          quantity: 50,
          type: 'purchase' as const
        }
      ];

      const mockBatchResult = [mockInventory, { ...mockInventory, _id: '507f1f77bcf86cd799439014' }];
      mockedAxios.post.mockResolvedValue({
        data: {
          success: true,
          data: mockBatchResult
        }
      });

      const result = await createBatchInventory(batchData);

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/inventory/batch', { items: batchData });
      expect(result).toEqual(mockBatchResult);
    });
  });

  describe('getInventoryStats', () => {
    it('應該成功獲取庫存統計', async () => {
      const mockStats = {
        totalRecords: 100,
        totalQuantity: 5000,
        totalAmount: 50000,
        byType: {
          purchase: { count: 60, quantity: 3000, amount: 30000 },
          sale: { count: 40, quantity: 2000, amount: 20000 }
        }
      };

      mockedAxios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockStats
        }
      });

      const result = await getInventoryStats();

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/inventory/stats', { params: undefined });
      expect(result).toEqual(mockStats);
    });
  });

  describe('getInventoryHistory', () => {
    it('應該成功獲取庫存歷史記錄', async () => {
      const mockHistory = [mockInventory];
      mockedAxios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockHistory
        }
      });

      const result = await getInventoryHistory('507f1f77bcf86cd799439012');

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/inventory/history/507f1f77bcf86cd799439012', { params: undefined });
      expect(result).toEqual(mockHistory);
    });

    it('應該支援查詢參數', async () => {
      const params = {
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        limit: 10,
        offset: 0
      };

      mockedAxios.get.mockResolvedValue({
        data: {
          success: true,
          data: [mockInventory]
        }
      });

      await getInventoryHistory('507f1f77bcf86cd799439012', params);

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/inventory/history/507f1f77bcf86cd799439012', { params });
    });
  });

  describe('錯誤處理', () => {
    it('應該正確處理 API 錯誤', async () => {
      const errorResponse = {
        response: {
          data: {
            message: '庫存記錄不存在'
          }
        }
      };

      mockedAxios.get.mockRejectedValue(errorResponse);

      await expect(getInventoryById('invalid-id')).rejects.toThrow('庫存記錄不存在');
    });

    it('應該處理網路錯誤', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      await expect(getAllInventory()).rejects.toThrow('GET  失敗');
    });
  });
});
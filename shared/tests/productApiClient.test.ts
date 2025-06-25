/**
 * 產品 API 客戶端測試
 * 驗證修復後的 API 客戶端功能
 */

import { ProductApiClient } from '../services/productApiClient';
import { ProductType } from '../enums';
import type { HttpClient } from '../services/baseApiClient';
import type { Product } from '../types/entities';

// Mock HTTP 客戶端
const mockHttpClient: HttpClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

describe('ProductApiClient', () => {
  let productApiClient: ProductApiClient;

  beforeEach(() => {
    productApiClient = new ProductApiClient(mockHttpClient);
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    it('應該為商品使用正確的端點', async () => {
      const productData: Partial<Product> = {
        name: '測試商品',
        productType: ProductType.PRODUCT,
        unit: '個',
        price: 100
      };

      const mockResponse: Product = {
        _id: '1',
        code: 'P00001',
        name: '測試商品',
        productType: ProductType.PRODUCT,
        unit: '個',
        price: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (mockHttpClient.post as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResponse
      });

      await productApiClient.createProduct(productData);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/products/product',
        productData
      );
    });

    it('應該為藥品使用正確的端點', async () => {
      const medicineData: Partial<Product> = {
        name: '測試藥品',
        productType: ProductType.MEDICINE,
        unit: '盒',
        price: 200
      };

      const mockResponse: Product = {
        _id: '2',
        code: 'M00001',
        name: '測試藥品',
        productType: ProductType.MEDICINE,
        unit: '盒',
        price: 200,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (mockHttpClient.post as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResponse
      });

      await productApiClient.createProduct(medicineData);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/products/medicine',
        medicineData
      );
    });

    it('應該為未指定類型的產品使用商品端點', async () => {
      const productData: Partial<Product> = {
        name: '未分類產品',
        unit: '個',
        price: 50
      };

      const mockResponse: Product = {
        _id: '3',
        code: 'P00002',
        name: '未分類產品',
        unit: '個',
        price: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (mockHttpClient.post as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResponse
      });

      await productApiClient.createProduct(productData);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/products/product',
        productData
      );
    });
  });

  describe('searchProducts', () => {
    const mockProducts: Product[] = [
      {
        _id: '1',
        code: 'P00001',
        name: '阿斯匹靈',
        unit: '盒',
        price: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: '2',
        code: 'P00002',
        shortCode: 'ASP',
        name: '維他命C',
        unit: '瓶',
        price: 200,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: '3',
        code: 'M00001',
        name: '感冒糖漿',
        description: '治療感冒症狀',
        unit: '瓶',
        price: 150,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    beforeEach(() => {
      (mockHttpClient.get as jest.Mock).mockResolvedValue({
        success: true,
        data: mockProducts
      });
    });

    it('應該根據產品名稱搜尋', async () => {
      const results = await productApiClient.searchProducts('阿斯匹靈');
      
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('阿斯匹靈');
    });

    it('應該根據產品代碼搜尋', async () => {
      const results = await productApiClient.searchProducts('P00002');
      
      expect(results).toHaveLength(1);
      expect(results[0].code).toBe('P00002');
    });

    it('應該根據簡碼搜尋', async () => {
      const results = await productApiClient.searchProducts('ASP');
      
      expect(results).toHaveLength(1);
      expect(results[0].shortCode).toBe('ASP');
    });

    it('應該根據描述搜尋', async () => {
      const results = await productApiClient.searchProducts('感冒');
      
      expect(results).toHaveLength(1);
      expect(results[0].description).toContain('感冒');
    });

    it('空查詢應該返回所有產品', async () => {
      const results = await productApiClient.searchProducts('');
      
      expect(results).toHaveLength(3);
    });

    it('不匹配的查詢應該返回空陣列', async () => {
      const results = await productApiClient.searchProducts('不存在的產品');
      
      expect(results).toHaveLength(0);
    });
  });

  describe('getLowStockProducts', () => {
    const mockProducts: Product[] = [
      {
        _id: '1',
        code: 'P00001',
        name: '低庫存產品',
        unit: '個',
        price: 100,
        stock: 5,
        minStock: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: '2',
        code: 'P00002',
        name: '正常庫存產品',
        unit: '個',
        price: 200,
        stock: 20,
        minStock: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: '3',
        code: 'P00003',
        name: '無庫存資訊產品',
        unit: '個',
        price: 150,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    beforeEach(() => {
      (mockHttpClient.get as jest.Mock).mockResolvedValue({
        success: true,
        data: mockProducts
      });
    });

    it('應該只返回低庫存產品', async () => {
      const results = await productApiClient.getLowStockProducts();
      
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('低庫存產品');
      expect(results[0].stock).toBeLessThanOrEqual(results[0].minStock!);
    });
  });

  describe('updateProductStock', () => {
    it('應該批量更新產品庫存', async () => {
      const updates = [
        { id: '1', quantity: 50 },
        { id: '2', quantity: 30 }
      ];

      const mockUpdatedProducts: Product[] = [
        {
          _id: '1',
          code: 'P00001',
          name: '產品1',
          unit: '個',
          price: 100,
          stock: 50,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: '2',
          code: 'P00002',
          name: '產品2',
          unit: '個',
          price: 200,
          stock: 30,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      (mockHttpClient.put as jest.Mock)
        .mockResolvedValueOnce({
          success: true,
          data: mockUpdatedProducts[0]
        })
        .mockResolvedValueOnce({
          success: true,
          data: mockUpdatedProducts[1]
        });

      const results = await productApiClient.updateProductStock(updates);

      expect(results).toHaveLength(2);
      expect(mockHttpClient.put).toHaveBeenCalledTimes(2);
      expect(mockHttpClient.put).toHaveBeenCalledWith('/api/products/1', { stock: 50 });
      expect(mockHttpClient.put).toHaveBeenCalledWith('/api/products/2', { stock: 30 });
    });

    it('應該處理部分更新失敗的情況', async () => {
      const updates = [
        { id: '1', quantity: 50 },
        { id: '2', quantity: 30 }
      ];

      const mockUpdatedProduct: Product = {
        _id: '1',
        code: 'P00001',
        name: '產品1',
        unit: '個',
        price: 100,
        stock: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (mockHttpClient.put as jest.Mock)
        .mockResolvedValueOnce({
          success: true,
          data: mockUpdatedProduct
        })
        .mockRejectedValueOnce(new Error('更新失敗'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const results = await productApiClient.updateProductStock(updates);

      expect(results).toHaveLength(1);
      expect(results[0]._id).toBe('1');
      expect(consoleSpy).toHaveBeenCalledWith('更新產品 2 庫存失敗:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});
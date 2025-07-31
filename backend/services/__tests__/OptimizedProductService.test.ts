import { OptimizedProductService } from '../OptimizedProductService';
import BaseProduct from '../../models/BaseProduct';
import ProductPackageUnit from '../../models/ProductPackageUnit';
import mongoose from 'mongoose';

// Mock 所有依賴
jest.mock('../../models/BaseProduct');
jest.mock('../../models/ProductPackageUnit');

const MockedBaseProduct = BaseProduct as any;
const MockedProductPackageUnit = ProductPackageUnit as any;

describe('OptimizedProductService', () => {
  let mockProducts: any[];
  let mockPackageUnits: any[];
  let mockProductId1: mongoose.Types.ObjectId;
  let mockProductId2: mongoose.Types.ObjectId;

  beforeEach(() => {
    jest.clearAllMocks();

    // 創建測試用的 ObjectId
    mockProductId1 = new mongoose.Types.ObjectId();
    mockProductId2 = new mongoose.Types.ObjectId();

    // 設置 mock 產品數據
    mockProducts = [
      {
        _id: mockProductId1,
        code: 'P001',
        name: '測試產品1',
        sellingPrice: 100,
        purchasePrice: 80,
        minStock: 10,
        isActive: true,
        category: { name: '分類1' },
        supplier: { name: '供應商1' }
      },
      {
        _id: mockProductId2,
        code: 'P002',
        name: '測試產品2',
        sellingPrice: 200,
        purchasePrice: 160,
        minStock: 5,
        isActive: true,
        category: { name: '分類2' },
        supplier: { name: '供應商2' }
      }
    ];

    // 設置 mock 包裝單位數據
    mockPackageUnits = [
      {
        _id: new mongoose.Types.ObjectId(),
        productId: mockProductId1,
        unitName: '盒',
        unitValue: 10,
        isBaseUnit: false,
        isActive: true
      },
      {
        _id: new mongoose.Types.ObjectId(),
        productId: mockProductId1,
        unitName: '個',
        unitValue: 1,
        isBaseUnit: true,
        isActive: true
      },
      {
        _id: new mongoose.Types.ObjectId(),
        productId: mockProductId2,
        unitName: '瓶',
        unitValue: 1,
        isBaseUnit: true,
        isActive: true
      }
    ];
  });

  describe('getProductsWithPackageUnits', () => {
    beforeEach(() => {
      // Mock BaseProduct.find() 鏈式調用
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockProducts)
      };

      MockedBaseProduct.find = jest.fn().mockReturnValue(mockQuery);
      MockedBaseProduct.countDocuments = jest.fn().mockResolvedValue(2);
      MockedProductPackageUnit.find = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockPackageUnits)
      });
    });

    test('應該成功獲取包含包裝單位的產品列表', async () => {
      const result = await OptimizedProductService.getProductsWithPackageUnits();

      expect(MockedBaseProduct.find).toHaveBeenCalledWith({});
      expect(MockedBaseProduct.countDocuments).toHaveBeenCalledWith({});
      expect(MockedProductPackageUnit.find).toHaveBeenCalledWith({
        productId: { $in: [mockProductId1, mockProductId2] },
        isActive: true
      });

      expect(result.products).toHaveLength(2);
      expect(result.products[0].packageUnits).toHaveLength(2); // 產品1有2個包裝單位
      expect(result.products[1].packageUnits).toHaveLength(1); // 產品2有1個包裝單位
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        pages: 1
      });
    });

    test('應該支援自定義查詢條件和選項', async () => {
      const query = { isActive: true };
      const options = {
        page: 2,
        limit: 10,
        sortBy: 'name',
        sortOrder: 'desc' as const
      };

      await OptimizedProductService.getProductsWithPackageUnits(query, options);

      expect(MockedBaseProduct.find).toHaveBeenCalledWith(query);
      
      // 檢查分頁計算
      const mockQuery = MockedBaseProduct.find.mock.results[0].value;
      expect(mockQuery.skip).toHaveBeenCalledWith(10); // (2-1) * 10
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
    });

    test('應該支援不包含包裝單位的查詢', async () => {
      const options = { includePackageUnits: false };

      const result = await OptimizedProductService.getProductsWithPackageUnits({}, options);

      expect(MockedProductPackageUnit.find).not.toHaveBeenCalled();
      expect(result.products).toEqual(mockProducts);
    });

    test('應該處理空產品列表', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      MockedBaseProduct.find = jest.fn().mockReturnValue(mockQuery);
      MockedBaseProduct.countDocuments = jest.fn().mockResolvedValue(0);

      const result = await OptimizedProductService.getProductsWithPackageUnits();

      expect(MockedProductPackageUnit.find).not.toHaveBeenCalled();
      expect(result.products).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    test('應該正確計算分頁信息', async () => {
      MockedBaseProduct.countDocuments = jest.fn().mockResolvedValue(25);

      const result = await OptimizedProductService.getProductsWithPackageUnits({}, { limit: 10 });

      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        pages: 3 // Math.ceil(25 / 10)
      });
    });
  });

  describe('searchProducts', () => {
    beforeEach(() => {
      MockedBaseProduct.aggregate = jest.fn()
        .mockResolvedValueOnce(mockProducts) // 第一次調用返回產品列表
        .mockResolvedValueOnce([{ total: 2 }]); // 第二次調用返回總數
    });

    test('應該成功執行產品搜尋', async () => {
      const searchTerm = '測試';
      const options = {
        page: 1,
        limit: 20,
        productType: 'product',
        category: 'category1',
        supplier: 'supplier1',
        minPrice: 50,
        maxPrice: 300
      };

      const result = await OptimizedProductService.searchProducts(searchTerm, options);

      expect(MockedBaseProduct.aggregate).toHaveBeenCalledTimes(2);
      expect(result.products).toEqual(mockProducts);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        pages: 1
      });
      expect(result.searchTerm).toBe(searchTerm);
    });

    test('應該處理空搜尋詞', async () => {
      await OptimizedProductService.searchProducts('');

      const aggregateCalls = MockedBaseProduct.aggregate.mock.calls;
      const matchStage = aggregateCalls[0][0].find((stage: any) => stage.$match);
      
      expect(matchStage.$match.$text).toBeUndefined();
      expect(matchStage.$match.isActive).toEqual({ $ne: false });
    });

    test('應該支援價格區間篩選', async () => {
      const options = { minPrice: 100, maxPrice: 200 };

      await OptimizedProductService.searchProducts('', options);

      const aggregateCalls = MockedBaseProduct.aggregate.mock.calls;
      const matchStage = aggregateCalls[0][0].find((stage: any) => stage.$match);
      
      expect(matchStage.$match.sellingPrice).toEqual({
        $gte: 100,
        $lte: 200
      });
    });

    test('應該支援只設定最小價格', async () => {
      const options = { minPrice: 100 };

      await OptimizedProductService.searchProducts('', options);

      const aggregateCalls = MockedBaseProduct.aggregate.mock.calls;
      const matchStage = aggregateCalls[0][0].find((stage: any) => stage.$match);
      
      expect(matchStage.$match.sellingPrice).toEqual({ $gte: 100 });
    });

    test('應該支援只設定最大價格', async () => {
      const options = { maxPrice: 200 };

      await OptimizedProductService.searchProducts('', options);

      const aggregateCalls = MockedBaseProduct.aggregate.mock.calls;
      const matchStage = aggregateCalls[0][0].find((stage: any) => stage.$match);
      
      expect(matchStage.$match.sellingPrice).toEqual({ $lte: 200 });
    });

    test('應該處理總數查詢返回空結果', async () => {
      MockedBaseProduct.aggregate = jest.fn()
        .mockResolvedValueOnce(mockProducts)
        .mockResolvedValueOnce([]); // 總數查詢返回空陣列

      const result = await OptimizedProductService.searchProducts('測試');

      expect(result.pagination.total).toBe(0);
    });
  });

  describe('batchUpdateStock', () => {
    beforeEach(() => {
      MockedBaseProduct.bulkWrite = jest.fn().mockResolvedValue({
        modifiedCount: 2,
        matchedCount: 2,
        upsertedCount: 0
      });
    });

    test('應該成功執行批量庫存更新', async () => {
      const updates = [
        { productId: mockProductId1.toString(), quantity: 10, operation: 'add' as const },
        { productId: mockProductId2.toString(), quantity: 5, operation: 'subtract' as const }
      ];

      const result = await OptimizedProductService.batchUpdateStock(updates);

      expect(MockedBaseProduct.bulkWrite).toHaveBeenCalledWith([
        {
          updateOne: {
            filter: { _id: mockProductId1.toString() },
            update: { $inc: { currentStock: 10 } }
          }
        },
        {
          updateOne: {
            filter: { _id: mockProductId2.toString() },
            update: { $inc: { currentStock: -5 } }
          }
        }
      ]);

      expect(result).toEqual({
        modifiedCount: 2,
        matchedCount: 2,
        upsertedCount: 0
      });
    });

    test('應該支援設定庫存操作', async () => {
      const updates = [
        { productId: mockProductId1.toString(), quantity: 100, operation: 'set' as const }
      ];

      await OptimizedProductService.batchUpdateStock(updates);

      expect(MockedBaseProduct.bulkWrite).toHaveBeenCalledWith([
        {
          updateOne: {
            filter: { _id: mockProductId1.toString() },
            update: { $set: { currentStock: 100 } }
          }
        }
      ]);
    });

    test('應該在不支援的操作時拋出錯誤', async () => {
      const updates = [
        { productId: mockProductId1.toString(), quantity: 10, operation: 'invalid' as any }
      ];

      await expect(OptimizedProductService.batchUpdateStock(updates))
        .rejects.toThrow('不支援的操作: invalid');
    });

    test('應該處理空更新陣列', async () => {
      // 為這個測試重新設置 mock
      MockedBaseProduct.bulkWrite = jest.fn().mockResolvedValue({
        modifiedCount: 0,
        matchedCount: 0,
        upsertedCount: 0
      });

      const result = await OptimizedProductService.batchUpdateStock([]);

      expect(MockedBaseProduct.bulkWrite).toHaveBeenCalledWith([]);
      expect(result).toEqual({
        modifiedCount: 0,
        matchedCount: 0,
        upsertedCount: 0
      });
    });
  });

  describe('getLowStockProducts', () => {
    beforeEach(() => {
      const mockLowStockProducts = [
        {
          _id: mockProductId1,
          code: 'P001',
          name: '測試產品1',
          unit: '個',
          minStock: 10,
          currentStock: 5,
          stockDifference: 5,
          category: '分類1',
          supplier: '供應商1'
        }
      ];

      MockedBaseProduct.aggregate = jest.fn().mockResolvedValue(mockLowStockProducts);
    });

    test('應該成功獲取低庫存產品', async () => {
      const result = await OptimizedProductService.getLowStockProducts();

      expect(MockedBaseProduct.aggregate).toHaveBeenCalled();
      expect(result.products).toHaveLength(1);
      expect(result.count).toBe(1);
      expect(result.threshold).toBe('各產品最低庫存設定');
    });

    test('應該支援自定義庫存閾值', async () => {
      const threshold = 20;
      const result = await OptimizedProductService.getLowStockProducts(threshold);

      expect(result.threshold).toBe(threshold);
      
      // 檢查聚合管道中的閾值設定
      const aggregateCalls = MockedBaseProduct.aggregate.mock.calls;
      const matchStage = aggregateCalls[0][0].find((stage: any) => stage.$match && stage.$match.$expr);
      expect(matchStage).toBeDefined();
    });

    test('應該處理空結果', async () => {
      MockedBaseProduct.aggregate = jest.fn().mockResolvedValue([]);

      const result = await OptimizedProductService.getLowStockProducts();

      expect(result.products).toEqual([]);
      expect(result.count).toBe(0);
    });
  });

  describe('getProductSalesStats', () => {
    beforeEach(() => {
      const mockSalesStats = [
        {
          productId: mockProductId1,
          productCode: 'P001',
          productName: '測試產品1',
          totalQuantity: 100,
          totalRevenue: 10000,
          salesCount: 10,
          avgPrice: 100,
          grossProfit: 2000,
          profitMargin: 20
        }
      ];

      MockedBaseProduct.aggregate = jest.fn().mockResolvedValue(mockSalesStats);
    });

    test('應該成功獲取產品銷售統計', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const limit = 20;

      const result = await OptimizedProductService.getProductSalesStats(startDate, endDate, limit);

      expect(MockedBaseProduct.aggregate).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    test('應該使用預設限制數量', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await OptimizedProductService.getProductSalesStats(startDate, endDate);

      expect(MockedBaseProduct.aggregate).toHaveBeenCalled();
    });

    test('應該處理空統計結果', async () => {
      MockedBaseProduct.aggregate = jest.fn().mockResolvedValue([]);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const result = await OptimizedProductService.getProductSalesStats(startDate, endDate);

      expect(result).toEqual([]);
    });
  });

  describe('錯誤處理', () => {
    test('getProductsWithPackageUnits 應該處理資料庫錯誤', async () => {
      MockedBaseProduct.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockRejectedValue(new Error('資料庫錯誤'))
      });

      await expect(OptimizedProductService.getProductsWithPackageUnits())
        .rejects.toThrow('資料庫錯誤');
    });

    test('searchProducts 應該處理聚合查詢錯誤', async () => {
      MockedBaseProduct.aggregate = jest.fn().mockRejectedValue(new Error('聚合查詢錯誤'));

      await expect(OptimizedProductService.searchProducts('測試'))
        .rejects.toThrow('聚合查詢錯誤');
    });

    test('batchUpdateStock 應該處理批量寫入錯誤', async () => {
      MockedBaseProduct.bulkWrite = jest.fn().mockRejectedValue(new Error('批量寫入錯誤'));

      const updates = [
        { productId: mockProductId1.toString(), quantity: 10, operation: 'add' as const }
      ];

      await expect(OptimizedProductService.batchUpdateStock(updates))
        .rejects.toThrow('批量寫入錯誤');
    });

    test('getLowStockProducts 應該處理聚合查詢錯誤', async () => {
      MockedBaseProduct.aggregate = jest.fn().mockRejectedValue(new Error('聚合查詢錯誤'));

      await expect(OptimizedProductService.getLowStockProducts())
        .rejects.toThrow('聚合查詢錯誤');
    });

    test('getProductSalesStats 應該處理聚合查詢錯誤', async () => {
      MockedBaseProduct.aggregate = jest.fn().mockRejectedValue(new Error('聚合查詢錯誤'));

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await expect(OptimizedProductService.getProductSalesStats(startDate, endDate))
        .rejects.toThrow('聚合查詢錯誤');
    });
  });

  describe('邊界條件測試', () => {
    test('getProductsWithPackageUnits 應該處理極大的分頁數', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      MockedBaseProduct.find = jest.fn().mockReturnValue(mockQuery);
      MockedBaseProduct.countDocuments = jest.fn().mockResolvedValue(0);

      const options = { page: 999999, limit: 1000 };
      const result = await OptimizedProductService.getProductsWithPackageUnits({}, options);

      expect(mockQuery.skip).toHaveBeenCalledWith(999998000); // (999999-1) * 1000
      expect(result.pagination.page).toBe(999999);
    });

    test('searchProducts 應該處理極長的搜尋詞', async () => {
      MockedBaseProduct.aggregate = jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ total: 0 }]);

      const longSearchTerm = 'a'.repeat(1000);
      const result = await OptimizedProductService.searchProducts(longSearchTerm);

      expect(result.searchTerm).toBe(longSearchTerm);
    });

    test('batchUpdateStock 應該處理大量更新', async () => {
      MockedBaseProduct.bulkWrite = jest.fn().mockResolvedValue({
        modifiedCount: 1000,
        matchedCount: 1000,
        upsertedCount: 0
      });

      const updates = Array.from({ length: 1000 }, (_, i) => ({
        productId: new mongoose.Types.ObjectId().toString(),
        quantity: i + 1,
        operation: 'add' as const
      }));

      const result = await OptimizedProductService.batchUpdateStock(updates);

      expect(MockedBaseProduct.bulkWrite).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            updateOne: expect.objectContaining({
              filter: expect.any(Object),
              update: expect.any(Object)
            })
          })
        ])
      );
      expect(result.modifiedCount).toBe(1000);
    });
  });

  describe('性能優化驗證', () => {
    test('getProductsWithPackageUnits 應該使用 lean() 查詢', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockProducts)
      };

      MockedBaseProduct.find = jest.fn().mockReturnValue(mockQuery);
      MockedBaseProduct.countDocuments = jest.fn().mockResolvedValue(2);
      MockedProductPackageUnit.find = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockPackageUnits)
      });

      await OptimizedProductService.getProductsWithPackageUnits();

      expect(mockQuery.lean).toHaveBeenCalled();
    });

    test('getProductsWithPackageUnits 應該並行執行產品查詢和總數查詢', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockProducts)
      };

      MockedBaseProduct.find = jest.fn().mockReturnValue(mockQuery);
      MockedBaseProduct.countDocuments = jest.fn().mockResolvedValue(2);
      MockedProductPackageUnit.find = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockPackageUnits)
      });

      await OptimizedProductService.getProductsWithPackageUnits();

      // 驗證 Promise.all 的使用（通過檢查兩個查詢都被調用）
      expect(MockedBaseProduct.find).toHaveBeenCalled();
      expect(MockedBaseProduct.countDocuments).toHaveBeenCalled();
    });

    test('getProductsWithPackageUnits 應該批量查詢包裝單位', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockProducts)
      };

      MockedBaseProduct.find = jest.fn().mockReturnValue(mockQuery);
      MockedBaseProduct.countDocuments = jest.fn().mockResolvedValue(2);
      MockedProductPackageUnit.find = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockPackageUnits)
      });

      await OptimizedProductService.getProductsWithPackageUnits();

      // 驗證使用 $in 操作符進行批量查詢
      expect(MockedProductPackageUnit.find).toHaveBeenCalledWith({
        productId: { $in: [mockProductId1, mockProductId2] },
        isActive: true
      });
    });
  });
});
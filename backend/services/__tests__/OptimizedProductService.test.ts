import { OptimizedProductService } from '../OptimizedProductService';
import BaseProduct from '../../models/BaseProduct';
import ProductPackageUnit from '../../models/ProductPackageUnit';
import mongoose from 'mongoose';

// Mock the models
jest.mock('../../models/BaseProduct');
jest.mock('../../models/ProductPackageUnit');

const MockedBaseProduct = BaseProduct as jest.Mocked<typeof BaseProduct>;
const MockedProductPackageUnit = ProductPackageUnit as jest.Mocked<typeof ProductPackageUnit>;

describe('OptimizedProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProductsWithPackageUnits', () => {
    const mockProducts = [
      {
        _id: new mongoose.Types.ObjectId(),
        code: 'P001',
        name: '測試產品1',
        sellingPrice: 100,
        category: { name: '分類1' },
        supplier: { name: '供應商1' }
      },
      {
        _id: new mongoose.Types.ObjectId(),
        code: 'P002',
        name: '測試產品2',
        sellingPrice: 200,
        category: { name: '分類2' },
        supplier: { name: '供應商2' }
      }
    ];

    const mockPackageUnits = [
      {
        _id: new mongoose.Types.ObjectId(),
        productId: mockProducts[0]._id,
        unitName: '盒',
        unitValue: 10,
        isActive: true
      }
    ];

    beforeEach(() => {
      // Mock the find chain
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockProducts)
      };

      MockedBaseProduct.find.mockReturnValue(mockFind as any);
      MockedBaseProduct.countDocuments.mockResolvedValue(2);
      MockedProductPackageUnit.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockPackageUnits)
      } as any);
    });

    it('應該返回包含包裝單位的產品列表', async () => {
      const result = await OptimizedProductService.getProductsWithPackageUnits();

      expect(result).toHaveProperty('products');
      expect(result).toHaveProperty('pagination');
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        pages: 1
      });
      expect(result.products).toHaveLength(2);
      expect(result.products[0]).toHaveProperty('packageUnits');
    });

    it('應該支援分頁參數', async () => {
      const options = { page: 2, limit: 10 };
      await OptimizedProductService.getProductsWithPackageUnits({}, options);

      expect(MockedBaseProduct.find().skip).toHaveBeenCalledWith(10);
      expect(MockedBaseProduct.find().limit).toHaveBeenCalledWith(10);
    });

    it('應該支援排序參數', async () => {
      const options = { sortBy: 'name', sortOrder: 'desc' as const };
      await OptimizedProductService.getProductsWithPackageUnits({}, options);

      expect(MockedBaseProduct.find().sort).toHaveBeenCalledWith({ name: -1 });
    });

    it('當includePackageUnits為false時不應該查詢包裝單位', async () => {
      const options = { includePackageUnits: false };
      await OptimizedProductService.getProductsWithPackageUnits({}, options);

      expect(MockedProductPackageUnit.find).not.toHaveBeenCalled();
    });

    it('當產品列表為空時應該返回空結果', async () => {
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      MockedBaseProduct.find.mockReturnValue(mockFind as any);
      MockedBaseProduct.countDocuments.mockResolvedValue(0);

      const result = await OptimizedProductService.getProductsWithPackageUnits();

      expect(result.products).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('searchProducts', () => {
    const mockSearchResults = [
      {
        _id: new mongoose.Types.ObjectId(),
        code: 'P001',
        name: '測試產品',
        sellingPrice: 100,
        score: 1.5
      }
    ];

    beforeEach(() => {
      MockedBaseProduct.aggregate.mockResolvedValueOnce(mockSearchResults);
      MockedBaseProduct.aggregate.mockResolvedValueOnce([{ total: 1 }]);
    });

    it('應該執行文字搜尋', async () => {
      const result = await OptimizedProductService.searchProducts('測試');

      expect(MockedBaseProduct.aggregate).toHaveBeenCalledTimes(2);
      expect(result).toHaveProperty('products');
      expect(result).toHaveProperty('pagination');
      expect(result).toHaveProperty('searchTerm', '測試');
    });

    it('應該支援篩選條件', async () => {
      const options = {
        productType: 'medicine',
        category: 'cat1',
        supplier: 'sup1',
        minPrice: 50,
        maxPrice: 150
      };

      await OptimizedProductService.searchProducts('測試', options);

      expect(MockedBaseProduct.aggregate).toHaveBeenCalled();
      const aggregatePipeline = MockedBaseProduct.aggregate.mock.calls[0][0];
      const matchStage = aggregatePipeline.find((stage: any) => stage.$match) as any;
      
      expect(matchStage).toBeDefined();
      expect(matchStage.$match).toMatchObject({
        productType: 'medicine',
        category: 'cat1',
        supplier: 'sup1',
        sellingPrice: { $gte: 50, $lte: 150 }
      });
    });

    it('應該處理空搜尋詞', async () => {
      await OptimizedProductService.searchProducts('');

      const aggregatePipeline = MockedBaseProduct.aggregate.mock.calls[0][0];
      const matchStage = aggregatePipeline.find((stage: any) => stage.$match) as any;
      
      expect(matchStage).toBeDefined();
      expect(matchStage.$match).not.toHaveProperty('$text');
    });

    it('應該支援分頁', async () => {
      const options = { page: 2, limit: 5 };
      await OptimizedProductService.searchProducts('測試', options);

      const aggregatePipeline = MockedBaseProduct.aggregate.mock.calls[0][0];
      const skipStage = aggregatePipeline.find((stage: any) => stage.$skip) as any;
      const limitStage = aggregatePipeline.find((stage: any) => stage.$limit) as any;
      
      expect(skipStage).toBeDefined();
      expect(skipStage.$skip).toBe(5);
      expect(limitStage).toBeDefined();
      expect(limitStage.$limit).toBe(5);
    });
  });

  describe('batchUpdateStock', () => {
    const mockBulkWriteResult = {
      modifiedCount: 2,
      matchedCount: 2,
      upsertedCount: 0
    };

    beforeEach(() => {
      MockedBaseProduct.bulkWrite.mockResolvedValue(mockBulkWriteResult as any);
    });

    it('應該執行批量庫存更新 - 增加操作', async () => {
      const updates = [
        { productId: 'prod1', quantity: 10, operation: 'add' as const },
        { productId: 'prod2', quantity: 5, operation: 'add' as const }
      ];

      const result = await OptimizedProductService.batchUpdateStock(updates);

      expect(MockedBaseProduct.bulkWrite).toHaveBeenCalledWith([
        {
          updateOne: {
            filter: { _id: 'prod1' },
            update: { $inc: { currentStock: 10 } }
          }
        },
        {
          updateOne: {
            filter: { _id: 'prod2' },
            update: { $inc: { currentStock: 5 } }
          }
        }
      ]);

      expect(result).toEqual({
        modifiedCount: 2,
        matchedCount: 2,
        upsertedCount: 0
      });
    });

    it('應該執行批量庫存更新 - 減少操作', async () => {
      const updates = [
        { productId: 'prod1', quantity: 3, operation: 'subtract' as const }
      ];

      await OptimizedProductService.batchUpdateStock(updates);

      expect(MockedBaseProduct.bulkWrite).toHaveBeenCalledWith([
        {
          updateOne: {
            filter: { _id: 'prod1' },
            update: { $inc: { currentStock: -3 } }
          }
        }
      ]);
    });

    it('應該執行批量庫存更新 - 設定操作', async () => {
      const updates = [
        { productId: 'prod1', quantity: 100, operation: 'set' as const }
      ];

      await OptimizedProductService.batchUpdateStock(updates);

      expect(MockedBaseProduct.bulkWrite).toHaveBeenCalledWith([
        {
          updateOne: {
            filter: { _id: 'prod1' },
            update: { $set: { currentStock: 100 } }
          }
        }
      ]);
    });

    it('應該拋出錯誤當操作類型不支援時', async () => {
      const updates = [
        { productId: 'prod1', quantity: 10, operation: 'invalid' as any }
      ];

      await expect(OptimizedProductService.batchUpdateStock(updates))
        .rejects.toThrow('不支援的操作: invalid');
    });
  });

  describe('getLowStockProducts', () => {
    const mockLowStockProducts = [
      {
        _id: new mongoose.Types.ObjectId(),
        code: 'P001',
        name: '低庫存產品1',
        minStock: 10,
        currentStock: 5,
        stockDifference: 5,
        category: '分類1',
        supplier: '供應商1'
      }
    ];

    beforeEach(() => {
      MockedBaseProduct.aggregate.mockResolvedValue(mockLowStockProducts);
    });

    it('應該返回低庫存產品列表', async () => {
      const result = await OptimizedProductService.getLowStockProducts();

      expect(MockedBaseProduct.aggregate).toHaveBeenCalled();
      expect(result).toEqual({
        products: mockLowStockProducts,
        count: 1,
        threshold: '各產品最低庫存設定'
      });
    });

    it('應該支援自定義閾值', async () => {
      const threshold = 20;
      const result = await OptimizedProductService.getLowStockProducts(threshold);

      expect(result.threshold).toBe(20);
      
      const aggregatePipeline = MockedBaseProduct.aggregate.mock.calls[0][0];
      const matchStage = aggregatePipeline.find((stage: any) => stage.$match && stage.$match.$expr);
      
      expect(matchStage).toBeDefined();
    });

    it('應該正確構建聚合管道', async () => {
      await OptimizedProductService.getLowStockProducts();

      const aggregatePipeline = MockedBaseProduct.aggregate.mock.calls[0][0];
      
      // 檢查管道階段
      expect(aggregatePipeline.some((stage: any) => stage.$match)).toBe(true);
      expect(aggregatePipeline.some((stage: any) => stage.$lookup)).toBe(true);
      expect(aggregatePipeline.some((stage: any) => stage.$addFields)).toBe(true);
      expect(aggregatePipeline.some((stage: any) => stage.$project)).toBe(true);
      expect(aggregatePipeline.some((stage: any) => stage.$sort)).toBe(true);
    });
  });

  describe('getProductSalesStats', () => {
    const mockSalesStats = [
      {
        productId: new mongoose.Types.ObjectId(),
        productCode: 'P001',
        productName: '熱銷產品',
        totalQuantity: 100,
        totalRevenue: 10000,
        salesCount: 50,
        avgPrice: 100,
        grossProfit: 5000,
        profitMargin: 50
      }
    ];

    beforeEach(() => {
      MockedBaseProduct.aggregate.mockResolvedValue(mockSalesStats);
    });

    it('應該返回產品銷售統計', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const limit = 10;

      const result = await OptimizedProductService.getProductSalesStats(startDate, endDate, limit);

      expect(MockedBaseProduct.aggregate).toHaveBeenCalled();
      expect(result).toEqual(mockSalesStats);
    });

    it('應該使用預設限制數量', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await OptimizedProductService.getProductSalesStats(startDate, endDate);

      expect(MockedBaseProduct.aggregate).toHaveBeenCalled();
    });

    it('應該正確構建銷售統計聚合管道', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await OptimizedProductService.getProductSalesStats(startDate, endDate, 5);

      expect(MockedBaseProduct.aggregate).toHaveBeenCalled();
      const aggregateCall = MockedBaseProduct.aggregate.mock.calls[0][0];
      
      // 檢查是否有 lookup 階段
      expect(aggregateCall.some((stage: any) => stage.$lookup)).toBe(true);
    });
  });

  describe('錯誤處理', () => {
    it('應該處理資料庫連接錯誤', async () => {
      MockedBaseProduct.find.mockImplementation(() => {
        throw new Error('資料庫連接失敗');
      });

      await expect(OptimizedProductService.getProductsWithPackageUnits())
        .rejects.toThrow('資料庫連接失敗');
    });

    it('應該處理聚合查詢錯誤', async () => {
      MockedBaseProduct.aggregate.mockRejectedValue(new Error('聚合查詢失敗'));

      await expect(OptimizedProductService.searchProducts('測試'))
        .rejects.toThrow('聚合查詢失敗');
    });

    it('應該處理批量更新錯誤', async () => {
      MockedBaseProduct.bulkWrite.mockRejectedValue(new Error('批量更新失敗'));

      const updates = [
        { productId: 'prod1', quantity: 10, operation: 'add' as const }
      ];

      await expect(OptimizedProductService.batchUpdateStock(updates))
        .rejects.toThrow('批量更新失敗');
    });
  });

  describe('邊界條件測試', () => {
    it('應該處理空的更新陣列', async () => {
      MockedBaseProduct.bulkWrite.mockResolvedValue({
        modifiedCount: 0,
        matchedCount: 0,
        upsertedCount: 0
      } as any);

      const result = await OptimizedProductService.batchUpdateStock([]);

      expect(result).toEqual({
        modifiedCount: 0,
        matchedCount: 0,
        upsertedCount: 0
      });
    });

    it('應該處理無效的分頁參數', async () => {
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      MockedBaseProduct.find.mockReturnValue(mockFind as any);
      MockedBaseProduct.countDocuments.mockResolvedValue(0);

      const options = { page: -1, limit: 0 };
      const result = await OptimizedProductService.getProductsWithPackageUnits({}, options);

      expect(result.pagination.page).toBe(-1);
      expect(result.pagination.limit).toBe(0);
    });

    it('應該處理空的搜尋結果', async () => {
      MockedBaseProduct.aggregate.mockResolvedValueOnce([]);
      MockedBaseProduct.aggregate.mockResolvedValueOnce([]);

      const result = await OptimizedProductService.searchProducts('不存在的產品');

      expect(result.products).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });
});
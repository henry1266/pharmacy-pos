import request from 'supertest';
import express from 'express';
import { PackageUnitsController } from '../packageUnits';
import { PackageUnitService } from '../../services/PackageUnitService';
import { PackageUnitErrorCodes } from '@pharmacy-pos/shared/types/package';

// Mock PackageUnitService
jest.mock('../../services/PackageUnitService');
const mockPackageUnitService = PackageUnitService as jest.Mocked<typeof PackageUnitService>;

// 創建測試應用
const app = express();
app.use(express.json());

// 設置路由
app.get('/api/products/:productId/package-units', PackageUnitsController.getPackageUnits);
app.get('/api/products/:productId/package-units/history', PackageUnitsController.getPackageUnitsAtDate);
app.post('/api/products/:productId/package-units', PackageUnitsController.createOrUpdatePackageUnits);
app.put('/api/products/:productId/package-units', PackageUnitsController.updatePackageUnits);
app.delete('/api/products/:productId/package-units', PackageUnitsController.deletePackageUnits);
app.post('/api/package-units/validate', PackageUnitsController.validatePackageUnits);
app.post('/api/inventory/convert-to-package-display', PackageUnitsController.convertToPackageDisplay);
app.post('/api/inventory/convert-to-base-unit', PackageUnitsController.convertToBaseUnit);

describe('PackageUnitsController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products/:productId/package-units', () => {
    it('應該成功獲取產品包裝單位配置', async () => {
      const mockPackageUnits = [
        { unitName: '盒', baseUnitCount: 100, level: 1 },
        { unitName: '排', baseUnitCount: 10, level: 2 },
        { unitName: '粒', baseUnitCount: 1, level: 3 }
      ];

      mockPackageUnitService.getProductPackageUnits.mockResolvedValue(mockPackageUnits);

      const response = await request(app)
        .get('/api/products/test-product-id/package-units')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockPackageUnits
      });
      expect(mockPackageUnitService.getProductPackageUnits).toHaveBeenCalledWith('test-product-id');
    });

    it('應該處理缺少產品ID的情況', async () => {
      const response = await request(app)
        .get('/api/products//package-units')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: '產品ID不能為空',
        code: PackageUnitErrorCodes.PRODUCT_NOT_FOUND
      });
    });

    it('應該處理服務錯誤', async () => {
      mockPackageUnitService.getProductPackageUnits.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/products/test-product-id/package-units')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: '服務器內部錯誤',
        code: 'INTERNAL_SERVER_ERROR'
      });
    });
  });

  describe('GET /api/products/:productId/package-units/history', () => {
    it('應該成功獲取歷史包裝單位配置', async () => {
      const mockPackageUnits = [
        { unitName: '盒', baseUnitCount: 100, level: 1 }
      ];
      const testDate = '2024-01-01';

      mockPackageUnitService.getProductPackageUnitsAtDate.mockResolvedValue(mockPackageUnits);

      const response = await request(app)
        .get(`/api/products/test-product-id/package-units/history?date=${testDate}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPackageUnits);
      expect(response.body.queryDate).toBe(new Date(testDate).toISOString());
    });

    it('應該處理無效日期格式', async () => {
      const response = await request(app)
        .get('/api/products/test-product-id/package-units/history?date=invalid-date')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: '無效的日期格式',
        code: 'INVALID_DATE_FORMAT'
      });
    });
  });

  describe('POST /api/products/:productId/package-units', () => {
    it('應該成功創建包裝單位配置', async () => {
      const packageUnits = [
        { unitName: '盒', baseUnitCount: 100, level: 1 },
        { unitName: '粒', baseUnitCount: 1, level: 2 }
      ];

      const mockResult = {
        success: true,
        data: { productId: 'test-product-id', packageUnits }
      };

      mockPackageUnitService.createOrUpdatePackageUnits.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/products/test-product-id/package-units')
        .send({ packageUnits })
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: mockResult.data,
        message: '包裝單位配置創建成功'
      });
    });

    it('應該處理無效的包裝單位數據', async () => {
      const response = await request(app)
        .post('/api/products/test-product-id/package-units')
        .send({ packageUnits: 'invalid' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'packageUnits 必須是陣列',
        code: PackageUnitErrorCodes.INVALID_PACKAGE_UNITS
      });
    });

    it('應該處理服務驗證失敗', async () => {
      const packageUnits = [
        { unitName: '盒', baseUnitCount: 0, level: 1 } // 無效數據
      ];

      const mockResult = {
        success: false,
        error: '包裝單位數量必須大於0'
      };

      mockPackageUnitService.createOrUpdatePackageUnits.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/products/test-product-id/package-units')
        .send({ packageUnits })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: mockResult.error,
        code: PackageUnitErrorCodes.INVALID_PACKAGE_UNITS
      });
    });
  });

  describe('DELETE /api/products/:productId/package-units', () => {
    it('應該成功刪除包裝單位配置', async () => {
      const mockResult = { success: true };
      mockPackageUnitService.deletePackageUnits.mockResolvedValue(mockResult);

      const response = await request(app)
        .delete('/api/products/test-product-id/package-units')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: '包裝單位配置刪除成功'
      });
    });

    it('應該處理刪除失敗', async () => {
      const mockResult = { success: false, error: '刪除失敗' };
      mockPackageUnitService.deletePackageUnits.mockResolvedValue(mockResult);

      const response = await request(app)
        .delete('/api/products/test-product-id/package-units')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: mockResult.error,
        code: 'INTERNAL_SERVER_ERROR'
      });
    });
  });

  describe('POST /api/package-units/validate', () => {
    it('應該成功驗證包裝單位配置', async () => {
      const packageUnits = [
        { unitName: '盒', baseUnitCount: 100, level: 1 },
        { unitName: '粒', baseUnitCount: 1, level: 2 }
      ];

      const mockValidation = {
        isValid: true,
        errors: [],
        warnings: []
      };

      mockPackageUnitService.validatePackageUnits.mockReturnValue(mockValidation);

      const response = await request(app)
        .post('/api/package-units/validate')
        .send({ packageUnits })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        isValid: true,
        errors: [],
        warnings: []
      });
    });

    it('應該處理驗證失敗', async () => {
      const packageUnits = [
        { unitName: '盒', baseUnitCount: 0, level: 1 } // 無效數據
      ];

      const mockValidation = {
        isValid: false,
        errors: ['包裝單位數量必須大於0'],
        warnings: []
      };

      mockPackageUnitService.validatePackageUnits.mockReturnValue(mockValidation);

      const response = await request(app)
        .post('/api/package-units/validate')
        .send({ packageUnits })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        isValid: false,
        errors: ['包裝單位數量必須大於0'],
        warnings: []
      });
    });
  });

  describe('POST /api/inventory/convert-to-package-display', () => {
    it('應該成功轉換基礎單位為包裝顯示', async () => {
      const mockPackageUnits = [
        { unitName: '盒', baseUnitCount: 100, level: 1 },
        { unitName: '粒', baseUnitCount: 1, level: 2 }
      ];

      const mockDisplayResult = {
        baseQuantity: 235,
        packageBreakdown: [
          { unitName: '盒', quantity: 2 },
          { unitName: '粒', quantity: 35 }
        ],
        displayText: '2盒 35粒'
      };

      mockPackageUnitService.getProductPackageUnits.mockResolvedValue(mockPackageUnits);
      mockPackageUnitService.convertToPackageDisplay.mockReturnValue(mockDisplayResult);

      const response = await request(app)
        .post('/api/inventory/convert-to-package-display')
        .send({
          productId: 'test-product-id',
          baseQuantity: 235
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          baseQuantity: 235,
          packageBreakdown: mockDisplayResult.packageBreakdown,
          displayText: mockDisplayResult.displayText,
          configUsed: mockPackageUnits
        }
      });
    });

    it('應該處理無效的基礎數量', async () => {
      const response = await request(app)
        .post('/api/inventory/convert-to-package-display')
        .send({
          productId: 'test-product-id',
          baseQuantity: -1
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: '基礎數量必須為非負數',
        code: 'INVALID_BASE_QUANTITY'
      });
    });
  });

  describe('POST /api/inventory/convert-to-base-unit', () => {
    it('應該成功轉換包裝輸入為基礎單位', async () => {
      const mockPackageUnits = [
        { unitName: '盒', baseUnitCount: 100, level: 1 },
        { unitName: '粒', baseUnitCount: 1, level: 2 }
      ];

      const mockParseResult = {
        baseQuantity: 235,
        parsedInput: [
          { unitName: '盒', quantity: 2 },
          { unitName: '粒', quantity: 35 }
        ],
        displayText: '2盒 35粒',
        errors: []
      };

      mockPackageUnitService.getProductPackageUnits.mockResolvedValue(mockPackageUnits);
      mockPackageUnitService.convertToBaseUnit.mockReturnValue(mockParseResult);

      const response = await request(app)
        .post('/api/inventory/convert-to-base-unit')
        .send({
          productId: 'test-product-id',
          packageInput: '2盒 35粒'
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          baseQuantity: 235,
          parsedInput: mockParseResult.parsedInput,
          displayText: mockParseResult.displayText
        },
        errors: []
      });
    });

    it('應該處理空的包裝輸入', async () => {
      const response = await request(app)
        .post('/api/inventory/convert-to-base-unit')
        .send({
          productId: 'test-product-id',
          packageInput: ''
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: '包裝輸入不能為空',
        code: PackageUnitErrorCodes.INVALID_PACKAGE_INPUT
      });
    });
  });
});
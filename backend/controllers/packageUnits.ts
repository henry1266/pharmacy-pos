import { Request, Response } from 'express';
import { PackageUnitService } from '../services/PackageUnitService';
import {
  ProductPackageUnit,
  PackageUnitErrorCodes
} from '@pharmacy-pos/shared/types/package';

/**
 * 包裝單位控制器
 * 處理包裝單位相關的 HTTP 請求
 */
export class PackageUnitsController {

  /**
   * 獲取產品的包裝單位配置
   * GET /api/products/:productId/package-units
   */
  static async getPackageUnits(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      
      if (!productId || !productId.trim()) {
        res.status(400).json({
          success: false,
          error: '產品ID不能為空',
          code: PackageUnitErrorCodes.PRODUCT_NOT_FOUND
        });
        return;
      }

      const packageUnits = await PackageUnitService.getProductPackageUnits(productId);
      
      res.json({
        success: true,
        data: packageUnits
      });
      
    } catch (error) {
      console.error('獲取包裝單位配置失敗:', error);
      res.status(500).json({
        success: false,
        error: '服務器內部錯誤',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * 獲取產品在指定日期的包裝單位配置（歷史配置）
   * GET /api/products/:productId/package-units/history?date=2024-01-01
   */
  static async getPackageUnitsAtDate(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const { date } = req.query;
      
      if (!productId || !productId.trim()) {
        res.status(400).json({
          success: false,
          error: '產品ID不能為空',
          code: PackageUnitErrorCodes.PRODUCT_NOT_FOUND
        });
        return;
      }

      const targetDate = date ? new Date(date as string) : new Date();
      
      if (isNaN(targetDate.getTime())) {
        res.status(400).json({
          success: false,
          error: '無效的日期格式',
          code: 'INVALID_DATE_FORMAT'
        });
        return;
      }

      const packageUnits = await PackageUnitService.getProductPackageUnitsAtDate(productId, targetDate);
      
      res.json({
        success: true,
        data: packageUnits,
        queryDate: targetDate.toISOString()
      });
      
    } catch (error) {
      console.error('獲取歷史包裝單位配置失敗:', error);
      res.status(500).json({
        success: false,
        error: '服務器內部錯誤',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * 創建或更新產品的包裝單位配置
   * POST /api/products/:productId/package-units
   */
  static async createOrUpdatePackageUnits(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const { packageUnits } = req.body;
      
      if (!productId || !productId.trim()) {
        res.status(400).json({
          success: false,
          error: '產品ID不能為空',
          code: PackageUnitErrorCodes.PRODUCT_NOT_FOUND
        });
        return;
      }

      if (!Array.isArray(packageUnits)) {
        res.status(400).json({
          success: false,
          error: 'packageUnits 必須是陣列',
          code: PackageUnitErrorCodes.INVALID_PACKAGE_UNITS
        });
        return;
      }

      const result = await PackageUnitService.createOrUpdatePackageUnits(productId, packageUnits);
      
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
          code: PackageUnitErrorCodes.INVALID_PACKAGE_UNITS
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: result.data,
        message: '包裝單位配置創建成功'
      });
      
    } catch (error) {
      console.error('創建包裝單位配置失敗:', error);
      res.status(500).json({
        success: false,
        error: '服務器內部錯誤',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * 批量更新包裝單位配置
   * PUT /api/products/:productId/package-units
   */
  static async updatePackageUnits(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const { packageUnits } = req.body;
      
      if (!productId || !productId.trim()) {
        res.status(400).json({
          success: false,
          error: '產品ID不能為空',
          code: PackageUnitErrorCodes.PRODUCT_NOT_FOUND
        });
        return;
      }

      if (!Array.isArray(packageUnits)) {
        res.status(400).json({
          success: false,
          error: 'packageUnits 必須是陣列',
          code: PackageUnitErrorCodes.INVALID_PACKAGE_UNITS
        });
        return;
      }

      const result = await PackageUnitService.createOrUpdatePackageUnits(productId, packageUnits);
      
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
          code: PackageUnitErrorCodes.INVALID_PACKAGE_UNITS
        });
        return;
      }

      res.json({
        success: true,
        data: result.data,
        message: '包裝單位配置更新成功'
      });
      
    } catch (error) {
      console.error('更新包裝單位配置失敗:', error);
      res.status(500).json({
        success: false,
        error: '服務器內部錯誤',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * 刪除產品的包裝單位配置
   * DELETE /api/products/:productId/package-units
   */
  static async deletePackageUnits(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      
      if (!productId || !productId.trim()) {
        res.status(400).json({
          success: false,
          error: '產品ID不能為空',
          code: PackageUnitErrorCodes.PRODUCT_NOT_FOUND
        });
        return;
      }

      const result = await PackageUnitService.deletePackageUnits(productId);
      
      if (!result.success) {
        res.status(500).json({
          success: false,
          error: result.error,
          code: 'INTERNAL_SERVER_ERROR'
        });
        return;
      }

      res.json({
        success: true,
        message: '包裝單位配置刪除成功'
      });
      
    } catch (error) {
      console.error('刪除包裝單位配置失敗:', error);
      res.status(500).json({
        success: false,
        error: '服務器內部錯誤',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * 驗證包裝單位配置
   * POST /api/package-units/validate
   */
  static async validatePackageUnits(req: Request, res: Response): Promise<void> {
    try {
      const { packageUnits } = req.body;
      
      if (!Array.isArray(packageUnits)) {
        res.status(400).json({
          success: false,
          error: 'packageUnits 必須是陣列',
          code: PackageUnitErrorCodes.INVALID_PACKAGE_UNITS
        });
        return;
      }

      const validation = PackageUnitService.validatePackageUnits(packageUnits);
      
      res.json({
        success: true,
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings
      });
      
    } catch (error) {
      console.error('驗證包裝單位配置失敗:', error);
      res.status(500).json({
        success: false,
        error: '服務器內部錯誤',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * 將基礎單位轉換為包裝顯示
   * POST /api/inventory/convert-to-package-display
   */
  static async convertToPackageDisplay(req: Request, res: Response): Promise<void> {
    try {
      const { productId, baseQuantity, useHistoricalConfig, configDate } = req.body;
      
      if (!productId || !productId.trim()) {
        res.status(400).json({
          success: false,
          error: '產品ID不能為空',
          code: PackageUnitErrorCodes.PRODUCT_NOT_FOUND
        });
        return;
      }

      if (typeof baseQuantity !== 'number' || baseQuantity < 0) {
        res.status(400).json({
          success: false,
          error: '基礎數量必須為非負數',
          code: 'INVALID_BASE_QUANTITY'
        });
        return;
      }

      let packageUnits: ProductPackageUnit[];
      
      if (useHistoricalConfig && configDate) {
        const date = new Date(configDate);
        if (isNaN(date.getTime())) {
          res.status(400).json({
            success: false,
            error: '無效的日期格式',
            code: 'INVALID_DATE_FORMAT'
          });
          return;
        }
        packageUnits = await PackageUnitService.getProductPackageUnitsAtDate(productId, date);
      } else {
        packageUnits = await PackageUnitService.getProductPackageUnits(productId);
      }

      const displayResult = PackageUnitService.convertToPackageDisplay(baseQuantity, packageUnits);
      
      res.json({
        success: true,
        data: {
          baseQuantity: displayResult.baseQuantity,
          packageBreakdown: displayResult.packageBreakdown,
          displayText: displayResult.displayText,
          configUsed: packageUnits
        }
      });
      
    } catch (error) {
      console.error('轉換包裝顯示失敗:', error);
      res.status(500).json({
        success: false,
        error: '服務器內部錯誤',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * 將包裝單位輸入轉換為基礎單位
   * POST /api/inventory/convert-to-base-unit
   */
  static async convertToBaseUnit(req: Request, res: Response): Promise<void> {
    try {
      const { productId, packageInput } = req.body;
      
      if (!productId || !productId.trim()) {
        res.status(400).json({
          success: false,
          error: '產品ID不能為空',
          code: PackageUnitErrorCodes.PRODUCT_NOT_FOUND
        });
        return;
      }

      if (!packageInput || typeof packageInput !== 'string') {
        res.status(400).json({
          success: false,
          error: '包裝輸入不能為空',
          code: PackageUnitErrorCodes.INVALID_PACKAGE_INPUT
        });
        return;
      }

      const packageUnits = await PackageUnitService.getProductPackageUnits(productId);
      const parseResult = PackageUnitService.convertToBaseUnit(packageInput, packageUnits);
      
      res.json({
        success: true,
        data: {
          baseQuantity: parseResult.baseQuantity,
          parsedInput: parseResult.parsedInput,
          displayText: parseResult.displayText
        },
        errors: parseResult.errors || []
      });
      
    } catch (error) {
      console.error('轉換基礎單位失敗:', error);
      res.status(500).json({
        success: false,
        error: '服務器內部錯誤',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
}

export default PackageUnitsController;
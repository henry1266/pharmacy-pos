import { Router, type IRouter } from 'express';
import { PackageUnitsController } from './controllers/packageUnits';

const router: IRouter = Router();

/**
 * @description 包裝單位相關路由
 * @module routes/packageUnits
 * @requires express
 * @requires controllers/packageUnits
 */

/**
 * @description 產品包裝單位 CRUD 操作
 * @name 包裝單位管理
 * @group 包裝單位
 */
router.get('/products/:productId/package-units', PackageUnitsController.getPackageUnits);
router.get('/products/:productId/package-units/history', PackageUnitsController.getPackageUnitsAtDate);
router.post('/products/:productId/package-units', PackageUnitsController.createOrUpdatePackageUnits);
router.put('/products/:productId/package-units', PackageUnitsController.updatePackageUnits);
router.delete('/products/:productId/package-units', PackageUnitsController.deletePackageUnits);

/**
 * @description 包裝單位驗證
 * @name 包裝單位驗證
 * @group 包裝單位
 */
router.post('/package-units/validate', PackageUnitsController.validatePackageUnits);

/**
 * @description 包裝單位轉換計算
 * @name 包裝單位轉換
 * @group 包裝單位
 */
router.post('/inventory/convert-to-package-display', PackageUnitsController.convertToPackageDisplay);
router.post('/inventory/convert-to-base-unit', PackageUnitsController.convertToBaseUnit);

/**
 * @description 導出包裝單位路由
 */
export default router;
import { Router, type IRouter } from 'express';
import { PackageUnitsController } from '../controllers/packageUnits';

const router: IRouter = Router();

/**
 * 包裝單位相關路由
 */

// 產品包裝單位 CRUD 操作
router.get('/products/:productId/package-units', PackageUnitsController.getPackageUnits);
router.get('/products/:productId/package-units/history', PackageUnitsController.getPackageUnitsAtDate);
router.post('/products/:productId/package-units', PackageUnitsController.createOrUpdatePackageUnits);
router.put('/products/:productId/package-units', PackageUnitsController.updatePackageUnits);
router.delete('/products/:productId/package-units', PackageUnitsController.deletePackageUnits);

// 包裝單位驗證
router.post('/package-units/validate', PackageUnitsController.validatePackageUnits);

// 包裝單位轉換計算
router.post('/inventory/convert-to-package-display', PackageUnitsController.convertToPackageDisplay);
router.post('/inventory/convert-to-base-unit', PackageUnitsController.convertToBaseUnit);

export default router;
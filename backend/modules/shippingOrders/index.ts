import express from 'express';
import { 
  getAllShippingOrders,
  getShippingOrderById,
  getShippingOrdersBySupplier,
  searchShippingOrders,
  getShippingOrdersByProduct,
  getRecentShippingOrders,
  createShippingOrder,
  createShippingOrderValidation,
  importShippingOrdersBasic,
  updateShippingOrder,
  deleteShippingOrder
} from './controllers';
import { upload } from './middlewares';

// 創建路由器
const router: express.Router = express.Router();

// GET 路由
router.get('/', getAllShippingOrders);
router.get('/supplier/:supplierId', getShippingOrdersBySupplier);
router.get('/search/query', searchShippingOrders);
router.get('/product/:productId', getShippingOrdersByProduct);
router.get('/recent/list', getRecentShippingOrders);
router.get('/:id', getShippingOrderById);

// POST 路由
router.post('/', createShippingOrderValidation, createShippingOrder);
router.post('/import/basic', upload.single('file'), importShippingOrdersBasic);

// PUT 路由
router.put('/:id', updateShippingOrder);

// DELETE 路由
router.delete('/:id', deleteShippingOrder);

export default router;
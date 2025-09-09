import express from 'express';
import { check } from 'express-validator';
import auth from '../../middleware/auth';
import * as purchaseOrdersController from './purchaseOrders.controller';

const router: express.Router = express.Router();

// @route   GET api/purchase-orders
// @desc    獲取所有進貨單
// @access  Public
router.get('/', purchaseOrdersController.getAllPurchaseOrders);

// @route   GET api/purchase-orders/:id
// @desc    獲取單個進貨單
// @access  Public
router.get('/:id', purchaseOrdersController.getPurchaseOrderById);

// @route   POST api/purchase-orders
// @desc    創建新進貨單
// @access  Private
router.post('/', [
  auth,
  check('posupplier', '供應商為必填項').not().isEmpty(),
  check('items', '至少需要一個藥品項目').isArray().not().isEmpty()
], purchaseOrdersController.createPurchaseOrder);

// @route   PUT api/purchase-orders/:id
// @desc    更新進貨單
// @access  Private
router.put('/:id', auth, purchaseOrdersController.updatePurchaseOrder);

// @route   DELETE api/purchase-orders/:id
// @desc    刪除進貨單
// @access  Public
router.delete('/:id', purchaseOrdersController.deletePurchaseOrder);

// @route   GET api/purchase-orders/supplier/:supplierId
// @desc    獲取特定供應商的進貨單
// @access  Public
router.get('/supplier/:supplierId', purchaseOrdersController.getPurchaseOrdersBySupplier);

// @route   GET api/purchase-orders/product/:productId
// @desc    獲取特定產品的進貨單
// @access  Public
router.get('/product/:productId', purchaseOrdersController.getPurchaseOrdersByProduct);

// @route   GET api/purchase-orders/recent/list
// @desc    獲取最近的進貨單
// @access  Public
router.get('/recent/list', purchaseOrdersController.getRecentPurchaseOrders);

export default router;
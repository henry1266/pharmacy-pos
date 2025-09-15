import express from 'express';
import * as salesController from './sales.controller';
import { validateSale } from './middlewares/validateSale';
import { validateObjectId } from './middlewares/validateObjectId';

const router: express.Router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     SaleItem:
 *       type: object
 *       required:
 *         - product
 *         - quantity
 *         - price
 *         - subtotal
 *       properties:
 *         product:
 *           type: string
 *           description: 產品ID
 *         quantity:
 *           type: number
 *           description: 數量
 *         price:
 *           type: number
 *           description: 單價
 *         subtotal:
 *           type: number
 *           description: 小計
 *     Sale:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: 銷售記錄ID
 *         saleNumber:
 *           type: string
 *           description: 銷售單號
 *         customer:
 *           type: string
 *           description: 客戶ID
 *         items:
 *           type: array
 *           description: 銷售項目
 *           items:
 *             $ref: '#/components/schemas/SaleItem'
 *         totalAmount:
 *           type: number
 *           description: 總金額
 *         discount:
 *           type: number
 *           description: 折扣金額
 *           default: 0
 *         paymentMethod:
 *           type: string
 *           description: 支付方式
 *           enum: [cash, credit_card, debit_card, mobile_payment, other, transfer, card]
 *           default: cash
 *         paymentStatus:
 *           type: string
 *           description: 支付狀態
 *           enum: [paid, pending, partial, cancelled]
 *           default: paid
 *         notes:
 *           type: string
 *           description: 備註
 *         cashier:
 *           type: string
 *           description: 收銀員ID
 *         date:
 *           type: string
 *           format: date-time
 *           description: 銷售日期
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 創建時間
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新時間
 */

/**
 * @swagger
 * /api/sales:
 *   get:
 *     summary: 獲取所有銷售記錄
 *     description: 獲取所有銷售記錄，支援搜尋和萬用字元搜尋
 *     tags: [Sales]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜尋關鍵字
 *       - in: query
 *         name: wildcardSearch
 *         schema:
 *           type: string
 *         description: 萬用字元搜尋（支援 * 和 ? 萬用字元）
 *     responses:
 *       200:
 *         description: 成功獲取銷售記錄列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 操作成功
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Sale'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: 伺服器錯誤
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// @route   GET api/sales
// @desc    Get all sales with optional wildcard search
// @access  Public
router.get('/', salesController.getAllSales);
// 今日銷售
router.get('/today', salesController.getTodaySales);

/**
 * @swagger
 * /api/sales/{id}:
 *   get:
 *     summary: 獲取單個銷售記錄
 *     description: 根據ID獲取單個銷售記錄的詳細信息
 *     tags: [Sales]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 銷售記錄ID
 *     responses:
 *       200:
 *         description: 成功獲取銷售記錄
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 操作成功
 *                 data:
 *                   $ref: '#/components/schemas/Sale'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: 找不到銷售記錄
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: 伺服器錯誤
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// @route   GET api/sales/:id
// @desc    Get sale by ID
// @access  Public
router.get('/:id', validateObjectId(), salesController.getSaleById);

/**
 * @swagger
 * /api/sales:
 *   post:
 *     summary: 創建銷售記錄
 *     description: 創建新的銷售記錄
 *     tags: [Sales]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - totalAmount
 *             properties:
 *               saleNumber:
 *                 type: string
 *                 description: 銷售單號（如果不提供將自動生成）
 *               customer:
 *                 type: string
 *                 description: 客戶ID
 *               items:
 *                 type: array
 *                 description: 銷售項目
 *                 items:
 *                   type: object
 *                   required:
 *                     - product
 *                     - quantity
 *                   properties:
 *                     product:
 *                       type: string
 *                       description: 產品ID
 *                     quantity:
 *                       type: number
 *                       description: 數量
 *                     price:
 *                       type: number
 *                       description: 單價
 *                     unitPrice:
 *                       type: number
 *                       description: 單位價格
 *                     discount:
 *                       type: number
 *                       description: 折扣
 *                     subtotal:
 *                       type: number
 *                       description: 小計
 *               totalAmount:
 *                 type: number
 *                 description: 總金額
 *               discount:
 *                 type: number
 *                 description: 折扣金額
 *               paymentMethod:
 *                 type: string
 *                 description: 支付方式
 *                 enum: [cash, credit_card, debit_card, mobile_payment, other, transfer, card]
 *               paymentStatus:
 *                 type: string
 *                 description: 支付狀態
 *                 enum: [paid, pending, partial, cancelled]
 *               notes:
 *                 type: string
 *                 description: 備註
 *               cashier:
 *                 type: string
 *                 description: 收銀員ID
 *     responses:
 *       200:
 *         description: 銷售記錄創建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 已創建
 *                 data:
 *                   $ref: '#/components/schemas/Sale'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: 請求參數錯誤
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: 伺服器錯誤
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// @route   POST api/sales
// @desc    Create a sale
// @access  Public
router.post(
  '/',
  /*
  [
    check('items', '至少需要一個銷售項目').isArray({ min: 1 }),
    check('totalAmount', '總金額為必填項').isNumeric()
  ],
  */
  validateSale('create'),
  salesController.createSale
);

/**
 * @swagger
 * /api/sales/{id}:
 *   put:
 *     summary: 更新銷售記錄
 *     description: 根據ID更新銷售記錄
 *     tags: [Sales]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 銷售記錄ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customer:
 *                 type: string
 *                 description: 客戶ID
 *               items:
 *                 type: array
 *                 description: 銷售項目
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                       description: 產品ID
 *                     quantity:
 *                       type: number
 *                       description: 數量
 *                     price:
 *                       type: number
 *                       description: 單價
 *                     unitPrice:
 *                       type: number
 *                       description: 單位價格
 *                     discount:
 *                       type: number
 *                       description: 折扣
 *                     subtotal:
 *                       type: number
 *                       description: 小計
 *               totalAmount:
 *                 type: number
 *                 description: 總金額
 *               discount:
 *                 type: number
 *                 description: 折扣金額
 *               paymentMethod:
 *                 type: string
 *                 description: 支付方式
 *                 enum: [cash, credit_card, debit_card, mobile_payment, other, transfer, card]
 *               paymentStatus:
 *                 type: string
 *                 description: 支付狀態
 *                 enum: [paid, pending, partial, cancelled]
 *               notes:
 *                 type: string
 *                 description: 備註
 *               cashier:
 *                 type: string
 *                 description: 收銀員ID
 *     responses:
 *       200:
 *         description: 銷售記錄更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 已更新
 *                 data:
 *                   $ref: '#/components/schemas/Sale'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: 找不到銷售記錄
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: 伺服器錯誤
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// @route   PUT api/sales/:id
// @desc    Update a sale
// @access  Public
router.put('/:id', validateObjectId(), validateSale('update'), salesController.updateSale);

/**
 * @swagger
 * /api/sales/{id}:
 *   delete:
 *     summary: 刪除銷售記錄
 *     description: 根據ID刪除銷售記錄
 *     tags: [Sales]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 銷售記錄ID
 *     responses:
 *       200:
 *         description: 銷售記錄刪除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 銷售記錄已刪除
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: 被刪除的銷售記錄ID
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: 找不到銷售記錄
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: 伺服器錯誤
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// @route   DELETE api/sales/:id
// @desc    Delete a sale
// @access  Public
router.delete('/:id', validateObjectId(), salesController.deleteSale);

export default router;

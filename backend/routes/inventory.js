const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const Inventory = require('../models/Inventory');
const { BaseProduct } = require('../models/BaseProduct');
const PurchaseOrder = require('../models/PurchaseOrder');

// @route   GET api/inventory
// @desc    Get all inventory items
// @access  Public (已改為公開)
router.get('/', async (req, res) => {
  try {
    const inventory = await Inventory.find()
      .populate('product')
      .populate('purchaseOrderId', 'poid orderNumber pobill');
    res.json(inventory);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/inventory/:id
// @desc    Get inventory item by ID
// @access  Public (已改為公開)
router.get('/:id', async (req, res) => {
  try {
    // 修正：使用 findOne 替代 findById，並將 id 轉換為字串
    const inventory = await Inventory.findOne({ _id: req.params.id.toString() })
      .populate('product')
      .populate('purchaseOrderId', 'poid orderNumber pobill');
    if (!inventory) {
      return res.status(404).json({ msg: '庫存記錄不存在' });
    }
    res.json(inventory);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '庫存記錄不存在' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/inventory
// @desc    Create an inventory item
// @access  Public (已改為公開)
router.post(
  '/',
  [
    [
      check('product', '藥品ID為必填項').not().isEmpty(),
      check('quantity', '數量為必填項').isNumeric()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      product,
      quantity,
      purchaseOrderId,
      purchaseOrderNumber
    } = req.body;
    try {
      // 檢查藥品是否存在
      // 修正：使用 findOne 替代 findById，並將 product 轉換為字串
      const productExists = await BaseProduct.findOne({ _id: product.toString() });
      if (!productExists) {
        return res.status(404).json({ msg: '藥品不存在' });
      }
      
      // 檢查是否已有該藥品的庫存記錄
      let existingInventory = null;
      if (purchaseOrderId) {
        // 修正：將 product 和 purchaseOrderId 參數轉換為字串
        existingInventory = await Inventory.findOne({ 
          product: product.toString(), 
          purchaseOrderId: purchaseOrderId.toString() 
        });
      } else {
        // 修正：將 product 參數轉換為字串
        existingInventory = await Inventory.findOne({ product: product.toString() });
      }
      
      if (existingInventory) {
        // 更新現有庫存
        existingInventory.quantity += parseInt(quantity);
        existingInventory.lastUpdated = Date.now();
        
        await existingInventory.save();
        return res.json(existingInventory);
      }
      
      // 建立新庫存記錄
      const inventoryFields = {
        product,
        quantity
      };
      if (purchaseOrderId) inventoryFields.purchaseOrderId = purchaseOrderId;
      if (purchaseOrderNumber) inventoryFields.purchaseOrderNumber = purchaseOrderNumber;

      const inventory = new Inventory(inventoryFields);
      await inventory.save();
      res.json(inventory);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/inventory/:id
// @desc    Update an inventory item
// @access  Public (已改為公開)
router.put('/:id', async (req, res) => {
  const {
    product,
    quantity,
    purchaseOrderId,
    purchaseOrderNumber
  } = req.body;
  // 建立更新欄位物件
  const inventoryFields = {};
  if (product) inventoryFields.product = product;
  if (quantity !== undefined) inventoryFields.quantity = quantity;
  if (purchaseOrderId) inventoryFields.purchaseOrderId = purchaseOrderId;
  if (purchaseOrderNumber) inventoryFields.purchaseOrderNumber = purchaseOrderNumber;
  inventoryFields.lastUpdated = Date.now();
  
  try {
    // 修正：使用 findOne 替代 findById，並將 id 轉換為字串
    let inventory = await Inventory.findOne({ _id: req.params.id.toString() });
    if (!inventory) {
      return res.status(404).json({ msg: '庫存記錄不存在' });
    }
    
    // 如果更改了藥品，檢查新藥品是否存在
    if (product && product !== inventory.product.toString()) {
      // 修正：使用 findOne 替代 findById，並將 product 轉換為字串
      const productExists = await BaseProduct.findOne({ _id: product.toString() });
      if (!productExists) {
        return res.status(404).json({ msg: '藥品不存在' });
      }
    }
    
    // 更新
    // 修正：使用 findOneAndUpdate 替代 findByIdAndUpdate，並將 id 轉換為字串
    inventory = await Inventory.findOneAndUpdate(
      { _id: req.params.id.toString() },
      { $set: inventoryFields },
      { new: true }
    );
    res.json(inventory);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '庫存記錄不存在' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/inventory/:id
// @desc    Delete an inventory item
// @access  Public (已改為公開)
router.delete('/:id', async (req, res) => {
  try {
    // 修正：使用 findOne 替代 findById，並將 id 轉換為字串
    const inventory = await Inventory.findOne({ _id: req.params.id.toString() });
    if (!inventory) {
      return res.status(404).json({ msg: '庫存記錄不存在' });
    }
    await inventory.deleteOne();
    res.json({ msg: '庫存記錄已刪除' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '庫存記錄不存在' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/inventory/product/:productId
// @desc    Get inventory by product ID
// @access  Public (已改為公開)
router.get('/product/:productId', async (req, res) => {
  try {
    const inventory = await Inventory.find({ product: req.params.productId.toString() })
      .populate('product')
      .populate('purchaseOrderId', 'poid orderNumber pobill')
      .populate('saleId', 'saleNumber');
    res.json(inventory);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

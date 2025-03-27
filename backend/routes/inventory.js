const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
// const auth = require('../middleware/auth'); // 已移除
const Inventory = require('../models/Inventory');
const { BaseProduct } = require('../models/BaseProduct');

// @route   GET api/inventory
// @desc    Get all inventory items
// @access  Public (已改為公開)
router.get('/', async (req, res) => {
  try {
    const inventory = await Inventory.find().populate('product');
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
    const inventory = await Inventory.findById(req.params.id).populate('product');
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
    // 移除 auth
    // auth,
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
      batchNumber,
      expiryDate,
      location
    } = req.body;
    try {
      // 檢查藥品是否存在
      const productExists = await BaseProduct.findById(product);
      if (!productExists) {
        return res.status(404).json({ msg: '藥品不存在' });
      }
      
      // 檢查是否已有該藥品的庫存記錄
      let existingInventory = null;
      if (batchNumber) {
        existingInventory = await Inventory.findOne({ 
          product, 
          batchNumber 
        });
      } else {
        existingInventory = await Inventory.findOne({ product });
      }
      
      if (existingInventory) {
        // 更新現有庫存
        existingInventory.quantity += parseInt(quantity);
        existingInventory.lastUpdated = Date.now();
        if (expiryDate) existingInventory.expiryDate = expiryDate;
        if (location) existingInventory.location = location;
        
        await existingInventory.save();
        return res.json(existingInventory);
      }
      
      // 建立新庫存記錄
      const inventoryFields = {
        product,
        quantity
      };
      if (batchNumber) inventoryFields.batchNumber = batchNumber;
      if (expiryDate) inventoryFields.expiryDate = expiryDate;
      if (location) inventoryFields.location = location;

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
    batchNumber,
    expiryDate,
    location
  } = req.body;
  // 建立更新欄位物件
  const inventoryFields = {};
  if (product) inventoryFields.product = product;
  if (quantity !== undefined) inventoryFields.quantity = quantity;
  if (batchNumber) inventoryFields.batchNumber = batchNumber;
  if (expiryDate) inventoryFields.expiryDate = expiryDate;
  if (location) inventoryFields.location = location;
  inventoryFields.lastUpdated = Date.now();
  
  try {
    let inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ msg: '庫存記錄不存在' });
    }
    
    // 如果更改了藥品，檢查新藥品是否存在
    if (product && product !== inventory.product.toString()) {
      const productExists = await BaseProduct.findById(product);
      if (!productExists) {
        return res.status(404).json({ msg: '藥品不存在' });
      }
    }
    
    // 更新
    inventory = await Inventory.findByIdAndUpdate(
      req.params.id,
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
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ msg: '庫存記錄不存在' });
    }
    await inventory.remove();
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
    const inventory = await Inventory.find({ product: req.params.productId }).populate('product');
    res.json(inventory);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

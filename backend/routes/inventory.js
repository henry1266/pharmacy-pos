const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const Inventory = require('../models/Inventory');
const Product = require('../models/Product');

// @route   GET api/inventory
// @desc    Get all inventory items
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const inventory = await Inventory.find().populate('product', ['name', 'code', 'specification']);
    res.json(inventory);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/inventory/:id
// @desc    Get inventory item by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id).populate('product', ['name', 'code', 'specification']);
    
    if (!inventory) {
      return res.status(404).json({ msg: '庫存項目不存在' });
    }
    
    res.json(inventory);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '庫存項目不存在' });
    }
    
    res.status(500).send('Server Error');
  }
});

// @route   POST api/inventory
// @desc    Create an inventory item
// @access  Private
router.post('/', [
  auth,
  [
    check('product', '產品ID為必填項').not().isEmpty(),
    check('quantity', '數量為必填項').isNumeric()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const {
    product,
    quantity,
    batchNumber,
    expiryDate,
    location,
    costPrice
  } = req.body;
  
  try {
    // 檢查產品是否存在
    const productExists = await Product.findById(product);
    if (!productExists) {
      return res.status(404).json({ msg: '產品不存在' });
    }
    
    // 檢查是否已有相同批號的庫存
    if (batchNumber) {
      const existingInventory = await Inventory.findOne({ 
        product, 
        batchNumber 
      });
      
      if (existingInventory) {
        // 更新現有庫存
        existingInventory.quantity += quantity;
        existingInventory.lastUpdated = Date.now();
        
        await existingInventory.save();
        return res.json(existingInventory);
      }
    }
    
    // 創建新庫存項目
    const inventoryFields = {
      product,
      quantity,
      lastUpdated: Date.now()
    };
    
    if (batchNumber) inventoryFields.batchNumber = batchNumber;
    if (expiryDate) inventoryFields.expiryDate = expiryDate;
    if (location) inventoryFields.location = location;
    if (costPrice) inventoryFields.costPrice = costPrice;
    
    const inventory = new Inventory(inventoryFields);
    await inventory.save();
    
    res.json(inventory);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/inventory/:id
// @desc    Update inventory item
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const {
    quantity,
    batchNumber,
    expiryDate,
    location,
    costPrice
  } = req.body;
  
  // 建立更新對象
  const inventoryFields = {};
  if (quantity !== undefined) inventoryFields.quantity = quantity;
  if (batchNumber) inventoryFields.batchNumber = batchNumber;
  if (expiryDate) inventoryFields.expiryDate = expiryDate;
  if (location) inventoryFields.location = location;
  if (costPrice) inventoryFields.costPrice = costPrice;
  inventoryFields.lastUpdated = Date.now();
  
  try {
    let inventory = await Inventory.findById(req.params.id);
    
    if (!inventory) {
      return res.status(404).json({ msg: '庫存項目不存在' });
    }
    
    // 更新庫存
    inventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      { $set: inventoryFields },
      { new: true }
    );
    
    res.json(inventory);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '庫存項目不存在' });
    }
    
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/inventory/:id
// @desc    Delete inventory item
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id);
    
    if (!inventory) {
      return res.status(404).json({ msg: '庫存項目不存在' });
    }
    
    await inventory.remove();
    
    res.json({ msg: '庫存項目已刪除' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '庫存項目不存在' });
    }
    
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/inventory/adjust/:id
// @desc    Adjust inventory quantity
// @access  Private
router.put('/adjust/:id', [
  auth,
  [
    check('adjustmentQuantity', '調整數量為必填項').isNumeric(),
    check('adjustmentReason', '調整原因為必填項').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { adjustmentQuantity, adjustmentReason } = req.body;
  
  try {
    let inventory = await Inventory.findById(req.params.id);
    
    if (!inventory) {
      return res.status(404).json({ msg: '庫存項目不存在' });
    }
    
    // 調整庫存數量
    inventory.quantity += adjustmentQuantity;
    inventory.lastUpdated = Date.now();
    
    // 添加調整記錄
    if (!inventory.adjustmentHistory) {
      inventory.adjustmentHistory = [];
    }
    
    inventory.adjustmentHistory.push({
      date: Date.now(),
      quantity: adjustmentQuantity,
      reason: adjustmentReason,
      user: req.user.id
    });
    
    await inventory.save();
    
    res.json(inventory);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '庫存項目不存在' });
    }
    
    res.status(500).send('Server Error');
  }
});

module.exports = router;

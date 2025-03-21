const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const Supplier = require('../models/Supplier');

// @route   GET api/suppliers
// @desc    Get all suppliers
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.json(suppliers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/suppliers/:id
// @desc    Get supplier by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ msg: '供應商不存在' });
    }
    
    res.json(supplier);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '供應商不存在' });
    }
    
    res.status(500).send('Server Error');
  }
});

// @route   POST api/suppliers
// @desc    Create a supplier
// @access  Private
router.post('/', [
  auth,
  [
    check('name', '供應商名稱為必填項').not().isEmpty(),
    check('code', '供應商編號為必填項').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const {
    code,
    name,
    contactPerson,
    phone,
    email,
    address,
    taxId,
    paymentTerms,
    notes
  } = req.body;
  
  try {
    // 檢查供應商編號是否已存在
    let supplier = await Supplier.findOne({ code });
    
    if (supplier) {
      return res.status(400).json({ msg: '供應商編號已存在' });
    }
    
    // 創建新供應商
    supplier = new Supplier({
      code,
      name,
      contactPerson,
      phone,
      email,
      address,
      taxId,
      paymentTerms,
      notes
    });
    
    await supplier.save();
    
    res.json(supplier);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/suppliers/:id
// @desc    Update a supplier
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const {
    code,
    name,
    contactPerson,
    phone,
    email,
    address,
    taxId,
    paymentTerms,
    notes
  } = req.body;
  
  // 建立更新對象
  const supplierFields = {};
  if (code) supplierFields.code = code;
  if (name) supplierFields.name = name;
  if (contactPerson) supplierFields.contactPerson = contactPerson;
  if (phone) supplierFields.phone = phone;
  if (email) supplierFields.email = email;
  if (address) supplierFields.address = address;
  if (taxId) supplierFields.taxId = taxId;
  if (paymentTerms) supplierFields.paymentTerms = paymentTerms;
  if (notes) supplierFields.notes = notes;
  
  try {
    let supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ msg: '供應商不存在' });
    }
    
    // 如果編號已更改，檢查新編號是否已存在
    if (code && code !== supplier.code) {
      const existingSupplier = await Supplier.findOne({ code });
      if (existingSupplier) {
        return res.status(400).json({ msg: '供應商編號已存在' });
      }
    }
    
    // 更新供應商
    supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { $set: supplierFields },
      { new: true }
    );
    
    res.json(supplier);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '供應商不存在' });
    }
    
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/suppliers/:id
// @desc    Delete a supplier
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ msg: '供應商不存在' });
    }
    
    await supplier.remove();
    
    res.json({ msg: '供應商已刪除' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '供應商不存在' });
    }
    
    res.status(500).send('Server Error');
  }
});

module.exports = router;

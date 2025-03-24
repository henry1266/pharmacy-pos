const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
// const auth = require('../middleware/auth'); // 已移除
const Supplier = require('../models/Supplier');

// @route   GET api/suppliers
// @desc    Get all suppliers
// @access  Public (已改為公開)
router.get('/', async (req, res) => {
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
// @access  Public (已改為公開)
router.get('/:id', async (req, res) => {
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
// @access  Public (已改為公開)
router.post(
  '/',
  [
    // 移除 auth
    // auth,
    [
      check('name', '供應商名稱為必填項').not().isEmpty(),
      check('code', '供應商編號為必填項').not().isEmpty(),
      check('phone', '電話號碼為必填項').not().isEmpty()
    ]
  ],
  async (req, res) => {
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
      // 建立供應商欄位物件
      const supplierFields = {
        code,
        name,
        phone
      };
      if (contactPerson) supplierFields.contactPerson = contactPerson;
      if (email) supplierFields.email = email;
      if (address) supplierFields.address = address;
      if (taxId) supplierFields.taxId = taxId;
      if (paymentTerms) supplierFields.paymentTerms = paymentTerms;
      if (notes) supplierFields.notes = notes;

      supplier = new Supplier(supplierFields);
      await supplier.save();
      res.json(supplier);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/suppliers/:id
// @desc    Update a supplier
// @access  Public (已改為公開)
router.put('/:id', async (req, res) => {
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
  // 建立更新欄位物件
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
    // 若編號被修改，檢查是否重複
    if (code && code !== supplier.code) {
      const existingSupplier = await Supplier.findOne({ code });
      if (existingSupplier) {
        return res.status(400).json({ msg: '供應商編號已存在' });
      }
    }
    // 更新
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
// @access  Public (已改為公開)
router.delete('/:id', async (req, res) => {
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

const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const Customer = require('../models/Customer');

// @route   GET api/customers
// @desc    Get all customers
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const customers = await Customer.find().sort({ name: 1 });
    res.json(customers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/customers/:id
// @desc    Get customer by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ msg: '會員不存在' });
    }
    
    res.json(customer);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '會員不存在' });
    }
    
    res.status(500).send('Server Error');
  }
});

// @route   POST api/customers
// @desc    Create a customer
// @access  Private
router.post('/', [
  auth,
  [
    check('name', '會員姓名為必填項').not().isEmpty(),
    check('phone', '電話號碼為必填項').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const {
    code,
    name,
    phone,
    email,
    address,
    birthdate,
    gender,
    medicalHistory,
    allergies,
    membershipLevel,
    points
  } = req.body;
  
  try {
    // 檢查會員編號是否已存在
    if (code) {
      let customer = await Customer.findOne({ code });
      
      if (customer) {
        return res.status(400).json({ msg: '會員編號已存在' });
      }
    }
    
    // 創建新會員
    const customerFields = {
      name,
      phone
    };
    
    if (code) customerFields.code = code;
    if (email) customerFields.email = email;
    if (address) customerFields.address = address;
    if (birthdate) customerFields.birthdate = birthdate;
    if (gender) customerFields.gender = gender;
    if (medicalHistory) customerFields.medicalHistory = medicalHistory;
    if (allergies) customerFields.allergies = allergies;
    if (membershipLevel) customerFields.membershipLevel = membershipLevel;
    if (points) customerFields.points = points;
    
    // 如果沒有提供會員編號，自動生成
    if (!code) {
      const customerCount = await Customer.countDocuments();
      customerFields.code = `C${String(customerCount + 1).padStart(5, '0')}`;
    }
    
    const customer = new Customer(customerFields);
    await customer.save();
    
    res.json(customer);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/customers/:id
// @desc    Update a customer
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const {
    code,
    name,
    phone,
    email,
    address,
    birthdate,
    gender,
    medicalHistory,
    allergies,
    membershipLevel,
    points
  } = req.body;
  
  // 建立更新對象
  const customerFields = {};
  if (code) customerFields.code = code;
  if (name) customerFields.name = name;
  if (phone) customerFields.phone = phone;
  if (email) customerFields.email = email;
  if (address) customerFields.address = address;
  if (birthdate) customerFields.birthdate = birthdate;
  if (gender) customerFields.gender = gender;
  if (medicalHistory) customerFields.medicalHistory = medicalHistory;
  if (allergies) customerFields.allergies = allergies;
  if (membershipLevel) customerFields.membershipLevel = membershipLevel;
  if (points !== undefined) customerFields.points = points;
  
  try {
    let customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ msg: '會員不存在' });
    }
    
    // 如果編號已更改，檢查新編號是否已存在
    if (code && code !== customer.code) {
      const existingCustomer = await Customer.findOne({ code });
      if (existingCustomer) {
        return res.status(400).json({ msg: '會員編號已存在' });
      }
    }
    
    // 更新會員
    customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { $set: customerFields },
      { new: true }
    );
    
    res.json(customer);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '會員不存在' });
    }
    
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/customers/:id
// @desc    Delete a customer
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ msg: '會員不存在' });
    }
    
    await customer.remove();
    
    res.json({ msg: '會員已刪除' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '會員不存在' });
    }
    
    res.status(500).send('Server Error');
  }
});

module.exports = router;

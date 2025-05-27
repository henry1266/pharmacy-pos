const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
// const auth = require('../middleware/auth'); // 已移除

const Customer = require('../models/Customer');

// @route   GET api/customers
// @desc    Get all customers
// @access  Public (已改為公開)
router.get('/', async (req, res) => {
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
// @access  Public (已改為公開)
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id.toString() });

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
// @access  Public (已改為公開)
router.post(
  '/',
  [
    // 移除 auth
    // auth,
    [
      check('name', '會員姓名為必填項').not().isEmpty(),
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
      phone,
      email,
      address,
      birthdate,
      gender,
      medicalHistory,
      allergies,
      membershipLevel,
      points,
      idCardNumber // <<< Add idCardNumber here
    } = req.body;

    try {
      // 檢查會員編號是否已存在
      if (code) {
        let customer = await Customer.findOne({ code: code.toString() });
        if (customer) {
          return res.status(400).json({ msg: '會員編號已存在' });
        }
      }

      // 建立會員欄位物件
      const customerFields = { name, phone };
      if (code) customerFields.code = code;
      if (email) customerFields.email = email;
      if (address) customerFields.address = address;
      if (birthdate) customerFields.birthdate = birthdate;
      if (gender) customerFields.gender = gender;
      if (medicalHistory) customerFields.medicalHistory = medicalHistory;
      if (allergies) customerFields.allergies = allergies;
      if (membershipLevel) customerFields.membershipLevel = membershipLevel;
      if (points) customerFields.points = points;
      if (idCardNumber) customerFields.idCardNumber = idCardNumber; // <<< Add idCardNumber here

      // 若沒提供會員編號，系統自動生成
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
  }
);

// @route   PUT api/customers/:id
// @desc    Update a customer
// @access  Public (已改為公開)
router.put('/:id', async (req, res) => {
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
    points,
    idCardNumber, // <<< Add idCardNumber here
    note // <<< Add note here
  } = req.body;

  // 建立更新欄位物件
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
  if (idCardNumber) customerFields.idCardNumber = idCardNumber; // <<< Add idCardNumber here
  if (note !== undefined) customerFields.note = note; // <<< Add note here

  try {
    let customer = await Customer.findOne({ _id: req.params.id.toString() });
    if (!customer) {
      return res.status(404).json({ msg: '會員不存在' });
    }

    // 若編號被修改，檢查是否重複
    if (code && code !== customer.code) {
      const existingCustomer = await Customer.findOne({ code: code.toString() });
      if (existingCustomer) {
        return res.status(400).json({ msg: '會員編號已存在' });
      }
    }

    // 更新
    customer = await Customer.findOneAndUpdate(
      { _id: req.params.id.toString() },
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
// @access  Public (已改為公開)
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id.toString() });

    if (!customer) {
      return res.status(404).json({ msg: '會員不存在' });
    }

    // 使用 findOneAndDelete 替代已棄用的 remove() 方法
    await Customer.findOneAndDelete({ _id: req.params.id.toString() });

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

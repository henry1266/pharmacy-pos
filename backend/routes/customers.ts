import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import Customer from '../models/Customer';
import { ApiResponse, ErrorResponse } from '../src/types/api';
import { ICustomerDocument } from '../src/types/models';

const router = express.Router();

// 型別定義
interface CustomerCreationRequest {
  code?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  notes?: string;
  isActive?: boolean;
  // 舊欄位相容性
  birthdate?: Date;
  medicalHistory?: string;
  allergies?: string;
  membershipLevel?: string;
  points?: number;
  idCardNumber?: string;
  note?: string;
}

interface CustomerUpdateRequest extends Partial<CustomerCreationRequest> {}

// @route   GET api/customers
// @desc    Get all customers
// @access  Public
router.get('/', async (req: Request, res: Response) => {
  try {
    const customers = await Customer.find().sort({ name: 1 });
    
    const response: ApiResponse<ICustomerDocument[]> = {
      success: true,
      message: 'Customers retrieved successfully',
      data: customers,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err: any) {
    console.error(err.message);
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Server Error',
      timestamp: new Date()
    };
    
    res.status(500).json(errorResponse);
  }
});

// @route   GET api/customers/:id
// @desc    Get customer by ID
// @access  Public
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id });

    if (!customer) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '會員不存在',
        timestamp: new Date()
      };
      return res.status(404).json(errorResponse);
    }

    const response: ApiResponse<ICustomerDocument> = {
      success: true,
      message: 'Customer retrieved successfully',
      data: customer,
      timestamp: new Date()
    };

    res.json(response);
  } catch (err: any) {
    console.error(err.message);

    if (err.kind === 'ObjectId') {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '會員不存在',
        timestamp: new Date()
      };
      return res.status(404).json(errorResponse);
    }

    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Server Error',
      timestamp: new Date()
    };

    res.status(500).json(errorResponse);
  }
});

/**
 * 檢查會員編號是否已存在
 */
async function checkCustomerCodeExists(code: string): Promise<boolean> {
  if (!code) return false;
  
  const customer = await Customer.findOne({ code: code });
  return !!customer;
}

/**
 * 生成新的會員編號
 */
async function generateCustomerCode(): Promise<string> {
  const customerCount = await Customer.countDocuments();
  return `C${String(customerCount + 1).padStart(5, '0')}`;
}

/**
 * 從請求中構建會員欄位物件
 */
function buildCustomerFields(reqBody: CustomerCreationRequest | CustomerUpdateRequest): Partial<ICustomerDocument> {
  const {
    code,
    name,
    phone,
    email,
    address,
    birthdate,
    dateOfBirth,
    gender,
    notes,
    note,
    isActive,
    // 舊欄位相容性
    medicalHistory,
    allergies,
    membershipLevel,
    points,
    idCardNumber
  } = reqBody;

  const customerFields: any = {};
  
  if (name) customerFields.name = name;
  if (phone) customerFields.phone = phone;
  if (code) customerFields.code = code;
  if (email) customerFields.email = email;
  if (address) customerFields.address = address;
  
  // 處理生日欄位 (支援新舊欄位名稱)
  if (dateOfBirth) customerFields.dateOfBirth = dateOfBirth;
  else if (birthdate) customerFields.dateOfBirth = birthdate;
  
  if (gender) customerFields.gender = gender;
  
  // 處理備註欄位 (支援新舊欄位名稱)
  if (notes !== undefined) customerFields.notes = notes;
  else if (note !== undefined) customerFields.notes = note;
  
  if (isActive !== undefined) customerFields.isActive = isActive;
  
  // 舊欄位相容性處理 (可能需要存在 notes 中或忽略)
  const additionalInfo: string[] = [];
  if (medicalHistory) additionalInfo.push(`病史: ${medicalHistory}`);
  if (allergies) additionalInfo.push(`過敏: ${allergies}`);
  if (membershipLevel) additionalInfo.push(`會員等級: ${membershipLevel}`);
  if (idCardNumber) additionalInfo.push(`身分證: ${idCardNumber}`);
  
  if (additionalInfo.length > 0) {
    const existingNotes = customerFields.notes || '';
    customerFields.notes = existingNotes ? 
      `${existingNotes}\n${additionalInfo.join('\n')}` : 
      additionalInfo.join('\n');
  }
  
  return customerFields;
}

// @route   POST api/customers
// @desc    Create a customer
// @access  Public
router.post(
  '/',
  [
    check('name', '會員姓名為必填項').not().isEmpty(),
    check('phone', '電話號碼為必填項').not().isEmpty()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Validation failed',
        error: JSON.stringify(errors.array()),
        timestamp: new Date()
      };
      return res.status(400).json(errorResponse);
    }

    try {
      const requestBody = req.body as CustomerCreationRequest;
      
      // 檢查會員編號是否已存在
      if (requestBody.code && await checkCustomerCodeExists(requestBody.code)) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: '會員編號已存在',
          timestamp: new Date()
        };
        return res.status(400).json(errorResponse);
      }

      // 建立會員欄位物件
      const customerFields = buildCustomerFields(requestBody);

      // 若沒提供會員編號，系統自動生成
      if (!requestBody.code) {
        customerFields.code = await generateCustomerCode();
      }

      const customer = new Customer(customerFields);
      await customer.save();

      const response: ApiResponse<ICustomerDocument> = {
        success: true,
        message: 'Customer created successfully',
        data: customer,
        timestamp: new Date()
      };

      res.json(response);
    } catch (err: any) {
      console.error(err.message);
      
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Server Error',
        timestamp: new Date()
      };
      
      res.status(500).json(errorResponse);
    }
  }
);

// @route   PUT api/customers/:id
// @desc    Update a customer
// @access  Public
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const requestBody = req.body as CustomerUpdateRequest;
    
    // 檢查會員是否存在
    let customer = await Customer.findOne({ _id: req.params.id });
    if (!customer) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '會員不存在',
        timestamp: new Date()
      };
      return res.status(404).json(errorResponse);
    }

    // 若編號被修改，檢查是否重複
    if (requestBody.code && requestBody.code !== customer.code) {
      if (await checkCustomerCodeExists(requestBody.code)) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: '會員編號已存在',
          timestamp: new Date()
        };
        return res.status(400).json(errorResponse);
      }
    }

    // 建立更新欄位物件
    const customerFields = buildCustomerFields(requestBody);

    // 更新
    const updatedCustomer = await Customer.findOneAndUpdate(
      { _id: req.params.id },
      { $set: customerFields },
      { new: true }
    );

    const response: ApiResponse<ICustomerDocument> = {
      success: true,
      message: 'Customer updated successfully',
      data: updatedCustomer!,
      timestamp: new Date()
    };

    res.json(response);
  } catch (err: any) {
    console.error(err.message);

    if (err.kind === 'ObjectId') {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '會員不存在',
        timestamp: new Date()
      };
      return res.status(404).json(errorResponse);
    }

    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Server Error',
      timestamp: new Date()
    };

    res.status(500).json(errorResponse);
  }
});

// @route   DELETE api/customers/:id
// @desc    Delete a customer
// @access  Public
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id });

    if (!customer) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '會員不存在',
        timestamp: new Date()
      };
      return res.status(404).json(errorResponse);
    }

    // 使用 findOneAndDelete 替代已棄用的 remove() 方法
    await Customer.findOneAndDelete({ _id: req.params.id });

    const response: ApiResponse<null> = {
      success: true,
      message: '會員已刪除',
      data: null,
      timestamp: new Date()
    };

    res.json(response);
  } catch (err: any) {
    console.error(err.message);

    if (err.kind === 'ObjectId') {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '會員不存在',
        timestamp: new Date()
      };
      return res.status(404).json(errorResponse);
    }

    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Server Error',
      timestamp: new Date()
    };

    res.status(500).json(errorResponse);
  }
});

export default router;
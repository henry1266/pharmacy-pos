import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import Customer from '../models/Customer';
import { ApiResponse, ErrorResponse } from '@shared/types/api';
import { Customer as CustomerType } from '@shared/types/entities';
import { API_CONSTANTS, ERROR_MESSAGES } from '@shared/constants';

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
    
    const response: ApiResponse<CustomerType[]> = {
      success: true,
      message: 'Customers retrieved successfully',
      data: customers.map(customer => ({
        _id: customer._id.toString(),
        name: customer.name,
        code: customer.code,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        birthdate: customer.birthdate,
        gender: customer.gender,
        notes: customer.notes,
        idCardNumber: customer.idCardNumber,
        allergies: customer.allergies,
        membershipLevel: customer.membershipLevel,
        medicalHistory: customer.medicalHistory,
        totalPurchases: customer.totalPurchases,
        lastPurchaseDate: customer.lastPurchaseDate,
        date: customer.date,
        createdAt: (customer as any).createdAt,
        updatedAt: (customer as any).updatedAt
      })),
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err: any) {
    console.error(err.message);
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
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
        message: ERROR_MESSAGES.CUSTOMER.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }

    const response: ApiResponse<CustomerType> = {
      success: true,
      message: 'Customer retrieved successfully',
      data: {
        _id: customer._id.toString(),
        name: customer.name,
        code: customer.code,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        birthdate: customer.birthdate,
        gender: customer.gender,
        notes: customer.notes,
        idCardNumber: customer.idCardNumber,
        allergies: customer.allergies,
        membershipLevel: customer.membershipLevel,
        medicalHistory: customer.medicalHistory,
        totalPurchases: customer.totalPurchases,
        lastPurchaseDate: customer.lastPurchaseDate,
        date: customer.date,
        createdAt: (customer as any).createdAt,
        updatedAt: (customer as any).updatedAt
      },
      timestamp: new Date()
    };

    res.json(response);
  } catch (err: any) {
    console.error(err.message);

    if (err.kind === 'ObjectId') {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.CUSTOMER.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }

    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };

    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
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
function buildCustomerFields(reqBody: CustomerCreationRequest | CustomerUpdateRequest): Partial<CustomerType> {
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
  if (dateOfBirth) customerFields.birthdate = dateOfBirth;
  else if (birthdate) customerFields.birthdate = birthdate;
  
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
        message: ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
        error: JSON.stringify(errors.array()),
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
    }

    try {
      const requestBody = req.body as CustomerCreationRequest;
      
      // 檢查會員編號是否已存在
      if (requestBody.code && await checkCustomerCodeExists(requestBody.code)) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: ERROR_MESSAGES.CUSTOMER.CODE_EXISTS,
          timestamp: new Date()
        };
        res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
      }

      // 建立會員欄位物件
      const customerFields = buildCustomerFields(requestBody);

      // 若沒提供會員編號，系統自動生成
      if (!requestBody.code) {
        customerFields.code = await generateCustomerCode();
      }

      const customer = new Customer(customerFields);
      await customer.save();

      const response: ApiResponse<CustomerType> = {
        success: true,
        message: 'Customer created successfully',
        data: {
          _id: customer._id.toString(),
          name: customer.name,
          code: customer.code,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          birthdate: customer.birthdate,
          gender: customer.gender,
          notes: customer.notes,
          idCardNumber: customer.idCardNumber,
          allergies: customer.allergies,
          membershipLevel: customer.membershipLevel,
          medicalHistory: customer.medicalHistory,
          totalPurchases: customer.totalPurchases,
          lastPurchaseDate: customer.lastPurchaseDate,
          date: customer.date,
          createdAt: (customer as any).createdAt,
          updatedAt: (customer as any).updatedAt
        },
        timestamp: new Date()
      };

      res.json(response);
    } catch (err: any) {
      console.error(err.message);
      
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
        timestamp: new Date()
      };
      
      res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
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
        message: ERROR_MESSAGES.CUSTOMER.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }

    // 若編號被修改，檢查是否重複
    if (requestBody.code && requestBody.code !== customer.code) {
      if (await checkCustomerCodeExists(requestBody.code)) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: ERROR_MESSAGES.CUSTOMER.CODE_EXISTS,
          timestamp: new Date()
        };
        res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
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

    const response: ApiResponse<CustomerType> = {
      success: true,
      message: 'Customer updated successfully',
      data: {
        _id: updatedCustomer!._id.toString(),
        name: updatedCustomer!.name,
        code: updatedCustomer!.code,
        phone: updatedCustomer!.phone,
        email: updatedCustomer!.email,
        address: updatedCustomer!.address,
        birthdate: updatedCustomer!.birthdate,
        gender: updatedCustomer!.gender,
        notes: updatedCustomer!.notes,
        idCardNumber: updatedCustomer!.idCardNumber,
        allergies: updatedCustomer!.allergies,
        membershipLevel: updatedCustomer!.membershipLevel,
        medicalHistory: updatedCustomer!.medicalHistory,
        totalPurchases: updatedCustomer!.totalPurchases,
        lastPurchaseDate: updatedCustomer!.lastPurchaseDate,
        date: updatedCustomer!.date,
        createdAt: (updatedCustomer as any).createdAt,
        updatedAt: (updatedCustomer as any).updatedAt
      },
      timestamp: new Date()
    };

    res.json(response);
  } catch (err: any) {
    console.error(err.message);

    if (err.kind === 'ObjectId') {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.CUSTOMER.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }

    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };

    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
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
        message: ERROR_MESSAGES.CUSTOMER.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
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
        message: ERROR_MESSAGES.CUSTOMER.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }

    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };

    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

export default router;
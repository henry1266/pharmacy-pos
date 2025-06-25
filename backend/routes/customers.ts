import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Customer from '../models/Customer';
import { ApiResponse, ErrorResponse } from '@pharmacy-pos/shared/types/api';
import { Customer as CustomerType } from '@pharmacy-pos/shared/types/entities';
import { API_CONSTANTS, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';

const router: express.Router = express.Router();

/**
 * 驗證 MongoDB ObjectId 是否有效
 * 防止 NoSQL 注入攻擊
 */
function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * 將 MongoDB 客戶文檔轉換為 API 響應格式
 */
function transformCustomerToResponse(customer: any): CustomerType {
  return {
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
    createdAt: (customer as unknown as { createdAt?: Date }).createdAt,
    updatedAt: (customer as unknown as { updatedAt?: Date }).updatedAt
  };
}

/**
 * 創建成功響應
 */
function createSuccessResponse<T>(message: string, data: T): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    timestamp: new Date()
  };
}

/**
 * 創建錯誤響應
 */
function createErrorResponse(message: string, error?: string): ErrorResponse {
  return {
    success: false,
    message,
    error,
    timestamp: new Date()
  };
}

/**
 * 處理數據庫錯誤
 */
function handleDatabaseError(err: unknown, res: Response): void {
  console.error(err instanceof Error ? err.message : 'Unknown error');

  if (err instanceof Error && err.name === 'CastError') {
    res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND)
       .json(createErrorResponse(ERROR_MESSAGES.CUSTOMER.NOT_FOUND));
    return;
  }

  res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR)
     .json(createErrorResponse(ERROR_MESSAGES.GENERIC.SERVER_ERROR));
}

// 型別定義
interface CustomerCreationRequest {
  code?: string;
  name: string;
  phone?: string;
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
    const transformedCustomers = customers.map(transformCustomerToResponse);
    
    res.json(createSuccessResponse('Customers retrieved successfully', transformedCustomers));
  } catch (err) {
    handleDatabaseError(err, res);
  }
});

// @route   GET api/customers/:id
// @desc    Get customer by ID
// @access  Public
router.get('/:id', async (req: Request, res: Response) => {
  try {
    // 驗證 ID 格式，防止 NoSQL 注入
    if (!isValidObjectId(req.params.id)) {
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND)
         .json(createErrorResponse(ERROR_MESSAGES.CUSTOMER.NOT_FOUND));
      return;
    }

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND)
         .json(createErrorResponse(ERROR_MESSAGES.CUSTOMER.NOT_FOUND));
      return;
    }

    res.json(createSuccessResponse('Customer retrieved successfully', transformCustomerToResponse(customer)));
  } catch (err) {
    handleDatabaseError(err, res);
  }
});

/**
 * 檢查會員編號是否已存在
 */
async function checkCustomerCodeExists(code: string): Promise<boolean> {
  if (!code) return false;
  
  // 使用嚴格的查詢條件，防止 NoSQL 注入
  const customer = await Customer.findOne({ code: String(code) });
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
/**
 * 從請求中構建會員欄位物件
 * 重構以降低認知複雜度
 */
function buildCustomerFields(reqBody: CustomerCreationRequest | CustomerUpdateRequest): Partial<CustomerType> {
  // 使用明確的型別而非 any
  const customerFields: Partial<CustomerType> = {};
  
  // 基本欄位處理
  assignBasicFields(reqBody, customerFields);
  
  // 處理生日欄位 (支援新舊欄位名稱)
  handleBirthdateField(reqBody, customerFields);
  
  // 處理備註欄位 (支援新舊欄位名稱)
  handleNotesField(reqBody, customerFields);
  
  // 處理其他欄位
  assignAdditionalFields(reqBody, customerFields);
  
  return customerFields;
}

/**
 * 處理基本欄位
 */
function assignBasicFields(
  reqBody: CustomerCreationRequest | CustomerUpdateRequest,
  customerFields: Partial<CustomerType>
): void {
  const { name, phone, code, email, address, gender, isActive } = reqBody;
  
  if (name) customerFields.name = name;
  if (phone) customerFields.phone = phone;
  if (code) customerFields.code = code;
  if (email) customerFields.email = email;
  if (address) customerFields.address = address;
  if (gender) customerFields.gender = gender;
  if (isActive !== undefined) (customerFields as unknown as { isActive?: boolean }).isActive = isActive;
}

/**
 * 處理生日欄位
 */
function handleBirthdateField(
  reqBody: CustomerCreationRequest | CustomerUpdateRequest,
  customerFields: Partial<CustomerType>
): void {
  const { dateOfBirth, birthdate } = reqBody;
  
  if (dateOfBirth) {
    customerFields.birthdate = dateOfBirth;
  } else if (birthdate) {
    customerFields.birthdate = birthdate;
  }
}

/**
 * 處理備註欄位
 */
function handleNotesField(
  reqBody: CustomerCreationRequest | CustomerUpdateRequest,
  customerFields: Partial<CustomerType>
): void {
  const { notes, note } = reqBody;
  
  if (notes !== undefined) {
    customerFields.notes = notes;
  } else if (note !== undefined) {
    customerFields.notes = note;
  }
}

/**
 * 處理其他欄位
 */
function assignAdditionalFields(
  reqBody: CustomerCreationRequest | CustomerUpdateRequest,
  customerFields: Partial<CustomerType>
): void {
  const { medicalHistory, allergies, membershipLevel, idCardNumber, points } = reqBody;
  
  if (medicalHistory !== undefined) customerFields.medicalHistory = medicalHistory;
  if (allergies !== undefined) {
    try {
      if (typeof allergies === 'string') {
        customerFields.allergies = allergies.trim() ? [allergies.trim()] : [];
      } else if (Array.isArray(allergies)) {
        customerFields.allergies = allergies.filter((item: any) =>
          typeof item === 'string' && item.trim()
        ).map((item: string) => item.trim());
      } else {
        customerFields.allergies = [];
      }
    } catch (error) {
      console.error('Error processing allergies field:', error);
      customerFields.allergies = [];
    }
  }
  if (membershipLevel !== undefined) customerFields.membershipLevel = membershipLevel as 'regular' | 'silver' | 'gold' | 'platinum';
  if (idCardNumber !== undefined) customerFields.idCardNumber = idCardNumber;
  if (points !== undefined) (customerFields as unknown as { points?: number }).points = points;
}

// @route   POST api/customers
// @desc    Create a customer
// @access  Public
router.post(
  '/',
  [
    check('name', '會員姓名為必填項').not().isEmpty()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST)
         .json(createErrorResponse(ERROR_MESSAGES.GENERIC.VALIDATION_FAILED, JSON.stringify(errors.array())));
      return;
    }

    try {
      const requestBody = req.body as CustomerCreationRequest;
      
      // 檢查會員編號是否已存在
      if (requestBody.code && await checkCustomerCodeExists(requestBody.code)) {
        res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST)
           .json(createErrorResponse(ERROR_MESSAGES.CUSTOMER.CODE_EXISTS));
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

      res.json(createSuccessResponse('Customer created successfully', transformCustomerToResponse(customer)));
    } catch (err) {
      handleDatabaseError(err, res);
    }
  }
);

// @route   PUT api/customers/:id
// @desc    Update a customer
// @access  Public
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const requestBody = req.body as CustomerUpdateRequest;
    
    // 驗證 ID 格式，防止 NoSQL 注入
    if (!isValidObjectId(req.params.id)) {
      return res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND)
         .json(createErrorResponse(ERROR_MESSAGES.CUSTOMER.NOT_FOUND));
    }
    
    // 檢查會員是否存在
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND)
         .json(createErrorResponse(ERROR_MESSAGES.CUSTOMER.NOT_FOUND));
    }

    // 若編號被修改，檢查是否重複
    if (requestBody.code && requestBody.code !== customer.code) {
      const codeExists = await checkCustomerCodeExists(requestBody.code);
      if (codeExists) {
        return res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST)
           .json(createErrorResponse(ERROR_MESSAGES.CUSTOMER.CODE_EXISTS));
      }
    }

    // 建立更新欄位物件 - 只包含有值的欄位
    const customerFields = buildCustomerFields(requestBody);
    
    // 確保不會更新空值或未定義的欄位
    const filteredFields = Object.fromEntries(
      Object.entries(customerFields).filter(([_, value]) => value !== undefined && value !== null)
    );

    // 更新 - 使用已驗證的 ID 和過濾後的欄位
    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      { $set: filteredFields },
      {
        new: true,
        runValidators: true,
        context: 'query'
      }
    );

    if (!updatedCustomer) {
      return res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND)
         .json(createErrorResponse(ERROR_MESSAGES.CUSTOMER.NOT_FOUND));
    }

    res.json(createSuccessResponse('Customer updated successfully', transformCustomerToResponse(updatedCustomer)));
  } catch (err) {
    console.error('Customer update error:', err);
    handleDatabaseError(err, res);
  }
});

// @route   DELETE api/customers/:id
// @desc    Delete a customer
// @access  Public
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    // 驗證 ID 格式，防止 NoSQL 注入
    if (!isValidObjectId(req.params.id)) {
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND)
         .json(createErrorResponse(ERROR_MESSAGES.CUSTOMER.NOT_FOUND));
      return;
    }

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND)
         .json(createErrorResponse(ERROR_MESSAGES.CUSTOMER.NOT_FOUND));
      return;
    }

    // 使用 findOneAndDelete 替代已棄用的 remove() 方法
    // 使用已驗證的 ID
    await Customer.findByIdAndDelete(req.params.id);

    res.json(createSuccessResponse('會員已刪除', null));
  } catch (err) {
    handleDatabaseError(err, res);
  }
});

export default router;
import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import Supplier from '../models/Supplier';
import { ApiResponse, ErrorResponse, CSVImportResponse } from '@pharmacy-pos/shared/types/api';
import { Supplier as SupplierType } from '@pharmacy-pos/shared/types/entities';
import { API_CONSTANTS, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';

const router: express.Router = express.Router();

// 型別定義
interface SupplierCreationRequest {
  code?: string;
  shortCode: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
  notes?: string;
}

interface SupplierUpdateRequest extends Partial<SupplierCreationRequest> {}

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  duplicates: number;
  errors: Array<{
    row: any;
    error: string;
  }>;
}

// 輔助函數：轉換 Mongoose Document 到 SupplierType
function convertToSupplierType(supplier: any): SupplierType {
  return {
    _id: supplier._id.toString(),
    code: supplier.code,
    shortCode: supplier.shortCode,
    name: supplier.name,
    contactPerson: supplier.contactPerson,
    phone: supplier.phone,
    email: supplier.email,
    address: supplier.address,
    taxId: supplier.taxId,
    paymentTerms: supplier.paymentTerms,
    notes: supplier.notes,
    date: supplier.date,
    createdAt: supplier.createdAt ?? new Date(),
    updatedAt: supplier.updatedAt ?? new Date()
  };
}

// 設置文件上傳
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    // 確保上傳目錄存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `suppliers-${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // 只接受CSV文件
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('只接受CSV文件') as any, false);
    }
  },
  limits: {
    fileSize: 1024 * 1024 * 5 // 限制5MB
  }
});

// @route   GET api/suppliers
// @desc    Get all suppliers
// @access  Public
router.get('/', async (req: Request, res: Response) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    
    const response: ApiResponse<SupplierType[]> = {
      success: true,
      message: 'Suppliers retrieved successfully',
      data: suppliers.map(supplier => convertToSupplierType(supplier)),
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

// @route   GET api/suppliers/:id
// @desc    Get supplier by ID
// @access  Public
router.get('/:id', async (req: Request, res: Response) => {
  try {
    // 確保id存在
    if (!req.params.id) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.INVALID_REQUEST,
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
    }
    
    const supplier = await Supplier.findOne({ _id: req.params.id.toString() });
    
    if (!supplier) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.SUPPLIER.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }
    
    const response: ApiResponse<SupplierType> = {
      success: true,
      message: 'Supplier retrieved successfully',
      data: convertToSupplierType(supplier),
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err: any) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.SUPPLIER.NOT_FOUND,
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

// @route   POST api/suppliers
// @desc    Create a supplier
// @access  Public
router.post(
  '/',
  [
    check('name', '供應商名稱為必填項').not().isEmpty(),
    check('shortCode', '簡碼為必填項').not().isEmpty()
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
      const requestBody = req.body as SupplierCreationRequest;
      const {
        code,
        shortCode,
        name,
        contactPerson,
        phone,
        email,
        address,
        taxId,
        paymentTerms,
        notes
      } = requestBody;

      // 檢查供應商編號是否已存在
      if (code) {
        let supplier = await Supplier.findOne({ code: code.toString() });
        if (supplier) {
          const errorResponse: ErrorResponse = {
            success: false,
            message: ERROR_MESSAGES.SUPPLIER.CODE_EXISTS,
            timestamp: new Date()
          };
          res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
        }
      }

      // 建立供應商欄位物件
      const supplierFields: Partial<SupplierType> = {
        name: name.toString(),
        shortCode: shortCode.toString()
      };

      // 修復：允許保存空字符串值，使用 !== undefined 而不是簡單的 if 檢查
      if (code !== undefined) supplierFields.code = code.toString();
      if (contactPerson !== undefined) supplierFields.contactPerson = contactPerson.toString();
      if (phone !== undefined) supplierFields.phone = phone.toString();
      if (email !== undefined) supplierFields.email = email.toString();
      if (address !== undefined) supplierFields.address = address.toString();
      if (taxId !== undefined) supplierFields.taxId = taxId.toString();
      if (paymentTerms !== undefined) supplierFields.paymentTerms = paymentTerms.toString();
      if (notes !== undefined) supplierFields.notes = notes.toString();
      
      // 設置日期
      supplierFields.date = new Date();

      // 若沒提供供應商編號，系統自動生成
      if (!code) {
        const supplierCount = await Supplier.countDocuments();
        supplierFields.code = `S${String(supplierCount + 1).padStart(5, '0')}`;
      }

      let supplier = new Supplier(supplierFields);
      await supplier.save();
      
      const response: ApiResponse<SupplierType> = {
        success: true,
        message: 'Supplier created successfully',
        data: convertToSupplierType(supplier),
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

/**
 * 建立供應商更新欄位物件
 * @param reqBody - 請求體
 * @returns 供應商欄位物件
 */
function createSupplierFields(reqBody: SupplierUpdateRequest): Partial<SupplierType> {
  const {
    code,
    shortCode,
    name,
    contactPerson,
    phone,
    email,
    address,
    taxId,
    paymentTerms,
    notes
  } = reqBody;

  // 建立更新欄位物件
  const supplierFields: Partial<SupplierType> = {};
  
  // 修復：允許保存空字符串值，使用 !== undefined 而不是簡單的 if 檢查
  if (code !== undefined) supplierFields.code = code.toString();
  if (shortCode !== undefined) supplierFields.shortCode = shortCode.toString();
  if (name !== undefined) supplierFields.name = name.toString();
  if (contactPerson !== undefined) supplierFields.contactPerson = contactPerson.toString();
  if (phone !== undefined) supplierFields.phone = phone.toString();
  if (email !== undefined) supplierFields.email = email.toString();
  if (address !== undefined) supplierFields.address = address.toString();
  if (taxId !== undefined) supplierFields.taxId = taxId.toString();
  if (paymentTerms !== undefined) supplierFields.paymentTerms = paymentTerms.toString();
  if (notes !== undefined) supplierFields.notes = notes.toString();
  
  return supplierFields;
}

/**
 * 檢查供應商編號是否重複
 * @param code - 供應商編號
 * @param currentCode - 當前供應商編號
 * @returns 是否重複
 */
async function isCodeDuplicate(code: string | undefined, currentCode: string | undefined): Promise<boolean> {
  // 若編號未修改，不需檢查
  if (!code || code === currentCode) {
    return false;
  }
  
  const existingSupplier = await Supplier.findOne({ code: code.toString() });
  return !!existingSupplier;
}

/**
 * 應用更新到供應商物件
 * @param supplier - 供應商物件
 * @param supplierFields - 供應商欄位物件
 */
function applyUpdatesToSupplier(supplier: any, supplierFields: Partial<SupplierType>): void {
  Object.keys(supplierFields).forEach(key => {
    supplier[key] = (supplierFields as any)[key];
  });
}

// @route   PUT api/suppliers/:id
// @desc    Update a supplier
// @access  Public
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const requestBody = req.body as SupplierUpdateRequest;
    
    // 確保id存在
    if (!req.params.id) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.INVALID_REQUEST,
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
    }
    
    // 查找供應商
    let supplier = await Supplier.findOne({ _id: req.params.id.toString() });
    if (!supplier) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.SUPPLIER.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }

    // 建立更新欄位物件
    const supplierFields = createSupplierFields(requestBody);
    
    // 檢查編號是否重複
    if (await isCodeDuplicate(supplierFields.code, supplier.code)) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.SUPPLIER.CODE_EXISTS,
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
    }

    // 應用更新
    applyUpdatesToSupplier(supplier, supplierFields);
    
    // 保存更新
    await supplier.save();
    
    const response: ApiResponse<SupplierType> = {
      success: true,
      message: 'Supplier updated successfully',
      data: convertToSupplierType(supplier),
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err: any) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.SUPPLIER.NOT_FOUND,
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

// @route   DELETE api/suppliers/:id
// @desc    Delete a supplier
// @access  Public
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    // 確保id存在
    if (!req.params.id) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.INVALID_REQUEST,
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
    }
    
    const supplier = await Supplier.findOne({ _id: req.params.id.toString() });
    if (!supplier) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.SUPPLIER.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }

    // 修復：使用 deleteOne 替代 findByIdAndDelete
    await Supplier.deleteOne({ _id: req.params.id.toString() });
    
    const response: ApiResponse<null> = {
      success: true,
      message: '供應商已刪除',
      data: null,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err: any) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.SUPPLIER.NOT_FOUND,
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
 * 檢查CSV行的必填欄位
 * @param row - CSV行數據
 * @returns 檢查結果
 */
function validateRequiredFields(row: any): { isValid: boolean; error?: string } {
  if (!row.shortCode || !row.name) {
    return {
      isValid: false,
      error: '簡碼和供應商名稱為必填項'
    };
  }
  return { isValid: true };
}

/**
 * 檢查供應商編號是否已存在
 * @param code - 供應商編號
 * @returns 檢查結果
 */
async function checkCodeDuplicate(code: string | undefined): Promise<{ isDuplicate: boolean; existingId?: string }> {
  if (!code) {
    return { isDuplicate: false };
  }
  
  const existingSupplier = await Supplier.findOne({ code: code.toString() });
  if (existingSupplier) {
    return {
      isDuplicate: true,
      existingId: existingSupplier._id.toString()
    };
  }
  
  return { isDuplicate: false };
}

/**
 * 從CSV行創建供應商欄位物件
 * @param row - CSV行數據
 * @returns 供應商欄位物件
 */
function createSupplierFieldsFromRow(row: any): Partial<SupplierType> {
  const supplierFields: Partial<SupplierType> = {
    name: row.name.toString(),
    shortCode: row.shortCode.toString(),
    date: new Date()
  };

  // 處理可選欄位
  if (row.code) supplierFields.code = row.code.toString();
  if (row.contactPerson) supplierFields.contactPerson = row.contactPerson.toString();
  if (row.phone) supplierFields.phone = row.phone.toString();
  if (row.email) supplierFields.email = row.email.toString();
  if (row.address) supplierFields.address = row.address.toString();
  if (row.taxId) supplierFields.taxId = row.taxId.toString();
  if (row.paymentTerms) supplierFields.paymentTerms = row.paymentTerms.toString();
  if (row.notes) supplierFields.notes = row.notes.toString();
  
  return supplierFields;
}

/**
 * 生成供應商編號
 * @returns 生成的供應商編號
 */
async function generateSupplierCode(): Promise<string> {
  const supplierCount = await Supplier.countDocuments();
  return `S${String(supplierCount + 1).padStart(5, '0')}`;
}

/**
 * 處理單個CSV行
 * @param row - CSV行數據
 * @param importResults - 匯入結果
 * @param errors - 錯誤數組
 * @param duplicates - 重複數組
 */
async function processRow(
  row: any, 
  importResults: ImportResult, 
  errors: Array<{ row: any; error: string }>, 
  duplicates: Array<{ row: any; existingId: string }>
): Promise<void> {
  try {
    // 檢查必填欄位
    const validation = validateRequiredFields(row);
    if (!validation.isValid) {
      errors.push({
        row,
        error: validation.error || '驗證失敗'
      });
      importResults.failed++;
      return;
    }

    // 檢查供應商編號是否已存在
    const duplicateCheck = await checkCodeDuplicate(row.code);
    if (duplicateCheck.isDuplicate) {
      duplicates.push({
        row,
        existingId: duplicateCheck.existingId || ''
      });
      importResults.duplicates++;
      return;
    }

    // 建立供應商欄位物件
    const supplierFields = createSupplierFieldsFromRow(row);

    // 若沒提供供應商編號，系統自動生成
    if (!row.code) {
      supplierFields.code = await generateSupplierCode();
    }

    // 創建新供應商
    const supplier = new Supplier(supplierFields);
    await supplier.save();
    importResults.success++;
  } catch (err: any) {
    console.error('匯入供應商錯誤:', err.message);
    errors.push({
      row,
      error: err.message
    });
    importResults.failed++;
  }
}

// @route   POST api/suppliers/import-csv
// @desc    Import suppliers from CSV file
// @access  Public
router.post('/import-csv', upload.single('file'), async (req: Request, res: Response) => {
  // 使用Express的Request類型，並在內部進行類型斷言
  const fileRequest = req as Express.Request & { file?: Express.Multer.File };
  try {
    if (!fileRequest.file) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.FILE.UPLOAD_FAILED,
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
    }

    const results: any[] = [];
    const errors: Array<{ row: any; error: string }> = [];
    const duplicates: Array<{ row: any; existingId: string }> = [];
    const filePath = fileRequest.file.path;

    // 讀取CSV文件並處理
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve())
        .on('error', reject);
    });
    
    // 初始化匯入結果
    const importResults: ImportResult = {
      total: results.length,
      success: 0,
      failed: 0,
      duplicates: 0,
      errors: []
    };

    // 處理每一行CSV數據
    for (const row of results) {
      await processRow(row, importResults, errors, duplicates);
    }

    // 刪除上傳的文件
    fs.unlinkSync(filePath);

    // 返回匯入結果
    importResults.errors = errors;
    
    const response: CSVImportResponse = {
      success: true,
      message: '供應商匯入完成',
      data: {
        totalRows: importResults.total,
        successRows: importResults.success,
        errorRows: importResults.failed + importResults.duplicates,
        errors: errors.map((err, index) => ({
          row: index + 1,
          error: err.error,
          data: err.row
        }))
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
});

// @route   GET api/suppliers/template/csv
// @desc    Get CSV template for supplier import
// @access  Public
router.get('/template/csv', (req: Request, res: Response) => {
  try {
    // 創建CSV模板內容
    const csvTemplate = 'code,shortCode,name,contactPerson,phone,email,address,taxId,paymentTerms,notes\n' +
                       ',ABC,範例供應商,張三,0912345678,example@example.com,台北市信義區,12345678,月結30天,備註說明';

    // 設置響應頭
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=suppliers-template.csv');

    // 發送CSV模板
    res.send(csvTemplate);
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

export default router;
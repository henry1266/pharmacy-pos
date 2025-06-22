import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import auth from '../middleware/auth';
import Employee from '../models/Employee';
import mongoose from 'mongoose';
import { ApiResponse, ErrorResponse } from '@shared/types/api';
import { Employee as SharedEmployee } from '@shared/types/entities';
import { ERROR_MESSAGES, API_CONSTANTS } from '@shared/constants';

const router = express.Router();

// @route   GET api/employees
// @desc    Get all employees with pagination and search
// @access  Private
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const sortField = (req.query.sortField as string) || 'name';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

    // 建立搜尋條件
    const searchQuery = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { department: { $regex: search, $options: 'i' } },
            { position: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    // 計算總筆數
    const totalCount = await Employee.countDocuments(searchQuery);

    // 取得分頁資料
    const employees = await Employee.find(searchQuery)
      .sort({ [sortField]: sortOrder })
      .skip(page * limit)
      .limit(limit);

    // 轉換 Mongoose Document 到 shared 類型
    const employeeList: SharedEmployee[] = employees.map(emp => {
      const empAny = emp as any;
      return {
        _id: emp._id.toString(),
        name: emp.name,
        phone: emp.phone,
        email: emp.email,
        address: emp.address,
        position: emp.position,
        hireDate: emp.hireDate,
        birthDate: emp.birthDate,
        idNumber: emp.idNumber,
        gender: emp.gender,
        department: emp.department,
        salary: emp.salary,
        emergencyContact: empAny.emergencyContact,
        notes: empAny.notes,
        createdAt: empAny.createdAt,
        updatedAt: empAny.updatedAt
      };
    });

    const response: ApiResponse<{
      employees: SharedEmployee[];
      totalCount: number;
      page: number;
      limit: number;
    }> = {
      success: true,
      message: '員工列表獲取成功',
      data: {
        employees: employeeList,
        totalCount,
        page,
        limit
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

// @route   GET api/employees/:id
// @desc    Get employee by ID
// @access  Private
router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    // 驗證ID格式是否為有效的ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '無效的員工ID格式',
        timestamp: new Date()
      };
      return res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
    }

    const employee = await Employee.findOne({ _id: req.params.id.toString() });

    if (!employee) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '找不到此員工資料',
        timestamp: new Date()
      };
      return res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
    }

    // 轉換 Mongoose Document 到 shared 類型
    const empAny = employee as any;
    const employeeData: SharedEmployee = {
      _id: employee._id.toString(),
      name: employee.name,
      phone: employee.phone,
      email: employee.email,
      address: employee.address,
      position: employee.position,
      hireDate: employee.hireDate,
      birthDate: employee.birthDate,
      idNumber: employee.idNumber,
      gender: employee.gender,
      department: employee.department,
      salary: employee.salary,
      emergencyContact: empAny.emergencyContact,
      notes: empAny.notes,
      createdAt: empAny.createdAt,
      updatedAt: empAny.updatedAt
    };

    const response: ApiResponse<SharedEmployee> = {
      success: true,
      message: '員工資料獲取成功',
      data: employeeData,
      timestamp: new Date()
    };

    res.json(response);
  } catch (err: any) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '找不到此員工資料',
        timestamp: new Date()
      };
      return res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
    }
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// @route   POST api/employees
// @desc    Create a new employee
// @access  Private
router.post(
  '/',
  auth,
  [
    check('name', '姓名為必填欄位').not().isEmpty(),
    check('gender', '性別為必填欄位').isIn(['male', 'female']),
    check('birthDate', '出生年月日為必填欄位').not().isEmpty(),
    check('idNumber', '身分證統一號碼為必填欄位').not().isEmpty(),
    check('address', '住址為必填欄位').not().isEmpty(),
    check('position', '任職職務為必填欄位').not().isEmpty(),
    check('department', '所屬部門為必填欄位').not().isEmpty(),
    check('hireDate', '到職年月日為必填欄位').not().isEmpty()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '驗證失敗',
        error: JSON.stringify(errors.array()),
        timestamp: new Date()
      };
      return res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
    }

    try {
      // 檢查身分證號碼是否已存在
      let employee = await Employee.findOne({ idNumber: req.body.idNumber.toString() });
      if (employee) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: '此身分證號碼已存在',
          timestamp: new Date()
        };
        return res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      }

      // 建立新員工資料
      const {
        name,
        gender,
        birthDate,
        idNumber,
        education,
        nativePlace,
        address,
        phone,
        position,
        department,
        hireDate,
        salary,
        insuranceDate,
        experience,
        rewards,
        injuries,
        additionalInfo,
        idCardFront,
        idCardBack,
        userId
      } = req.body;

      const newEmployee = new Employee({
        name,
        gender,
        birthDate,
        idNumber,
        education,
        nativePlace,
        address,
        phone,
        position,
        department,
        hireDate,
        salary,
        insuranceDate,
        experience,
        rewards,
        injuries,
        additionalInfo,
        idCardFront,
        idCardBack,
        userId: userId || (req as any).user.id // 使用當前登入用戶ID作為預設值
      });

      const savedEmployee = await newEmployee.save();
      
      // 轉換 Mongoose Document 到 shared 類型
      const savedEmpAny = savedEmployee as any;
      const employeeData: SharedEmployee = {
        _id: savedEmployee._id.toString(),
        name: savedEmployee.name,
        phone: savedEmployee.phone,
        email: savedEmployee.email,
        address: savedEmployee.address,
        position: savedEmployee.position,
        hireDate: savedEmployee.hireDate,
        birthDate: savedEmployee.birthDate,
        idNumber: savedEmployee.idNumber,
        gender: savedEmployee.gender,
        department: savedEmployee.department,
        salary: savedEmployee.salary,
        emergencyContact: savedEmpAny.emergencyContact,
        notes: savedEmpAny.notes,
        createdAt: savedEmpAny.createdAt as Date,
        updatedAt: savedEmpAny.updatedAt as Date
      };

      const response: ApiResponse<SharedEmployee> = {
        success: true,
        message: '員工創建成功',
        data: employeeData,
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

// @route   PUT api/employees/:id
// @desc    Update an employee
// @access  Private
router.put('/:id', auth, async (req: Request, res: Response) => {
  try {
    // 驗證ID格式是否為有效的ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '無效的員工ID格式',
        timestamp: new Date()
      };
      return res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
    }

    const employee = await Employee.findOne({ _id: req.params.id.toString() });

    if (!employee) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '找不到此員工資料',
        timestamp: new Date()
      };
      return res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
    }

    // 檢查身分證號碼是否與其他員工重複
    if (req.body.idNumber && req.body.idNumber !== employee.idNumber) {
      // 驗證身分證號碼格式，確保只包含合法字符
      if (!/^[A-Z][12]\d{8}$/.test(req.body.idNumber)) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: '身分證號碼格式不正確',
          timestamp: new Date()
        };
        return res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      }
      
      // 使用參數化查詢，避免直接將用戶輸入傳入查詢
      const idNumberToCheck = String(req.body.idNumber).trim();
      const existingEmployee = await Employee.findOne({ idNumber: idNumberToCheck.toString() });
      if (existingEmployee) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: '此身分證號碼已存在',
          timestamp: new Date()
        };
        return res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      }
    }

    // 更新資料 - 安全地處理用戶輸入
    const updatedFields: any = {};
    const allowedFields = [
      'name', 'gender', 'birthDate', 'idNumber', 'education', 
      'nativePlace', 'address', 'phone', 'position', 'department', 
      'hireDate', 'salary', 'insuranceDate', 'experience', 'rewards', 
      'injuries', 'additionalInfo', 'idCardFront', 'idCardBack'
    ];
    
    // 只允許更新預定義的欄位，避免惡意注入其他欄位
    for (const [key, value] of Object.entries(req.body)) {
      if (value !== undefined && allowedFields.includes(key)) {
        updatedFields[key] = value;
      }
    }

    // 設定更新時間
    updatedFields.updatedAt = Date.now();

    // 使用參數化查詢和安全的更新操作
    const updatedEmployee = await Employee.findOneAndUpdate(
      { _id: req.params.id.toString() },
      { $set: updatedFields },
      { new: true, runValidators: true }
    );

    // 轉換 Mongoose Document 到 shared 類型
    const updatedEmpAny = updatedEmployee as any;
    const employeeData: SharedEmployee = {
      _id: updatedEmployee!._id.toString(),
      name: updatedEmployee!.name,
      phone: updatedEmployee!.phone,
      email: updatedEmployee!.email,
      address: updatedEmployee!.address,
      position: updatedEmployee!.position,
      hireDate: updatedEmployee!.hireDate,
      birthDate: updatedEmployee!.birthDate,
      idNumber: updatedEmployee!.idNumber,
      gender: updatedEmployee!.gender,
      department: updatedEmployee!.department,
      salary: updatedEmployee!.salary,
      emergencyContact: updatedEmpAny.emergencyContact,
      notes: updatedEmpAny.notes,
      createdAt: updatedEmpAny.createdAt,
      updatedAt: updatedEmpAny.updatedAt
    };

    const response: ApiResponse<SharedEmployee> = {
      success: true,
      message: '員工資料更新成功',
      data: employeeData,
      timestamp: new Date()
    };

    res.json(response);
  } catch (err: any) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '找不到此員工資料',
        timestamp: new Date()
      };
      return res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
    }
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// @route   DELETE api/employees/:id
// @desc    Delete an employee
// @access  Private
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    // 驗證ID格式是否為有效的ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '無效的員工ID格式',
        timestamp: new Date()
      };
      return res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
    }

    const employee = await Employee.findOne({ _id: req.params.id.toString() });

    if (!employee) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '找不到此員工資料',
        timestamp: new Date()
      };
      return res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
    }

    await Employee.findOneAndDelete({ _id: req.params.id.toString() });
    
    const response: ApiResponse<null> = {
      success: true,
      message: '員工資料已刪除',
      data: null,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err: any) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '找不到此員工資料',
        timestamp: new Date()
      };
      return res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
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
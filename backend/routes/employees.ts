import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import auth from '../middleware/auth';
import Employee from '../models/Employee';
import User from '../models/User';
import mongoose from 'mongoose';
import { ApiResponse, ErrorResponse } from '@pharmacy-pos/shared/types/api';
import { Employee as SharedEmployee, EmployeeWithAccount } from '@pharmacy-pos/shared/types/entities';
import { ERROR_MESSAGES, API_CONSTANTS } from '@pharmacy-pos/shared/constants';

const router: express.Router = express.Router();

// 共用工具函數
const createErrorResponse = (message: string, error?: string): ErrorResponse => {
  const response: ErrorResponse = {
    success: false,
    message,
    timestamp: new Date()
  };
  
  if (error) {
    response.error = error;
  }
  
  return response;
};

const createSuccessResponse = <T>(data: T, message: string): ApiResponse<T> => ({
  success: true,
  message,
  data,
  timestamp: new Date()
});

const validateObjectId = (id: string): { valid: boolean; errorResponse?: ErrorResponse } => {
  if (!id) {
    return {
      valid: false,
      errorResponse: createErrorResponse('無效的員工ID格式')
    };
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return {
      valid: false,
      errorResponse: createErrorResponse('無效的員工ID格式')
    };
  }

  return { valid: true };
};

const findEmployeeById = async (id: string) => {
  return await Employee.findOne({ _id: id.toString() });
};

const buildSearchQuery = (search: string) => {
  return search
    ? {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { department: { $regex: search, $options: 'i' } },
          { position: { $regex: search, $options: 'i' } }
        ]
      }
    : {};
};

const parsePaginationParams = (query: any) => {
  return {
    page: parseInt(query.page as string) || 0,
    limit: parseInt(query.limit as string) || 10,
    search: (query.search as string) || '',
    sortField: (query.sortField as string) || 'name',
    sortOrder: query.sortOrder === 'desc' ? -1 as const : 1 as const
  };
};

const handleErrorResponse = (res: Response, error: any) => {
  console.error(error instanceof Error ? error.message : 'Unknown error');
  
  if (error instanceof Error && error.name === 'CastError') {
    res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(
      createErrorResponse('找不到此員工資料')
    );
    return;
  }
  
  res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
    createErrorResponse(ERROR_MESSAGES.GENERIC.SERVER_ERROR)
  );
};

// @route   GET api/employees
// @desc    Get all employees with pagination and search
// @access  Private
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const { page, limit, search, sortField, sortOrder } = parsePaginationParams(req.query);
    const searchQuery = buildSearchQuery(search);

    // 計算總筆數
    const totalCount = await Employee.countDocuments(searchQuery);

    // 取得分頁資料
    const employees = await Employee.find(searchQuery)
      .sort({ [sortField]: sortOrder })
      .skip(page * limit)
      .limit(limit);

    // 轉換 Mongoose Document 到 shared 類型
    const employeeList: SharedEmployee[] = employees.map(emp =>
      convertToSharedEmployee(emp)
    );

    const response = createSuccessResponse({
      employees: employeeList,
      totalCount,
      page,
      limit
    }, '員工列表獲取成功');

    res.json(response);
  } catch (err) {
    handleErrorResponse(res, err);
  }
});

// @route   GET api/employees/with-accounts
// @desc    Get all employees with their account status
// @access  Private
router.get('/with-accounts', auth, async (req: Request, res: Response) => {
  try {
    const { page, limit, search, sortField, sortOrder } = parsePaginationParams(req.query);
    const searchQuery = buildSearchQuery(search);

    // 計算總筆數
    const totalCount = await Employee.countDocuments(searchQuery);

    // 取得分頁資料
    const employees = await Employee.find(searchQuery)
      .sort({ [sortField]: sortOrder })
      .skip(page * limit)
      .limit(limit);

    // 取得所有用戶帳號資料
    const users = await User.find({});
    const userMap = new Map(users.map(user => [user._id.toString(), user]));

    // 轉換為 EmployeeWithAccount 格式
    const employeesWithAccounts: EmployeeWithAccount[] = employees.map(emp => {
      const employeeData = convertToSharedEmployee(emp);
      const user = userMap.get(emp.userId?.toString() || '');
      
      return {
        ...employeeData,
        account: user ? {
          _id: user._id.toString(),
          employeeId: (emp._id as any).toString(),
          username: user.username,
          email: user.email || '',
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin || new Date(),
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        } : null
      };
    });

    const response = createSuccessResponse({
      employees: employeesWithAccounts,
      totalCount,
      page,
      limit
    }, '員工帳號狀態列表獲取成功');

    res.json(response);
  } catch (err) {
    handleErrorResponse(res, err);
  }
});

// @route   GET api/employees/:id
// @desc    Get employee by ID
// @access  Private
router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const validation = validateObjectId(req.params.id);
    if (!validation.valid) {
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(validation.errorResponse);
      return;
    }

    const employee = await findEmployeeById(req.params.id);

    if (!employee) {
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse('找不到此員工資料')
      );
      return;
    }

    // 轉換 Mongoose Document 到 shared 類型
    const employeeData = convertToSharedEmployee(employee);

    const response = createSuccessResponse(employeeData, '員工資料獲取成功');

    res.json(response);
  } catch (err) {
    handleErrorResponse(res, err);
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
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse('驗證失敗', JSON.stringify(errors.array()))
      );
      return;
    }

    try {
      // 檢查身分證號碼是否已存在
      let employee = await Employee.findOne({ idNumber: req.body.idNumber.toString() });
      if (employee) {
        res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(
          createErrorResponse('此身分證號碼已存在')
        );
        return;
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
        signDate,
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
        signDate,
        userId: userId ?? (req as any).user.id // 使用當前登入用戶ID作為預設值
      });

      const savedEmployee = await newEmployee.save();
      
      // 轉換 Mongoose Document 到 shared 類型
      const employeeData = convertToSharedEmployee(savedEmployee);

      const response = createSuccessResponse(employeeData, '員工創建成功');

      res.json(response);
    } catch (err) {
      handleErrorResponse(res, err);
    }
  }
);

// 輔助函數：驗證身分證號碼格式和重複性
async function validateIdNumber(idNumber: string, currentEmployeeId: string): Promise<{ valid: boolean; message?: string }> {
  // 驗證身分證號碼格式
  if (!/^[A-Z][12]\d{8}$/.test(idNumber)) {
    return { valid: false, message: '身分證號碼格式不正確' };
  }
  
  // 檢查是否與其他員工重複
  const idNumberToCheck = String(idNumber).trim();
  const existingEmployee = await Employee.findOne({ idNumber: idNumberToCheck });
  if (existingEmployee && (existingEmployee._id as any).toString() !== currentEmployeeId) {
    return { valid: false, message: '此身分證號碼已存在' };
  }
  
  return { valid: true };
}

// 輔助函數：準備更新欄位
function prepareUpdateFields(requestBody: any): any {
  const updatedFields: any = {};
  const allowedFields = [
    'name', 'gender', 'birthDate', 'idNumber', 'education',
    'nativePlace', 'address', 'phone', 'position', 'department',
    'hireDate', 'salary', 'insuranceDate', 'experience', 'rewards',
    'injuries', 'additionalInfo', 'idCardFront', 'idCardBack', 'signDate'
  ];
  
  // 只允許更新預定義的欄位，避免惡意注入其他欄位
  for (const [key, value] of Object.entries(requestBody)) {
    if (value !== undefined && allowedFields.includes(key)) {
      updatedFields[key] = value;
    }
  }
  
  updatedFields.updatedAt = Date.now();
  return updatedFields;
}

// 輔助函數：轉換員工資料格式
function convertToSharedEmployee(employee: any): SharedEmployee {
  return {
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
    insuranceDate: employee.insuranceDate,
    education: employee.education,
    nativePlace: employee.nativePlace,
    experience: employee.experience,
    rewards: employee.rewards,
    injuries: employee.injuries,
    additionalInfo: employee.additionalInfo,
    idCardFront: employee.idCardFront,
    idCardBack: employee.idCardBack,
    signDate: employee.signDate,
    emergencyContact: employee.emergencyContact,
    notes: employee.notes,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt
  };
}

// @route   PUT api/employees/:id
// @desc    Update an employee
// @access  Private
router.put('/:id', auth, async (req: Request, res: Response) => {
  try {
    const validation = validateObjectId(req.params.id);
    if (!validation.valid) {
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(validation.errorResponse);
      return;
    }

    const employee = await findEmployeeById(req.params.id);

    if (!employee) {
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse('找不到此員工資料')
      );
      return;
    }

    // 檢查身分證號碼是否與其他員工重複
    if (req.body.idNumber && req.body.idNumber !== employee.idNumber) {
      const idValidation = await validateIdNumber(req.body.idNumber, req.params.id);
      if (!idValidation.valid) {
        res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(
          createErrorResponse(idValidation.message ?? '驗證失敗')
        );
        return;
      }
    }

    // 準備更新資料
    const updatedFields = prepareUpdateFields(req.body);

    // 使用參數化查詢和安全的更新操作
    const updatedEmployee = await Employee.findOneAndUpdate(
      { _id: req.params.id.toString() },
      { $set: updatedFields },
      { new: true, runValidators: true }
    );

    // 轉換 Mongoose Document 到 shared 類型
    const employeeData = convertToSharedEmployee(updatedEmployee);

    const response = createSuccessResponse(employeeData, '員工資料更新成功');

    res.json(response);
  } catch (err) {
    handleErrorResponse(res, err);
  }
});

// @route   DELETE api/employees/:id
// @desc    Delete an employee
// @access  Private
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    const validation = validateObjectId(req.params.id);
    if (!validation.valid) {
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(validation.errorResponse);
      return;
    }

    const employee = await findEmployeeById(req.params.id);

    if (!employee) {
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse('找不到此員工資料')
      );
      return;
    }

    await Employee.findOneAndDelete({ _id: req.params.id.toString() });
    
    const response = createSuccessResponse(null, '員工資料已刪除');
    
    res.json(response);
  } catch (err) {
    handleErrorResponse(res, err);
  }
});

export default router;
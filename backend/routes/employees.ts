import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import mongoose, { Types } from 'mongoose';

// 使用 TypeScript import 語法導入中介軟體
import auth from '../middleware/auth';
const Employee = require('../models/Employee');

// 定義員工性別型別
type Gender = 'male' | 'female';

// 定義員工介面
interface IEmployee {
  _id: Types.ObjectId;
  name: string;
  gender: Gender;
  birthDate: Date;
  idNumber: string;
  education?: string;
  nativePlace?: string;
  address: string;
  phone?: string;
  position: string;
  department: string;
  hireDate: Date;
  salary?: number;
  insuranceDate?: Date;
  experience?: string;
  rewards?: string;
  injuries?: string;
  additionalInfo?: string;
  idCardFront?: string;
  idCardBack?: string;
  userId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// 定義員工請求介面
interface EmployeeRequest {
  name: string;
  gender: Gender;
  birthDate: Date | string;
  idNumber: string;
  education?: string;
  nativePlace?: string;
  address: string;
  phone?: string;
  position: string;
  department: string;
  hireDate: Date | string;
  salary?: number;
  insuranceDate?: Date | string;
  experience?: string;
  rewards?: string;
  injuries?: string;
  additionalInfo?: string;
  idCardFront?: string;
  idCardBack?: string;
  userId?: string;
}

// 定義分頁查詢參數介面
interface EmployeeQueryParams {
  page?: string;
  limit?: string;
  search?: string;
  sortField?: string;
  sortOrder?: string;
}

// 定義分頁回應介面
interface EmployeeListResponse {
  employees: IEmployee[];
  totalCount: number;
  page: number;
  limit: number;
}

// 擴展 Request 介面以包含用戶資訊
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

const router = express.Router();

// @route   GET api/employees
// @desc    Get all employees with pagination and search
// @access  Private
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const { page, limit, search, sortField, sortOrder } = req.query as EmployeeQueryParams;
    
    const pageNum = parseInt(page || '0') || 0;
    const limitNum = parseInt(limit || '10') || 10;
    const searchTerm = search || '';
    const sortFieldName = sortField || 'name';
    const sortOrderNum = sortOrder === 'desc' ? -1 : 1;

    // 建立搜尋條件
    const searchQuery = searchTerm
      ? {
          $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { department: { $regex: searchTerm, $options: 'i' } },
            { position: { $regex: searchTerm, $options: 'i' } }
          ]
        }
      : {};

    // 計算總筆數
    const totalCount = await Employee.countDocuments(searchQuery);

    // 取得分頁資料
    const employees = await Employee.find(searchQuery)
      .sort({ [sortFieldName]: sortOrderNum })
      .skip(pageNum * limitNum)
      .limit(limitNum);

    const response: EmployeeListResponse = {
      employees,
      totalCount,
      page: pageNum,
      limit: limitNum
    };

    res.json(response);
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/employees/:id
// @desc    Get employee by ID
// @access  Private
router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 檢查ID是否存在
    if (!id) {
      return res.status(400).json({ msg: '員工ID為必填項' });
    }

    // 驗證ID格式是否為有效的ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: '無效的員工ID格式' });
    }

    const employee = await Employee.findOne({ _id: id });

    if (!employee) {
      return res.status(404).json({ msg: '找不到此員工資料' });
    }

    res.json(employee);
  } catch (err) {
    console.error((err as Error).message);
    if ((err as any).kind === 'ObjectId') {
      return res.status(404).json({ msg: '找不到此員工資料' });
    }
    res.status(500).send('Server Error');
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
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const employeeData = req.body as EmployeeRequest;

      // 檢查身分證號碼是否已存在
      const existingEmployee = await Employee.findOne({ idNumber: employeeData.idNumber });
      if (existingEmployee) {
        return res.status(400).json({ msg: '此身分證號碼已存在' });
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
      } = employeeData;

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
        userId: userId || req.user?.id // 使用當前登入用戶ID作為預設值
      });

      const savedEmployee = await newEmployee.save();
      res.json(savedEmployee);
    } catch (err) {
      console.error((err as Error).message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/employees/:id
// @desc    Update an employee
// @access  Private
router.put('/:id', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 檢查ID是否存在
    if (!id) {
      return res.status(400).json({ msg: '員工ID為必填項' });
    }

    // 驗證ID格式是否為有效的ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: '無效的員工ID格式' });
    }

    const employee = await Employee.findOne({ _id: id });

    if (!employee) {
      return res.status(404).json({ msg: '找不到此員工資料' });
    }

    const updateData = req.body as Partial<EmployeeRequest>;

    // 檢查身分證號碼是否與其他員工重複
    if (updateData.idNumber && updateData.idNumber !== employee.idNumber) {
      // 驗證身分證號碼格式，確保只包含合法字符
      if (!/^[A-Z][12]\d{8}$/.test(updateData.idNumber)) {
        return res.status(400).json({ msg: '身分證號碼格式不正確' });
      }
      
      // 使用參數化查詢，避免直接將用戶輸入傳入查詢
      const idNumberToCheck = String(updateData.idNumber).trim();
      const existingEmployee = await Employee.findOne({ idNumber: idNumberToCheck });
      if (existingEmployee) {
        return res.status(400).json({ msg: '此身分證號碼已存在' });
      }
    }

    // 更新資料 - 安全地處理用戶輸入
    const updatedFields: Record<string, any> = {};
    const allowedFields: (keyof EmployeeRequest)[] = [
      'name', 'gender', 'birthDate', 'idNumber', 'education', 
      'nativePlace', 'address', 'phone', 'position', 'department', 
      'hireDate', 'salary', 'insuranceDate', 'experience', 'rewards', 
      'injuries', 'additionalInfo', 'idCardFront', 'idCardBack'
    ];
    
    // 只允許更新預定義的欄位，避免惡意注入其他欄位
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined && allowedFields.includes(key as keyof EmployeeRequest)) {
        updatedFields[key] = value;
      }
    }

    // 設定更新時間
    updatedFields.updatedAt = new Date();

    // 使用參數化查詢和安全的更新操作
    const updatedEmployee = await Employee.findOneAndUpdate(
      { _id: id },
      { $set: updatedFields },
      { new: true, runValidators: true }
    );

    res.json(updatedEmployee);
  } catch (err) {
    console.error((err as Error).message);
    if ((err as any).kind === 'ObjectId') {
      return res.status(404).json({ msg: '找不到此員工資料' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/employees/:id
// @desc    Delete an employee
// @access  Private
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 檢查ID是否存在
    if (!id) {
      return res.status(400).json({ msg: '員工ID為必填項' });
    }

    // 驗證ID格式是否為有效的ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: '無效的員工ID格式' });
    }

    const employee = await Employee.findOne({ _id: id });

    if (!employee) {
      return res.status(404).json({ msg: '找不到此員工資料' });
    }

    await Employee.findOneAndDelete({ _id: id });
    res.json({ msg: '員工資料已刪除' });
  } catch (err) {
    console.error((err as Error).message);
    if ((err as any).kind === 'ObjectId') {
      return res.status(404).json({ msg: '找不到此員工資料' });
    }
    res.status(500).send('Server Error');
  }
});

export default router;
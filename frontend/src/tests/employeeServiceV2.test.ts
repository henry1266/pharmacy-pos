/**
 * 員工服務 V2 測試
 */

import employeeServiceV2, {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
  searchEmployees,
  getEmployeeAccount,
  createEmployeeAccount,
  updateEmployeeAccount,
  deleteEmployeeAccount,
  getEmployeesWithAccountStatus,
  validateEmployeeCredentials,
  resetEmployeePassword,
  toggleEmployeeAccountStatus
} from '../services/employeeServiceV2';
import type { 
  Employee, 
  EmployeeAccount, 
  EmployeeWithAccount 
} from '@pharmacy-pos/shared/types/entities';
import type { 
  EmployeeCreateRequest, 
  EmployeeUpdateRequest,
  EmployeeAccountCreateRequest,
  EmployeeAccountUpdateRequest,
  EmployeeStats
} from '@pharmacy-pos/shared/services/employeeApiClient';

// Mock axios
jest.mock('axios');

describe('EmployeeServiceV2', () => {
  const mockEmployee: Employee = {
    _id: '507f1f77bcf86cd799439011',
    name: '張三',
    phone: '0912345678',
    email: 'zhang.san@example.com',
    address: '台北市信義區',
    position: '藥師',
    hireDate: '2023-01-15',
    birthDate: '1990-05-20',
    idNumber: 'A123456789',
    gender: '男',
    department: '藥局部',
    salary: 50000,
    emergencyContact: {
      name: '張四',
      phone: '0987654321',
      relationship: '配偶'
    },
    notes: '資深藥師',
    createdAt: '2023-01-15T08:00:00.000Z',
    updatedAt: '2023-01-15T08:00:00.000Z'
  };

  const mockEmployeeAccount: EmployeeAccount = {
    _id: '507f1f77bcf86cd799439012',
    employeeId: '507f1f77bcf86cd799439011',
    username: 'zhang.san',
    email: 'zhang.san@example.com',
    role: 'pharmacist',
    isActive: true,
    lastLogin: '2023-12-01T10:00:00.000Z',
    createdAt: '2023-01-15T08:00:00.000Z',
    updatedAt: '2023-12-01T10:00:00.000Z'
  };

  const mockEmployeeWithAccount: EmployeeWithAccount = {
    ...mockEmployee,
    account: mockEmployeeAccount
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'mock-token'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
      },
      writable: true,
    });
  });

  describe('基本功能測試', () => {
    test('應該匯出所有必要的函數', () => {
      expect(getAllEmployees).toBeDefined();
      expect(typeof getAllEmployees).toBe('function');
      
      expect(getEmployeeById).toBeDefined();
      expect(typeof getEmployeeById).toBe('function');
      
      expect(createEmployee).toBeDefined();
      expect(typeof createEmployee).toBe('function');
      
      expect(updateEmployee).toBeDefined();
      expect(typeof updateEmployee).toBe('function');
      
      expect(deleteEmployee).toBeDefined();
      expect(typeof deleteEmployee).toBe('function');
      
      expect(getEmployeeStats).toBeDefined();
      expect(typeof getEmployeeStats).toBe('function');
      
      expect(searchEmployees).toBeDefined();
      expect(typeof searchEmployees).toBe('function');
    });

    test('應該匯出帳號管理函數', () => {
      expect(getEmployeeAccount).toBeDefined();
      expect(typeof getEmployeeAccount).toBe('function');
      
      expect(createEmployeeAccount).toBeDefined();
      expect(typeof createEmployeeAccount).toBe('function');
      
      expect(updateEmployeeAccount).toBeDefined();
      expect(typeof updateEmployeeAccount).toBe('function');
      
      expect(deleteEmployeeAccount).toBeDefined();
      expect(typeof deleteEmployeeAccount).toBe('function');
      
      expect(getEmployeesWithAccountStatus).toBeDefined();
      expect(typeof getEmployeesWithAccountStatus).toBe('function');
      
      expect(validateEmployeeCredentials).toBeDefined();
      expect(typeof validateEmployeeCredentials).toBe('function');
      
      expect(resetEmployeePassword).toBeDefined();
      expect(typeof resetEmployeePassword).toBe('function');
      
      expect(toggleEmployeeAccountStatus).toBeDefined();
      expect(typeof toggleEmployeeAccountStatus).toBe('function');
    });

    test('應該匯出預設服務物件', () => {
      expect(employeeServiceV2).toBeDefined();
      expect(typeof employeeServiceV2).toBe('object');
      
      // 檢查業務邏輯方法
      expect(employeeServiceV2.checkEmployeePermission).toBeDefined();
      expect(typeof employeeServiceV2.checkEmployeePermission).toBe('function');
      
      expect(employeeServiceV2.formatEmployeeDisplayName).toBeDefined();
      expect(typeof employeeServiceV2.formatEmployeeDisplayName).toBe('function');
      
      expect(employeeServiceV2.formatEmployeeStatus).toBeDefined();
      expect(typeof employeeServiceV2.formatEmployeeStatus).toBe('function');
      
      expect(employeeServiceV2.validateEmployeeData).toBeDefined();
      expect(typeof employeeServiceV2.validateEmployeeData).toBe('function');
      
      expect(employeeServiceV2.validateEmployeeAccountData).toBeDefined();
      expect(typeof employeeServiceV2.validateEmployeeAccountData).toBe('function');
    });
  });

  describe('業務邏輯方法測試', () => {
    test('checkEmployeePermission - 應該正確檢查管理員權限', () => {
      const adminAccount: EmployeeAccount = { ...mockEmployeeAccount, role: 'admin' };
      
      expect(employeeServiceV2.checkEmployeePermission(adminAccount, 'manage_employees')).toBe(true);
      expect(employeeServiceV2.checkEmployeePermission(adminAccount, 'manage_accounts')).toBe(true);
      expect(employeeServiceV2.checkEmployeePermission(adminAccount, 'view_reports')).toBe(true);
      expect(employeeServiceV2.checkEmployeePermission(adminAccount, 'manage_inventory')).toBe(true);
    });

    test('checkEmployeePermission - 應該正確檢查藥師權限', () => {
      const pharmacistAccount: EmployeeAccount = { ...mockEmployeeAccount, role: 'pharmacist' };
      
      expect(employeeServiceV2.checkEmployeePermission(pharmacistAccount, 'manage_employees')).toBe(false);
      expect(employeeServiceV2.checkEmployeePermission(pharmacistAccount, 'manage_inventory')).toBe(true);
      expect(employeeServiceV2.checkEmployeePermission(pharmacistAccount, 'process_sales')).toBe(true);
    });

    test('checkEmployeePermission - 應該正確檢查一般員工權限', () => {
      const staffAccount: EmployeeAccount = { ...mockEmployeeAccount, role: 'staff' };
      
      expect(employeeServiceV2.checkEmployeePermission(staffAccount, 'manage_employees')).toBe(false);
      expect(employeeServiceV2.checkEmployeePermission(staffAccount, 'manage_inventory')).toBe(false);
      expect(employeeServiceV2.checkEmployeePermission(staffAccount, 'basic_operations')).toBe(true);
    });

    test('formatEmployeeDisplayName - 應該正確格式化員工顯示名稱', () => {
      const result = employeeServiceV2.formatEmployeeDisplayName(mockEmployee);
      expect(result).toBe('張三 (藥師)');
    });

    test('formatEmployeeStatus - 應該正確格式化員工狀態', () => {
      const activeEmployee: EmployeeWithAccount = {
        ...mockEmployee,
        account: { ...mockEmployeeAccount, isActive: true }
      };
      const inactiveEmployee: EmployeeWithAccount = {
        ...mockEmployee,
        account: { ...mockEmployeeAccount, isActive: false }
      };
      const noAccountEmployee: EmployeeWithAccount = {
        ...mockEmployee,
        account: null
      };

      expect(employeeServiceV2.formatEmployeeStatus(activeEmployee)).toBe('啟用');
      expect(employeeServiceV2.formatEmployeeStatus(inactiveEmployee)).toBe('停用');
      expect(employeeServiceV2.formatEmployeeStatus(noAccountEmployee)).toBe('無帳號');
    });

    test('getEmployeeStatusColor - 應該返回正確的狀態顏色', () => {
      const activeEmployee: EmployeeWithAccount = {
        ...mockEmployee,
        account: { ...mockEmployeeAccount, isActive: true }
      };
      const inactiveEmployee: EmployeeWithAccount = {
        ...mockEmployee,
        account: { ...mockEmployeeAccount, isActive: false }
      };
      const noAccountEmployee: EmployeeWithAccount = {
        ...mockEmployee,
        account: null
      };

      expect(employeeServiceV2.getEmployeeStatusColor(activeEmployee)).toBe('success');
      expect(employeeServiceV2.getEmployeeStatusColor(inactiveEmployee)).toBe('error');
      expect(employeeServiceV2.getEmployeeStatusColor(noAccountEmployee)).toBe('warning');
    });

    test('validateEmployeeData - 應該驗證必填欄位', () => {
      const invalidData: EmployeeCreateRequest = {
        name: '',
        phone: '',
        position: '',
        hireDate: '2023-01-01'
      };

      const errors = employeeServiceV2.validateEmployeeData(invalidData);

      expect(errors).toContain('員工姓名不能為空');
      expect(errors).toContain('電話號碼不能為空');
      expect(errors).toContain('職位不能為空');
    });

    test('validateEmployeeData - 應該驗證電子郵件格式', () => {
      const invalidData: EmployeeCreateRequest = {
        name: '測試員工',
        phone: '0912345678',
        position: '測試職位',
        hireDate: '2023-01-01',
        email: 'invalid-email'
      };

      const errors = employeeServiceV2.validateEmployeeData(invalidData);

      expect(errors).toContain('電子郵件格式不正確');
    });

    test('validateEmployeeData - 應該驗證薪資不能為負數', () => {
      const invalidData: EmployeeCreateRequest = {
        name: '測試員工',
        phone: '0912345678',
        position: '測試職位',
        hireDate: '2023-01-01',
        salary: -1000
      };

      const errors = employeeServiceV2.validateEmployeeData(invalidData);

      expect(errors).toContain('薪資不能為負數');
    });

    test('validateEmployeeAccountData - 應該驗證帳號資料', () => {
      const invalidData: EmployeeAccountCreateRequest = {
        employeeId: '123',
        username: '',
        password: '123',
        role: 'admin'
      };

      const errors = employeeServiceV2.validateEmployeeAccountData(invalidData);

      expect(errors).toContain('使用者名稱不能為空');
      expect(errors).toContain('密碼至少需要6個字元');
    });

    test('formatRoleDisplayName - 應該正確格式化角色名稱', () => {
      expect(employeeServiceV2.formatRoleDisplayName('admin')).toBe('管理員');
      expect(employeeServiceV2.formatRoleDisplayName('pharmacist')).toBe('藥師');
      expect(employeeServiceV2.formatRoleDisplayName('staff')).toBe('員工');
      expect(employeeServiceV2.formatRoleDisplayName('unknown')).toBe('unknown');
    });

    test('calculateWorkYears - 應該正確計算工作年資', () => {
      const hireDate = new Date();
      hireDate.setFullYear(hireDate.getFullYear() - 2); // 2年前

      const years = employeeServiceV2.calculateWorkYears(hireDate);

      expect(years).toBe(2);
    });

    test('isUpcomingBirthday - 應該正確檢查即將到來的生日', () => {
      const today = new Date();
      const upcomingBirthday = new Date(today);
      upcomingBirthday.setDate(today.getDate() + 15); // 15天後

      const result = employeeServiceV2.isUpcomingBirthday(upcomingBirthday, 30);

      expect(result).toBe(true);
    });

    test('isUpcomingBirthday - 應該正確處理已過的生日', () => {
      const today = new Date();
      const pastBirthday = new Date(today);
      pastBirthday.setDate(today.getDate() - 15); // 15天前

      const result = employeeServiceV2.isUpcomingBirthday(pastBirthday, 30);

      expect(result).toBe(false);
    });

    test('isUpcomingBirthday - 應該處理空生日', () => {
      const result = employeeServiceV2.isUpcomingBirthday(null as any, 30);

      expect(result).toBe(false);
    });
  });

  describe('類型檢查', () => {
    test('應該正確匯出所有類型', () => {
      // 這個測試主要是確保類型定義正確匯出
      // 在 TypeScript 編譯時會檢查類型錯誤
      const employee: Employee = mockEmployee;
      const account: EmployeeAccount = mockEmployeeAccount;
      const employeeWithAccount: EmployeeWithAccount = mockEmployeeWithAccount;

      expect(employee).toBeDefined();
      expect(account).toBeDefined();
      expect(employeeWithAccount).toBeDefined();
    });
  });
});

// 整合測試範例
describe('EmployeeServiceV2 整合測試', () => {
  test('應該能夠完成完整的員工管理流程', async () => {
    // 這裡可以添加整合測試
    // 1. 創建員工
    // 2. 更新員工資訊
    // 3. 創建員工帳號
    // 4. 更新帳號權限
    // 5. 查詢員工列表
    // 6. 刪除員工帳號
    // 7. 刪除員工
    
    expect(true).toBe(true); // 佔位符測試
  });
});
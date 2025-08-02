import mongoose from 'mongoose';
import Employee, { IEmployee } from '../Employee';

describe('Employee Model', () => {
  beforeEach(async () => {
    // 清理測試數據
    await Employee.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('應該成功創建有效的員工', async () => {
      const employeeData: Partial<IEmployee> = {
        name: '張三',
        gender: 'male',
        birthDate: new Date('1990-01-01'),
        idNumber: 'A123456789',
        address: '台北市信義區信義路100號',
        phone: '0912345678',
        position: '藥師',
        department: '藥劑部',
        hireDate: new Date('2024-01-01'),
        email: 'employee@example.com',
        salary: 50000,
        insuranceDate: new Date('2024-01-15'),
        education: '藥學系學士',
        nativePlace: '台北市',
        experience: '5年藥局工作經驗',
        rewards: '優秀員工獎',
        injuries: '無',
        additionalInfo: '具備藥師執照',
        idCardFront: '/uploads/id_front.jpg',
        idCardBack: '/uploads/id_back.jpg',
        signDate: new Date('2024-01-01')
      };

      const employee = new Employee(employeeData);
      const savedEmployee = await employee.save();

      expect(savedEmployee._id).toBeDefined();
      expect(savedEmployee.name).toBe(employeeData.name);
      expect(savedEmployee.gender).toBe(employeeData.gender);
      expect(savedEmployee.birthDate).toEqual(employeeData.birthDate);
      expect(savedEmployee.idNumber).toBe(employeeData.idNumber);
      expect(savedEmployee.address).toBe(employeeData.address);
      expect(savedEmployee.phone).toBe(employeeData.phone);
      expect(savedEmployee.position).toBe(employeeData.position);
      expect(savedEmployee.department).toBe(employeeData.department);
      expect(savedEmployee.hireDate).toEqual(employeeData.hireDate);
      expect(savedEmployee.email).toBe(employeeData.email);
      expect(savedEmployee.salary).toBe(employeeData.salary);
      expect(savedEmployee.insuranceDate).toEqual(employeeData.insuranceDate);
      expect(savedEmployee.education).toBe(employeeData.education);
      expect(savedEmployee.nativePlace).toBe(employeeData.nativePlace);
      expect(savedEmployee.experience).toBe(employeeData.experience);
      expect(savedEmployee.rewards).toBe(employeeData.rewards);
      expect(savedEmployee.injuries).toBe(employeeData.injuries);
      expect(savedEmployee.additionalInfo).toBe(employeeData.additionalInfo);
      expect(savedEmployee.idCardFront).toBe(employeeData.idCardFront);
      expect(savedEmployee.idCardBack).toBe(employeeData.idCardBack);
      expect(savedEmployee.signDate).toEqual(employeeData.signDate);
      expect((savedEmployee as any).createdAt).toBeDefined();
      expect((savedEmployee as any).updatedAt).toBeDefined();
    });

    it('應該要求必填欄位', async () => {
      const employee = new Employee({});
      
      await expect(employee.save()).rejects.toThrow();
    });

    it('應該要求員工姓名', async () => {
      const employeeData = {
        phone: '0912345678',
        position: '藥師',
        hireDate: new Date('2024-01-01')
      };

      const employee = new Employee(employeeData);
      await expect(employee.save()).rejects.toThrow(/name.*required/i);
    });

    it('應該要求電話號碼', async () => {
      const employeeData = {
        name: '張三',
        position: '藥師',
        hireDate: new Date('2024-01-01')
      };

      const employee = new Employee(employeeData);
      await expect(employee.save()).rejects.toThrow(/phone.*required/i);
    });

    it('應該要求職位', async () => {
      const employeeData = {
        name: '張三',
        phone: '0912345678',
        hireDate: new Date('2024-01-01')
      };

      const employee = new Employee(employeeData);
      await expect(employee.save()).rejects.toThrow(/position.*required/i);
    });

    it('應該要求入職日期', async () => {
      const employeeData = {
        name: '張三',
        phone: '0912345678',
        position: '藥師'
      };

      const employee = new Employee(employeeData);
      await expect(employee.save()).rejects.toThrow(/hireDate.*required/i);
    });

    it('應該驗證性別枚舉值', async () => {
      const employeeData = {
        name: '張三',
        phone: '0912345678',
        position: '藥師',
        hireDate: new Date('2024-01-01'),
        gender: 'invalid_gender' as any
      };

      const employee = new Employee(employeeData);
      await expect(employee.save()).rejects.toThrow();
    });

    it('應該支援中文性別值', async () => {
      const employeeData = {
        name: '張三',
        phone: '0912345678',
        position: '藥師',
        hireDate: new Date('2024-01-01'),
        gender: '男' as any
      };

      const employee = new Employee(employeeData);
      const savedEmployee = await employee.save();
      
      expect(savedEmployee.gender).toBe('男');
    });

    it('應該允許身分證字號不唯一', async () => {
      const employeeData1 = {
        name: '張三',
        phone: '0912345678',
        position: '藥師',
        hireDate: new Date('2024-01-01'),
        idNumber: 'A123456789'
      };

      const employeeData2 = {
        name: '李四',
        phone: '0987654321',
        position: '助理',
        hireDate: new Date('2024-01-02'),
        idNumber: 'A123456789' // 相同身分證字號
      };

      await new Employee(employeeData1).save();
      
      // 應該允許相同的身分證字號（因為 unique: false）
      const employee2 = new Employee(employeeData2);
      const savedEmployee2 = await employee2.save();
      
      expect(savedEmployee2.idNumber).toBe('A123456789');
    });
  });

  describe('Optional Fields', () => {
    it('應該允許創建只有必填欄位的員工', async () => {
      const minimalEmployeeData = {
        name: '最小員工',
        phone: '0912345678',
        position: '助理',
        hireDate: new Date('2024-01-01')
      };

      const employee = new Employee(minimalEmployeeData);
      const savedEmployee = await employee.save();

      expect(savedEmployee.name).toBe(minimalEmployeeData.name);
      expect(savedEmployee.phone).toBe(minimalEmployeeData.phone);
      expect(savedEmployee.position).toBe(minimalEmployeeData.position);
      expect(savedEmployee.hireDate).toEqual(minimalEmployeeData.hireDate);
      expect(savedEmployee.gender).toBeUndefined();
      expect(savedEmployee.birthDate).toBeUndefined();
      expect(savedEmployee.department).toBeUndefined();
      expect(savedEmployee.salary).toBeUndefined();
    });

    it('應該允許設置所有選填欄位', async () => {
      const completeEmployeeData = {
        name: '完整員工',
        gender: 'female' as any,
        birthDate: new Date('1985-05-15'),
        idNumber: 'B987654321',
        address: '台中市西區公益路200號',
        phone: '0923456789',
        position: '主管',
        department: '管理部',
        hireDate: new Date('2023-06-01'),
        email: 'complete@example.com',
        salary: 80000,
        insuranceDate: new Date('2023-06-15'),
        education: '管理學碩士',
        nativePlace: '台中市',
        experience: '10年管理經驗',
        rewards: '年度最佳主管',
        injuries: '無職業傷害',
        additionalInfo: '具備管理證照',
        idCardFront: '/uploads/complete_front.jpg',
        idCardBack: '/uploads/complete_back.jpg',
        signDate: new Date('2023-06-01')
      };

      const employee = new Employee(completeEmployeeData);
      const savedEmployee = await employee.save();

      Object.keys(completeEmployeeData).forEach(key => {
        if (key === 'birthDate' || key === 'hireDate' || key === 'insuranceDate' || key === 'signDate') {
          expect(savedEmployee[key as keyof typeof completeEmployeeData]).toEqual(
            completeEmployeeData[key as keyof typeof completeEmployeeData]
          );
        } else {
          expect(savedEmployee[key as keyof typeof completeEmployeeData]).toBe(
            completeEmployeeData[key as keyof typeof completeEmployeeData]
          );
        }
      });
    });
  });

  describe('User Association', () => {
    it('應該支援關聯用戶帳號', async () => {
      const userId = new mongoose.Types.ObjectId();
      const employeeData = {
        name: '系統用戶',
        phone: '0934567890',
        position: '系統管理員',
        hireDate: new Date('2024-01-01'),
        userId: userId
      };

      const employee = new Employee(employeeData);
      const savedEmployee = await employee.save();

      expect(savedEmployee.userId).toEqual(userId);
    });

    it('應該允許員工沒有關聯用戶帳號', async () => {
      const employeeData = {
        name: '一般員工',
        phone: '0945678901',
        position: '櫃檯人員',
        hireDate: new Date('2024-01-01')
      };

      const employee = new Employee(employeeData);
      const savedEmployee = await employee.save();

      expect(savedEmployee.userId).toBeUndefined();
    });
  });

  describe('Date Fields', () => {
    it('應該正確處理各種日期欄位', async () => {
      const dates = {
        birthDate: new Date('1990-03-15'),
        hireDate: new Date('2024-01-01'),
        insuranceDate: new Date('2024-01-15'),
        signDate: new Date('2024-01-01')
      };

      const employeeData = {
        name: '日期測試員工',
        phone: '0956789012',
        position: '測試員',
        ...dates
      };

      const employee = new Employee(employeeData);
      const savedEmployee = await employee.save();

      expect(savedEmployee.birthDate).toEqual(dates.birthDate);
      expect(savedEmployee.hireDate).toEqual(dates.hireDate);
      expect(savedEmployee.insuranceDate).toEqual(dates.insuranceDate);
      expect(savedEmployee.signDate).toEqual(dates.signDate);
    });

    it('應該允許日期欄位為空', async () => {
      const employeeData = {
        name: '無日期員工',
        phone: '0967890123',
        position: '臨時工',
        hireDate: new Date('2024-01-01')
        // 其他日期欄位都不設置
      };

      const employee = new Employee(employeeData);
      const savedEmployee = await employee.save();

      expect(savedEmployee.birthDate).toBeUndefined();
      expect(savedEmployee.insuranceDate).toBeUndefined();
      expect(savedEmployee.signDate).toBeUndefined();
    });
  });

  describe('File Upload Fields', () => {
    it('應該支援身分證照片上傳', async () => {
      const employeeData = {
        name: '有照片員工',
        phone: '0978901234',
        position: '文件管理員',
        hireDate: new Date('2024-01-01'),
        idCardFront: '/uploads/documents/id_front_001.jpg',
        idCardBack: '/uploads/documents/id_back_001.jpg'
      };

      const employee = new Employee(employeeData);
      const savedEmployee = await employee.save();

      expect(savedEmployee.idCardFront).toBe('/uploads/documents/id_front_001.jpg');
      expect(savedEmployee.idCardBack).toBe('/uploads/documents/id_back_001.jpg');
    });

    it('應該允許沒有上傳身分證照片', async () => {
      const employeeData = {
        name: '無照片員工',
        phone: '0989012345',
        position: '清潔人員',
        hireDate: new Date('2024-01-01')
      };

      const employee = new Employee(employeeData);
      const savedEmployee = await employee.save();

      expect(savedEmployee.idCardFront).toBeUndefined();
      expect(savedEmployee.idCardBack).toBeUndefined();
    });
  });

  describe('Timestamps', () => {
    it('應該自動設置createdAt和updatedAt', async () => {
      const employeeData = {
        name: '時間戳測試員工',
        phone: '0990123456',
        position: '測試員',
        hireDate: new Date('2024-01-01')
      };

      const employee = new Employee(employeeData);
      const savedEmployee = await employee.save();
      
      expect((savedEmployee as any).createdAt).toBeDefined();
      expect((savedEmployee as any).updatedAt).toBeDefined();
      expect((savedEmployee as any).createdAt).toBeInstanceOf(Date);
      expect((savedEmployee as any).updatedAt).toBeInstanceOf(Date);
    });

    it('應該在更新時更新updatedAt', async () => {
      const employeeData = {
        name: '更新測試員工',
        phone: '0901234567',
        position: '測試員',
        hireDate: new Date('2024-01-01')
      };

      const employee = await new Employee(employeeData).save();
      const originalUpdatedAt = (employee as any).updatedAt;
      
      // 等待一毫秒確保時間差異
      await new Promise(resolve => setTimeout(resolve, 1));
      
      employee.position = '資深測試員';
      const updatedEmployee = await employee.save();
      
      expect((updatedEmployee as any).updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Query Methods', () => {
    beforeEach(async () => {
      // 創建測試數據
      await Employee.create([
        {
          name: '張藥師',
          phone: '0912345678',
          position: '藥師',
          department: '藥劑部',
          hireDate: new Date('2023-01-01'),
          salary: 60000,
          gender: 'male'
        },
        {
          name: '李護理師',
          phone: '0923456789',
          position: '護理師',
          department: '護理部',
          hireDate: new Date('2023-06-01'),
          salary: 50000,
          gender: 'female'
        },
        {
          name: '王助理',
          phone: '0934567890',
          position: '助理',
          department: '行政部',
          hireDate: new Date('2024-01-01'),
          salary: 35000,
          gender: 'male'
        },
        {
          name: '陳主管',
          phone: '0945678901',
          position: '主管',
          department: '管理部',
          hireDate: new Date('2022-01-01'),
          salary: 80000,
          gender: 'female'
        }
      ]);
    });

    it('應該能夠按職位查詢', async () => {
      const pharmacists = await Employee.find({ position: '藥師' });
      expect(pharmacists).toHaveLength(1);
      expect(pharmacists[0].name).toBe('張藥師');

      const assistants = await Employee.find({ position: '助理' });
      expect(assistants).toHaveLength(1);
      expect(assistants[0].name).toBe('王助理');
    });

    it('應該能夠按部門查詢', async () => {
      const pharmacyDept = await Employee.find({ department: '藥劑部' });
      expect(pharmacyDept).toHaveLength(1);
      expect(pharmacyDept[0].position).toBe('藥師');

      const nursingDept = await Employee.find({ department: '護理部' });
      expect(nursingDept).toHaveLength(1);
      expect(nursingDept[0].position).toBe('護理師');
    });

    it('應該能夠按性別查詢', async () => {
      const maleEmployees = await Employee.find({ gender: 'male' });
      expect(maleEmployees).toHaveLength(2);

      const femaleEmployees = await Employee.find({ gender: 'female' });
      expect(femaleEmployees).toHaveLength(2);
    });

    it('應該能夠按薪資範圍查詢', async () => {
      const highSalaryEmployees = await Employee.find({ 
        salary: { $gte: 60000 } 
      });
      expect(highSalaryEmployees).toHaveLength(2);

      const lowSalaryEmployees = await Employee.find({ 
        salary: { $lt: 40000 } 
      });
      expect(lowSalaryEmployees).toHaveLength(1);
      expect(lowSalaryEmployees[0].name).toBe('王助理');
    });

    it('應該能夠按入職日期範圍查詢', async () => {
      const recentHires = await Employee.find({
        hireDate: {
          $gte: new Date('2023-06-01'),
          $lte: new Date('2024-12-31')
        }
      });
      expect(recentHires).toHaveLength(2);

      const oldEmployees = await Employee.find({
        hireDate: { $lt: new Date('2023-01-01') }
      });
      expect(oldEmployees).toHaveLength(1);
      expect(oldEmployees[0].name).toBe('陳主管');
    });

    it('應該能夠按姓名模糊查詢', async () => {
      const employeesWithWang = await Employee.find({ 
        name: { $regex: '王', $options: 'i' } 
      });
      expect(employeesWithWang).toHaveLength(1);
      expect(employeesWithWang[0].name).toBe('王助理');
    });

    it('應該能夠查詢有薪資資訊的員工', async () => {
      const employeesWithSalary = await Employee.find({ 
        salary: { $exists: true, $ne: null } 
      });
      expect(employeesWithSalary).toHaveLength(4);
    });
  });

  describe('Complex Scenarios', () => {
    it('應該處理完整的員工生命週期', async () => {
      // 創建新員工
      const employee = await Employee.create({
        name: '生命週期員工',
        phone: '0912000000',
        position: '實習生',
        department: '實習部',
        hireDate: new Date('2024-01-01'),
        salary: 25000
      });

      expect(employee.position).toBe('實習生');
      expect(employee.salary).toBe(25000);

      // 升職加薪
      employee.position = '正職員工';
      employee.salary = 40000;
      employee.department = '業務部';
      await employee.save();

      expect(employee.position).toBe('正職員工');
      expect(employee.salary).toBe(40000);
      expect(employee.department).toBe('業務部');

      // 再次升職
      employee.position = '資深員工';
      employee.salary = 55000;
      await employee.save();

      expect(employee.position).toBe('資深員工');
      expect(employee.salary).toBe(55000);

      // 添加額外資訊
      employee.education = '在職進修學士';
      employee.experience = '3年業務經驗';
      employee.rewards = '年度優秀員工';
      await employee.save();

      expect(employee.education).toBe('在職進修學士');
      expect(employee.experience).toBe('3年業務經驗');
      expect(employee.rewards).toBe('年度優秀員工');
    });

    it('應該處理多種員工類型', async () => {
      const employees = await Employee.create([
        {
          name: '全職藥師',
          phone: '0911111111',
          position: '藥師',
          department: '藥劑部',
          hireDate: new Date('2023-01-01'),
          salary: 65000,
          education: '藥學系學士',
          experience: '8年藥局經驗',
          insuranceDate: new Date('2023-01-15')
        },
        {
          name: '兼職助理',
          phone: '0922222222',
          position: '兼職助理',
          department: '行政部',
          hireDate: new Date('2024-01-01'),
          salary: 28000,
          education: '高中畢業'
        },
        {
          name: '實習學生',
          phone: '0933333333',
          position: '實習生',
          department: '實習部',
          hireDate: new Date('2024-02-01'),
          education: '藥學系在學',
          additionalInfo: '實習期間6個月'
        },
        {
          name: '退休返聘',
          phone: '0944444444',
          position: '顧問',
          department: '管理部',
          hireDate: new Date('2024-01-01'),
          salary: 45000,
          education: '藥學系碩士',
          experience: '30年藥局管理經驗',
          additionalInfo: '退休返聘，彈性工時'
        }
      ]);

      expect(employees).toHaveLength(4);

      // 驗證不同類型員工的特定屬性
      const pharmacist = employees.find(e => e.position === '藥師');
      expect(pharmacist?.insuranceDate).toBeDefined();
      expect(pharmacist?.experience).toContain('藥局經驗');

      const partTime = employees.find(e => e.position === '兼職助理');
      expect(partTime?.salary).toBe(28000);

      const intern = employees.find(e => e.position === '實習生');
      expect(intern?.salary).toBeUndefined();
      expect(intern?.additionalInfo).toContain('實習期間');

      const consultant = employees.find(e => e.position === '顧問');
      expect(consultant?.experience).toContain('30年');
      expect(consultant?.additionalInfo).toContain('退休返聘');
    });

    it('應該處理員工資料的完整性檢查', async () => {
      const completeEmployee = await Employee.create({
        name: '完整資料員工',
        gender: '女',
        birthDate: new Date('1988-08-08'),
        idNumber: 'C123456789',
        address: '高雄市前金區中正四路100號',
        phone: '0955555555',
        position: '資深藥師',
        department: '藥劑部',
        hireDate: new Date('2020-03-01'),
        email: 'complete.employee@pharmacy.com',
        salary: 70000,
        insuranceDate: new Date('2020-03-15'),
        education: '臨床藥學碩士',
        nativePlace: '高雄市',
        experience: '12年醫院藥局經驗',
        rewards: '多次優秀員工、專業貢獻獎',
        injuries: '無職業傷害記錄',
        additionalInfo: '具備臨床藥師證照、糖尿病衛教師證照',
        idCardFront: '/uploads/employees/complete_front.jpg',
        idCardBack: '/uploads/employees/complete_back.jpg',
        signDate: new Date('2020-03-01'),
        userId: new mongoose.Types.ObjectId()
      });

      // 驗證所有欄位都正確儲存
      expect(completeEmployee.name).toBe('完整資料員工');
      expect(completeEmployee.gender).toBe('女');
      expect(completeEmployee.idNumber).toBe('C123456789');
      expect(completeEmployee.salary).toBe(70000);
      expect(completeEmployee.education).toBe('臨床藥學碩士');
      expect(completeEmployee.experience).toContain('12年');
      expect(completeEmployee.rewards).toContain('優秀員工');
      expect(completeEmployee.additionalInfo).toContain('臨床藥師證照');
      expect(completeEmployee.userId).toBeDefined();

      // 驗證日期欄位
      expect(completeEmployee.birthDate).toEqual(new Date('1988-08-08'));
      expect(completeEmployee.hireDate).toEqual(new Date('2020-03-01'));
      expect(completeEmployee.insuranceDate).toEqual(new Date('2020-03-15'));
      expect(completeEmployee.signDate).toEqual(new Date('2020-03-01'));

      // 驗證檔案路徑
      expect(completeEmployee.idCardFront).toBe('/uploads/employees/complete_front.jpg');
      expect(completeEmployee.idCardBack).toBe('/uploads/employees/complete_back.jpg');
    });
  });
});
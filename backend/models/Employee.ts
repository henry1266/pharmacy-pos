import mongoose, { Schema, Model } from 'mongoose';
import { IEmployee, IEmployeeDocument } from '../src/types/models';

// Employee Schema 定義
const EmployeeSchema = new Schema<IEmployeeDocument>({
  employeeId: {
    type: String,
    required: [true, '員工編號為必填項目'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, '姓名為必填項目'],
    trim: true,
    maxlength: [50, '姓名不能超過50個字元']
  },
  position: {
    type: String,
    required: [true, '職位為必填項目'],
    trim: true,
    maxlength: [100, '職位不能超過100個字元']
  },
  department: {
    type: String,
    trim: true,
    maxlength: [100, '部門不能超過100個字元']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(email: string) {
        if (!email) return true; // 允許空值
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      },
      message: '請提供有效的電子郵件地址'
    },
    sparse: true // 允許多個文檔有 null 值，但不允許重複的非 null 值
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(phone: string) {
        if (!phone) return true; // 允許空值
        const phoneRegex = /^[\d\-\+\(\)\s]+$/;
        return phoneRegex.test(phone);
      },
      message: '請提供有效的電話號碼'
    }
  },
  hireDate: {
    type: Date,
    required: [true, '入職日期為必填項目']
  },
  salary: {
    type: Number,
    min: [0, '薪資不能為負數']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  workSchedule: {
    monday: {
      start: { type: String, match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      end: { type: String, match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ }
    },
    tuesday: {
      start: { type: String, match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      end: { type: String, match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ }
    },
    wednesday: {
      start: { type: String, match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      end: { type: String, match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ }
    },
    thursday: {
      start: { type: String, match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      end: { type: String, match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ }
    },
    friday: {
      start: { type: String, match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      end: { type: String, match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ }
    },
    saturday: {
      start: { type: String, match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      end: { type: String, match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ }
    },
    sunday: {
      start: { type: String, match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      end: { type: String, match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引設定
EmployeeSchema.index({ employeeId: 1 }, { unique: true });
EmployeeSchema.index({ name: 'text' });
EmployeeSchema.index({ position: 1 });
EmployeeSchema.index({ department: 1 });
EmployeeSchema.index({ isActive: 1 });
EmployeeSchema.index({ hireDate: -1 });
EmployeeSchema.index({ email: 1 }, { sparse: true });

// 複合索引
EmployeeSchema.index({ department: 1, position: 1 });
EmployeeSchema.index({ isActive: 1, hireDate: -1 });

// 靜態方法：根據員工編號查找
EmployeeSchema.statics.findByEmployeeId = function(employeeId: string) {
  return this.findOne({ employeeId: employeeId.toUpperCase(), isActive: true });
};

// 靜態方法：根據部門查找員工
EmployeeSchema.statics.findByDepartment = function(department: string) {
  return this.find({ department, isActive: true }).sort({ name: 1 });
};

// 靜態方法：根據職位查找員工
EmployeeSchema.statics.findByPosition = function(position: string) {
  return this.find({ position, isActive: true }).sort({ name: 1 });
};

// 靜態方法：搜尋員工
EmployeeSchema.statics.searchEmployees = function(searchTerm: string, options: any = {}) {
  const query: any = {
    isActive: true,
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { employeeId: { $regex: searchTerm, $options: 'i' } },
      { position: { $regex: searchTerm, $options: 'i' } },
      { department: { $regex: searchTerm, $options: 'i' } }
    ]
  };

  if (options.department) {
    query.department = options.department;
  }

  if (options.position) {
    query.position = options.position;
  }

  return this.find(query)
    .sort(options.sort || { name: 1 })
    .limit(options.limit || 50);
};

// 靜態方法：獲取部門統計
EmployeeSchema.statics.getDepartmentStats = async function() {
  return await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$department',
        employeeCount: { $sum: 1 },
        averageSalary: { $avg: '$salary' },
        totalSalary: { $sum: '$salary' }
      }
    },
    { $sort: { employeeCount: -1 } }
  ]);
};

// 靜態方法：獲取職位統計
EmployeeSchema.statics.getPositionStats = async function() {
  return await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$position',
        employeeCount: { $sum: 1 },
        averageSalary: { $avg: '$salary' },
        departments: { $addToSet: '$department' }
      }
    },
    { $sort: { employeeCount: -1 } }
  ]);
};

// 實例方法：計算工作年資
EmployeeSchema.methods.getWorkExperience = function(): number {
  const now = new Date();
  const hireDate = new Date(this.hireDate);
  const diffTime = Math.abs(now.getTime() - hireDate.getTime());
  const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
  return diffYears;
};

// 實例方法：檢查是否有工作排程
EmployeeSchema.methods.hasWorkSchedule = function(): boolean {
  if (!this.workSchedule) return false;
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  return days.some(day => {
    const schedule = this.workSchedule[day as keyof typeof this.workSchedule];
    return schedule && schedule.start && schedule.end;
  });
};

// 實例方法：獲取工作日排程
EmployeeSchema.methods.getWorkDays = function(): string[] {
  if (!this.workSchedule) return [];
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  return days.filter(day => {
    const schedule = this.workSchedule[day as keyof typeof this.workSchedule];
    return schedule && schedule.start && schedule.end;
  });
};

// 虛擬屬性：完整顯示名稱
EmployeeSchema.virtual('displayName').get(function(this: IEmployeeDocument) {
  return `${this.employeeId} - ${this.name}`;
});

// 虛擬屬性：工作年資
EmployeeSchema.virtual('workExperience').get(function(this: IEmployeeDocument) {
  return this.getWorkExperience();
});

// 虛擬屬性：是否為新員工（入職不到一年）
EmployeeSchema.virtual('isNewEmployee').get(function(this: IEmployeeDocument) {
  return this.getWorkExperience() < 1;
});

// 虛擬屬性：聯絡資訊
EmployeeSchema.virtual('contactInfo').get(function(this: IEmployeeDocument) {
  const contact: any = {};
  if (this.email) contact.email = this.email;
  if (this.phone) contact.phone = this.phone;
  return contact;
});

// 中間件：員工編號自動轉大寫
EmployeeSchema.pre<IEmployeeDocument>('save', function(next) {
  if (this.employeeId) {
    this.employeeId = this.employeeId.toUpperCase();
  }
  next();
});

// 中間件：驗證工作排程時間格式
EmployeeSchema.pre<IEmployeeDocument>('save', function(next) {
  if (this.workSchedule) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const day of days) {
      const schedule = this.workSchedule[day as keyof typeof this.workSchedule];
      if (schedule && schedule.start && schedule.end) {
        const startTime = schedule.start.split(':').map(Number);
        const endTime = schedule.end.split(':').map(Number);
        
        const startMinutes = (startTime[0] || 0) * 60 + (startTime[1] || 0);
        const endMinutes = (endTime[0] || 0) * 60 + (endTime[1] || 0);
        
        if (startMinutes >= endMinutes) {
          return next(new Error(`${day} 的結束時間必須晚於開始時間`));
        }
      }
    }
  }
  next();
});

// 擴展靜態方法介面
interface IEmployeeModel extends Model<IEmployeeDocument> {
  findByEmployeeId(employeeId: string): Promise<IEmployeeDocument | null>;
  findByDepartment(department: string): Promise<IEmployeeDocument[]>;
  findByPosition(position: string): Promise<IEmployeeDocument[]>;
  searchEmployees(searchTerm: string, options?: any): Promise<IEmployeeDocument[]>;
  getDepartmentStats(): Promise<any[]>;
  getPositionStats(): Promise<any[]>;
}

// 創建並匯出模型
const Employee = mongoose.model<IEmployeeDocument, IEmployeeModel>('Employee', EmployeeSchema);

export default Employee;
export { IEmployee, IEmployeeDocument, IEmployeeModel };
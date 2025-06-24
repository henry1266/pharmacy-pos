/**
 * 加班數據處理工具函數
 * 處理加班記錄的分組、統計和格式化
 */

/**
 * 員工介面
 */
interface Employee {
  _id: string;
  name: string;
  position?: string;
  department?: string;
  [key: string]: any;
}

/**
 * 加班記錄介面
 */
interface OvertimeRecord {
  employeeId?: Employee | string;
  date: string | Date;
  hours: number;
  status?: string;
  [key: string]: any;
}

/**
 * 排班記錄介面
 */
interface ScheduleRecord {
  employeeId?: Employee;
  employee?: Employee;
  [key: string]: any;
}

/**
 * 統計數據介面
 */
interface SummaryData {
  employeeId: string | Employee;
  employeeName?: string;
  overtimeHours: number;
  scheduleRecordCount?: number;
  [key: string]: any;
}

/**
 * 員工群組介面
 */
interface EmployeeGroup {
  employee: Employee;
  records: OvertimeRecord[];
  independentHours: number;
  scheduleHours: number;
  totalHours: number;
  scheduleRecords: ScheduleRecord[];
  scheduleRecordCount: number;
  latestDate: Date;
}

/**
 * 表單數據介面
 */
interface OvertimeFormData {
  employeeId?: string;
  date?: string | Date;
  hours?: number;
  [key: string]: any;
}

/**
 * 錯誤對象介面
 */
interface FormErrors {
  employeeId?: string;
  date?: string;
  hours?: string;
  [key: string]: string | undefined;
}

/**
 * 建立基本員工群組
 * @param {Employee} employee - 員工對象
 * @returns {EmployeeGroup} 員工群組對象
 */
const createBasicEmployeeGroup = (employee: Employee): EmployeeGroup => ({
  employee,
  records: [],
  independentHours: 0,
  scheduleHours: 0,
  totalHours: 0,
  scheduleRecords: [],
  scheduleRecordCount: 0,
  latestDate: new Date(0)
});

/**
 * 從多個來源查找員工姓名
 * @param {string} empId - 員工ID
 * @param {ScheduleRecord[]} scheduleRecords - 排班記錄
 * @param {Employee[]} employees - 員工列表
 * @param {SummaryData[]} summaryData - 統計數據
 * @param {OvertimeRecord[]} overtimeRecords - 加班記錄
 * @param {number} selectedMonth - 選中月份
 * @returns {{ name: string; obj: Employee | null }} 包含員工姓名和對象的結果
 */
const findEmployeeInfo = (
  empId: string,
  scheduleRecords: ScheduleRecord[],
  employees: Employee[],
  summaryData: SummaryData[],
  overtimeRecords: OvertimeRecord[],
  selectedMonth: number
): { name: string; obj: Employee | null } => {
  let employeeName = '';
  let employeeObj: Employee | null = null;
  
  // 首先從員工列表中查找
  const matchingEmployee = employees.find(emp =>
    emp._id === empId || (typeof empId === 'string' && empId.includes(emp._id))
  );
  
  if (matchingEmployee) {
    return { name: matchingEmployee.name, obj: matchingEmployee };
  }
  
  // 從排班記錄中獲取員工信息
  for (const record of scheduleRecords) {
    if (record.employeeId?.name) {
      return { name: record.employeeId.name, obj: record.employeeId };
    }
    
    if (record.employee?.name) {
      return { name: record.employee.name, obj: record.employee };
    }
  }
  
  // 從統計數據中查找
  const matchingStat = Array.isArray(summaryData) ? summaryData.find(stat =>
    stat.employeeId === empId || (typeof stat.employeeId === 'object' && stat.employeeId?._id === empId) ||
    (stat.employeeName && typeof empId === 'string' && empId.includes(stat.employeeName))
  ) : undefined;
  
  if (matchingStat?.employeeName) {
    employeeName = matchingStat.employeeName;
  }
  
  // 從加班記錄中查找
  if (!employeeName) {
    const matchingRecord = overtimeRecords.find(r => 
      typeof r.employeeId === 'object' && r.employeeId?._id === empId
    );
    if (matchingRecord?.employeeId && typeof matchingRecord.employeeId === 'object') {
      return { name: matchingRecord.employeeId.name, obj: matchingRecord.employeeId };
    }
  }
  
  // 使用臨時名稱
  if (!employeeName) {
    const monthNum = selectedMonth + 1;
    const monthStr = monthNum < 10 ? `0${monthNum}` : monthNum.toString();
    employeeName = `員工${monthStr}`;
  }
  
  return { name: employeeName, obj: employeeObj };
};

/**
 * 建立員工群組
 * @param {string} empId - 員工ID
 * @param {ScheduleRecord[]} scheduleRecords - 排班記錄
 * @param {Employee[]} employees - 員工列表
 * @param {SummaryData[]} summaryData - 統計數據
 * @param {OvertimeRecord[]} overtimeRecords - 加班記錄
 * @param {number} selectedMonth - 選中月份
 * @returns {EmployeeGroup} 員工群組對象
 */
const createEmployeeGroup = (
  empId: string,
  scheduleRecords: ScheduleRecord[],
  employees: Employee[],
  summaryData: SummaryData[],
  overtimeRecords: OvertimeRecord[],
  selectedMonth: number
): EmployeeGroup => {
  const { name, obj } = findEmployeeInfo(empId, scheduleRecords, employees, summaryData, overtimeRecords, selectedMonth);
  
  return {
    employee: obj || {
      _id: empId,
      name,
      position: '員工',
      department: '員工'
    },
    records: [],
    independentHours: 0,
    scheduleHours: 0,
    totalHours: 0,
    scheduleRecords: [],
    scheduleRecordCount: 0,
    latestDate: new Date(0)
  };
};

/**
 * 將加班記錄按員工分組並計算統計數據
 * @param {OvertimeRecord[]} overtimeRecords - 獨立加班記錄
 * @param {Record<string, ScheduleRecord[]>} scheduleOvertimeRecords - 排班系統加班記錄
 * @param {SummaryData[]} summaryData - 統計數據
 * @param {Employee[]} employees - 員工列表
 * @param {number} selectedMonth - 選中的月份
 * @returns {Array<[string, EmployeeGroup]>} 分組後的記錄數組
 */
/**
 * 從統計數據中初始化員工群組
 */
const initializeGroupsFromSummary = (
  summaryData: SummaryData[],
  employees: Employee[],
  overtimeRecords: OvertimeRecord[],
  selectedMonth: number
): Record<string, EmployeeGroup> => {
  const groups: Record<string, EmployeeGroup> = {};
  
  (Array.isArray(summaryData) ? summaryData : []).forEach(stat => {
    if (!stat.employeeId) return;
    
    const employeeId = typeof stat.employeeId === 'string' ? stat.employeeId : stat.employeeId._id;
    const employeeName = getEmployeeNameFromSources(stat, employees, overtimeRecords, selectedMonth);
    
    groups[employeeId] = {
      employee: {
        _id: employeeId,
        name: employeeName,
        position: '員工',
        department: '員工'
      },
      records: [],
      independentHours: 0,
      scheduleHours: 0,
      totalHours: 0,
      scheduleRecords: [],
      scheduleRecordCount: 0,
      latestDate: new Date(0)
    };
  });
  
  return groups;
};

/**
 * 從多個來源獲取員工姓名
 */
const getEmployeeNameFromSources = (
  stat: SummaryData,
  employees: Employee[],
  overtimeRecords: OvertimeRecord[],
  selectedMonth: number
): string => {
  const employeeId = typeof stat.employeeId === 'string' ? stat.employeeId : stat.employeeId._id;
  
  // 優先使用統計數據中的名稱
  if (stat.employeeName) return stat.employeeName;
  
  // 從員工列表中查找
  const matchingEmployee = employees.find(emp => emp._id === employeeId);
  if (matchingEmployee?.name) return matchingEmployee.name;
  
  // 從加班記錄中查找
  const matchingRecord = overtimeRecords.find(r =>
    typeof r.employeeId === 'object' && r.employeeId?._id === employeeId
  );
  if (matchingRecord?.employeeId && typeof matchingRecord.employeeId === 'object') {
    return matchingRecord.employeeId.name;
  }
  
  // 使用臨時名稱
  const monthNum = selectedMonth + 1;
  const monthStr = monthNum < 10 ? `0${monthNum}` : monthNum.toString();
  return `員工${monthStr}`;
};

/**
 * 處理獨立加班記錄
 */
const processIndependentOvertimeRecords = (
  overtimeRecords: OvertimeRecord[],
  groups: Record<string, EmployeeGroup>
): void => {
  overtimeRecords.forEach(record => {
    if (typeof record.employeeId === 'object' && record.employeeId?._id) {
      const employeeId = record.employeeId._id;
      if (!groups[employeeId]) {
        groups[employeeId] = createBasicEmployeeGroup(record.employeeId);
      }
      
      groups[employeeId].records.push(record);
      groups[employeeId].independentHours += record.hours;
      groups[employeeId].totalHours += record.hours;
      
      const recordDate = new Date(record.date);
      if (recordDate > groups[employeeId].latestDate) {
        groups[employeeId].latestDate = recordDate;
      }
    }
  });
};

/**
 * 處理排班系統加班記錄和統計數據
 */
const processScheduleOvertimeData = (
  groups: Record<string, EmployeeGroup>,
  scheduleOvertimeRecords: Record<string, ScheduleRecord[]>,
  summaryData: SummaryData[]
): void => {
  Object.keys(groups).forEach(employeeId => {
    const group = groups[employeeId];
    
    // 添加排班記錄
    if (scheduleOvertimeRecords[employeeId]) {
      group.scheduleRecords = scheduleOvertimeRecords[employeeId];
    }
    
    // 查找對應的統計數據
    const scheduleStats = findMatchingScheduleStats(summaryData, employeeId);
    
    if (scheduleStats) {
      const scheduleHours = scheduleStats.overtimeHours - group.independentHours;
      group.scheduleHours = scheduleHours > 0 ? scheduleHours : 0;
      group.totalHours = scheduleStats.overtimeHours;
      group.scheduleRecordCount = scheduleStats.scheduleRecordCount ?? 0;
    }
  });
};

/**
 * 查找匹配的排班統計數據
 */
const findMatchingScheduleStats = (summaryData: SummaryData[], employeeId: string): SummaryData | undefined => {
  return Array.isArray(summaryData) ? summaryData.find(stat => {
    if (typeof stat.employeeId === 'string') {
      return stat.employeeId === employeeId || employeeId.includes(stat.employeeId);
    } else if (typeof stat.employeeId === 'object') {
      return stat.employeeId._id === employeeId;
    }
    return false;
  }) : undefined;
};

export const groupOvertimeRecords = (
  overtimeRecords: OvertimeRecord[],
  scheduleOvertimeRecords: Record<string, ScheduleRecord[]>,
  summaryData: SummaryData[],
  employees: Employee[],
  selectedMonth: number
): Array<[string, EmployeeGroup]> => {
  // 初始化群組
  const initialGroups = initializeGroupsFromSummary(summaryData, employees, overtimeRecords, selectedMonth);
  
  // 從排班系統加班記錄中獲取員工ID
  Object.keys(scheduleOvertimeRecords).forEach(empId => {
    if (!initialGroups[empId]) {
      initialGroups[empId] = createEmployeeGroup(
        empId,
        scheduleOvertimeRecords[empId],
        employees,
        summaryData,
        overtimeRecords,
        selectedMonth
      );
    }
  });
  
  // 處理獨立加班記錄
  processIndependentOvertimeRecords(overtimeRecords, initialGroups);
  
  // 處理排班系統加班記錄和統計數據
  processScheduleOvertimeData(initialGroups, scheduleOvertimeRecords, summaryData);
  
  // 轉換為數組格式並排序
  return Object.entries(initialGroups).sort((a, b) => {
    return b[1].totalHours - a[1].totalHours;
  });
};

/**
 * 驗證表單數據
 * @param {OvertimeFormData} formData - 表單數據
 * @returns {FormErrors} 錯誤對象
 */
export const validateOvertimeForm = (formData: OvertimeFormData): FormErrors => {
  const errors: FormErrors = {};
  
  if (!formData.employeeId) {
    errors.employeeId = '請選擇員工';
  }
  
  if (!formData.date) {
    errors.date = '請選擇日期';
  }
  
  if (!formData.hours) {
    errors.hours = '請輸入加班時數';
  } else if (isNaN(Number(formData.hours)) || Number(formData.hours) <= 0 || Number(formData.hours) > 24) {
    errors.hours = '加班時數必須在 0.5 到 24 小時之間';
  }
  
  return errors;
};

/**
 * 格式化日期顯示
 * @param {string|Date} dateString - 日期字符串或日期對象
 * @returns {string} 格式化後的日期字符串
 */
export const formatDate = (dateString: string | Date): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW');
};

/**
 * 加班狀態類型
 */
export type OvertimeStatus = 'pending' | 'approved' | 'rejected';

/**
 * 獲取狀態顯示文字
 * @param {OvertimeStatus} status - 狀態值
 * @returns {string} 狀態顯示文字
 */
export const getStatusText = (status: OvertimeStatus): string => {
  const statusMap: Record<OvertimeStatus, string> = {
    pending: '待審核',
    approved: '已核准',
    rejected: '已拒絕'
  };
  return statusMap[status] || status;
};

/**
 * 獲取狀態顏色
 * @param {OvertimeStatus} status - 狀態值
 * @returns {string} 狀態顏色
 */
export const getStatusColor = (status: OvertimeStatus): string => {
  const colorMap: Record<OvertimeStatus, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error'
  };
  return colorMap[status] || 'default';
};
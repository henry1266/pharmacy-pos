/**
 * 加班數據處理工具函數
 * 處理加班記錄的分組、統計和格式化
 */

/**
 * 建立基本員工群組
 * @param {Object} employee - 員工對象
 * @returns {Object} 員工群組對象
 */
const createBasicEmployeeGroup = (employee) => ({
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
 * @param {Array} scheduleRecords - 排班記錄
 * @param {Array} employees - 員工列表
 * @param {Array} summaryData - 統計數據
 * @param {Array} overtimeRecords - 加班記錄
 * @param {number} selectedMonth - 選中月份
 * @returns {Object} 包含員工姓名和對象的結果
 */
const findEmployeeInfo = (empId, scheduleRecords, employees, summaryData, overtimeRecords, selectedMonth) => {
  let employeeName = '';
  let employeeObj = null;
  
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
  const matchingStat = summaryData.find(stat =>
    stat.employeeId === empId || (stat.employeeName && empId.includes(stat.employeeName))
  );
  
  if (matchingStat?.employeeName) {
    employeeName = matchingStat.employeeName;
  }
  
  // 從加班記錄中查找
  if (!employeeName) {
    const matchingRecord = overtimeRecords.find(r => r.employeeId?._id === empId);
    if (matchingRecord?.employeeId?.name) {
      return { name: matchingRecord.employeeId.name, obj: matchingRecord.employeeId };
    }
  }
  
  // 使用臨時名稱
  if (!employeeName) {
    const monthStr = (selectedMonth + 1).toString().padStart(2, '0');
    employeeName = `員工${monthStr}`;
  }
  
  return { name: employeeName, obj: employeeObj };
};

/**
 * 建立員工群組
 * @param {string} empId - 員工ID
 * @param {Array} scheduleRecords - 排班記錄
 * @param {Array} employees - 員工列表
 * @param {Array} summaryData - 統計數據
 * @param {Array} overtimeRecords - 加班記錄
 * @param {number} selectedMonth - 選中月份
 * @returns {Object} 員工群組對象
 */
const createEmployeeGroup = (empId, scheduleRecords, employees, summaryData, overtimeRecords, selectedMonth) => {
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
 * @param {Array} overtimeRecords - 獨立加班記錄
 * @param {Object} scheduleOvertimeRecords - 排班系統加班記錄
 * @param {Array} summaryData - 統計數據
 * @param {Array} employees - 員工列表
 * @param {number} selectedMonth - 選中的月份
 * @returns {Array} 分組後的記錄數組
 */
export const groupOvertimeRecords = (
  overtimeRecords,
  scheduleOvertimeRecords,
  summaryData,
  employees,
  selectedMonth
) => {
  const initialGroups = {};
  
  // 從統計數據中獲取員工ID
  summaryData.forEach(stat => {
    if (stat.employeeId) {
      let employeeName = stat.employeeName || '';
      
      // 嘗試從員工列表中查找
      if (!employeeName) {
        const matchingEmployee = employees.find(emp => emp._id === stat.employeeId);
        employeeName = matchingEmployee?.name;
      }
      
      // 如果沒有名字，嘗試從其他地方獲取
      if (!employeeName) {
        const matchingRecord = overtimeRecords.find(r =>
          r.employeeId?._id === stat.employeeId
        );
        employeeName = matchingRecord?.employeeId?.name;
      }
      
      // 如果還是沒有名字，使用臨時名稱
      if (!employeeName) {
        const monthStr = (selectedMonth + 1).toString().padStart(2, '0');
        employeeName = `員工${monthStr}`;
      }
      
      initialGroups[stat.employeeId] = {
        employee: {
          _id: stat.employeeId,
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
    }
  });
  
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
  overtimeRecords.forEach(record => {
    const employeeId = record.employeeId?._id;
    if (employeeId) {
      if (!initialGroups[employeeId]) {
        initialGroups[employeeId] = createBasicEmployeeGroup(record.employeeId);
      }
      
      initialGroups[employeeId].records.push(record);
      initialGroups[employeeId].independentHours += record.hours;
      initialGroups[employeeId].totalHours += record.hours;
      
      const recordDate = new Date(record.date);
      if (recordDate > initialGroups[employeeId].latestDate) {
        initialGroups[employeeId].latestDate = recordDate;
      }
    }
  });
  
  // 處理排班系統加班記錄和統計數據
  Object.keys(initialGroups).forEach(employeeId => {
    const group = initialGroups[employeeId];
    
    // 添加排班記錄
    if (scheduleOvertimeRecords[employeeId]) {
      group.scheduleRecords = scheduleOvertimeRecords[employeeId];
    }
    
    // 查找對應的統計數據
    const scheduleStats = summaryData.find(stat => 
      stat.employeeId === employeeId ||
      stat.employeeId?._id === employeeId ||
      (stat.employeeId && employeeId.includes(stat.employeeId))
    );
    
    if (scheduleStats) {
      // 計算排班系統加班時數 (總時數 - 獨立加班時數)
      const scheduleHours = scheduleStats.overtimeHours - group.independentHours;
      group.scheduleHours = scheduleHours > 0 ? scheduleHours : 0;
      group.totalHours = scheduleStats.overtimeHours;
      group.scheduleRecordCount = scheduleStats.scheduleRecordCount || 0;
    }
  });
  
  // 轉換為數組格式並排序
  return Object.entries(initialGroups).sort((a, b) => {
    // 按總加班時數降序排序
    return b[1].totalHours - a[1].totalHours;
  });
};

/**
 * 驗證表單數據
 * @param {Object} formData - 表單數據
 * @returns {Object} 錯誤對象
 */
export const validateOvertimeForm = (formData) => {
  const errors = {};
  
  if (!formData.employeeId) {
    errors.employeeId = '請選擇員工';
  }
  
  if (!formData.date) {
    errors.date = '請選擇日期';
  }
  
  if (!formData.hours) {
    errors.hours = '請輸入加班時數';
  } else if (isNaN(formData.hours) || formData.hours <= 0 || formData.hours > 24) {
    errors.hours = '加班時數必須在 0.5 到 24 小時之間';
  }
  
  return errors;
};

/**
 * 格式化日期顯示
 * @param {string|Date} dateString - 日期字符串或日期對象
 * @returns {string} 格式化後的日期字符串
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW');
};

/**
 * 獲取狀態顯示文字
 * @param {string} status - 狀態值
 * @returns {string} 狀態顯示文字
 */
export const getStatusText = (status) => {
  const statusMap = {
    pending: '待審核',
    approved: '已核准',
    rejected: '已拒絕'
  };
  return statusMap[status] || status;
};

/**
 * 獲取狀態顏色
 * @param {string} status - 狀態值
 * @returns {string} 狀態顏色
 */
export const getStatusColor = (status) => {
  const colorMap = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error'
  };
  return colorMap[status] || 'default';
};
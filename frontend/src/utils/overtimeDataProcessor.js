/**
 * 加班數據處理工具函數
 * 處理加班記錄的分組、統計和格式化
 */

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
        if (matchingEmployee) {
          employeeName = matchingEmployee.name;
        }
      }
      
      // 如果沒有名字，嘗試從其他地方獲取
      if (!employeeName) {
        const matchingRecord = overtimeRecords.find(r =>
          r.employeeId && r.employeeId._id === stat.employeeId
        );
        
        if (matchingRecord && matchingRecord.employeeId.name) {
          employeeName = matchingRecord.employeeId.name;
        }
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
      const scheduleRecords = scheduleOvertimeRecords[empId];
      let employeeName = '';
      let employeeObj = null;
      
      // 首先從員工列表中查找
      const matchingEmployee = employees.find(emp =>
        emp._id === empId || (typeof empId === 'string' && empId.includes(emp._id))
      );
      
      if (matchingEmployee) {
        employeeName = matchingEmployee.name;
        employeeObj = matchingEmployee;
      } else {
        // 從排班記錄中獲取員工信息
        for (const record of scheduleRecords) {
          if (record.employeeId) {
            if (typeof record.employeeId === 'object' && record.employeeId.name) {
              employeeName = record.employeeId.name;
              employeeObj = record.employeeId;
              break;
            }
          }
          
          if (record.employee && record.employee.name) {
            employeeName = record.employee.name;
            employeeObj = record.employee;
            break;
          }
        }
        
        // 如果還是沒找到，使用臨時名稱
        if (!employeeName) {
          const monthStr = (selectedMonth + 1).toString().padStart(2, '0');
          employeeName = `員工${monthStr}`;
        }
      }
      
      initialGroups[empId] = {
        employee: employeeObj || {
          _id: empId,
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
  
  // 處理獨立加班記錄
  overtimeRecords.forEach(record => {
    if (record.employeeId && record.employeeId._id) {
      const employeeId = record.employeeId._id;
      
      if (!initialGroups[employeeId]) {
        initialGroups[employeeId] = {
          employee: record.employeeId,
          records: [],
          independentHours: 0,
          scheduleHours: 0,
          totalHours: 0,
          scheduleRecords: [],
          scheduleRecordCount: 0,
          latestDate: new Date(0)
        };
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
    const scheduleStats = summaryData.find(stat => {
      if (stat.employeeId === employeeId) return true;
      if (stat.employeeId && typeof stat.employeeId === 'object' && stat.employeeId._id === employeeId) return true;
      if (stat.employeeId && employeeId.includes(stat.employeeId)) return true;
      return false;
    });
    
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
  switch (status) {
    case 'pending': return '待審核';
    case 'approved': return '已核准';
    case 'rejected': return '已拒絕';
    default: return status;
  }
};

/**
 * 獲取狀態顏色
 * @param {string} status - 狀態值
 * @returns {string} 狀態顏色
 */
export const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return 'warning';
    case 'approved': return 'success';
    case 'rejected': return 'error';
    default: return 'default';
  }
};
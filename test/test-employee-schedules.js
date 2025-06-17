/**
 * 測試程序 - 直接解析 JSON 格式的 employeeschedules 數據
 * 用於診斷加班管理頁面數據讀取問題
 * 
 * 使用方法：
 * 1. 運行腳本：node test/test-employee-schedules.js
 */

const fs = require('fs');

// 配置參數
const config = {
  // 指定要查詢的年
  year: 2025,
  // 是否輸出詳細日誌
  verbose: true,
  // 是否將結果保存到文件
  saveToFile: true,
  // 結果文件路徑
  outputFile: './test/employee-schedules-data.json',
  // 測試數據文件路徑
  testDataFile: './test/employee-schedules-test-data.json'
};

// 格式化日期為 YYYY-MM-DD 格式
function formatDateToYYYYMMDD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 解析 MongoDB 日期格式
function parseMongoDate(dateObj) {
  if (dateObj && dateObj.$date) {
    return new Date(dateObj.$date);
  }
  return new Date(dateObj);
}

// 解析 MongoDB ObjectId 格式
function parseMongoId(idObj) {
  if (idObj && idObj.$oid) {
    return idObj.$oid;
  }
  return String(idObj);
}


// 檢查指定月份的數據
function checkMonthData(scheduleRecords, year, month) {
  // 計算查詢日期範圍
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  const startDateStr = formatDateToYYYYMMDD(startDate);
  const endDateStr = formatDateToYYYYMMDD(endDate);
  
  console.log(`檢查 ${year}年${month}月 (${startDateStr} 至 ${endDateStr}) 的數據...`);
  
  // 過濾指定月份的記錄
  const monthRecords = scheduleRecords.filter(record => {
    const recordDate = parseMongoDate(record.date);
    return recordDate >= startDate && recordDate <= endDate;
  });
  
  // 過濾加班記錄
  const overtimeRecords = monthRecords.filter(record => record.leaveType === 'overtime');
  
  console.log(`${year}年${month}月: 找到 ${monthRecords.length} 條排班記錄，其中 ${overtimeRecords.length} 條加班記錄`);
  
  return {
    month,
    totalRecords: monthRecords.length,
    overtimeRecords: overtimeRecords.length,
    hasData: monthRecords.length > 0,
    hasOvertimeData: overtimeRecords.length > 0,
    records: monthRecords
  };
}

// 主函數
function testEmployeeSchedules() {
  console.log('開始測試 employeeschedules 數據...');
  console.log(`查詢參數: 年份=${config.year}`);
  
  try {
    // 創建或讀取測試數據
    let scheduleRecords;
    if (fs.existsSync(config.testDataFile)) {
      console.log(`從文件讀取測試數據: ${config.testDataFile}`);
      scheduleRecords = JSON.parse(fs.readFileSync(config.testDataFile, 'utf8'));
    } else {
      console.log('創建測試數據...');
      scheduleRecords = createTestData();
    }
    
    console.log(`讀取到 ${scheduleRecords.length} 條排班記錄`);
    
    // 檢查所有月份的數據
    console.log('\n===== 檢查各月份數據 =====');
    const monthResults = [];
    
    for (let month = 1; month <= 12; month++) {
      const result = checkMonthData(scheduleRecords, config.year, month);
      monthResults.push(result);
    }
    
    // 顯示結果摘要
    console.log('\n===== 月份數據摘要 =====');
    console.log('月份 | 總記錄數 | 加班記錄數 | 有數據 | 有加班數據');
    console.log('-----|----------|------------|--------|------------');
    monthResults.forEach(result => {
      console.log(`${result.month.toString().padStart(2, ' ')}月 | ${result.totalRecords.toString().padStart(8, ' ')} | ${result.overtimeRecords.toString().padStart(10, ' ')} | ${result.hasData ? '  是  ' : '  否  '} | ${result.hasOvertimeData ? '    是    ' : '    否    '}`);
    });
    
    // 檢查是否有五六月以外的數據
    const otherMonthsData = monthResults.filter(r => r.month !== 5 && r.month !== 6 && r.hasData);
    console.log(`\n五六月以外的月份中，有 ${otherMonthsData.length} 個月有數據`);
    if (otherMonthsData.length > 0) {
      console.log('這些月份是: ' + otherMonthsData.map(r => `${r.month}月`).join(', '));
    }
    
    // 詳細檢查每個月的加班記錄
    console.log('\n===== 詳細檢查加班記錄 =====');
    monthResults.forEach(result => {
      if (result.hasOvertimeData) {
        console.log(`\n${config.year}年${result.month}月加班記錄:`);
        result.records.forEach((record, index) => {
          if (record.leaveType === 'overtime') {
            const recordDate = parseMongoDate(record.date);
            const employeeId = parseMongoId(record.employeeId);
            console.log(`記錄 ${index + 1}:`);
            console.log(`  ID: ${parseMongoId(record._id)}`);
            console.log(`  日期: ${recordDate.toISOString().split('T')[0]}`);
            console.log(`  班次: ${record.shift}`);
            console.log(`  員工ID: ${employeeId}`);
            console.log(`  leaveType: ${record.leaveType}`);
          }
        });
      }
    });
    
    // 檢查 leaveType 字段
    console.log('\n===== 檢查 leaveType 字段 =====');
    const recordsWithLeaveType = scheduleRecords.filter(record => record.leaveType !== undefined);
    const recordsWithoutLeaveType = scheduleRecords.filter(record => record.leaveType === undefined);
    console.log(`有 leaveType 字段的記錄數: ${recordsWithLeaveType.length}`);
    console.log(`沒有 leaveType 字段的記錄數: ${recordsWithoutLeaveType.length}`);
    
    if (recordsWithoutLeaveType.length > 0) {
      console.log('\n沒有 leaveType 字段的記錄示例:');
      const example = recordsWithoutLeaveType[0];
      const recordDate = parseMongoDate(example.date);
      console.log(`  ID: ${parseMongoId(example._id)}`);
      console.log(`  日期: ${recordDate.toISOString().split('T')[0]}`);
      console.log(`  班次: ${example.shift}`);
      console.log(`  員工ID: ${parseMongoId(example.employeeId)}`);
    }
    
    // 保存結果到文件
    if (config.saveToFile) {
      const result = {
        queryParams: {
          year: config.year
        },
        monthResults,
        leaveTypeStats: {
          withLeaveType: recordsWithLeaveType.length,
          withoutLeaveType: recordsWithoutLeaveType.length
        }
      };
      
      fs.writeFileSync(config.outputFile, JSON.stringify(result, null, 2));
      console.log(`\n結果已保存到文件: ${config.outputFile}`);
    }
  } catch (error) {
    console.error('測試過程中發生錯誤:', error);
  }
}

// 執行測試
testEmployeeSchedules();
console.log('測試完成');
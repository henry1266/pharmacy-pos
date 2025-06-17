/**
 * 測試程序 - 直接連接 MongoDB 數據庫讀取 employeeschedules 集合數據
 * 用於診斷加班管理頁面數據讀取問題
 * 
 * 使用方法：
 * 1. 確保已安裝 MongoDB 驅動程序：npm install mongodb
 * 2. 運行腳本：node test/test-employee-schedules-mongodb.js
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');

// 配置參數
const config = {
  // MongoDB 連接字符串
  mongoURI: 'mongodb://192.168.68.79:27017/pharmacy-pos',
  // 是否輸出詳細日誌
  verbose: true,
  // 是否將結果保存到文件
  saveToFile: true,
  // 結果文件路徑
  outputFile: './test/employee-schedules-data.json'
};

// 格式化日期為 YYYY-MM-DD 格式
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 主函數
async function testEmployeeSchedules() {
  console.log('開始測試 employeeschedules 集合數據...');
  console.log(`連接到 MongoDB: ${config.mongoURI}`);
  
  let client;
  try {
    // 連接到 MongoDB
    client = new MongoClient(config.mongoURI);
    await client.connect();
    console.log('成功連接到 MongoDB');
    
    // 獲取數據庫和集合
    const db = client.db();
    const employeeSchedulesCollection = db.collection('employeeschedules');
    const employeesCollection = db.collection('employees');
    
    // 獲取所有排班記錄
    console.log('獲取所有排班記錄...');
    const scheduleRecords = await employeeSchedulesCollection.find({}).toArray();
    console.log(`找到 ${scheduleRecords.length} 條排班記錄`);
    
    // 獲取所有員工信息
    console.log('獲取所有員工信息...');
    const employees = await employeesCollection.find({}).toArray();
    console.log(`找到 ${employees.length} 名員工`);
    
    // 創建員工ID到姓名的映射
    const employeeMap = {};
    employees.forEach(emp => {
      employeeMap[emp._id.toString()] = emp.name;
    });
    
    // 按月份分組
    console.log('\n===== 按月份分組 =====');
    const recordsByMonth = {};
    for (let month = 1; month <= 12; month++) {
      recordsByMonth[month] = [];
    }
    
    // 分組記錄
    scheduleRecords.forEach(record => {
      const recordDate = new Date(record.date);
      const month = recordDate.getMonth() + 1; // 月份從0開始，所以+1
      if (recordsByMonth[month]) {
        recordsByMonth[month].push(record);
      }
    });
    
    // 統計每個月的記錄數
    const monthResults = [];
    for (let month = 1; month <= 12; month++) {
      const monthRecords = recordsByMonth[month];
      const overtimeRecords = monthRecords.filter(record => record.leaveType === 'overtime');
      
      monthResults.push({
        month,
        totalRecords: monthRecords.length,
        overtimeRecords: overtimeRecords.length,
        hasData: monthRecords.length > 0,
        hasOvertimeData: overtimeRecords.length > 0
      });
      
      console.log(`${month}月: 找到 ${monthRecords.length} 條排班記錄，其中 ${overtimeRecords.length} 條加班記錄`);
    }
    
    // 檢查所有記錄的 leaveType 字段
    console.log('\n===== 檢查所有記錄的 leaveType 字段 =====');
    const recordsWithLeaveType = scheduleRecords.filter(record => record.leaveType !== undefined);
    const recordsWithoutLeaveType = scheduleRecords.filter(record => record.leaveType === undefined);
    const overtimeRecords = scheduleRecords.filter(record => record.leaveType === 'overtime');
    
    console.log(`總記錄數: ${scheduleRecords.length}`);
    console.log(`有 leaveType 字段的記錄數: ${recordsWithLeaveType.length}`);
    console.log(`沒有 leaveType 字段的記錄數: ${recordsWithoutLeaveType.length}`);
    console.log(`加班記錄數 (leaveType === 'overtime'): ${overtimeRecords.length}`);
    
    // 輸出所有加班記錄的詳細信息
    console.log('\n===== 所有加班記錄詳細信息 =====');
    if (overtimeRecords.length > 0) {
      overtimeRecords.forEach((record, index) => {
        const recordDate = new Date(record.date);
        const employeeId = record.employeeId.toString();
        const employeeName = employeeMap[employeeId] || '未知';
        
        console.log(`\n加班記錄 ${index + 1}:`);
        console.log(`  ID: ${record._id}`);
        console.log(`  日期: ${formatDate(recordDate)} (${recordDate.getFullYear()}年${recordDate.getMonth() + 1}月${recordDate.getDate()}日)`);
        console.log(`  班次: ${record.shift}`);
        console.log(`  員工ID: ${employeeId}`);
        console.log(`  員工姓名: ${employeeName}`);
        console.log(`  leaveType: ${record.leaveType}`);
      });
    } else {
      console.log('沒有找到加班記錄');
    }
    
    // 如果有沒有 leaveType 字段的記錄，輸出示例
    if (recordsWithoutLeaveType.length > 0) {
      console.log('\n===== 沒有 leaveType 字段的記錄示例 =====');
      const example = recordsWithoutLeaveType[0];
      const recordDate = new Date(example.date);
      const employeeId = example.employeeId.toString();
      const employeeName = employeeMap[employeeId] || '未知';
      
      console.log(`  ID: ${example._id}`);
      console.log(`  日期: ${formatDate(recordDate)} (${recordDate.getFullYear()}年${recordDate.getMonth() + 1}月${recordDate.getDate()}日)`);
      console.log(`  班次: ${example.shift}`);
      console.log(`  員工ID: ${employeeId}`);
      console.log(`  員工姓名: ${employeeName}`);
    }
    
    // 保存結果到文件
    if (config.saveToFile) {
      const result = {
        totalRecords: scheduleRecords.length,
        overtimeRecords: overtimeRecords.length,
        monthResults,
        leaveTypeStats: {
          withLeaveType: recordsWithLeaveType.length,
          withoutLeaveType: recordsWithoutLeaveType.length
        },
        allOvertimeRecords: overtimeRecords.map(record => {
          const recordDate = new Date(record.date);
          const employeeId = record.employeeId.toString();
          const employeeName = employeeMap[employeeId] || '未知';
          
          return {
            id: record._id.toString(),
            date: formatDate(recordDate),
            month: recordDate.getMonth() + 1,
            shift: record.shift,
            employeeId: employeeId,
            employeeName: employeeName,
            leaveType: record.leaveType
          };
        })
      };
      
      fs.writeFileSync(config.outputFile, JSON.stringify(result, null, 2));
      console.log(`\n結果已保存到文件: ${config.outputFile}`);
    }
  } catch (error) {
    console.error('測試過程中發生錯誤:', error);
  } finally {
    // 關閉 MongoDB 連接
    if (client) {
      await client.close();
      console.log('已關閉 MongoDB 連接');
    }
  }
}

// 執行測試
testEmployeeSchedules()
  .then(() => console.log('測試完成'))
  .catch(err => console.error('測試失敗:', err));
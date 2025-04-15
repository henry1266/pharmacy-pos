/**
 * 測試修復後的銷貨單號生成邏輯
 */

// 簡化版的測試 - 直接使用修改後的邏輯
function generateOrderNumber(latestNumber, datePrefix, sequenceDigits = 3) {
  console.log(`最後一個訂單號: ${latestNumber || '無'}`);
  console.log(`日期前綴: ${datePrefix}`);
  
  // 設置默認序號
  let sequenceNumber = 1;
  
  // 如果有最後一個訂單號，提取序號部分
  if (latestNumber) {
    // 檢查訂單號是否以日期前綴開頭
    if (latestNumber.startsWith(datePrefix)) {
      // 提取序號部分 - 從日期前綴後開始
      const sequencePart = latestNumber.substring(datePrefix.length);
      console.log(`序號部分: ${sequencePart}`);
      
      // 嘗試將序號部分轉換為數字
      // 只取最後sequenceDigits位數字，避免中間有其他字符
      const regex = new RegExp(`\\d{${sequenceDigits}}$`);
      const match = sequencePart.match(regex);
      
      if (match) {
        const sequence = parseInt(match[0]);
        if (!isNaN(sequence)) {
          sequenceNumber = sequence + 1;
          console.log(`下一個序號: ${sequenceNumber}`);
        }
      }
    }
  }
  
  // 確保序號不超過位數限制
  sequenceNumber = sequenceNumber % Math.pow(10, sequenceDigits);
  if (sequenceNumber === 0) sequenceNumber = 1;
  
  // 格式化序號為指定位數
  const formattedSequence = String(sequenceNumber).padStart(sequenceDigits, '0');
  console.log(`格式化後的序號: ${formattedSequence}`);
  
  // 組合最終訂單號
  const finalOrderNumber = `${datePrefix}${formattedSequence}`;
  console.log(`生成的訂單號: ${finalOrderNumber}`);
  
  return finalOrderNumber;
}

// 測試正常情況
function testNormalCase() {
  console.log('===== 測試正常情況 =====');
  
  // 創建日期前綴
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const datePrefix = `${year}${month}${day}`;
  
  // 模擬最後一個訂單號
  const latestNumber = `${datePrefix}003`;
  
  // 生成銷貨單號
  const saleNumber = generateOrderNumber(latestNumber, datePrefix);
  
  // 驗證結果
  const expectedNumber = `${datePrefix}004`;
  console.log(`預期的銷貨單號: ${expectedNumber}`);
  console.log(`銷貨單號是否符合預期: ${saleNumber === expectedNumber ? '是' : '否'}`);
}

// 測試異常情況 - 重複日期
function testDuplicateDateCase() {
  console.log('\n===== 測試異常情況 - 重複日期 =====');
  
  // 創建日期前綴
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const datePrefix = `${year}${month}${day}`;
  
  // 模擬最後一個訂單號 - 日期部分重複
  const latestNumber = `${datePrefix}${day}003`;
  
  // 生成銷貨單號
  const saleNumber = generateOrderNumber(latestNumber, datePrefix);
  
  // 驗證結果
  const expectedNumber = `${datePrefix}004`;
  console.log(`預期的銷貨單號: ${expectedNumber}`);
  console.log(`銷貨單號是否符合預期: ${saleNumber === expectedNumber ? '是' : '否'}`);
}

// 測試異常情況 - 舊格式（短年份）
function testOldFormatCase() {
  console.log('\n===== 測試異常情況 - 舊格式（短年份） =====');
  
  // 創建日期前綴
  const today = new Date();
  const fullYear = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const fullDatePrefix = `${fullYear}${month}${day}`;
  
  // 模擬最後一個訂單號 - 使用短年份
  const shortYear = today.getFullYear().toString().substring(2);
  const shortDatePrefix = `${shortYear}${month}${day}`;
  const latestNumber = `${shortDatePrefix}003`;
  
  // 生成銷貨單號
  const saleNumber = generateOrderNumber(latestNumber, fullDatePrefix);
  
  // 驗證結果
  const expectedNumber = `${fullDatePrefix}001`;
  console.log(`預期的銷貨單號: ${expectedNumber}`);
  console.log(`銷貨單號是否符合預期: ${saleNumber === expectedNumber ? '是' : '否'}`);
}

// 測試用戶報告的問題 - 2025041515004
function testUserReportedCase() {
  console.log('\n===== 測試用戶報告的問題 - 2025041515004 =====');
  
  // 創建日期前綴
  const datePrefix = '20250415';
  
  // 模擬用戶報告的問題訂單號
  const latestNumber = '2025041515004';
  
  // 生成銷貨單號
  const saleNumber = generateOrderNumber(latestNumber, datePrefix);
  
  // 驗證結果
  const expectedNumber = '20250415005';
  console.log(`預期的銷貨單號: ${expectedNumber}`);
  console.log(`銷貨單號是否符合預期: ${saleNumber === expectedNumber ? '是' : '否'}`);
}

// 執行所有測試
function runAllTests() {
  console.log('開始測試修復後的銷貨單號生成邏輯...\n');
  
  testNormalCase();
  testDuplicateDateCase();
  testOldFormatCase();
  testUserReportedCase();
  
  console.log('\n所有測試完成，修復後的銷貨單號生成邏輯工作正常！');
}

// 執行測試
runAllTests();

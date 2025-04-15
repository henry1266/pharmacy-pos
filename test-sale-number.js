// 測試銷貨單號生成邏輯
const testSaleNumberGeneration = () => {
  // 模擬不同的情況
  
  // 測試用例1: 正常情況 - 當前最新單號為 20250415001，應生成 20250415002
  const testCase1 = {
    datePrefix: '20250415',
    latestSaleNumber: '20250415001'
  };
  
  // 測試用例2: 序號進位 - 當前最新單號為 20250415999，應生成 20250415000
  const testCase2 = {
    datePrefix: '20250415',
    latestSaleNumber: '20250415999'
  };
  
  // 測試用例3: 無法解析序號 - 當前最新單號格式不正確，應從001開始
  const testCase3 = {
    datePrefix: '20250415',
    latestSaleNumber: '2025041501' // 格式不正確
  };
  
  // 測試函數
  const generateNextNumber = (datePrefix, latestSaleNumber) => {
    let finalSaleNumber;
    
    if (latestSaleNumber) {
      // 提取序號部分並加1 - 使用正則表達式確保正確提取序號
      const match = latestSaleNumber.match(/^(\d{8})(\d{3})$/);
      if (match && match[2]) {
        const sequence = parseInt(match[2]) + 1;
        finalSaleNumber = `${datePrefix}${sequence.toString().padStart(3, '0')}`;
      } else {
        // 如果無法正確解析序號，從001開始
        finalSaleNumber = `${datePrefix}001`;
      }
    } else {
      // 如果沒有最新單號，從001開始
      finalSaleNumber = `${datePrefix}001`;
    }
    
    return finalSaleNumber;
  };
  
  // 執行測試
  console.log('測試用例1 結果:', generateNextNumber(testCase1.datePrefix, testCase1.latestSaleNumber));
  console.log('測試用例2 結果:', generateNextNumber(testCase2.datePrefix, testCase2.latestSaleNumber));
  console.log('測試用例3 結果:', generateNextNumber(testCase3.datePrefix, testCase3.latestSaleNumber));
};

// 執行測試
testSaleNumberGeneration();

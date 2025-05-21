const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

// 測試配置
const API_BASE_URL = 'http://localhost:5000/api';
const CSV_FILE_PATH = path.join(__dirname, '../test/csv/medicine_sample_with_date.csv');

// 測試出貨單號生成API
async function testGenerateOrderNumber() {
  try {
    console.log('測試出貨單號生成API...');
    const response = await axios.get(`${API_BASE_URL}/shipping-orders/generate-number`);
    console.log('成功生成出貨單號:', response.data);
    return response.data.orderNumber;
  } catch (error) {
    console.error('出貨單號生成失敗:', error.message);
    if (error.response) {
      console.error('錯誤詳情:', error.response.data);
    }
    throw error;
  }
}

// 測試藥品CSV匯入API
async function testMedicineCsvImport(orderNumber) {
  try {
    console.log('測試藥品CSV匯入API...');
    
    // 檢查CSV文件是否存在
    if (!fs.existsSync(CSV_FILE_PATH)) {
      throw new Error(`CSV文件不存在: ${CSV_FILE_PATH}`);
    }
    
    // 準備表單數據
    const formData = new FormData();
    formData.append('file', fs.createReadStream(CSV_FILE_PATH));
    formData.append('orderNumber', orderNumber || '');
    
    // 添加預設供應商信息
    const defaultSupplier = {
      _id: "test_supplier_id",
      name: "測試供應商",
      shortCode: "TEST"
    };
    formData.append('defaultSupplier', JSON.stringify(defaultSupplier));
    
    // 發送請求
    const response = await axios.post(
      `${API_BASE_URL}/shipping-orders/import/medicine`, 
      formData, 
      {
        headers: {
          ...formData.getHeaders()
        }
      }
    );
    
    console.log('CSV匯入成功:', response.data);
    
    // 驗證paymentStatus是否為"已收款"
    if (response.data.shippingOrder.paymentStatus === '已收款') {
      console.log('✅ paymentStatus正確設置為"已收款"');
    } else {
      console.error('❌ paymentStatus未正確設置，當前值:', response.data.shippingOrder.paymentStatus);
    }
    
    // 驗證訂單號格式是否正確
    const orderNumberPattern = /^D\d{8}\d{3}$/;
    if (orderNumberPattern.test(response.data.shippingOrder.orderNumber)) {
      console.log('✅ 訂單號格式正確:', response.data.shippingOrder.orderNumber);
    } else {
      console.error('❌ 訂單號格式不正確:', response.data.shippingOrder.orderNumber);
    }
    
    return response.data;
  } catch (error) {
    console.error('CSV匯入失敗:', error.message);
    if (error.response) {
      console.error('錯誤詳情:', error.response.data);
    }
    throw error;
  }
}

// 執行測試
async function runTests() {
  try {
    console.log('開始API測試...');
    
    // 測試出貨單號生成
    const orderNumber = await testGenerateOrderNumber();
    console.log('生成的訂單號:', orderNumber);
    
    // 測試藥品CSV匯入
    await testMedicineCsvImport();
    
    console.log('所有測試完成!');
  } catch (error) {
    console.error('測試過程中發生錯誤:', error.message);
  }
}

// 執行測試
runTests();

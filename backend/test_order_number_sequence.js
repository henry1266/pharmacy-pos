const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

// 測試訂單號生成邏輯
async function testOrderNumberGeneration() {
  try {
    console.log('開始測試訂單號生成邏輯...');
    console.log('測試重點：確保嚴格使用CSV日期且序號連續不重複');
    
    // 準備表單數據
    const formData = new FormData();
    const filePath = path.join(__dirname, 'test/csv/medicine_sample_rocdate_test.csv');
    
    formData.append('file', fs.createReadStream(filePath));
    
    // 第一次匯入
    console.log('\n第一次匯入測試 - 應生成20250407001D');
    const response1 = await axios.post('http://localhost:5000/api/shipping-orders/import/medicine', formData, {
      headers: {
        ...formData.getHeaders()
      }
    });
    
    console.log('第一次匯入結果:', response1.data.shippingOrder.soid);
    
    // 第二次匯入
    console.log('\n第二次匯入測試 - 應生成20250407002D');
    const response2 = await axios.post('http://localhost:5000/api/shipping-orders/import/medicine', formData, {
      headers: {
        ...formData.getHeaders()
      }
    });
    
    console.log('第二次匯入結果:', response2.data.shippingOrder.soid);
    
    // 第三次匯入
    console.log('\n第三次匯入測試 - 應生成20250407003D');
    const response3 = await axios.post('http://localhost:5000/api/shipping-orders/import/medicine', formData, {
      headers: {
        ...formData.getHeaders()
      }
    });
    
    console.log('第三次匯入結果:', response3.data.shippingOrder.soid);
    
    // 驗證結果
    const orderNumber1 = response1.data.shippingOrder.soid;
    const orderNumber2 = response2.data.shippingOrder.soid;
    const orderNumber3 = response3.data.shippingOrder.soid;
    
    console.log('\n驗證結果:');
    console.log('訂單號1:', orderNumber1);
    console.log('訂單號2:', orderNumber2);
    console.log('訂單號3:', orderNumber3);
    
    // 檢查日期部分是否為20250407
    const datePattern = /^20250407\d{3}D$/;
    const isDateCorrect1 = datePattern.test(orderNumber1);
    const isDateCorrect2 = datePattern.test(orderNumber2);
    const isDateCorrect3 = datePattern.test(orderNumber3);
    
    console.log('\n日期檢查 (應為20250407):');
    console.log('訂單號1日期正確:', isDateCorrect1);
    console.log('訂單號2日期正確:', isDateCorrect2);
    console.log('訂單號3日期正確:', isDateCorrect3);
    
    // 檢查序號是否連續
    const sequence1 = parseInt(orderNumber1.substring(8, 11), 10);
    const sequence2 = parseInt(orderNumber2.substring(8, 11), 10);
    const sequence3 = parseInt(orderNumber3.substring(8, 11), 10);
    
    console.log('\n序號檢查 (應為連續遞增):');
    console.log('序號1:', sequence1);
    console.log('序號2:', sequence2);
    console.log('序號3:', sequence3);
    console.log('序號連續性檢查:', sequence2 === sequence1 + 1 && sequence3 === sequence2 + 1);
    
    // 總結
    if (isDateCorrect1 && isDateCorrect2 && isDateCorrect3 && 
        sequence2 === sequence1 + 1 && sequence3 === sequence2 + 1) {
      console.log('\n測試結果: 成功! 訂單號嚴格使用CSV日期且序號連續不重複');
    } else {
      console.log('\n測試結果: 失敗! 訂單號生成邏輯仍有問題');
    }
    
  } catch (error) {
    console.error('測試過程中出錯:', error.message);
    if (error.response) {
      console.error('API回應錯誤:', error.response.data);
    }
  }
}

// 執行測試
testOrderNumberGeneration();

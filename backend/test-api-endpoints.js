const axios = require('axios');
const path = require('path');

// 載入根目錄的 .env 文件
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// API 測試配置 - 從環境變數讀取
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api/accounting2';

// 測試用的登入憑證 - 從環境變數讀取
const TEST_CREDENTIALS = {
  username: process.env.TEST_USERNAME,
  password: process.env.TEST_PASSWORD
};

// 檢查必要的環境變數
if (!TEST_CREDENTIALS.username || !TEST_CREDENTIALS.password) {
  console.error('❌ 錯誤：請在 .env 文件中設定 TEST_USERNAME 和 TEST_PASSWORD');
  console.error('📋 範例 .env 配置：');
  console.error('   TEST_USERNAME=your_username');
  console.error('   TEST_PASSWORD=your_password');
  console.error('   BASE_URL=http://localhost:5000');
  console.error('   API_BASE_URL=http://localhost:5000/api/accounting2');
  process.exit(1);
}

console.log('🔧 測試配置：');
console.log('📊 BASE_URL:', BASE_URL);
console.log('📊 API_BASE_URL:', API_BASE_URL);
console.log('📊 TEST_USERNAME:', TEST_CREDENTIALS.username);
console.log('📊 密碼已設定:', TEST_CREDENTIALS.password ? '✅' : '❌');

let authToken = null;

// 登入並獲取 JWT Token
async function login() {
  try {
    console.log('🔐 正在登入...');
    const response = await axios.post(`${BASE_URL}/api/auth`, TEST_CREDENTIALS);
    
    if (response.data.success && response.data.data && response.data.data.token) {
      authToken = response.data.data.token;
      console.log('✅ 登入成功');
      console.log('📊 用戶:', response.data.data.user.username);
      console.log('📊 Token 前綴:', authToken.substring(0, 20) + '...');
      return true;
    } else {
      console.error('❌ 登入失敗:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ 登入請求失敗:', error.response?.data || error.message);
    return false;
  }
}

// 創建帶認證的 axios 實例
function createAuthenticatedAxios() {
  return axios.create({
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });
}

// 測試新的內嵌分錄 API 端點
async function testEmbeddedEntriesAPI() {
  try {
    console.log('🧪 開始測試內嵌分錄 API 端點...\n');
    
    // 先登入
    const loginSuccess = await login();
    if (!loginSuccess) {
      console.error('❌ 無法登入，終止測試');
      return;
    }
    
    const authAxios = createAuthenticatedAxios();
    
    // 測試 1: 獲取交易群組列表
    console.log('\n📋 測試 1: GET /transaction-groups-with-entries');
    try {
      const response = await authAxios.get(`${API_BASE_URL}/transaction-groups-with-entries`);
      console.log('✅ 獲取列表成功');
      console.log('📊 回應狀態:', response.status);
      console.log('📊 數據數量:', response.data.data ? response.data.data.length : 'N/A');
      
      if (response.data.data && response.data.data.length > 0) {
        const sample = response.data.data[0];
        console.log('📊 範例數據結構:', Object.keys(sample));
        if (sample.entries) {
          console.log('📊 內嵌分錄數量:', sample.entries.length);
        }
      }
    } catch (error) {
      console.error('❌ 獲取列表失敗:', error.response?.data || error.message);
    }
    
    // 測試 2: 創建新的交易群組（內嵌分錄）
    console.log('\n📋 測試 2: POST /transaction-groups-with-entries');
    const testTransactionGroup = {
      description: '測試內嵌分錄交易群組',
      transactionDate: new Date().toISOString(),
      entries: [
        {
          accountId: '507f1f77bcf86cd799439011', // 測試用帳戶 ID
          description: '測試借方分錄',
          debitAmount: 1000,
          creditAmount: 0,
          sequence: 1
        },
        {
          accountId: '507f1f77bcf86cd799439012', // 測試用帳戶 ID
          description: '測試貸方分錄',
          debitAmount: 0,
          creditAmount: 1000,
          sequence: 2
        }
      ]
    };
    
    let createdTransactionGroupId = null;
    try {
      const response = await authAxios.post(`${API_BASE_URL}/transaction-groups-with-entries`, testTransactionGroup);
      console.log('✅ 創建交易群組成功');
      console.log('📊 回應狀態:', response.status);
      console.log('📊 新建 ID:', response.data.data._id);
      console.log('📊 群組編號:', response.data.data.groupNumber);
      console.log('📊 內嵌分錄數量:', response.data.data.entries.length);
      createdTransactionGroupId = response.data.data._id;
    } catch (error) {
      console.error('❌ 創建交易群組失敗:', error.response?.data || error.message);
    }
    
    // 測試 3: 獲取單一交易群組
    if (createdTransactionGroupId) {
      console.log('\n📋 測試 3: GET /transaction-groups-with-entries/:id');
      try {
        const response = await authAxios.get(`${API_BASE_URL}/transaction-groups-with-entries/${createdTransactionGroupId}`);
        console.log('✅ 獲取單一交易群組成功');
        console.log('📊 回應狀態:', response.status);
        console.log('📊 交易群組 ID:', response.data.data._id);
        console.log('📊 描述:', response.data.data.description);
        console.log('📊 內嵌分錄數量:', response.data.data.entries.length);
        
        // 顯示分錄詳情
        response.data.data.entries.forEach((entry, index) => {
          console.log(`📊 分錄 ${index + 1}:`, {
            id: entry._id,
            description: entry.description,
            debit: entry.debitAmount,
            credit: entry.creditAmount,
            sequence: entry.sequence
          });
        });
      } catch (error) {
        console.error('❌ 獲取單一交易群組失敗:', error.response?.data || error.message);
      }
    }
    
    // 測試 4: 更新交易群組
    if (createdTransactionGroupId) {
      console.log('\n📋 測試 4: PUT /transaction-groups-with-entries/:id');
      const updateData = {
        description: '更新後的測試內嵌分錄交易群組',
        entries: [
          {
            accountId: '507f1f77bcf86cd799439011',
            description: '更新後的借方分錄',
            debitAmount: 1500,
            creditAmount: 0,
            sequence: 1
          },
          {
            accountId: '507f1f77bcf86cd799439012',
            description: '更新後的貸方分錄',
            debitAmount: 0,
            creditAmount: 1500,
            sequence: 2
          }
        ]
      };
      
      try {
        const response = await authAxios.put(`${API_BASE_URL}/transaction-groups-with-entries/${createdTransactionGroupId}`, updateData);
        console.log('✅ 更新交易群組成功');
        console.log('📊 回應狀態:', response.status);
        console.log('📊 更新後描述:', response.data.data.description);
        console.log('📊 更新後分錄數量:', response.data.data.entries.length);
      } catch (error) {
        console.error('❌ 更新交易群組失敗:', error.response?.data || error.message);
      }
    }
    
    // 測試 5: 確認交易群組
    if (createdTransactionGroupId) {
      console.log('\n📋 測試 5: POST /transaction-groups-with-entries/:id/confirm');
      try {
        const response = await authAxios.post(`${API_BASE_URL}/transaction-groups-with-entries/${createdTransactionGroupId}/confirm`);
        console.log('✅ 確認交易群組成功');
        console.log('📊 回應狀態:', response.status);
        console.log('📊 確認狀態:', response.data.data.isConfirmed);
        console.log('📊 確認時間:', response.data.data.confirmedAt);
      } catch (error) {
        console.error('❌ 確認交易群組失敗:', error.response?.data || error.message);
      }
    }
    
    // 測試 6: 獲取可用資金來源
    console.log('\n📋 測試 6: GET /transaction-groups-with-entries/funding/available-sources');
    try {
      const response = await authAxios.get(`${API_BASE_URL}/transaction-groups-with-entries/funding/available-sources`);
      console.log('✅ 獲取可用資金來源成功');
      console.log('📊 回應狀態:', response.status);
      console.log('📊 可用資金來源數量:', response.data.data ? response.data.data.length : 'N/A');
    } catch (error) {
      console.error('❌ 獲取可用資金來源失敗:', error.response?.data || error.message);
    }
    
    // 測試 7: 借貸平衡驗證測試
    console.log('\n📋 測試 7: 借貸平衡驗證測試');
    const unbalancedData = {
      description: '不平衡測試交易群組',
      transactionDate: new Date().toISOString(),
      entries: [
        {
          accountId: '507f1f77bcf86cd799439011',
          description: '不平衡借方分錄',
          debitAmount: 1000,
          creditAmount: 0,
          sequence: 1
        },
        {
          accountId: '507f1f77bcf86cd799439012',
          description: '不平衡貸方分錄',
          debitAmount: 0,
          creditAmount: 500, // 故意不平衡
          sequence: 2
        }
      ]
    };
    
    try {
      const response = await authAxios.post(`${API_BASE_URL}/transaction-groups-with-entries`, unbalancedData);
      console.log('❌ 借貸平衡驗證失敗 - 應該要拒絕不平衡的交易');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('借貸不平衡')) {
        console.log('✅ 借貸平衡驗證成功 - 正確拒絕了不平衡的交易');
        console.log('📊 錯誤訊息:', error.response.data.message);
      } else {
        console.error('❌ 借貸平衡驗證測試失敗:', error.response?.data || error.message);
      }
    }
    
    // 測試 8: 刪除交易群組（清理測試數據）
    if (createdTransactionGroupId) {
      console.log('\n📋 測試 8: DELETE /transaction-groups-with-entries/:id');
      try {
        const response = await authAxios.delete(`${API_BASE_URL}/transaction-groups-with-entries/${createdTransactionGroupId}`);
        console.log('✅ 刪除交易群組成功');
        console.log('📊 回應狀態:', response.status);
        console.log('📊 刪除訊息:', response.data.message);
      } catch (error) {
        console.error('❌ 刪除交易群組失敗:', error.response?.data || error.message);
      }
    }
    
    console.log('\n🎉 內嵌分錄 API 端點測試完成！');
    
  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
  }
}

// 執行測試
testEmbeddedEntriesAPI().catch(console.error);
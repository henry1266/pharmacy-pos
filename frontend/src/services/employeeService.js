import axios from 'axios';

const API_URL = '/api/employees';

/**
 * 獲取所有員工資訊
 * @param {object} params - 查詢參數
 * @param {number} [params.page] - 頁碼
 * @param {number} [params.limit] - 每頁筆數
 * @param {string} [params.search] - 搜尋關鍵字
 * @param {string} [params.sortField] - 排序欄位
 * @param {string} [params.sortOrder] - 排序方式 (asc/desc)
 * @returns {Promise<object>} 員工資訊列表
 */
export const getEmployees = async (params = {}) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未登入或權限不足');
    }

    const config = {
      headers: {
        'x-auth-token': token
      },
      params
    };

    const response = await axios.get(API_URL, config);
    return response.data;
  } catch (err) {
    console.error('獲取員工資訊失敗:', err);
    throw new Error(
      err.response?.data?.msg || 
      '獲取員工資訊失敗，請稍後再試'
    );
  }
};

/**
 * 獲取單一員工資訊
 * @param {string} id - 員工ID
 * @returns {Promise<object>} 員工資訊
 */
export const getEmployee = async (id) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未登入或權限不足');
    }

    const config = {
      headers: {
        'x-auth-token': token
      }
    };

    const response = await axios.get(`${API_URL}/${id}`, config);
    return response.data;
  } catch (err) {
    console.error('獲取員工資訊失敗:', err);
    throw new Error(
      err.response?.data?.msg || 
      '獲取員工資訊失敗，請稍後再試'
    );
  }
};

/**
 * 獲取所有員工資訊及其帳號狀態
 * 這個方法會獲取所有員工，並檢查每個員工是否有關聯的帳號
 * @returns {Promise<Array>} 員工資訊列表，包含帳號狀態
 */
export const getEmployeesWithAccountStatus = async () => {
  try {
    // 獲取所有員工
    const { employees } = await getEmployees({ limit: 1000 }); // 獲取所有員工，設置較大的limit
    
    // 獲取所有用戶帳號
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未登入或權限不足');
    }
    
    // 獲取所有員工的帳號狀態
    const employeesWithAccounts = [];
    
    // 逐個處理員工，避免並行請求可能導致的問題
    for (const employee of employees) {
      try {
        // 嘗試獲取員工帳號
        const response = await axios.get(`/api/employee-accounts/${employee._id}`, {
          headers: {
            'x-auth-token': token
          }
        });
        
        // 如果成功獲取帳號，將帳號資訊添加到員工資料中
        employeesWithAccounts.push({
          ...employee,
          account: response.data
        });
      } catch (error) {
        // 只有當錯誤是 404 Not Found（表示員工沒有帳號）時才處理
        if (error.response && error.response.status === 404) {
          employeesWithAccounts.push({
            ...employee,
            account: null
          });
        } else {
          // 其他錯誤需要記錄並重新拋出
          console.error(`獲取員工 ${employee.name} (${employee._id}) 帳號時發生錯誤:`, error);
          throw error;
        }
      }
    }
    
    return employeesWithAccounts;
  } catch (err) {
    console.error('獲取員工帳號狀態失敗:', err);
    throw new Error(
      err.response?.data?.msg ||
      '獲取員工帳號狀態失敗，請稍後再試'
    );
  }
};

const employeeService = {
  getEmployees,
  getEmployee,
  getEmployeesWithAccountStatus
};

export default employeeService;
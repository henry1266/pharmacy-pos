import { useState, useEffect } from 'react';
import testModeDataService from '../../../testMode/services/TestModeDataService';

/**
 * 測試模式 Hook
 * 
 * @description 處理儀表板的測試模式相關邏輯，包括測試模式狀態檢查和模擬數據處理
 * 
 * @returns {Object} 測試模式相關的狀態和函數
 * @property {boolean} isTestMode - 是否處於測試模式
 * @property {Function} getTestModeData - 根據實際數據和錯誤狀態獲取測試模式數據的函數
 * 
 * @example
 * ```tsx
 * const { isTestMode, getTestModeData } = useTestMode();
 * 
 * // 使用測試模式狀態
 * {isTestMode && <Typography>(測試模式)</Typography>}
 * 
 * // 獲取測試模式數據
 * const dashboardData = isTestMode 
 *   ? getTestModeData(actualDashboardData, actualError, 'dashboard')
 *   : actualDashboardData;
 * ```
 */
export const useTestMode = () => {
  const [isTestMode, setIsTestMode] = useState<boolean>(false);

  useEffect(() => {
    const testModeActive = localStorage.getItem('isTestMode') === 'true';
    setIsTestMode(testModeActive);
  }, []);

  /**
   * 獲取測試模式數據
   * 
   * @param {any} actualData - 實際數據
   * @param {any} error - 錯誤信息
   * @param {string} dataType - 數據類型，如 'dashboard', 'salesTrend', 'categorySales'
   * @returns {any} 根據數據類型返回相應的測試模式數據
   */
  const getTestModeData = (actualData: any, error: any, dataType: string): any => {
    switch (dataType) {
      case 'dashboard':
        return testModeDataService.getDashboardData(actualData, error);
      case 'salesTrend':
        return testModeDataService.getSalesTrend(actualData, error);
      case 'categorySales':
        return testModeDataService.getCategorySales(actualData, error);
      default:
        return actualData;
    }
  };

  return {
    isTestMode,
    getTestModeData
  };
};

export default useTestMode;
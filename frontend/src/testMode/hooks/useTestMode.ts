import { useState, useEffect, useCallback } from 'react';
import TestModeService from '../services/TestModeService';
import type { TestModeState, TestModeLoginResult } from '../types/TestModeTypes';

/**
 * 測試模式 React Hook
 * 提供測試模式相關的狀態和操作
 */
const useTestMode = () => {
  const [state, setState] = useState<TestModeState>({
    isTestMode: false,
    isTestModeEnabled: TestModeService.isEnabled()
  });

  const [loading, setLoading] = useState<boolean>(false);

  // 初始化時檢查測試模式狀態
  useEffect(() => {
    const isInTestSession = TestModeService.isInTestModeSession();
    setState(prev => ({
      ...prev,
      isTestMode: isInTestSession
    }));
  }, []);

  /**
   * 切換測試模式狀態
   */
  const toggleTestMode = useCallback((enabled: boolean) => {
    setState(prev => ({
      ...prev,
      isTestMode: enabled
    }));
  }, []);

  /**
   * 執行測試模式登入
   */
  const performTestLogin = useCallback(async (): Promise<TestModeLoginResult> => {
    if (!state.isTestModeEnabled) {
      throw new Error('測試模式未啟用');
    }

    setLoading(true);
    try {
      const result = await TestModeService.performTestLogin();
      setState(prev => ({
        ...prev,
        isTestMode: true
      }));
      return result;
    } finally {
      setLoading(false);
    }
  }, [state.isTestModeEnabled]);

  /**
   * 執行測試模式登出
   */
  const performTestLogout = useCallback(() => {
    TestModeService.performTestLogout();
    setState(prev => ({
      ...prev,
      isTestMode: false
    }));
  }, []);

  /**
   * 檢查是否應該跳過資料庫操作
   */
  const shouldSkipDatabaseOperations = useCallback((): boolean => {
    return TestModeService.shouldSkipDatabaseOperations();
  }, []);

  /**
   * 獲取模擬 API 響應
   */
  const getMockApiResponse = useCallback((endpoint: string, method: string = 'GET'): any => {
    return TestModeService.getMockApiResponse(endpoint, method);
  }, []);

  return {
    // 狀態
    isTestMode: state.isTestMode,
    isTestModeEnabled: state.isTestModeEnabled,
    loading,

    // 操作
    toggleTestMode,
    performTestLogin,
    performTestLogout,
    shouldSkipDatabaseOperations,
    getMockApiResponse,

    // 服務實例（用於高級用法）
    testModeService: TestModeService
  };
};

export default useTestMode;
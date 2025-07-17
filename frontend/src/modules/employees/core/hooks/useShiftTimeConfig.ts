/**
 * 班次時間配置管理 Hook
 * 提供班次時間配置的獲取、創建、更新和刪除功能
 */

import { useState, useCallback, useEffect } from 'react';
import { shiftTimeConfigService } from '../shiftTimeConfigService';
import type {
  ShiftTimeConfig,
  ShiftTimeConfigData,
  ShiftTimeConfigUpdateData,
  ShiftTimesMap
} from '../shiftTimeConfigService';

/**
 * 班次時間配置管理 Hook
 */
export const useShiftTimeConfig = () => {
  const [configs, setConfigs] = useState<ShiftTimeConfig[]>([]);
  const [shiftTimesMap, setShiftTimesMap] = useState<ShiftTimesMap>({
    morning: { start: '08:30', end: '12:00' },
    afternoon: { start: '15:00', end: '18:00' },
    evening: { start: '19:00', end: '20:30' }
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 獲取所有班次時間配置
   */
  const fetchConfigs = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await shiftTimeConfigService.getShiftTimeConfigs();
      setConfigs(data);
      
      // 同時更新班次時間映射
      const timesMap = await shiftTimeConfigService.getShiftTimesMap();
      setShiftTimesMap(timesMap);
    } catch (err: any) {
      setError(err.response?.data?.message ?? '獲取班次時間配置失敗');
      console.error('獲取班次時間配置失敗:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 獲取特定班次的時間配置
   * @param {string} shift - 班次類型
   * @returns {Promise<ShiftTimeConfig>} - 班次時間配置
   */
  const fetchConfig = useCallback(async (shift: 'morning' | 'afternoon' | 'evening'): Promise<ShiftTimeConfig> => {
    setLoading(true);
    setError(null);
    try {
      const config = await shiftTimeConfigService.getShiftTimeConfig(shift);
      return config;
    } catch (err: any) {
      setError(err.response?.data?.message ?? '獲取班次時間配置失敗');
      console.error('獲取班次時間配置失敗:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 創建或更新班次時間配置
   * @param {ShiftTimeConfigData} configData - 班次時間配置數據
   * @returns {Promise<ShiftTimeConfig>} - 創建或更新的班次時間配置
   */
  const createOrUpdateConfig = useCallback(async (configData: ShiftTimeConfigData): Promise<ShiftTimeConfig> => {
    setLoading(true);
    setError(null);
    try {
      const newConfig = await shiftTimeConfigService.createOrUpdateShiftTimeConfig(configData);
      
      // 更新本地狀態
      setConfigs(prev => {
        const existingIndex = prev.findIndex(config => config.shift === configData.shift);
        if (existingIndex >= 0) {
          // 更新現有配置
          const updated = [...prev];
          updated[existingIndex] = newConfig;
          return updated;
        } else {
          // 添加新配置
          return [...prev, newConfig];
        }
      });

      // 更新班次時間映射
      setShiftTimesMap(prev => ({
        ...prev,
        [configData.shift]: {
          start: configData.startTime,
          end: configData.endTime
        }
      }));

      return newConfig;
    } catch (err: any) {
      setError(err.response?.data?.message ?? '創建或更新班次時間配置失敗');
      console.error('創建或更新班次時間配置失敗:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 更新特定班次的時間配置
   * @param {string} shift - 班次類型
   * @param {ShiftTimeConfigUpdateData} updateData - 更新數據
   * @returns {Promise<ShiftTimeConfig>} - 更新後的班次時間配置
   */
  const updateConfig = useCallback(async (
    shift: 'morning' | 'afternoon' | 'evening',
    updateData: ShiftTimeConfigUpdateData
  ): Promise<ShiftTimeConfig> => {
    setLoading(true);
    setError(null);
    try {
      const updatedConfig = await shiftTimeConfigService.updateShiftTimeConfig(shift, updateData);
      
      // 更新本地狀態
      setConfigs(prev => 
        prev.map(config => 
          config.shift === shift ? updatedConfig : config
        )
      );

      // 如果更新了時間，同時更新班次時間映射
      if (updateData.startTime || updateData.endTime) {
        setShiftTimesMap(prev => ({
          ...prev,
          [shift]: {
            start: updateData.startTime || prev[shift].start,
            end: updateData.endTime || prev[shift].end
          }
        }));
      }

      return updatedConfig;
    } catch (err: any) {
      setError(err.response?.data?.message ?? '更新班次時間配置失敗');
      console.error('更新班次時間配置失敗:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 停用班次時間配置
   * @param {string} shift - 班次類型
   * @returns {Promise<any>} - 停用結果
   */
  const deactivateConfig = useCallback(async (shift: 'morning' | 'afternoon' | 'evening'): Promise<any> => {
    setLoading(true);
    setError(null);
    try {
      const result = await shiftTimeConfigService.deactivateShiftTimeConfig(shift);
      
      // 更新本地狀態
      setConfigs(prev => 
        prev.map(config => 
          config.shift === shift ? { ...config, isActive: false } : config
        )
      );

      return result;
    } catch (err: any) {
      setError(err.response?.data?.message ?? '停用班次時間配置失敗');
      console.error('停用班次時間配置失敗:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 獲取班次時間映射
   */
  const refreshShiftTimesMap = useCallback(async (): Promise<void> => {
    try {
      const timesMap = await shiftTimeConfigService.getShiftTimesMap();
      setShiftTimesMap(timesMap);
    } catch (err: any) {
      console.error('獲取班次時間映射失敗:', err);
    }
  }, []);

  /**
   * 計算班次工時
   * @param {string} shift - 班次類型
   * @returns {number} - 工時數（小時）
   */
  const calculateShiftHours = useCallback((shift: 'morning' | 'afternoon' | 'evening'): number => {
    const { start, end } = shiftTimesMap[shift];
    return shiftTimeConfigService.calculateShiftHours(start, end);
  }, [shiftTimesMap]);

  /**
   * 獲取班次的開始和結束時間
   * @param {string} shift - 班次類型
   * @returns {{ start: string; end: string }} - 班次時間
   */
  const getShiftTimes = useCallback((shift: 'morning' | 'afternoon' | 'evening'): { start: string; end: string } => {
    return shiftTimesMap[shift];
  }, [shiftTimesMap]);

  /**
   * 驗證時間格式
   * @param {string} time - 時間字串
   * @returns {boolean} - 是否為有效格式
   */
  const validateTimeFormat = useCallback((time: string): boolean => {
    return shiftTimeConfigService.isValidTimeFormat(time);
  }, []);

  /**
   * 驗證時間範圍
   * @param {string} startTime - 開始時間
   * @param {string} endTime - 結束時間
   * @returns {boolean} - 時間範圍是否有效
   */
  const validateTimeRange = useCallback((startTime: string, endTime: string): boolean => {
    return shiftTimeConfigService.isValidTimeRange(startTime, endTime);
  }, []);

  // 初始化時獲取配置
  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  return {
    configs,
    shiftTimesMap,
    loading,
    error,
    fetchConfigs,
    fetchConfig,
    createOrUpdateConfig,
    updateConfig,
    deactivateConfig,
    refreshShiftTimesMap,
    calculateShiftHours,
    getShiftTimes,
    validateTimeFormat,
    validateTimeRange
  };
};

export default useShiftTimeConfig;
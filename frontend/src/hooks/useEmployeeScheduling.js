import { useState, useCallback } from 'react';
import { 
  getSchedules, 
  getSchedulesByDate, 
  createSchedule, 
  updateSchedule, 
  deleteSchedule 
} from '../services/employeeScheduleService';

/**
 * 員工排班管理 Hook
 * 提供排班資料的獲取、創建、更新和刪除功能
 */
const useEmployeeScheduling = () => {
  const [schedules, setSchedules] = useState([]);
  const [schedulesGroupedByDate, setSchedulesGroupedByDate] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * 獲取指定日期範圍內的排班資料
   * @param {string} startDate - 開始日期 (YYYY-MM-DD)
   * @param {string} endDate - 結束日期 (YYYY-MM-DD)
   * @param {string} employeeId - 員工ID (可選)
   */
  const fetchSchedules = useCallback(async (startDate, endDate, employeeId = null) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSchedules(startDate, endDate, employeeId);
      setSchedules(data);
    } catch (err) {
      setError(err.response?.data?.msg || '獲取排班資料失敗');
      console.error('獲取排班資料失敗:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 獲取按日期分組的排班資料
   * @param {string} startDate - 開始日期 (YYYY-MM-DD)
   * @param {string} endDate - 結束日期 (YYYY-MM-DD)
   */
  const fetchSchedulesByDate = useCallback(async (startDate, endDate) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSchedulesByDate(startDate, endDate);
      setSchedulesGroupedByDate(data);
    } catch (err) {
      setError(err.response?.data?.msg || '獲取排班資料失敗');
      console.error('獲取排班資料失敗:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 創建新的排班
   * @param {Object} scheduleData - 排班資料
   * @returns {Promise} - 創建的排班資料
   */
  const addSchedule = useCallback(async (scheduleData) => {
    setLoading(true);
    setError(null);
    try {
      const newSchedule = await createSchedule(scheduleData);
      setSchedules(prev => [...prev, newSchedule]);
      return newSchedule;
    } catch (err) {
      setError(err.response?.data?.msg || '創建排班失敗');
      console.error('創建排班失敗:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 更新排班
   * @param {string} id - 排班ID
   * @param {Object} scheduleData - 排班資料
   * @returns {Promise} - 更新後的排班資料
   */
  const editSchedule = useCallback(async (id, scheduleData) => {
    setLoading(true);
    setError(null);
    try {
      const updatedSchedule = await updateSchedule(id, scheduleData);
      setSchedules(prev => 
        prev.map(schedule => 
          schedule._id === id ? updatedSchedule : schedule
        )
      );
      return updatedSchedule;
    } catch (err) {
      setError(err.response?.data?.msg || '更新排班失敗');
      console.error('更新排班失敗:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 刪除排班
   * @param {string} id - 排班ID
   * @returns {Promise} - 刪除結果
   */
  const removeSchedule = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const result = await deleteSchedule(id);
      setSchedules(prev => prev.filter(schedule => schedule._id !== id));
      return result;
    } catch (err) {
      setError(err.response?.data?.msg || '刪除排班失敗');
      console.error('刪除排班失敗:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    schedules,
    schedulesGroupedByDate,
    loading,
    error,
    fetchSchedules,
    fetchSchedulesByDate,
    addSchedule,
    editSchedule,
    removeSchedule
  };
};

export default useEmployeeScheduling;
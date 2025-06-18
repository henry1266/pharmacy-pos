import { useMemo } from 'react';

/**
 * 工時計算 Hook
 * 處理員工排班數據的工時統計計算，消除 Scheduling 組件中的複雜計算邏輯
 */
const useWorkHoursCalculation = (schedulesGroupedByDate) => {
  // 班次時間定義
  const shiftTimes = {
    morning: { start: '08:30', end: '12:00' },
    afternoon: { start: '15:00', end: '18:00' },
    evening: { start: '19:00', end: '20:30' }
  };

  // 計算班次工時
  const calculateShiftHours = (shift) => {
    const { start, end } = shiftTimes[shift];
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;
    
    return (endTimeInMinutes - startTimeInMinutes) / 60;
  };

  // 計算每位員工的本月工時
  const calculateEmployeeMonthlyHours = useMemo(() => {
    const employeeHoursData = {
      hours: {},
      overtimeHours: {},
      personalLeaveHours: {},
      sickLeaveHours: {},
      names: {},
      totalSchedules: 0,
      sickLeaveCount: 0
    };

    // 處理單個排班記錄的工時計算
    const processScheduleHours = (schedule, dateStr, shift, shiftHours) => {
      const employeeId = schedule.employee._id;
      const employeeName = schedule.employee.name;
      
      // 初始化員工工時記錄
      if (!employeeHoursData.hours[employeeId]) {
        employeeHoursData.hours[employeeId] = 0;
        employeeHoursData.overtimeHours[employeeId] = 0;
        employeeHoursData.personalLeaveHours[employeeId] = 0;
        employeeHoursData.sickLeaveHours[employeeId] = 0;
        employeeHoursData.names[employeeId] = employeeName;
      }
      
      // 根據 leaveType 進行分類
      if (schedule.leaveType === 'overtime') {
        employeeHoursData.overtimeHours[employeeId] += shiftHours;
      } else if (schedule.leaveType === 'personal') {
        employeeHoursData.personalLeaveHours[employeeId] += shiftHours;
      } else if (schedule.leaveType === 'sick') {
        employeeHoursData.sickLeaveHours[employeeId] += shiftHours;
        employeeHoursData.sickLeaveCount++;
      } else {
        employeeHoursData.hours[employeeId] += shiftHours;
      }
      
      employeeHoursData.totalSchedules++;
    };

    // 處理特定日期的所有班次排班
    const processDateSchedules = (dateStr, schedules) => {
      ['morning', 'afternoon', 'evening'].forEach(shift => {
        if (schedules[shift] && schedules[shift].length > 0) {
          const shiftHours = calculateShiftHours(shift);
          schedules[shift].forEach(schedule => {
            processScheduleHours(schedule, dateStr, shift, shiftHours);
          });
        }
      });
    };

    // 遍歷所有排班記錄
    Object.keys(schedulesGroupedByDate).forEach(dateStr => {
      processDateSchedules(dateStr, schedulesGroupedByDate[dateStr]);
    });
    
    // 將結果轉換為數組格式
    return Object.keys(employeeHoursData.names).map(employeeId => {
      const hours = employeeHoursData.hours[employeeId] || 0;
      const overtimeHours = employeeHoursData.overtimeHours[employeeId] || 0;
      const personalLeaveHours = employeeHoursData.personalLeaveHours[employeeId] || 0;
      const sickLeaveHours = employeeHoursData.sickLeaveHours[employeeId] || 0;
      
      return {
        employeeId,
        name: employeeHoursData.names[employeeId],
        hours: hours.toFixed(1),
        overtimeHours: overtimeHours.toFixed(1),
        personalLeaveHours: personalLeaveHours.toFixed(1),
        sickLeaveHours: sickLeaveHours.toFixed(1)
      };
    }).sort((a, b) => parseFloat(b.hours) - parseFloat(a.hours));
  }, [schedulesGroupedByDate]);

  return {
    calculateEmployeeMonthlyHours,
    calculateShiftHours
  };
};

export default useWorkHoursCalculation;
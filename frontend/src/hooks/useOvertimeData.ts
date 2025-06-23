import { useMemo, useCallback } from 'react';
import { Employee } from '@pharmacy-pos/shared/types/entities';
import { OvertimeRecord } from '../services/overtimeRecordService';

/**
 * 加班狀態類型
 */
type OvertimeStatus = 'pending' | 'approved' | 'rejected';

/**
 * 排班系統加班記錄介面
 */
interface ScheduleOvertimeRecord {
  _id: string;
  date: string | Date;
  shift: 'morning' | 'afternoon' | 'evening';
  employee?: {
    _id: string;
    name: string;
    [key: string]: any;
  };
  employeeId?: {
    _id: string;
    name: string;
    [key: string]: any;
  };
  leaveType?: string;
  [key: string]: any;
}

/**
 * 簡化的員工介面，用於加班數據處理
 */
interface OvertimeEmployee {
  _id: string;
  name: string;
  position?: string;
  department?: string;
  [key: string]: any;
}

/**
 * 排班系統加班記錄集合介面
 */
interface ScheduleOvertimeRecords {
  [employeeId: string]: ScheduleOvertimeRecord[];
}

/**
 * 統計數據介面
 */
interface SummaryData {
  employeeId: string;
  employeeName?: string;
  [key: string]: any;
}

/**
 * 處理後的加班記錄介面
 */
interface ProcessedOvertimeData {
  [employeeId: string]: {
    employee: OvertimeEmployee;
    records: OvertimeRecord[];
    independentHours: number;
    scheduleHours: number;
    totalHours: number;
    scheduleRecords: ScheduleOvertimeRecord[];
    latestDate: Date;
  };
}

/**
 * 合併記錄介面
 */
interface MergedRecord {
  id: string;
  type: 'independent' | 'schedule';
  date: Date;
  originalRecord: OvertimeRecord | ScheduleOvertimeRecord;
  hours: number;
  description: string;
  status: OvertimeStatus;
  shift?: string;
}

/**
 * 員工信息結果介面
 */
interface EmployeeInfoResult {
  employeeName: string;
  employeeObj: Employee | null;
}

/**
 * 加班數據處理 Hook
 * 統一處理加班記錄的數據邏輯，減少組件中的複雜計算
 */
const useOvertimeData = (
  overtimeRecords: OvertimeRecord[],
  scheduleOvertimeRecords: ScheduleOvertimeRecords,
  summaryData: SummaryData[],
  employees: Employee[],
  selectedMonth: number
) => {
  
  // 從員工列表中查找
  const findFromEmployeeList = useCallback((empId: string, employees: Employee[]): EmployeeInfoResult | null => {
    const matchingEmployee = employees.find(emp =>
      emp._id === empId || (typeof empId === 'string' && empId.includes(emp._id))
    );
    
    if (matchingEmployee) {
      return {
        employeeName: matchingEmployee.name,
        employeeObj: matchingEmployee
      };
    }
    
    return null;
  }, []);

  // 從排班記錄中查找
  const findFromScheduleRecords = useCallback((scheduleRecords: ScheduleOvertimeRecord[] | undefined): EmployeeInfoResult | null => {
    for (const record of scheduleRecords || []) {
      if (record.employeeId?.name) {
        return {
          employeeName: record.employeeId.name,
          employeeObj: record.employeeId as unknown as Employee
        };
      }
      if (record.employee?.name) {
        return {
          employeeName: record.employee.name,
          employeeObj: record.employee as unknown as Employee
        };
      }
    }
    return null;
  }, []);

  // 從統計數據中查找
  const findFromSummaryData = useCallback((empId: string, summaryData: SummaryData[]): string | null => {
    const matchingStat = Array.isArray(summaryData) ? summaryData.find(stat =>
      stat.employeeId === empId || (stat?.employeeName && empId.includes(stat.employeeName))
    ) : undefined;
    
    return matchingStat?.employeeName || null;
  }, []);

  // 從加班記錄中查找
  const findFromOvertimeRecords = useCallback((empId: string, overtimeRecords: OvertimeRecord[]): EmployeeInfoResult | null => {
    const matchingRecord = overtimeRecords.find(r =>
      (typeof r.employee === 'object' && r.employee?._id === empId) ||
      r.employeeId === empId
    );
    
    if (matchingRecord?.employee && typeof matchingRecord.employee === 'object') {
      return {
        employeeName: matchingRecord.employee.name,
        employeeObj: matchingRecord.employee as unknown as Employee
      };
    }
    
    return null;
  }, []);

  // 生成臨時員工名稱
  const generateTempEmployeeName = useCallback((selectedMonth: number): string => {
    const monthNum = selectedMonth + 1;
    const monthStr = monthNum < 10 ? `0${monthNum}` : monthNum.toString();
    return `員工${monthStr}`;
  }, []);

  // 員工查找邏輯
  const findEmployeeInfo = useCallback((
    empId: string,
    employees: Employee[],
    scheduleRecords: ScheduleOvertimeRecord[] | undefined,
    summaryData: SummaryData[],
    overtimeRecords: OvertimeRecord[],
    selectedMonth: number
  ): EmployeeInfoResult => {
    // 首先從員工列表中查找
    const employeeResult = findFromEmployeeList(empId, employees);
    if (employeeResult) {
      return employeeResult;
    }
    
    // 從排班記錄中查找
    const scheduleResult = findFromScheduleRecords(scheduleRecords);
    if (scheduleResult) {
      return scheduleResult;
    }
    
    // 從統計數據中查找
    const summaryName = findFromSummaryData(empId, summaryData);
    if (summaryName) {
      return { employeeName: summaryName, employeeObj: null };
    }
    
    // 從加班記錄中查找
    const overtimeResult = findFromOvertimeRecords(empId, overtimeRecords);
    if (overtimeResult) {
      return overtimeResult;
    }
    
    // 生成臨時名稱
    return {
      employeeName: generateTempEmployeeName(selectedMonth),
      employeeObj: null
    };
  }, [findFromEmployeeList, findFromScheduleRecords, findFromSummaryData, findFromOvertimeRecords, generateTempEmployeeName]);

  // 從統計數據處理員工
  const processEmployeesFromSummary = useCallback((initialGroups: ProcessedOvertimeData) => {
    (Array.isArray(summaryData) ? summaryData : []).forEach(stat => {
      if (stat.employeeId) {
        let employeeName = stat.employeeName || '';
        
        // 嘗試從員工列表中查找
        if (!employeeName) {
          const matchingEmployee = employees.find(emp => emp._id === stat.employeeId);
          if (matchingEmployee) {
            employeeName = matchingEmployee.name;
          }
        }
        
        // 嘗試從加班記錄中查找
        if (!employeeName) {
          const matchingRecord = overtimeRecords.find(r =>
            (typeof r.employee === 'object' && r.employee?._id === stat.employeeId) ||
            r.employeeId === stat.employeeId
          );
          
          if (matchingRecord?.employee && typeof matchingRecord.employee === 'object') {
            employeeName = matchingRecord.employee.name;
          }
        }
        
        // 生成臨時名稱
        if (!employeeName) {
          employeeName = generateTempEmployeeName(selectedMonth);
        }
        
        initialGroups[stat.employeeId] = {
          employee: {
            _id: stat.employeeId,
            name: employeeName,
            position: '員工',
            department: '員工'
          },
          records: [],
          independentHours: 0,
          scheduleHours: 0,
          totalHours: 0,
          scheduleRecords: [],
          latestDate: new Date(0)
        };
      }
    });
  }, [summaryData, employees, overtimeRecords, generateTempEmployeeName, selectedMonth]);

  // 從排班記錄處理員工
  const processEmployeesFromSchedule = useCallback((initialGroups: ProcessedOvertimeData) => {
    Object.keys(scheduleOvertimeRecords).forEach(empId => {
      if (!initialGroups[empId]) {
        const scheduleRecords = scheduleOvertimeRecords[empId];
        const { employeeName, employeeObj } = findEmployeeInfo(
          empId, employees, scheduleRecords, summaryData, overtimeRecords, selectedMonth
        );
        
        initialGroups[empId] = {
          employee: employeeObj ?? {
            _id: empId,
            name: employeeName,
            position: '員工',
            department: '員工'
          },
          records: [],
          independentHours: 0,
          scheduleHours: 0,
          totalHours: 0,
          scheduleRecords: [],
          latestDate: new Date(0)
        };
      }
    });
  }, [scheduleOvertimeRecords, findEmployeeInfo, employees, summaryData, overtimeRecords, selectedMonth]);

  // 處理獨立加班記錄
  const processIndependentOvertimeRecords = useCallback((initialGroups: ProcessedOvertimeData) => {
    overtimeRecords.forEach(record => {
      let employeeId: string;
      let employeeObj: any;
      
      if (typeof record.employee === 'object' && record.employee?._id) {
        employeeId = record.employee._id;
        employeeObj = record.employee;
      } else if (typeof record.employeeId === 'string') {
        employeeId = record.employeeId;
        // 嘗試從員工列表中找到對應的員工對象
        employeeObj = employees.find(emp => emp._id === employeeId) ?? {
          _id: employeeId,
          name: `員工${employeeId.slice(-4)}`,
          position: '員工'
        };
      } else {
        return; // 跳過無效記錄
      }
      
      if (!initialGroups[employeeId]) {
        initialGroups[employeeId] = {
          employee: employeeObj,
          records: [],
          independentHours: 0,
          scheduleHours: 0,
          totalHours: 0,
          scheduleRecords: [],
          latestDate: new Date(0)
        };
      }
      
      initialGroups[employeeId].records.push(record);
      initialGroups[employeeId].independentHours += record.hours;
      initialGroups[employeeId].totalHours += record.hours;
      
      const recordDate = new Date(record.date);
      if (recordDate > initialGroups[employeeId].latestDate) {
        initialGroups[employeeId].latestDate = recordDate;
      }
    });
  }, [overtimeRecords, employees]);

  // 處理加班記錄數據
  const processedOvertimeData = useMemo<ProcessedOvertimeData>(() => {
    const initialGroups: ProcessedOvertimeData = {};
    
    // 從統計數據中獲取員工ID
    processEmployeesFromSummary(initialGroups);
    
    // 從排班系統加班記錄中獲取員工ID
    processEmployeesFromSchedule(initialGroups);
    
    // 處理獨立加班記錄
    processIndependentOvertimeRecords(initialGroups);
    
    return initialGroups;
  }, [processEmployeesFromSummary, processEmployeesFromSchedule, processIndependentOvertimeRecords]);

  // 生成合併的記錄數據
  const generateMergedRecords = useCallback((
    group: ProcessedOvertimeData[string],
    employeeId: string
  ): MergedRecord[] => {
    // 準備獨立加班記錄
    const independentRecords: MergedRecord[] = group.records.map(record => ({
      id: `independent-${record._id}`,
      type: 'independent',
      date: new Date(record.date),
      originalRecord: record,
      hours: record.hours,
      description: record.description || '-',
      status: record.status || 'pending'
    }));
    
    // 準備排班系統加班記錄
    let scheduleRecords: MergedRecord[] = [];
    
    try {
      if (Array.isArray(scheduleOvertimeRecords?.[employeeId])) {
        scheduleRecords = scheduleOvertimeRecords[employeeId].map(record => {
          try {
            // 計算加班時數
            let hours: number;
            switch(record.shift) {
              case 'morning': hours = 3.5; break;
              case 'afternoon': hours = 3; break;
              case 'evening': hours = 1.5; break;
              default: hours = 0;
            }
            
            // 班次中文名稱
            const shiftName = {
              'morning': '早班 (08:30-12:00)',
              'afternoon': '中班 (15:00-18:00)',
              'evening': '晚班 (19:00-20:30)'
            }[record.shift] || `${record.shift || '未知班次'}`;
            
            // 確保日期是有效的
            let recordDate: Date;
            recordDate = new Date(record.date);
            if (isNaN(recordDate?.getTime())) {
              recordDate = new Date();
              console.warn(`無效的日期格式: ${record.date}，使用當前日期作為替代`);
            }
            
            const result: MergedRecord = {
              id: `schedule-${record._id || 'unknown'}`,
              type: 'schedule',
              date: recordDate,
              originalRecord: record,
              hours: hours,
              description: shiftName,
              status: 'approved' as 'pending' | 'approved' | 'rejected',
              shift: record.shift
            };
            return result;
          } catch (recordErr) {
            console.error(`處理排班記錄時出錯:`, recordErr, record);
            return null;
          }
        }).filter((item): item is MergedRecord => item !== null);
      }
    } catch (err) {
      console.error(`獲取員工 ${employeeId} 的排班加班記錄時出錯:`, err);
    }
    
    // 合併並按日期排序
    return [...independentRecords, ...scheduleRecords]
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [scheduleOvertimeRecords]);

  return {
    processedOvertimeData,
    findEmployeeInfo,
    generateMergedRecords
  };
};

export default useOvertimeData;
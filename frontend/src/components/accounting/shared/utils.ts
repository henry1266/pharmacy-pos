/**
 * 會計模組共用工具函數
 */

import { getMonth, parseISO, getDaysInMonth, getDate } from 'date-fns';
import { LocalAccountingRecord, MonthlyData, DailyData, ChartData } from './types';
import { MONTH_NAMES } from './constants';

/**
 * 通用資料處理函數
 */
export const processAccountingData = <T extends Record<string, any>>(
  data: LocalAccountingRecord[],
  initializer: () => T,
  aggregator: (totals: T, record: LocalAccountingRecord, date: Date) => void,
  categoryFilter?: string
): T => {
  // 初始化數據結構
  const totals = initializer();
  
  // 計算總額
  data.forEach(record => {
    const recordDate = parseISO(record.date);
    
    // 如果有類別過濾條件，只處理指定類別的項目
    if (categoryFilter) {
      record.items.forEach(item => {
        if (item.category === categoryFilter) {
          aggregator(totals, record, recordDate);
        }
      });
    } else {
      // 處理所有項目
      aggregator(totals, record, recordDate);
    }
  });
  
  return totals;
};

/**
 * 處理月度數據
 */
export const processMonthlyData = (
  data: LocalAccountingRecord[],
  categoryName?: string
): MonthlyData => {
  return processAccountingData<MonthlyData>(
    data,
    // 初始化函數
    () => {
      const totals: MonthlyData = {};
      for (let month = 0; month < 12; month++) {
        totals[month] = 0;
      }
      return totals;
    },
    // 聚合函數
    (totals, record, date) => {
      const month = getMonth(date);
      record.items.forEach(item => {
        if (!categoryName || item.category === categoryName) {
          totals[month] += item.amount;
        }
      });
    }
  );
};

/**
 * 處理日度數據
 */
export const processDailyData = (
  data: LocalAccountingRecord[],
  currentYear: number,
  categoryName?: string
): DailyData => {
  return processAccountingData<DailyData>(
    data,
    // 初始化函數
    () => {
      const totals: DailyData = {};
      for (let month = 0; month < 12; month++) {
        totals[month] = {};
        const daysInMonth = getDaysInMonth(new Date(currentYear, month));
        
        for (let day = 1; day <= daysInMonth; day++) {
          totals[month][day] = 0;
        }
      }
      return totals;
    },
    // 聚合函數
    (totals, record, date) => {
      const month = getMonth(date);
      const day = getDate(date);
      record.items.forEach(item => {
        if ((!categoryName || item.category === categoryName) && totals[month]) {
          totals[month][day] += item.amount;
        }
      });
    }
  );
};

/**
 * 準備圖表數據
 */
export const prepareChartData = (monthlyData: MonthlyData): ChartData[] => {
  return Object.keys(monthlyData).map(month => ({
    name: MONTH_NAMES[parseInt(month)],
    金額: monthlyData[parseInt(month)],
    月份: parseInt(month) + 1
  }));
};

/**
 * 計算年度總額
 */
export const calculateYearlyTotal = (monthlyData: MonthlyData): number => {
  return Object.values(monthlyData).reduce((sum, amount) => sum + amount, 0);
};

/**
 * 導出CSV功能
 */
export const exportToCSV = (
  monthlyData: MonthlyData,
  filename: string,
  categoryName?: string
): void => {
  // 準備CSV數據
  const headers = ['月份', categoryName ? `${categoryName} 金額` : '所有類別金額'];
  const rows: (string | number)[][] = [];
  
  // 添加每月數據
  for (let month = 0; month < 12; month++) {
    rows.push([
      `${month + 1}月`,
      monthlyData[month]
    ]);
  }
  
  // 添加總計行
  rows.push(['總計', calculateYearlyTotal(monthlyData)]);
  
  // 轉換為CSV格式
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // 創建下載連結
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * 轉換API返回的數據為本地定義的類型
 */
export const transformApiDataToLocal = (data: any[]): LocalAccountingRecord[] => {
  return data.map(record => {
    // 使用類型斷言來處理 API 返回的數據
    const apiRecord = record as any;
    return {
      _id: apiRecord._id,
      date: typeof apiRecord.date === 'string' ? apiRecord.date : apiRecord.date.toString(),
      shift: apiRecord.shift,
      items: Array.isArray(apiRecord.items) ? apiRecord.items : [],
      totalAmount: typeof apiRecord.totalAmount === 'number' ? apiRecord.totalAmount : 0,
      status: apiRecord.status ?? 'pending'
    };
  });
};

/**
 * 生成年份選擇器選項
 */
export const generateYearOptions = (currentYear: number): number[] => {
  return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
};
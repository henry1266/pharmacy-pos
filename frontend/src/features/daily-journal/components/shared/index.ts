/**
 * 日常記帳模組共用元件索引檔案
 */

// 型別定義
export * from './types';

// 常數定義
export * from './constants';
export { SECTION_WIDTHS } from './constants';

// 基礎組件
export * from './components';
export {
  ContentSection,
  StatusDisplay,
  PageHeader,
  InfoCard,
  MonthListItem,
  CalendarCell,
  BarChartComponent,
  LineChartComponent,
  PieChartComponent,
  ChartCommonElements
} from './components';

// 業務邏輯組件
export * from './businessComponents';
export {
  MonthList,
  YearSelector,
  CalendarGrid
} from './businessComponents';

// 工具函數
export * from './utils';
export {
  processAccountingData,
  processMonthlyData,
  processDailyData,
  prepareChartData,
  calculateYearlyTotal,
  exportToCSV,
  transformApiDataToLocal,
  generateYearOptions
} from './utils';

// Hooks
export * from './hooks';
export {
  useAccountingData,
  useAccountingCategories,
  useChartState,
  useYearState
} from './hooks';
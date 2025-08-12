/**
 * 日常記帳模組共用型別定義
 */

// 記帳項目介面
export interface AccountingItem {
  category: string;
  categoryId: string;
  amount: number;
  note?: string;
}

// 本地記帳記錄介面 (與API返回的格式匹配)
export interface LocalAccountingRecord {
  _id: string;
  date: string;
  shift: string;
  items: AccountingItem[];
  totalAmount: number;
  status: string;
}

// 月度數據介面
export interface MonthlyData {
  [month: number]: number;
}

// 日度數據介面
export interface DailyData {
  [month: number]: {
    [day: number]: number;
  };
}

// 圖表數據介面
export interface ChartData {
  name: string;
  金額: number;
  月份: number;
}

// 內容區塊介面
export interface ContentSectionProps {
  children: React.ReactNode;
  maxWidth?: Record<string, string>;
  withPaper?: boolean;
}

// 狀態顯示組件介面
export interface StatusDisplayProps {
  type: 'loading' | 'error' | 'info';
  message?: string;
}

// 頁面標題組件介面
export interface PageHeaderProps {
  title: string;
  onBack: () => void;
  onExport: () => void;
  exportDisabled: boolean;
}

// 月份列表項目介面
export interface MonthListItemProps {
  month: string;
  index: number;
  isSelected: boolean;
  amount: number;
  onSelect: (index: number) => void;
}

// 通用資訊卡片組件介面
export interface InfoCardProps {
  title: string;
  content: React.ReactNode;
}

// 圖表共用元素組件介面
export interface ChartCommonElementsProps {
  dataKey?: string;
}

// 日曆格子組件介面
export interface CalendarCellProps {
  dayOffset: number;
  isCurrentMonth: boolean;
  dayAmount: number;
  year: number;
  month: number;
}

// 圖表組件介面
export interface BarChartComponentProps {
  data: ChartData[];
}

export interface LineChartComponentProps {
  data: ChartData[];
}

export interface PieChartComponentProps {
  data: ChartData[];
  colors: string[];
}
/**
 * Dashboard 模組對外 API
 * 
 * 此文件作為 dashboard 模組的唯一對外匯出入口
 * 只匯出穩定的 API（組件、hooks、頁面、類型等）
 */

// 匯出面板組件
export { DailyShippingPanel } from './components/DailyShippingPanel';
export { DailySalesPanel } from './components/DailySalesPanel';
export { DailySchedulePanel } from './components/DailySchedulePanel';

// 匯出頁面組件
export { default as DashboardPage } from './pages/DashboardPage';
export { default as DashboardDateDetailPage } from './pages/DashboardDateDetailPage';

// 匯出 hooks
export { useDailyShipping } from './hooks/useDailyShipping';
export { useDailyStats } from './hooks/useDailyStats';
export { useDailyScheduleSummary } from './hooks/useDailyScheduleSummary';
export { useAccountingDashboard } from './hooks/useAccountingDashboard';
export { useSalesDashboard } from './hooks/useSalesDashboard';

// 匯出工具函數
export { formatDate } from './utils/scheduleUtils';

// 匯出類型
export type { DailyShippingPanelProps } from './components/DailyShippingPanel';
export type { DailySalesPanelProps, Sale } from './components/DailySalesPanel';
export type { DailySchedulePanelProps } from './components/DailySchedulePanel';
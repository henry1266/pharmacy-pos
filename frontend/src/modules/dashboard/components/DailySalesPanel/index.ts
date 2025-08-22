/**
 * DailySalesPanel 模組對外 API
 * 
 * 此文件作為唯一對外匯出入口，只匯出穩定 API
 */

// 從組件實現文件導入
import DailySalesPanel, { DailySalesPanelProps, Sale } from './DailySalesPanel';

// 匯出組件
export { DailySalesPanel };

// 匯出類型
export type { DailySalesPanelProps, Sale };

// 默認匯出
export default DailySalesPanel;
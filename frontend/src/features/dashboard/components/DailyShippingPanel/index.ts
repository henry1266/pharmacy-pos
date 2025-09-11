/**
 * DailyShippingPanel 模組對外 API
 * 
 * 此文件作為唯一對外匯出入口，只匯出穩定 API
 */

// 從組件實現文件導入
import DailyShippingPanel, { DailyShippingPanelProps } from './DailyShippingPanel';

// 匯出組件
export { DailyShippingPanel };

// 匯出類型
export type { DailyShippingPanelProps };

// 默認匯出
export default DailyShippingPanel;
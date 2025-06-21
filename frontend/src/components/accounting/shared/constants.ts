/**
 * 會計模組共用常數定義
 */

// 月份名稱
export const MONTH_NAMES = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
];

// 星期標題
export const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

// 圖表顏色
export const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// 日曆格子樣式
export const CALENDAR_CELL_STYLES = {
  base: {
    width: 'calc(100% / 7)',
    height: '70px',
    p: 1,
    border: '1px solid #e0e0e0',
    position: 'relative',
  },
  current: {
    backgroundColor: 'white',
    '&:hover': {
      backgroundColor: '#f0f7ff'
    }
  },
  other: {
    backgroundColor: '#f9f9f9',
    '&:hover': {
      backgroundColor: '#f9f9f9'
    }
  }
} as const;

// 響應式佈局寬度配置
export const SECTION_WIDTHS = {
  half: { xs: '100%', md: '48%' },
  monthList: { xs: '100%', md: '23%', lg: '15%' },
  calendar: { xs: '100%', md: '31%', lg: '42%' },
  visualization: { xs: '100%', md: '40%', lg: '40%' }
} as const;
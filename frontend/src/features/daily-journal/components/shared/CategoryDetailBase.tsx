import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import {
  // 共用組件
  ContentSection,
  StatusDisplay,
  PageHeader,
  // 業務邏輯組件
  MonthList,
  YearSelector,
  CalendarGrid,
  // Hooks
  useAccountingData,
  useChartState,
  useYearState,
  // 工具函數
  exportToCSV,
  calculateYearlyTotal,
  // 常數
  SECTION_WIDTHS,
  // 類型
  MonthlyData,
  LocalAccountingRecord
} from '../shared';

// 定義通用組件的屬性
export interface CategoryDetailBaseProps {
  // 基本配置
  title: string;
  backPath: string;
  
  // 數據相關
  categoryName?: string; // 可選，如果提供則過濾特定類別
  
  // 自定義渲染函數
  renderInfoCards: (props: {
    currentYear: number;
    monthlyData: MonthlyData;
    records?: LocalAccountingRecord[];
  }) => React.ReactNode;
}

/**
 * 會計類別詳細頁面的通用基礎組件
 * 可用於顯示單一類別或所有類別的月度統計
 */
const CategoryDetailBase: React.FC<CategoryDetailBaseProps> = ({
  title,
  backPath,
  categoryName,
  renderInfoCards,
}) => {
  const navigate = useNavigate();
  
  // 使用共用 Hooks
  const { currentYear, handleYearChange } = useYearState();
  const { chartType, selectedMonth, handleChartTypeChange, handleMonthSelect } = useChartState();
  
  // 使用會計數據 Hook
  const { loading, error, records, monthlyData, dailyData } = useAccountingData(
    currentYear,
    categoryName
  );
  
  // 處理返回按鈕點擊
  const handleBack = (): void => {
    navigate(backPath);
  };
  
  // 處理導出CSV
  const handleExportCSV = useCallback((): void => {
    const filename = `${categoryName || '所有類別'}_${currentYear}_月度統計.csv`;
    exportToCSV(monthlyData, filename, categoryName);
  }, [categoryName, currentYear, monthlyData]);
  
  // 渲染內容區域
  const renderContent = (): React.ReactNode => {
    if (loading) {
      return <StatusDisplay type="loading" />;
    }
    
    if (error) {
      return <StatusDisplay type="error" message={error} />;
    }
    
    return (
      <Box>
        {/* 資訊卡片區域 */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
          {renderInfoCards({ currentYear, monthlyData, records })}
        </Box>
        
        <YearSelector currentYear={currentYear} onYearChange={handleYearChange} />
        
        {/* 主要數據顯示區域 */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {/* 左側月份列表 */}
          <ContentSection maxWidth={SECTION_WIDTHS.monthList}>
            <MonthList
              currentYear={currentYear}
              monthlyData={monthlyData}
              selectedMonth={selectedMonth}
              onMonthSelect={handleMonthSelect}
            />
          </ContentSection>
          
          {/* 中間日曆 */}
          <ContentSection maxWidth={SECTION_WIDTHS.calendar} withPaper>
            <CalendarGrid
              currentYear={currentYear}
              selectedMonth={selectedMonth}
              dailyData={dailyData}
            />
          </ContentSection>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title={title}
        onBack={handleBack}
        onExport={handleExportCSV}
        exportDisabled={loading}
      />
      {renderContent()}
    </Box>
  );
};

export default CategoryDetailBase;
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import {
  // 共用組件
  StatusDisplay,
  PageHeader,
  InfoCard,
  // 業務邏輯組件
  MonthList,
  YearSelector,
  CalendarGrid,
  // Hooks
  useAccountingCategories,
  useAccountingData,
  useChartState,
  useYearState,
  // 工具函數
  exportToCSV,
  calculateYearlyTotal,
  // 常數
  SECTION_WIDTHS
} from './shared';

/**
 * 所有日常記帳類別彙總頁面組件
 * 顯示所有類別的月度加總表格
 */
const AllCategoriesDetailComponent: React.FC = () => {
  const navigate = useNavigate();
  
  // 使用共用 Hooks
  const { currentYear, handleYearChange } = useYearState();
  const { chartType, selectedMonth, handleChartTypeChange, handleMonthSelect } = useChartState();
  const { categories } = useAccountingCategories();
  
  // 使用會計數據 Hook，不傳入類別名稱表示獲取所有類別數據
  const { loading, error, records, monthlyData, dailyData } = useAccountingData(currentYear);
  
  // 處理返回按鈕點擊
  const handleBack = (): void => {
    navigate('/accounting/categories');
  };
  
  // 處理導出CSV
  const handleExportCSV = useCallback((): void => {
    const filename = `所有類別_${currentYear}_月度統計.csv`;
    exportToCSV(monthlyData, filename);
  }, [currentYear, monthlyData]);
  
  // 渲染彙總資訊卡片
  const renderSummaryInfoCard = (): React.ReactNode => {
    const content = (
      <>
        <Typography variant="body1">
          <strong>類別數量:</strong> {categories.length}
        </Typography>
        <Typography variant="body1">
          <strong>記錄數量:</strong> {records.length}
        </Typography>
      </>
    );
    
    return <InfoCard title="彙總資訊" content={content} />;
  };
  
  // 渲染年度統計卡片
  const renderYearlyStatsCard = (): React.ReactNode => {
    const content = (
      <>
        <Typography variant="body1">
          <strong>總金額:</strong> ${calculateYearlyTotal(monthlyData)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          顯示{currentYear}年度所有類別的月度加總統計
        </Typography>
      </>
    );
    
    return <InfoCard title={`${currentYear}年度統計`} content={content} />;
  };
  
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
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
          <Box sx={{ flex: '1 1 100%', maxWidth: SECTION_WIDTHS.half }}>
            {renderSummaryInfoCard()}
          </Box>
          <Box sx={{ flex: '1 1 100%', maxWidth: SECTION_WIDTHS.half }}>
            {renderYearlyStatsCard()}
          </Box>
        </Box>
        
        <YearSelector currentYear={currentYear} onYearChange={handleYearChange} />
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {/* 左側月份列表 */}
          <Box sx={{ flex: '1 1 100%', maxWidth: SECTION_WIDTHS.monthList }}>
            <MonthList
              currentYear={currentYear}
              monthlyData={monthlyData}
              selectedMonth={selectedMonth}
              onMonthSelect={handleMonthSelect}
            />
          </Box>
          
          {/* 中間日曆 */}
          <Box sx={{ flex: '1 1 100%', maxWidth: SECTION_WIDTHS.calendar }}>
            <Box sx={{ p: 1, border: '1px solid #e0e0e0', borderRadius: '4px', backgroundColor: 'white' }}>
              <CalendarGrid
                currentYear={currentYear}
                selectedMonth={selectedMonth}
                dailyData={dailyData}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="所有類別 - 月度統計"
        onBack={handleBack}
        onExport={handleExportCSV}
        exportDisabled={loading}
      />
      {renderContent()}
    </Box>
  );
};

export default AllCategoriesDetailComponent;
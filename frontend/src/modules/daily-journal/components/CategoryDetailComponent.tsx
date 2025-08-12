import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import {
  // 共用組件
  ContentSection,
  StatusDisplay,
  PageHeader,
  InfoCard,
  // 業務邏輯組件
  MonthList,
  YearSelector,
  CalendarGrid,
  DataVisualization,
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
 * 日常記帳類別詳細頁面組件
 * 顯示特定類別的月度加總表格
 */
const CategoryDetailComponent: React.FC = () => {
  // 從URL獲取類別ID
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  
  // 使用共用 Hooks
  const { currentYear, handleYearChange } = useYearState();
  const { chartType, selectedMonth, handleChartTypeChange, handleMonthSelect } = useChartState();
  const { findCategoryById } = useAccountingCategories();
  
  // 找到當前類別
  const category = findCategoryById(categoryId ?? '');
  
  // 使用會計數據 Hook，傳入類別名稱進行過濾
  const { loading, error, monthlyData, dailyData } = useAccountingData(
    currentYear,
    category?.name
  );
  
  // 處理返回按鈕點擊
  const handleBack = (): void => {
    navigate('/accounting/categories');
  };
  
  // 處理導出CSV
  const handleExportCSV = useCallback((): void => {
    if (!category) return;
    
    const filename = `${category.name}_${currentYear}_月度統計.csv`;
    exportToCSV(monthlyData, filename, category.name);
  }, [category, currentYear, monthlyData]);
  
  
  // 渲染類別資訊卡片
  const renderCategoryInfoCard = (): React.ReactNode => {
    if (!category) return null;
    
    const content = (
      <>
        <Typography variant="body1">
          <strong>名稱:</strong> {category.name}
        </Typography>
        {category.description && (
          <Typography variant="body1">
            <strong>描述:</strong> {category.description}
          </Typography>
        )}
      </>
    );
    
    return <InfoCard title="類別資訊" content={content} />;
  };
  
  // 渲染年度統計卡片
  const renderYearlyStatsCard = (): React.ReactNode => {
    if (!category) return null;
    
    const content = (
      <>
        <Typography variant="body1">
          <strong>總金額:</strong> ${calculateYearlyTotal(monthlyData)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          顯示{currentYear}年度{category.name}的月度加總統計
        </Typography>
      </>
    );
    
    return <InfoCard title={`${currentYear}年度統計`} content={content} />;
  };
  
  // 渲染主要內容
  const renderMainContent = (): React.ReactNode => {
    return (
      <Box>
        {/* 資訊卡片區域 */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
          <ContentSection maxWidth={SECTION_WIDTHS.half}>
            {renderCategoryInfoCard()}
          </ContentSection>
          <ContentSection maxWidth={SECTION_WIDTHS.half}>
            {renderYearlyStatsCard()}
          </ContentSection>
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
          
          {/* 右側數據可視化 */}
          <ContentSection maxWidth={SECTION_WIDTHS.visualization} withPaper>
            <DataVisualization
              currentYear={currentYear}
              monthlyData={monthlyData}
              chartType={chartType}
              onChartTypeChange={handleChartTypeChange}
            />
          </ContentSection>
        </Box>
      </Box>
    );
  };
  
  // 渲染內容區域
  const renderContent = (): React.ReactNode => {
    if (loading) {
      return <StatusDisplay type="loading" />;
    }
    
    if (error) {
      return <StatusDisplay type="error" message={error} />;
    }
    
    if (!category) {
      return <StatusDisplay type="info" message="找不到指定的類別" />;
    }
    
    return renderMainContent();
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title={category ? `${category.name} - 月度統計` : '類別詳情'}
        onBack={handleBack}
        onExport={handleExportCSV}
        exportDisabled={!category || loading}
      />
      {renderContent()}
    </Box>
  );
};

export default CategoryDetailComponent;
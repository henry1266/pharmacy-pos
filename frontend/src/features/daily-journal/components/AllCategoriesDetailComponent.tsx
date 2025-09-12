import React from 'react';
import { Typography } from '@mui/material';
import {
  InfoCard,
  ContentSection,
  SECTION_WIDTHS,
  calculateYearlyTotal,
  useAccountingCategories,
  MonthlyData,
  LocalAccountingRecord
} from './shared';
import CategoryDetailBase from './shared/CategoryDetailBase';

/**
 * 所有日常記帳類別彙總頁面組件
 * 顯示所有類別的月度加總表格
 */
const AllCategoriesDetailComponent: React.FC = () => {
  // 使用會計類別 Hook
  const { categories } = useAccountingCategories();
  
  // 渲染資訊卡片
  const renderInfoCards = ({ currentYear, monthlyData, records }: {
    currentYear: number;
    monthlyData: MonthlyData;
    records?: LocalAccountingRecord[]
  }) => (
    <>
      <ContentSection maxWidth={SECTION_WIDTHS.half}>
        <InfoCard
          title="彙總資訊"
          content={
            <>
              <Typography variant="body1">
                <strong>類別數量:</strong> {categories.length}
              </Typography>
              <Typography variant="body1">
                <strong>記錄數量:</strong> {records?.length || 0}
              </Typography>
            </>
          }
        />
      </ContentSection>
      <ContentSection maxWidth={SECTION_WIDTHS.half}>
        <InfoCard
          title={`${currentYear}年度統計`}
          content={
            <>
              <Typography variant="body1">
                <strong>總金額:</strong> ${calculateYearlyTotal(monthlyData)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                顯示{currentYear}年度所有類別的月度加總統計
              </Typography>
            </>
          }
        />
      </ContentSection>
    </>
  );
  
  return (
    <CategoryDetailBase
      title="所有類別 - 月度統計"
      backPath="/journals/categories"
      renderInfoCards={renderInfoCards}
    />
  );
};

export default AllCategoriesDetailComponent;
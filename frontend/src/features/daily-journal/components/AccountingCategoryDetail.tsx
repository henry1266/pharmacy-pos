import React from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Box } from '@mui/material';
import {
  InfoCard,
  ContentSection,
  SECTION_WIDTHS,
  calculateYearlyTotal,
  useAccountingCategories,
  MonthlyData
} from './shared';
import CategoryDetailBase from './shared/CategoryDetailBase';

/**
 * 會計名目類別詳細頁面組件
 * 顯示特定類別的月度加總表格
 */
const AccountingCategoryDetail: React.FC = () => {
  // 從URL獲取類別ID
  const { categoryId } = useParams<{ categoryId: string }>();
  
  // 使用會計類別 Hook
  const { findCategoryById } = useAccountingCategories();
  
  // 找到當前類別
  const category = findCategoryById(categoryId ?? '');
  
  // 如果找不到類別，顯示錯誤信息
  if (!category) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">找不到指定的類別</Typography>
      </Box>
    );
  }
  
  // 渲染資訊卡片
  const renderInfoCards = ({ currentYear, monthlyData }: { currentYear: number; monthlyData: MonthlyData }) => (
    <>
      <ContentSection maxWidth={SECTION_WIDTHS.half}>
        <InfoCard
          title="類別資訊"
          content={
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
                顯示{currentYear}年度{category.name}的月度加總統計
              </Typography>
            </>
          }
        />
      </ContentSection>
    </>
  );
  
  return (
    <CategoryDetailBase
      title={`${category.name} - 月度統計`}
      backPath="/accounting/categories"
      categoryName={category.name}
      renderInfoCards={renderInfoCards}
    />
  );
};

export default AccountingCategoryDetail;
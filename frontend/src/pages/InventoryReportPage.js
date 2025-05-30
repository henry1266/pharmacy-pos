import React, { useState } from 'react';
import { Box, Container, Typography, Tabs, Tab } from '@mui/material';
import InventoryFilters from '../components/reports/inventory/InventoryFilters';
import InventorySummary from '../components/reports/inventory/InventorySummary';
import InventoryTable from '../components/reports/inventory/InventoryTable';
import InventoryProfitLossChart from '../components/reports/inventory/InventoryProfitLossChart';

const InventoryReportPage = () => {
  // 篩選條件狀態
  const [filters, setFilters] = useState({
    supplier: '',
    category: '',
    productCode: '',
    productName: '',
    productType: ''
  });
  
  // 標籤頁狀態
  const [tabValue, setTabValue] = useState(0);

  // 處理篩選條件變更
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // 處理標籤頁變更
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="700" color="var(--text-primary)">
          庫存報表
        </Typography>
        <Typography color="var(--text-secondary)">
          查看庫存狀況、盈虧分析和庫存價值
        </Typography>
      </Box>

      {/* 篩選器 */}
      <InventoryFilters onFilterChange={handleFilterChange} />

      {/* 摘要卡片 */}
      <InventorySummary filters={filters} />

      {/* 標籤頁 */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: 'var(--primary-color)',
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              '&.Mui-selected': {
                color: 'var(--primary-color)',
              },
            },
          }}
        >
          <Tab label="庫存列表" />
          <Tab label="盈虧分析" />
        </Tabs>
      </Box>

      {/* 標籤頁內容 */}
      {tabValue === 0 ? (
        <InventoryTable filters={filters} />
      ) : (
        <InventoryProfitLossChart filters={filters} />
      )}
    </Container>
  );
};

export default InventoryReportPage;

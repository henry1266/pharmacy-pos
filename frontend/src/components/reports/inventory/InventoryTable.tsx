import React, { FC } from 'react';
import { Box } from '@mui/material';
import {
  InventoryFilterValues
} from './shared/types';
import {
  LoadingSpinner,
  ErrorAlert,
  SummaryCards,
  InventoryDataTable
} from './shared/components';
import {
  useInventoryData,
  usePagination
} from './shared/hooks';

// InventoryTable props 型別
interface InventoryTableProps {
  filters: InventoryFilterValues;
}

const InventoryTable: FC<InventoryTableProps> = ({ filters }) => {
  // 使用共用 Hooks
  const {
    groupedData,
    loading,
    error,
    totalInventoryQuantity,
    totalProfitLoss
  } = useInventoryData(filters);
  
  const {
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
    getPaginatedData
  } = usePagination(10);

  // 計算分頁後的數據
  const paginatedData = getPaginatedData(groupedData);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorAlert message={error} />;
  }

  if (groupedData.length === 0) {
    return <ErrorAlert message="沒有符合條件的庫存數據" />;
  }

  return (
    <Box>
      {/* 總計卡片 */}
      <SummaryCards
        totalInventoryQuantity={totalInventoryQuantity}
        totalProfitLoss={totalProfitLoss}
        groupedData={groupedData}
      />

      {/* 庫存表格 */}
      <InventoryDataTable
        data={paginatedData}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={groupedData.length}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
};


export default InventoryTable;
import React, { useState } from 'react';
import { Container, Alert, Snackbar, Box } from '@mui/material';
import { useAppSelector } from '../../../../hooks/redux';

// 導入自定義 hook
import { useTransactionPage } from '../../pages/TransactionPage/hooks/useTransactionPage';

// 導入子組件
import PageHeader from '../components/PageHeader';
import FilterPanel from '../components/FilterPanel';
import TransactionList from '../../pages/TransactionPage/components/TransactionList';

// 導入類型
import { FilterOptions } from '../../pages/TransactionPage/types';

/**
 * 會計系統交易列表頁面
 * 專門用於管理交易的頁面
 */
export const TransactionPage: React.FC = () => {
  // 使用自定義 hook 獲取頁面狀態和事件處理函數
  const {
    // 狀態
    transactionGroups,
    loading,
    error,
    pagination,
    showFilters,
    searchTerm,
    snackbar,
    
    // 事件處理函數
    setSearchTerm,
    setShowFilters,
    handleCreateNew,
    handleEdit,
    handleView,
    handleDelete,
    handleCopy,
    handleConfirm,
    handleUnlock,
    handleCloseSnackbar,
  } = useTransactionPage();

  // 獲取帳戶和組織數據
  const { accounts } = useAppSelector(state => state.account2);
  const { organizations } = useAppSelector(state => state.organization);

  // 過濾選項狀態
  const [filters, setFilters] = useState<FilterOptions>({
    startDate: null,
    endDate: null,
    status: '',
    type: '',
    minAmount: '',
    maxAmount: '',
    account: '',
    category: ''
  });

  // 處理過濾器變更
  const handleFilterChange = (name: keyof FilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // 重置過濾器
  const handleResetFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      status: '',
      type: '',
      minAmount: '',
      maxAmount: '',
      account: '',
      category: ''
    });
  };

  // 應用過濾器
  const handleApplyFilters = () => {
    // 這裡可以實現過濾邏輯
    console.log('應用過濾器:', filters);
  };

  // 處理分頁變更
  const handlePageChange = (_event: unknown, newPage: number) => {
    // 這裡可以實現分頁邏輯
    console.log('頁面變更:', newPage + 1);
  };

  // 處理每頁行數變更
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // 這裡可以實現每頁行數變更邏輯
    console.log('每頁行數變更:', parseInt(event.target.value, 10));
  };

  return (
    <Container maxWidth="xl" sx={{ py: 0, px: 0 }}>
      {/* 頁面標題 */}
      <PageHeader
        mode="list"
        showFilters={showFilters}
        searchTerm={searchTerm}
        pagination={pagination ? { total: pagination.total } : { total: 0 }}
        onSearchChange={setSearchTerm}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onNavigateToNew={handleCreateNew}
        onNavigateToList={() => {}}
      />

      {/* 過濾器面板 */}
      <FilterPanel
        show={showFilters}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onApplyFilters={handleApplyFilters}
      />

      {/* 錯誤提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 交易列表 */}
      <TransactionList
        transactions={transactionGroups}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onEdit={handleEdit}
        onView={handleView}
        onCopy={handleCopy}
        onDelete={handleDelete}
        onConfirm={handleConfirm}
        onUnlock={handleUnlock}
      />

      {/* 通知 Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TransactionPage;
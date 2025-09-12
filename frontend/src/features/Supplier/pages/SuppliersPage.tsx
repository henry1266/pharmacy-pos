import React, { useEffect, FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import TitleWithCount from '../../../components/common/TitleWithCount';
// 全域模板
import CommonListPageLayout from '../../../components/common/CommonListPageLayout';
// 導入新的 hooks 和組件
import { useSupplierManagement } from '../hooks/useSupplierManagement';
import { useSupplierForm } from '../hooks/useSupplierForm';
import { useSupplierSearch } from '../hooks/useSupplierSearch';
import { useSupplierImport } from '../hooks/useSupplierImport';
import { useSnackbar } from '../hooks/useSnackbar';
import { getSupplierColumns } from '../config/supplierColumns';
import SupplierFormDialog from '../components/SupplierFormDialog';
import SupplierImportDialog from '../components/SupplierImportDialog';
import SupplierActionButtons from '../components/SupplierActionButtons';
import SupplierDetailPanel from '../components/SupplierDetailPanel';
import SupplierSnackbar from '../components/SupplierSnackbar';

// 導入類型
import { SupplierData } from '../types/supplier.types';

const SuppliersPage: FC<{}> = () => {
  const navigate = useNavigate();

  // 使用自定義 hooks
  const {
    isTestMode,
    suppliers,
    loading,
    error,
    selectedSupplier,
    selectSupplier,
    handleDeleteSupplier,
    handleSaveSupplier,
    setActualError
  } = useSupplierManagement();

  const {
    openDialog,
    setOpenDialog,
    currentSupplierState,
    setCurrentSupplierState,
    editMode,
    handleInputChange,
    handleEditSupplier,
    handleAddSupplier,
    handleCloseDialog,
    resetForm
  } = useSupplierForm();

  const {
    searchTerm,
    filteredSuppliers,
    handleSearchChange,
    handleClearSearch
  } = useSupplierSearch(suppliers);

  const {
    openImportDialog,
    setOpenImportDialog,
    csvFile,
    importLoading,
    importResult,
    templateDownloading,
    handleCloseImportDialog,
    handleOpenImportDialog,
    handleFileChange,
    handleDownloadTemplate,
    handleImportCsv
  } = useSupplierImport(isTestMode);

  const {
    snackbar,
    showSnackbar,
    handleCloseSnackbar
  } = useSnackbar();

  // 處理錯誤顯示
  useEffect(() => {
    if (error && !isTestMode) {
      showSnackbar(error, 'error');
    }
  }, [error, isTestMode, showSnackbar]);

  // 處理保存供應商
  const handleSave = async (): Promise<void> => {
    try {
      await handleSaveSupplier(currentSupplierState);
      handleCloseDialog();
      resetForm();
      showSnackbar(editMode ? '供應商已更新' : '供應商已新增', 'success');
    } catch (error) {
      showSnackbar('保存失敗', 'error');
    }
  };

  // 處理刪除供應商
  const handleDelete = async (supplier: SupplierData): Promise<void> => {
    try {
      await handleDeleteSupplier(supplier.id);
      showSnackbar('供應商已成功刪除', 'success');
    } catch (error) {
      showSnackbar('刪除失敗', 'error');
    }
  };

  // 處理編輯供應商
  const handleEdit = (supplier: SupplierData): void => {
    handleEditSupplier(supplier);
  };

  // 處理行點擊
  const handleRowClick = (params: { row: SupplierData }): void => {
    selectSupplier(params.row.id);
  };

  // 處理編輯按鈕點擊（從列定義中調用）
  const handleEditFromColumn = (id: string): void => {
    const supplier = suppliers.find(s => s.id === id);
    if (supplier) {
      handleEditSupplier(supplier);
    }
  };

  // 處理查看按鈕點擊（從列定義中調用）
  const handleViewFromColumn = (id: string): void => {
    navigate(`/suppliers/${id}`);
  };

  // 獲取列定義
  const columns = getSupplierColumns({
    onEdit: handleEditFromColumn,
    onDelete: handleDeleteSupplier,
    onView: handleViewFromColumn
  });

  // 操作按鈕組件
  const actionButtons = (
    <SupplierActionButtons
      isTestMode={isTestMode}
      searchTerm={searchTerm}
      onSearchChange={handleSearchChange}
      onClearSearch={handleClearSearch}
      onOpenImportDialog={handleOpenImportDialog}
      onAddSupplier={handleAddSupplier}
    />
  );

  // 詳情面板組件
  const detailPanel = (
    <SupplierDetailPanel
      selectedSupplier={selectedSupplier}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );

  return (
    <>
      <Box sx={{ width: '95%', mx: 'auto' }}>
        <CommonListPageLayout
          title={<TitleWithCount title={isTestMode ? "供應商管理 (測試模式)" : "供應商管理"} count={suppliers.length} />}
          actionButtons={actionButtons}
          columns={columns}
          rows={filteredSuppliers}
          loading={loading}
          {...(error && { error })}
          onRowClick={handleRowClick}
          detailPanel={detailPanel}
          tableGridWidth={9}
          detailGridWidth={3}
          dataTableProps={{
            rowsPerPageOptions: [25, 50, 100],
            disablePagination: false,
            pageSize: 25,
            initialState: {
              pagination: { pageSize: 25 },
              sorting: {
                sortModel: [{ field: 'code', sort: 'asc' }],
              },
            },
            getRowId: (row: SupplierData) => row.id
          }}
        />
      </Box>

      {/* 供應商表單對話框 */}
      <SupplierFormDialog
        open={openDialog}
        onClose={handleCloseDialog}
        editMode={editMode}
        isTestMode={isTestMode}
        currentSupplierState={currentSupplierState}
        onInputChange={handleInputChange}
        onSave={handleSave}
      />

      {/* 匯入對話框 */}
      <SupplierImportDialog
        open={openImportDialog}
        onClose={handleCloseImportDialog}
        isTestMode={isTestMode}
        csvFile={csvFile}
        importLoading={importLoading}
        importResult={importResult}
        templateDownloading={templateDownloading}
        onFileChange={handleFileChange}
        onDownloadTemplate={handleDownloadTemplate}
        onImport={handleImportCsv}
      />

      {/* Snackbar 通知 */}
      <SupplierSnackbar
        snackbar={snackbar}
        onClose={handleCloseSnackbar}
        isTestMode={isTestMode}
      />
    </>
  );
};

export default SuppliersPage;
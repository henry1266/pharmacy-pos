/**
 * @file 銷售列表頁面
 * @description 顯示銷售記錄列表，提供搜索、預覽、編輯和刪除功能
 */

import React, { FC } from 'react';
import { Box, Fade } from '@mui/material';
import { useSalesList } from '../hooks/useSalesList';
import {
  SalesTable,
  SearchBar,
  SalesPreviewPopover,
  DeleteConfirmDialog,
  LoadingSkeleton,
  HeaderSection,
  ActionButtons,
  NotificationSnackbar
} from '../components/list';
import { SalesListPageProps } from '../types/list';

/**
 * 銷售列表頁面
 * 顯示銷售記錄列表，提供搜索、預覽、編輯和刪除功能
 */
const SalesListPage: FC<SalesListPageProps> = () => {
  const {
    // 狀態
    isTestMode,
    sales,
    loading,
    error,
    searchTerm,
    wildcardMode,
    confirmDeleteId,
    snackbar,
    previewAnchorEl,
    selectedSale,
    previewLoading,
    previewError,
    isPreviewOpen,
    previewId,
    totalAmount,

    // 處理函數
    handleSearchChange,
    handleWildcardModeChange,
    handleDeleteSale,
    handleCloseConfirmDialog,
    handleCloseSnackbar,
    handlePreviewClick,
    handlePreviewClose,
    handleAddNewSale,
    handleEditSale,
    handleViewSale,
    handleBackToHome
  } = useSalesList();

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <HeaderSection 
          totalAmount={totalAmount}
          isTestMode={isTestMode}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SearchBar
            searchTerm={searchTerm}
            wildcardMode={wildcardMode}
            onSearchChange={handleSearchChange}
            onWildcardModeChange={handleWildcardModeChange}
          />
          <ActionButtons
            isTestMode={isTestMode}
            onAddNewSale={handleAddNewSale}
            onBackToHome={handleBackToHome}
          />
        </Box>
      </Box>
      
      <Box sx={{
        width: '100%',
        position: 'relative',
        minHeight: '70vh', // 增加最小高度以填滿更多螢幕空間
        height: '100%',
        bgcolor: 'background.paper', // 確保整個容器使用相同的背景色
        borderRadius: 1,
        border: 1, // 添加外邊框
        borderColor: 'divider', // 使用主題的分隔線顏色
        boxShadow: 1, // 添加輕微陰影增強視覺效果
        overflow: 'hidden' // 確保內容不會溢出圓角
      }}>
        <Fade in={!loading} timeout={1000}>
          <Box sx={{
            position: loading ? 'absolute' : 'relative',
            width: '100%',
            opacity: loading ? 0 : 1,
            transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: 'none' // 不需要為骨架屏添加邊框，因為它在容器內部
          }}>
            <SalesTable
              sales={sales}
              loading={loading}
              onViewSale={handleViewSale}
              onEditSale={handleEditSale}
              onDeleteSale={(saleId) => {
                // 這裡我們需要從 useSalesList 鉤子中獲取一個函數來設置 confirmDeleteId
                // 但由於沒有這樣的函數，我們直接使用 handleDeleteSale
                handleDeleteSale(saleId);
              }}
              onPreviewClick={handlePreviewClick}
            />
          </Box>
        </Fade>
        
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%', // 確保填滿整個容器高度
            minHeight: '70vh', // 確保至少佔據70%的視窗高度
            opacity: loading ? 1 : 0,
            visibility: loading ? 'visible' : 'hidden',
            transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            bgcolor: 'background.paper',
            borderRadius: 1
          }}
        >
          <LoadingSkeleton />
        </Box>
      </Box>
      
      <SalesPreviewPopover
        {... (previewId ? { id: previewId } : {})}
        open={isPreviewOpen}
        anchorEl={previewAnchorEl}
        sale={selectedSale}
        loading={previewLoading}
        error={previewError}
        onClose={handlePreviewClose}
      />
      
      <DeleteConfirmDialog
        open={!!confirmDeleteId}
        saleId={confirmDeleteId}
        isTestMode={isTestMode}
        onClose={handleCloseConfirmDialog}
        onConfirm={handleDeleteSale}
      />
      
      <NotificationSnackbar
        snackbar={snackbar}
        onClose={handleCloseSnackbar}
      />
    </Box>
  );
};

export default SalesListPage;
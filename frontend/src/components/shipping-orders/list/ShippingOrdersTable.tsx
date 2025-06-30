import React, { FC } from 'react';
import PropTypes from 'prop-types';
import { Box, Fade, Skeleton } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  ShippingOrdersTableProps,
  ActionButtons,
  StatusChipRenderer,
  PaymentStatusChipRenderer,
  AmountRenderer,
  getLocalizedPaginationText,
  TABLE_LOCALE_TEXT,
  SHIPPING_ORDER_COLUMNS
} from '../shared';

/**
 * 出貨單表格組件
 * @param {ShippingOrdersTableProps} props - 組件屬性
 * @returns {React.ReactElement} 出貨單表格組件
 */
const ShippingOrdersTable: FC<ShippingOrdersTableProps> = ({
  filteredRows,
  paginationModel,
  setPaginationModel,
  loading,
  handleView,
  handleEdit,
  handleDeleteClick,
  handlePreviewMouseEnter,
  handlePreviewMouseLeave,
  renderSupplierHeader
}) => {
  // 表格列定義
  const columns: GridColDef[] = [
    {
      ...SHIPPING_ORDER_COLUMNS.soid
    },
    {
      ...SHIPPING_ORDER_COLUMNS.supplier,
      renderHeader: renderSupplierHeader
    },
    {
      ...SHIPPING_ORDER_COLUMNS.totalAmount,
      renderCell: (params: GridRenderCellParams) => <AmountRenderer value={params.value} />
    },
    {
      ...SHIPPING_ORDER_COLUMNS.status,
      renderCell: (params: GridRenderCellParams) => <StatusChipRenderer status={params.value} />
    },
    {
      ...SHIPPING_ORDER_COLUMNS.paymentStatus,
      renderCell: (params: GridRenderCellParams) => <PaymentStatusChipRenderer status={params.value} />
    },
    {
      ...SHIPPING_ORDER_COLUMNS.actions,
      renderCell: (params: GridRenderCellParams) => (
        <ActionButtons
          onView={() => handleView(params.row._id)}
          onEdit={() => handleEdit(params.row._id)}
          onDelete={() => handleDeleteClick(params.row)}
          onPreviewMouseEnter={(e) => handlePreviewMouseEnter(e, params.row._id)}
          onPreviewMouseLeave={handlePreviewMouseLeave}
          isDeleteDisabled={params.row.status === 'completed'}
        />
      )
    }
  ];
  
  // 本地化文字配置
  const localeText = {
    ...TABLE_LOCALE_TEXT,
    paginationLabelDisplayedRows: ({ from, to, count }: { from: number; to: number; count: number }) =>
      getLocalizedPaginationText(from, to, count),
    MuiTablePagination: {
      labelDisplayedRows: ({ from, to, count }: { from: number; to: number; count: number }) =>
        getLocalizedPaginationText(from, to, count),
      labelRowsPerPage: TABLE_LOCALE_TEXT.paginationLabelRowsPerPage
    }
  } as any;
  
  // 創建骨架屏載入效果
  const renderSkeleton = () => (
    <Box sx={{
      width: '100%',
      mt: 1,
      bgcolor: 'background.paper', // 使用主題的背景色
      borderRadius: 1,
      height: '100%',
      minHeight: '70vh' // 確保至少佔據70%的視窗高度
    }}>
      {[...Array(15)].map((_, index) => ( // 增加到15行以填滿更多空間
        <Box
          key={index}
          sx={{
            display: 'flex',
            mb: 1,
            opacity: 0,
            animation: 'fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
            animationDelay: `${index * 0.05}s`
          }}
        >
          {[...Array(6)].map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="rectangular"
              width={`${100 / 6}%`}
              height={52}
              animation="wave"
              sx={{
                mx: 0.5,
                borderRadius: 1,
                opacity: 1 - (index * 0.1), // 漸變效果
                bgcolor: 'action.hover', // 使用主題的懸停色，通常是淺灰色
                '&::after': {
                  background: 'linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.04), transparent)'
                }
              }}
            />
          ))}
        </Box>
      ))}
    </Box>
  );

  return (
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
          <DataGrid
            rows={filteredRows ?? []} // Directly use filteredRows, provide default empty array
            columns={columns}
            rowsPerPageOptions={[5, 10, 25, 50]}
            pagination
            paginationMode="client"
            checkboxSelection={false}
            disableSelectionOnClick
            loading={false} // 由於我們自己控制載入效果，這裡設為false
            autoHeight
            density="standard"
            getRowId={(row) => row.id}
            localeText={localeText}
            getRowClassName={(params) => `row-${params.indexRelativeToCurrentPage}`}
            sx={{
              // 基本樣式
              '& .MuiDataGrid-main': {
                bgcolor: 'background.paper'
              },
              '& .MuiDataGrid-root': {
                border: 'none' // 移除 DataGrid 自帶的邊框，因為我們已經為容器添加了邊框
              },
              // 基本行樣式
              '& .MuiDataGrid-row': {
                opacity: 0,
                animation: 'fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                bgcolor: 'background.paper'
              },
              // 為每一行設置不同的動畫延遲
              ...[...Array(20)].reduce((styles, _, index) => ({
                ...styles,
                [`& .row-${index}`]: {
                  animationDelay: `${index * 0.03}s`,
                },
              }), {}),
              '@keyframes fadeIn': {
                '0%': {
                  opacity: 0,
                  transform: 'translateY(5px)'
                },
                '100%': {
                  opacity: 1,
                  transform: 'translateY(0)'
                }
              }
            }}
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
        {renderSkeleton()}
      </Box>
    </Box>
  );
};

// PropTypes 驗證
ShippingOrdersTable.propTypes = {
  filteredRows: PropTypes.array,
  paginationModel: PropTypes.shape({
    page: PropTypes.number,
    pageSize: PropTypes.number
  }),
  setPaginationModel: PropTypes.func,
  loading: PropTypes.bool,
  handleView: PropTypes.func.isRequired,
  handleEdit: PropTypes.func.isRequired,
  handleDeleteClick: PropTypes.func.isRequired,
  handlePreviewMouseEnter: PropTypes.func.isRequired,
  handlePreviewMouseLeave: PropTypes.func.isRequired,
  renderSupplierHeader: PropTypes.func.isRequired
} as any;

// 移除 defaultProps，因為這些屬性已在 PropTypes 中標記為可選

export default ShippingOrdersTable;
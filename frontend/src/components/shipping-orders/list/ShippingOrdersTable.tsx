import React, { FC } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
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
  
  return (
    <Box sx={{ width: '100%' }}>
      <DataGrid
        rows={filteredRows ?? []} // Directly use filteredRows, provide default empty array
        columns={columns}
        rowsPerPageOptions={[5, 10, 25, 50]}
        pagination
        paginationMode="client"
        checkboxSelection={false}
        disableSelectionOnClick
        loading={loading}
        autoHeight
        density="standard"
        getRowId={(row) => row.id}
        localeText={localeText}
      />
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
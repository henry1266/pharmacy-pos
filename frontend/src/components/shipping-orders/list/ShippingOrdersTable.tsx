import React, { FC, ReactNode } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  IconButton
} from '@mui/material';
import { 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams, GridPaginationModel } from '@mui/x-data-grid';

import StatusChip from '../../common/StatusChip';
import PaymentStatusChip from '../../common/PaymentStatusChip';

// 定義出貨單介面
interface ShippingOrder {
  id: string;
  _id: string;
  soid: string;
  sosupplier: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  [key: string]: any;
}

// 定義組件 props 的介面
interface ShippingOrdersTableProps {
  filteredRows?: ShippingOrder[];
  paginationModel?: GridPaginationModel;
  setPaginationModel?: (model: GridPaginationModel) => void;
  loading?: boolean;
  handleView: (id: string) => void;
  handleEdit: (id: string) => void;
  handleDeleteClick: (row: ShippingOrder) => void;
  handlePreviewMouseEnter: (e: React.MouseEvent, id: string) => void;
  handlePreviewMouseLeave: () => void;
  renderSupplierHeader: () => ReactNode;
}

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
    { field: 'soid', headerName: '出貨單號', flex: 1 },
    { 
      field: 'sosupplier', 
      headerName: '供應商', 
      flex: 1,
      renderHeader: renderSupplierHeader
    },
    { 
      field: 'totalAmount', 
      headerName: '總金額', 
      flex: 1,
      valueFormatter: (params) => {
        return params.value ? params.value.toLocaleString() : '';
      }
    },
    { 
      field: 'status', 
      headerName: '狀態', 
      flex: 1,
      renderCell: (params: GridRenderCellParams) => <StatusChip status={params.value} />
    },
    { 
      field: 'paymentStatus', 
      headerName: '付款狀態', 
      flex: 1,
      renderCell: (params: GridRenderCellParams) => <PaymentStatusChip status={params.value} />
    },
    { 
      field: 'actions', 
      headerName: '操作', 
      flex: 1,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<ShippingOrder>) => (
        <Box>
          <IconButton 
            size="small" 
            onClick={() => handleView(params.row._id)}
            onMouseEnter={(e) => handlePreviewMouseEnter(e, params.row._id)}
            onMouseLeave={handlePreviewMouseLeave}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => handleEdit(params.row._id)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => handleDeleteClick(params.row)}
            disabled={params.row.status === 'completed'}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];
  
  // 重構巢狀樣板字串
  const getLocalizedPaginationText = (from: number, to: number, count: number) => {
    const totalCount = count !== -1 ? count : `超過 ${to}`;
    return `${from}-${to} / ${totalCount}`;
  };
  
  // 使用 as any 類型斷言來避免 localeText 屬性的類型錯誤
  const localeText = {
    noRowsLabel: '沒有出貨單記錄',
    footerRowSelected: (count: number) => `已選擇 ${count} 個項目`,
    columnMenuLabel: '選單',
    columnMenuShowColumns: '顯示欄位',
    columnMenuFilter: '篩選',
    columnMenuHideColumn: '隱藏',
    columnMenuUnsort: '取消排序',
    columnMenuSortAsc: '升序排列',
    columnMenuSortDesc: '降序排列',
    filterPanelAddFilter: '新增篩選',
    filterPanelDeleteIconLabel: '刪除',
    filterPanelOperator: '運算子',
    filterPanelOperatorAnd: '與',
    filterPanelOperatorOr: '或',
    filterPanelColumns: '欄位',
    filterPanelInputLabel: '值',
    filterPanelInputPlaceholder: '篩選值',
    columnsPanelTextFieldLabel: '尋找欄位',
    columnsPanelTextFieldPlaceholder: '欄位名稱',
    columnsPanelDragIconLabel: '重新排序欄位',
    columnsPanelShowAllButton: '顯示全部',
    columnsPanelHideAllButton: '隱藏全部',
    toolbarDensity: '密度',
    toolbarDensityLabel: '密度',
    toolbarDensityCompact: '緊湊',
    toolbarDensityStandard: '標準',
    toolbarDensityComfortable: '舒適',
    toolbarExport: '匯出',
    toolbarExportLabel: '匯出',
    toolbarExportCSV: '下載CSV',
    toolbarExportPrint: '列印',
    toolbarColumns: '欄位',
    toolbarColumnsLabel: '選擇欄位',
    toolbarFilters: '篩選',
    toolbarFiltersLabel: '顯示篩選',
    toolbarFiltersTooltipHide: '隱藏篩選',
    toolbarFiltersTooltipShow: '顯示篩選',
    toolbarQuickFilterPlaceholder: '搜尋...',
    toolbarQuickFilterLabel: '搜尋',
    toolbarQuickFilterDeleteIconLabel: '清除',
    paginationRowsPerPage: '每頁行數:',
    paginationPageSize: '頁面大小',
    paginationLabelDisplayedRows: ({ from, to, count }: { from: number; to: number; count: number }) => 
      getLocalizedPaginationText(from, to, count),
    paginationLabelRowsPerPage: '每頁行數:',
    MuiTablePagination: {
      labelDisplayedRows: ({ from, to, count }: { from: number; to: number; count: number }) => 
        getLocalizedPaginationText(from, to, count),
      labelRowsPerPage: '每頁行數:'
    }
  } as any; // 使用 any 類型斷言來避免類型錯誤
  
  return (
    <Box sx={{ width: '100%' }}>
      <DataGrid
        rows={filteredRows ?? []} // Directly use filteredRows, provide default empty array
        columns={columns}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[5, 10, 25, 50]}
        checkboxSelection={false}
        disableRowSelectionOnClick
        loading={loading}
        autoHeight
        density="standard"
        getRowId={(row) => row.id}
        localeText={localeText}
      />
    </Box>
  );
};

// 新增 props validation
ShippingOrdersTable.propTypes = {
  filteredRows: PropTypes.array,
  paginationModel: PropTypes.shape({
    page: PropTypes.number,
    pageSize: PropTypes.number
  }),
  setPaginationModel: PropTypes.func,
  loading: PropTypes.bool,
  handleView: PropTypes.func,
  handleEdit: PropTypes.func,
  handleDeleteClick: PropTypes.func,
  handlePreviewMouseEnter: PropTypes.func,
  handlePreviewMouseLeave: PropTypes.func,
  renderSupplierHeader: PropTypes.func
} as any; // 使用 any 類型來避免 TypeScript 錯誤

// 設定默認值
ShippingOrdersTable.defaultProps = {
  filteredRows: [],
  loading: false
};

export default ShippingOrdersTable;
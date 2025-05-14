import React from 'react';
import { 
  Box, 
  IconButton,
  Chip
} from '@mui/material';
import { 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { format } from 'date-fns';
import StatusChip from '../common/StatusChip';
import PaymentStatusChip from '../common/PaymentStatusChip';

/**
 * 進貨單表格組件
 * @param {Object} props - 組件屬性
 * @param {Array} props.purchaseOrders - 進貨單數據
 * @param {Array} props.filteredRows - 過濾後的進貨單數據
 * @param {Array} props.columns - 表格列定義
 * @param {Object} props.paginationModel - 分頁模型
 * @param {Function} props.setPaginationModel - 設置分頁模型的函數
 * @param {boolean} props.loading - 是否正在加載
 * @param {Function} props.handleView - 查看進貨單的處理函數
 * @param {Function} props.handleEdit - 編輯進貨單的處理函數
 * @param {Function} props.handleDeleteClick - 刪除進貨單的處理函數
 * @param {Function} props.handlePreviewMouseEnter - 滑鼠懸停在檢視按鈕上的處理函數
 * @param {Function} props.handlePreviewMouseLeave - 滑鼠離開檢視按鈕的處理函數
 * @param {Function} props.renderSupplierHeader - 渲染供應商表頭的函數
 * @returns {React.ReactElement} 進貨單表格組件
 */
const PurchaseOrdersTable = ({
  purchaseOrders,
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
  const columns = [
    { field: 'poid', headerName: '進貨單號', flex: 1 },
    { field: 'pobill', headerName: '發票號碼', flex: 1 },
    { 
      field: 'pobilldate', 
      headerName: '發票日期', 
      flex: 1,
      valueFormatter: (params) => {
        return params.value ? format(new Date(params.value), 'yyyy-MM-dd') : '';
      }
    },
    { 
      field: 'posupplier', 
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
      renderCell: (params) => <StatusChip status={params.value} />
    },
    { 
      field: 'paymentStatus', 
      headerName: '付款狀態', 
      flex: 1,
      renderCell: (params) => <PaymentStatusChip status={params.value} />
    },
    { 
      field: 'actions', 
      headerName: '操作', 
      flex: 1,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
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
  
  // 為DataGrid準備行數據
  const rows = purchaseOrders.map(po => ({
    id: po._id, // DataGrid需要唯一的id字段
    _id: po._id, // 保留原始_id用於操作
    poid: po.poid,
    pobill: po.pobill,
    pobilldate: po.pobilldate,
    posupplier: po.posupplier,
    totalAmount: po.totalAmount,
    status: po.status,
    paymentStatus: po.paymentStatus
  }));
  
  return (
    <Box sx={{ width: '100%' }}>
      <DataGrid
        rows={filteredRows.length > 0 ? filteredRows : rows}
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
        localeText={{
          noRowsLabel: '沒有進貨單記錄',
          footerRowSelected: (count) => `已選擇 ${count} 個項目`,
          columnMenuLabel: '選單',
          columnMenuShowColumns: '顯示欄位',
          columnMenuFilter: '篩選',
          columnMenuHideColumn: '隱藏',
          columnMenuUnsort: '取消排序',
          columnMenuSortAsc: '升序排列',
          columnMenuSortDesc: '降序排列',
          filterPanelAddFilter: '新增篩選',
          filterPanelDeleteIconLabel: '刪除',
          filterPanelOperators: '運算子',
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
          paginationLabelDisplayedRows: ({ from, to, count }) => `${from}-${to} / ${count !== -1 ? count : `超過 ${to}`}`,
          paginationLabelRowsPerPage: '每頁行數:',
          MuiTablePagination: {
            labelDisplayedRows: ({ from, to, count }) => `${from}-${to} / ${count}`,
            labelRowsPerPage: '每頁行數:'
          }
        }}
      />
    </Box>
  );
};

export default PurchaseOrdersTable;

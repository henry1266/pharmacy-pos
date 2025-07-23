import React, { FC, MouseEvent } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  IconButton,
  Fade,
  Skeleton
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams, GridLocaleText } from '@mui/x-data-grid';
import { format } from 'date-fns';
import StatusChip from '../common/StatusChip';
import PaymentStatusChip from '../common/PaymentStatusChip';

// 定義進貨單的介面
interface PurchaseOrder {
  _id: string;
  poid: string;
  pobill: string;
  pobilldate: string;
  posupplier: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
}

// 定義表格行數據的介面
interface PurchaseOrderRow extends PurchaseOrder {
  id: string; // DataGrid需要唯一的id字段
}

// 定義分頁模型介面
interface PaginationModel {
  page: number;
  pageSize: number;
}

// 定義組件 props 的介面
interface PurchaseOrdersTableProps {
  purchaseOrders: PurchaseOrder[];
  filteredRows: PurchaseOrderRow[];
  paginationModel: PaginationModel;
  setPaginationModel: (model: PaginationModel) => void;
  loading: boolean;
  handleView: (id: string) => void;
  handleEdit: (id: string) => void;
  handleDeleteClick: (row: PurchaseOrderRow) => void;
  handlePreviewMouseEnter: (e: MouseEvent<HTMLButtonElement>, id: string) => void;
  handlePreviewMouseLeave: () => void;
  renderSupplierHeader: () => React.ReactNode;
}

/**
 * 進貨單表格組件
 * @param {PurchaseOrdersTableProps} props - 組件屬性
 * @returns {React.ReactElement} 進貨單表格組件
 */
const PurchaseOrdersTable: FC<PurchaseOrdersTableProps> = ({
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
  const columns: GridColDef[] = [
    { field: 'poid', headerName: '進貨單號', flex: 1 },
    { field: 'pobill', headerName: '發票號碼', flex: 1 },
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
      renderCell: (params: GridRenderCellParams) => (
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
            onClick={() => handleDeleteClick(params.row as PurchaseOrderRow)}
            disabled={params.row.status === 'completed'}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];
  
  // 為DataGrid準備行數據
  const rows: PurchaseOrderRow[] = purchaseOrders.map(po => ({
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
          borderRadius: 1
        }}>
          <DataGrid
            rows={filteredRows.length > 0 ? filteredRows : rows}
            columns={columns}
            checkboxSelection={false}
            disableSelectionOnClick
            loading={false} // 由於我們自己控制載入效果，這裡設為false
            autoHeight
            getRowId={(row) => row.id}
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
              },
              // 移除自定義的pulse動畫，使用Material UI內建的wave動畫
            }}
        localeText={{
          noRowsLabel: '沒有進貨單記錄',
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
          paginationLabelDisplayedRows: ({ from, to, count }: { from: number; to: number; count: number }) => {
            const countDisplay = count !== -1 ? count.toString() : '超過 ' + to;
            return `${from}-${to} / ${countDisplay}`;
          },
          paginationLabelRowsPerPage: '每頁行數:'
        } as Partial<GridLocaleText>}
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
          borderRadius: 1,
          border: 'none' // 不需要為骨架屏添加邊框，因為它在容器內部
        }}
      >
        {renderSkeleton()}
      </Box>
    </Box>
  );
};

// Props 驗證
PurchaseOrdersTable.propTypes = {
  purchaseOrders: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      poid: PropTypes.string,
      pobill: PropTypes.string,
      pobilldate: PropTypes.string,
      posupplier: PropTypes.string,
      totalAmount: PropTypes.number,
      status: PropTypes.string,
      paymentStatus: PropTypes.string
    })
  ).isRequired,
  filteredRows: PropTypes.array.isRequired,
  paginationModel: PropTypes.shape({
    page: PropTypes.number.isRequired,
    pageSize: PropTypes.number.isRequired
  }).isRequired,
  setPaginationModel: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  handleView: PropTypes.func.isRequired,
  handleEdit: PropTypes.func.isRequired,
  handleDeleteClick: PropTypes.func.isRequired,
  handlePreviewMouseEnter: PropTypes.func.isRequired,
  handlePreviewMouseLeave: PropTypes.func.isRequired,
  renderSupplierHeader: PropTypes.func.isRequired
};

export default PurchaseOrdersTable;
/**
 * @file 銷售表格組件
 * @description 顯示銷售記錄的表格組件
 */

import React, { FC } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams, GridLocaleText } from '@mui/x-data-grid';
import { Sale, SaleItem } from '../../types/list';
import { 
  getPaymentMethodText, 
  getPaymentStatusInfo, 
  TABLE_LOCALE_TEXT, 
  getLocalizedPaginationText,
  formatDate
} from '../../utils/listUtils';

interface SalesTableProps {
  sales: Sale[];
  loading: boolean;
  onViewSale: (saleId: string) => void;
  onEditSale: (saleId: string) => void;
  onDeleteSale: (saleId: string) => void;
  onPreviewClick: (event: React.MouseEvent<HTMLButtonElement>, sale: Sale) => void;
  showSalesProfitColumns?: boolean;
}

/**
 * 銷售表格組件
 * 顯示銷售記錄的表格
 */
const SalesTable: FC<SalesTableProps> = ({
  sales,
  loading,
  onViewSale,
  onEditSale,
  onDeleteSale,
  onPreviewClick,
  showSalesProfitColumns = false
}) => {
  // 為DataGrid準備行數據
  const rows = sales.map(sale => ({
    id: sale._id, // DataGrid需要唯一的id字段
    saleNumber: sale.saleNumber ?? '無單號',
    // 保存原始日期值，讓 valueFormatter 處理格式化
    date: sale.date,
    customerName: sale.customer?.name ?? '一般客戶',
    totalAmount: sale.totalAmount ?? 0,
    ...sale // 保留其他屬性，包括 _id, items, paymentMethod, paymentStatus
  }));

  // 表格列定義
  const columns: GridColDef[] = [
    {
      field: 'saleNumber',
      headerName: '銷貨單號',
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Button
          size="small"
          color="primary"
          onClick={() => onViewSale(params.row._id)}
        >
          {params.value}
        </Button>
      )
    },
    {
      field: 'date',
      headerName: '日期',
      flex: 1,
      valueFormatter: (params) => formatDate(params.value)
    },
    {
      field: 'customerName',
      headerName: '客戶',
      flex: 1
    },
    {
      field: 'items',
      headerName: '產品',
      flex: 3, // 增加產品欄位的寬度比例
      minWidth: 250, // 設置最小寬度確保內容可見
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          {params.value.map((item: SaleItem, index: number) => (
            <div key={`${params.row._id}-${item.product?._id ?? item.name}-${index}`}>
              {item.product?.name ?? item.name} x {item.quantity}
            </div>
          ))}
        </Box>
      )
    },
    {
      field: 'totalAmount',
      headerName: '總金額',
      flex: 0.8,
      minWidth: 120, // 確保金額欄位有足夠寬度
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params) => {
        return params.value ? params.value.toFixed(2) : '0.00';
      }
    },
    {
      field: 'paymentMethod',
      headerName: '付款方式',
      flex: 0.8,
      minWidth: 120, // 確保付款方式欄位有足夠寬度
      align: 'center',
      headerAlign: 'center',
      valueFormatter: (params) => {
        return getPaymentMethodText(params.value);
      }
    },
    {
      field: 'paymentStatus',
      headerName: '付款狀態',
      flex: 0.8,
      minWidth: 120, // 確保付款狀態欄位有足夠寬度
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={getPaymentStatusInfo(params.value).text}
          color={getPaymentStatusInfo(params.value).color}
          size="small"
        />
      )
    },
    {
      field: 'actions',
      headerName: '操作',
      flex: 0.8,
      minWidth: 150, // 確保操作欄位有足夠寬度顯示所有按鈕
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <IconButton
            size="small"
            onClick={(event) => onPreviewClick(event, params.row)}
            title="查看詳情"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onEditSale(params.row._id)}
            title="編輯"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => onDeleteSale(params.row._id)}
            title="刪除"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      checkboxSelection={false}
      disableSelectionOnClick
      loading={loading}
      autoHeight
      rowsPerPageOptions={[10, 25, 50, 100]}
      pageSize={25}
      initialState={{
        sorting: {
          sortModel: [{ field: 'saleNumber', sort: 'desc' }] // 預設按銷貨編號降序排序，但允許用戶調整
        }
      }}
      getRowId={(row) => row.id}
      getRowClassName={(params) => `row-${params.indexRelativeToCurrentPage}`}
      getRowHeight={(params) => {
        // 根據產品數量動態調整列高
        const itemCount = params.model.items?.length || 1;
        const baseHeight = 52; // 基礎高度
        const itemHeight = 24; // 每個產品項目的高度
        return Math.max(baseHeight, baseHeight + (itemCount - 1) * itemHeight);
      }}
      localeText={{
        ...TABLE_LOCALE_TEXT,
        paginationLabelDisplayedRows: ({ from, to, count }: { from: number; to: number; count: number }) =>
          getLocalizedPaginationText(from, to, count),
        MuiTablePagination: {
          labelDisplayedRows: ({ from, to, count }: { from: number; to: number; count: number }) =>
            getLocalizedPaginationText(from, to, count),
          labelRowsPerPage: TABLE_LOCALE_TEXT.paginationLabelRowsPerPage
        }
      } as Partial<GridLocaleText>}
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
        // 表頭樣式
        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)', // 淺灰色表頭背景
          fontWeight: 'bold',
        },
        // 單元格樣式
        '& .MuiDataGrid-cell': {
          py: 1, // 增加單元格垂直內邊距
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
  );
};

export default SalesTable;
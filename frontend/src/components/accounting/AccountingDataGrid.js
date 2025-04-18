import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Paper, IconButton, Box } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';

/**
 * 記帳系統數據表格組件
 * 
 * @param {Object} props
 * @param {Array} props.records - 記帳記錄數據
 * @param {boolean} props.loading - 是否正在加載數據
 * @param {Function} props.onEdit - 編輯按鈕點擊處理函數
 * @param {Function} props.onDelete - 刪除按鈕點擊處理函數
 */
const AccountingDataGrid = ({ records, loading, onEdit, onDelete }) => {
  // 定義班別顏色
  const shiftColors = {
    '早': '#e3f2fd', // 淺藍色
    '中': '#e8f5e9', // 淺綠色
    '晚': '#fff8e1'  // 淺黃色
  };

  // 將記錄轉換為DataGrid所需的行數據格式
  const rows = records.map(record => ({
    id: record._id,
    date: new Date(record.date),
    shift: record.shift,
    items: record.items,
    totalAmount: record.totalAmount,
    rawRecord: record // 保存原始記錄以便編輯時使用
  }));

  // 定義列配置
  const columns = [
    { 
      field: 'date', 
      headerName: '日期', 
      width: 150,
      valueFormatter: (params) => format(params.value, 'yyyy-MM-dd')
    },
    { 
      field: 'shift', 
      headerName: '班別', 
      width: 120,
      valueFormatter: (params) => `${params.value}班`,
      cellClassName: (params) => `shift-${params.value}`
    },
    { 
      field: 'items', 
      headerName: '項目', 
      width: 300,
      sortable: false,
      renderCell: (params) => (
        <div>
          {params.value.map((item, index) => (
            <div key={index}>
              {item.category}: ${item.amount}
              {item.note && ` (${item.note})`}
            </div>
          ))}
        </div>
      )
    },
    { 
      field: 'totalAmount', 
      headerName: '總金額', 
      width: 150,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params) => `$${params.value}`
    },
    {
      field: 'actions',
      headerName: '操作',
      width: 150,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <div>
          <IconButton
            color="primary"
            onClick={() => onEdit(params.row.rawRecord)}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => onDelete(params.row.id)}
          >
            <DeleteIcon />
          </IconButton>
        </div>
      )
    }
  ];

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <Box sx={{ height: 540, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          initialState={{
            sorting: {
              sortModel: [
                { field: 'date', sort: 'desc' },
                { field: 'shift', sort: 'asc' }
              ],
            },
          }}
          sx={{
            '& .shift-早': {
              backgroundColor: shiftColors['早'],
            },
            '& .shift-中': {
              backgroundColor: shiftColors['中'],
            },
            '& .shift-晚': {
              backgroundColor: shiftColors['晚'],
            },
          }}
        />
      </Box>
    </Paper>
  );
};

export default AccountingDataGrid;

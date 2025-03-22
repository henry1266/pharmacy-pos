import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Paper, Box, Typography } from '@mui/material';

/**
 * 自定義數據表格組件
 * @param {Object} props - 組件屬性
 * @param {Array} props.columns - 表格列配置
 * @param {Array} props.rows - 表格數據行
 * @param {string} props.title - 表格標題
 * @param {boolean} props.loading - 是否正在加載數據
 * @param {number} props.pageSize - 每頁顯示行數
 * @param {boolean} props.checkboxSelection - 是否顯示選擇框
 * @returns {React.ReactElement} 數據表格組件
 */
const DataTable = ({
  columns,
  rows,
  title,
  loading = false,
  pageSize = 10,
  checkboxSelection = false,
  ...rest
}) => {
  return (
    <Paper elevation={2} sx={{ width: '100%', overflow: 'hidden' }}>
      {title && (
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
      )}
      <Box sx={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pageSize={pageSize}
          rowsPerPageOptions={[5, 10, 25, 50]}
          checkboxSelection={checkboxSelection}
          disableSelectionOnClick
          autoHeight
          {...rest}
        />
      </Box>
    </Paper>
  );
};

export default DataTable;

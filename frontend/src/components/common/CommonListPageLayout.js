import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress
} from '@mui/material';
import DataTable from '../tables/DataTable'; // Assuming DataTable is in ./tables/

/**
 * 通用的列表頁面佈局組件
 * @param {Object} props - 組件屬性
 * @param {string} props.title - 頁面標題
 * @param {React.ReactNode} [props.actionButtons] - 標題右側的操作按鈕區域
 * @param {Array<object>} props.columns - DataTable 的列定義
 * @param {Array<object>} props.rows - DataTable 的行數據
 * @param {boolean} props.loading - 是否正在加載數據
 * @param {string|null} props.error - 錯誤訊息
 * @param {function} props.onRowClick - DataTable 行點擊事件處理函數
 * @param {React.ReactNode} [props.detailPanel] - 右側詳情面板內容
 * @param {number} [props.tableGridWidth=9] - 表格佔用的 Grid 寬度 (md)
 * @param {number} [props.detailGridWidth=3] - 詳情面板佔用的 Grid 寬度 (md)
 * @param {object} [props.dataTableProps] - 傳遞給 DataTable 的其他屬性
 * @returns {React.ReactElement} 通用列表頁面佈局
 */
const CommonListPageLayout = ({
  title,
  actionButtons,
  columns,
  rows,
  loading,
  error,
  onRowClick,
  detailPanel,
  tableGridWidth = 9,
  detailGridWidth = 3,
  dataTableProps = {}
}) => {
  return (
    <Box sx={{ maxWidth: '100%', pl: 0 }}>
      {/* Header: Title and Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {title}
        </Typography>
        {actionButtons && <Box>{actionButtons}</Box>}
      </Box>

      {/* Error Message */}
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* Main Content Grid */}
      <Grid container spacing={1}>
        {/* Left/Main: Data Table */}
        <Grid item xs={12} md={detailPanel ? tableGridWidth : 12}> {/* Full width if no detail panel */}
          <Paper elevation={2} sx={{ p: 0 }}>
            {loading && !rows.length ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <DataTable
                rows={rows}
                columns={columns}
                loading={loading} // Pass loading state to DataTable
                onRowClick={onRowClick}
                // Default sorting, page size etc. can be passed via dataTableProps
                initialState={{
                  sorting: {
                    sortModel: [{ field: columns[0]?.field || 'id', sort: 'asc' }], // Default sort by first column
                  },
                }}
                pageSizeOptions={[10, 25, 50]}
                {...dataTableProps} // Spread any additional DataTable props
              />
            )}
          </Paper>
        </Grid>

        {/* Right: Detail Panel (Optional) */}
        {detailPanel && (
          <Grid item xs={12} md={detailGridWidth}>
            {detailPanel}
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

// PropTypes 驗證
CommonListPageLayout.propTypes = {
  title: PropTypes.string.isRequired,
  actionButtons: PropTypes.node,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      field: PropTypes.string.isRequired,
      headerName: PropTypes.string,
      width: PropTypes.number,
      // 其他可能的欄位屬性
      renderCell: PropTypes.func,
      valueGetter: PropTypes.func,
      type: PropTypes.string
    })
  ).isRequired,
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  onRowClick: PropTypes.func,
  detailPanel: PropTypes.node,
  tableGridWidth: PropTypes.number,
  detailGridWidth: PropTypes.number,
  dataTableProps: PropTypes.object
};

// 預設值
CommonListPageLayout.defaultProps = {
  tableGridWidth: 9,
  detailGridWidth: 3,
  dataTableProps: {},
  error: null,
  onRowClick: () => {},
  actionButtons: null,
  detailPanel: null
};

export default CommonListPageLayout;

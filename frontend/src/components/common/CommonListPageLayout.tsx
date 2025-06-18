import React from 'react';
import {
  Box,
  Typography,
  Grid as MuiGrid,
  Paper,
  CircularProgress
} from '@mui/material';
import DataTable from '../tables/DataTable'; // Assuming DataTable is in ./tables/

// 創建一個 Grid 組件，以便更容易使用
const Grid = MuiGrid as React.ComponentType<any>;

// 定義列的類型
interface Column {
  field: string;
  headerName?: string;
  width?: number;
  renderCell?: (params: any) => React.ReactNode;
  valueGetter?: (params: any) => any;
  type?: string;
  [key: string]: any; // 其他可能的欄位屬性
}

/**
 * 通用的列表頁面佈局組件
 */
interface CommonListPageLayoutProps {
  title: string;
  actionButtons?: React.ReactNode;
  columns: Column[];
  rows: any[];
  loading: boolean;
  error?: string | null;
  onRowClick?: (params: any) => void;
  detailPanel?: React.ReactNode;
  tableGridWidth?: number;
  detailGridWidth?: number;
  dataTableProps?: Record<string, any>;
}

const CommonListPageLayout: React.FC<CommonListPageLayoutProps> = ({
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
                loading={loading}
                title={title}
                pageSize={10}
                checkboxSelection={false}
                {...dataTableProps} // Spread any additional DataTable props including sorting if needed
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

export default CommonListPageLayout;
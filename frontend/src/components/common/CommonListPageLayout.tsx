import React from 'react';
import {
  Box,
  Typography,
  Grid as MuiGrid,
  Paper,
  CircularProgress
} from '@mui/material';
import DataTable from '../tables/DataTable'; // Assuming DataTable is in ./tables/
import PageHeaderSection from './PageHeaderSection';
import HomeIcon from '@mui/icons-material/Home';

// 直接使用 MuiGrid
const Grid = MuiGrid;

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
  error?: string;
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
      {/* Header: Title and Action Buttons using PageHeaderSection */}
      <PageHeaderSection
        breadcrumbItems={[
          {
            label: '首頁',
            path: '/',
            icon: <HomeIcon sx={{ fontSize: '1.1rem' }} />
          },
          {
            label: title,
            icon: null
          }
        ]}
        actions={actionButtons}
      />

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
                {...(onRowClick && { onRowClick })}
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
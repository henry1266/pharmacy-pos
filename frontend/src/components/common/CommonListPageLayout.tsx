import React from 'react';
import {
  Box,
  Typography,
  Grid as MuiGrid,
  Paper,
  CircularProgress
} from '@mui/material';
import DataTable from '../DataTable'; // Assuming DataTable is in ./tables/
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
  title: string | React.ReactNode;
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
        <Typography color="error">
          {error}
        </Typography>
      )}

      {/* Main Content Grid */}
      <Grid container spacing={2}>
        {/* Left/Main: Data Table */}
        <Grid item xs={12} md={detailPanel ? tableGridWidth : 12}> {/* Full width if no detail panel */}
          <Paper elevation={0} variant="outlined"
  sx={{
    p: { xs: 0, md: 0 },   // 小螢幕加內距，大螢幕維持原本 0
    mb: { xs: 0, md: 0 },    // 小螢幕保留更多底部空間給分頁
    height: '74vh',         // 設定高度為視窗高度的75vh
    overflow: 'auto',       // 內容超出時顯示滾動條
    display: 'flex',        // 使用 flex 佈局
    flexDirection: 'column' // 垂直排列子元素
  }}
>  {/* 添加底部外邊距，確保有足夠空間顯示分頁控制器 */}
            {loading && !rows.length ? (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', height: '100%', p: 0, m: 0, border: 'none', borderRadius: 0, boxShadow: 'none', backgroundColor: 'transparent' }}>
                <DataTable
                  rows={rows}
                  columns={columns}
                  loading={loading}
                  pageSize={10}
                  checkboxSelection={false}
                  sx={{
                    width: '100%',
                    height: '100%',
                    p: 0,
                    m: 0,
                    '& .MuiDataGrid-root': {
                      border: 'none',
                      backgroundColor: 'transparent'
                    },
                    '& .MuiDataGrid-footerContainer': {
                      borderTop: 'none'
                    }
                  }}
                  {...(onRowClick && { onRowClick })}
                  {...dataTableProps} // Spread any additional DataTable props including sorting if needed
                />
              </Box>
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
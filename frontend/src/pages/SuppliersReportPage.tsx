import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { zhTW } from 'date-fns/locale';
import { format } from 'date-fns';
import axios from 'axios';

interface SupplierPurchaseSummary {
  _id: string;
  supplierName: string;
  supplierCode: string;
  totalAmount: number;
  orderCount: number;
  avgOrderAmount: number;
}

interface Supplier {
  _id: string;
  name: string;
  code: string;
}

const SuppliersReportPage: React.FC = () => {
  const [startDate, setStartDate] = useState<Date | null>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [reportData, setReportData] = useState<SupplierPurchaseSummary[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [totalSummary, setTotalSummary] = useState({
    totalAmount: 0,
    totalOrders: 0,
    supplierCount: 0,
  });

  // 載入供應商列表
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await axios.get('/api/suppliers');
        // 確保 response.data 是陣列
        const suppliersData = Array.isArray(response.data) ? response.data : [];
        setSuppliers(suppliersData);
      } catch (error) {
        console.error('載入供應商列表失敗:', error);
        setSuppliers([]); // 發生錯誤時設置為空陣列
      }
    };
    fetchSuppliers();
  }, []);

  // 定義 DataGrid 欄位
  const columns: GridColDef[] = [
    {
      field: 'supplierCode',
      headerName: '供應商編號',
      width: 120,
      sortable: true,
    },
    {
      field: 'supplierName',
      headerName: '供應商名稱',
      width: 200,
      sortable: true,
    },
    {
      field: 'orderCount',
      headerName: '進貨單數量',
      width: 120,
      type: 'number',
      sortable: true,
    },
    {
      field: 'totalAmount',
      headerName: '進貨總額',
      width: 150,
      type: 'number',
      sortable: true,
      valueFormatter: (params) => {
        return `NT$ ${params.value?.toLocaleString() || 0}`;
      },
    },
    {
      field: 'avgOrderAmount',
      headerName: '平均單筆金額',
      width: 150,
      type: 'number',
      sortable: true,
      valueFormatter: (params) => {
        return `NT$ ${params.value?.toLocaleString() || 0}`;
      },
    },
  ];

  // 查詢報表數據
  const handleSearch = async () => {
    if (!startDate || !endDate) {
      setError('請選擇開始和結束日期');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      });

      if (selectedSupplier) {
        params.append('supplierId', selectedSupplier);
      }

      if (status) {
        params.append('status', status);
      }

      const response = await axios.get(`/api/reports/suppliers/purchase-summary?${params}`);
      const apiResponse = response.data;

      // 從 API 回應中提取實際的數據陣列
      const reportArray = Array.isArray(apiResponse?.data?.data) ? apiResponse.data.data : [];
      
      // 轉換數據格式以符合前端介面
      const formattedData = reportArray.map((item: any) => ({
        _id: item.supplierId || item._id,
        supplierName: item.supplierName,
        supplierCode: item.supplierCode,
        totalAmount: item.totalAmount,
        orderCount: item.totalOrders,
        avgOrderAmount: item.totalOrders > 0 ? item.totalAmount / item.totalOrders : 0,
      }));

      setReportData(formattedData);

      // 計算總計
      const summary = formattedData.reduce(
        (acc: any, item: SupplierPurchaseSummary) => ({
          totalAmount: acc.totalAmount + item.totalAmount,
          totalOrders: acc.totalOrders + item.orderCount,
          supplierCount: acc.supplierCount + 1,
        }),
        { totalAmount: 0, totalOrders: 0, supplierCount: 0 }
      );

      setTotalSummary(summary);
    } catch (error: any) {
      console.error('查詢報表失敗:', error);
      setError(error.response?.data?.message || '查詢報表失敗');
    } finally {
      setLoading(false);
    }
  };

  // 重置篩選條件
  const handleReset = () => {
    setStartDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    setEndDate(new Date());
    setSelectedSupplier('');
    setStatus('');
    setReportData([]);
    setTotalSummary({ totalAmount: 0, totalOrders: 0, supplierCount: 0 });
    setError('');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          供應商進貨單總額報表
        </Typography>

        {/* 篩選條件 */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            篩選條件
          </Typography>
          
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="開始日期"
                value={startDate}
                onChange={setStartDate}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="結束日期"
                value={endDate}
                onChange={setEndDate}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? '查詢中...' : '查詢'}
                </Button>
                <Button variant="outlined" onClick={handleReset}>
                  重置
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* 錯誤訊息 */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* 報表數據表格 */}
        <Paper sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={reportData}
            columns={columns}
            getRowId={(row) => row._id}
            pageSize={25}
            rowsPerPageOptions={[10, 25, 50, 100]}
            checkboxSelection={false}
            disableSelectionOnClick
            components={{
              Toolbar: GridToolbar,
            }}
            componentsProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
            sx={{
              '& .MuiDataGrid-root': {
                border: 'none',
              },
              '& .MuiDataGrid-cell': {
                borderBottom: 'none',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f5f5f5',
                borderBottom: 'none',
              },
              '& .MuiDataGrid-virtualScroller': {
                backgroundColor: '#fafafa',
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: 'none',
                backgroundColor: '#f5f5f5',
              },
            }}
            localeText={{
              // 中文化
              noRowsLabel: '無資料',
              noResultsOverlayLabel: '找不到結果',
              errorOverlayDefaultLabel: '發生錯誤',
              toolbarColumns: '欄位',
              toolbarColumnsLabel: '選擇欄位',
              toolbarFilters: '篩選',
              toolbarFiltersLabel: '顯示篩選',
              toolbarDensity: '密度',
              toolbarDensityLabel: '密度',
              toolbarDensityCompact: '緊密',
              toolbarDensityStandard: '標準',
              toolbarDensityComfortable: '舒適',
              toolbarExport: '匯出',
              toolbarExportLabel: '匯出',
              toolbarExportCSV: '下載 CSV',
              toolbarExportPrint: '列印',
              toolbarQuickFilterPlaceholder: '搜尋...',
              toolbarQuickFilterLabel: '搜尋',
              toolbarQuickFilterDeleteIconLabel: '清除',
            }}
          />
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default SuppliersReportPage;
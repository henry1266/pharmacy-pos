import React from 'react';
import {
  Box,
  Button,
  Tabs,
  Tab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DataTable from '../tables/DataTable'; // 假設 DataTable 在 ./tables/ 中
import TabPanel from './TabPanel';

/**
 * 產品/藥品資料介面
 */
interface Product {
  id: string | number;
  [key: string]: any;
}

/**
 * 表格欄位定義介面 (與 MUI DataGrid 的 GridColDef 兼容)
 */
interface Column {
  field: string;
  headerName?: string;
  width?: number;
  type?: string;
  [key: string]: any;
}

/**
 * ProductTabs 組件的 Props 接口
 */
interface ProductTabsProps {
  tabValue: number;
  handleTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  handleAddProduct: () => void;
  handleOpenCsvImport: () => void;
  products: Product[];
  medicines: Product[];
  loading?: boolean;
  onRowClick?: (row: Product) => void;
  productColumns: Column[];
  medicineColumns: Column[];
}

/**
 * ProductTabs 組件
 * 用於顯示商品和藥品的標籤頁
 */
const ProductTabs: React.FC<ProductTabsProps> = ({
  tabValue,
  handleTabChange,
  handleAddProduct,
  handleOpenCsvImport,
  products,
  medicines,
  loading,
  onRowClick,
  productColumns,
  medicineColumns
}) => {
  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="product tabs">
          <Tab label="商品" id="product-tab-0" aria-controls="product-tabpanel-0" />
          <Tab label="藥品" id="product-tab-1" aria-controls="product-tabpanel-1" />
        </Tabs>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddProduct}
            sx={{ mr: 1 }}
          >
            {tabValue === 0 ? '新增商品' : '新增藥品'}
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<CloudUploadIcon />}
            onClick={handleOpenCsvImport}
          >
            CSV匯入
          </Button>
        </Box>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <DataTable
          rows={products}
          columns={productColumns}
          loading={loading || false}
          {...(onRowClick && { onRowClick: (params) => onRowClick(params.row) })}
        />
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <DataTable
          rows={medicines}
          columns={medicineColumns}
          loading={loading || false}
          {...(onRowClick && { onRowClick: (params) => onRowClick(params.row) })}
        />
      </TabPanel>
    </>
  );
};

export default ProductTabs;
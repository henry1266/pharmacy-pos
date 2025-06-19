import React from 'react';
import PropTypes from 'prop-types'; // 引入 PropTypes 進行 props 驗證
import {
  Box,
  Button,
  Tabs,
  Tab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DataTable from '../tables/DataTable.tsx'; // 假設 DataTable 在 ./tables/ 中
import TabPanel from './TabPanel';

const ProductTabs = ({
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
          loading={loading}
          onRowClick={onRowClick}
        />
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <DataTable
          rows={medicines}
          columns={medicineColumns}
          loading={loading}
          onRowClick={onRowClick}
        />
      </TabPanel>
    </>
  );
};

// 添加 ProductTabs 的 PropTypes 驗證
ProductTabs.propTypes = {
  tabValue: PropTypes.number.isRequired,
  handleTabChange: PropTypes.func.isRequired,
  handleAddProduct: PropTypes.func.isRequired,
  handleOpenCsvImport: PropTypes.func.isRequired,
  products: PropTypes.array.isRequired,
  medicines: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onRowClick: PropTypes.func,
  productColumns: PropTypes.array.isRequired,
  medicineColumns: PropTypes.array.isRequired
};

export default ProductTabs;

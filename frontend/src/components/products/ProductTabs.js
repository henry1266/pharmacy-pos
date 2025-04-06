import React from 'react';
import {
  Box,
  Button,
  Tabs,
  Tab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DataTable from '../tables/DataTable';
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

export default ProductTabs;

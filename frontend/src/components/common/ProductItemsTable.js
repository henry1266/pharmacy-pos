import React from 'react';
import {
  Typography,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress, // Added for loading state
  Box // Added for loading state
} from '@mui/material';

/**
 * 產品項目表格組件 (純 UI)
 * @param {Object} props 組件屬性
 * @param {Array} props.items 項目數組
 * @param {Object} props.productDetails 產品詳細資料映射 (code -> details)
 * @param {string} props.codeField 產品代碼字段名稱
 * @param {string} props.nameField 產品名稱字段名稱
 * @param {string} props.quantityField 數量字段名稱
 * @param {string} props.priceField 單價字段名稱
 * @param {string} props.totalCostField 項目總金額字段名稱 (通常是 item subtotal)
 * @param {number} props.totalAmount 訂單總金額
 * @param {string} props.title 表格標題
 * @param {boolean} props.isLoading 是否正在載入產品詳細資料 (由父元件控制)
 * @returns {React.ReactElement} 產品項目表格組件
 */
const ProductItemsTable = ({
  items = [],
  productDetails = {}, // Receive product details via props
  codeField = 'did',
  nameField = 'dname',
  quantityField = 'dquantity',
  priceField = 'dprice', // Added price field prop
  totalCostField = 'dtotalCost', // This seems to be item subtotal
  totalAmount = 0,
  title = '藥品項目',
  isLoading = false // Receive loading state via props
}) => {

  // Helper to calculate unit price from item data if priceField is not directly available
  // Or simply use the priceField if provided
  const getUnitPrice = (item) => {
    const price = Number(item[priceField]);
    if (!isNaN(price)) {
        // Format to 2 decimal places
        return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    // Fallback calculation if priceField is missing/invalid
    const quantity = Number(item[quantityField]);
    const totalCost = Number(item[totalCostField]);
    return quantity > 0
      ? (totalCost / quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '0.00';
  };

  // Helper to get item subtotal
  const getItemSubtotal = (item) => {
      const total = Number(item[totalCostField]);
      if (!isNaN(total)) {
          // Format to 2 decimal places
          return total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      // Fallback calculation
      const quantity = Number(item[quantityField]);
      const price = Number(item[priceField]);
      return (!isNaN(quantity) && !isNaN(price))
        ? (quantity * price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '0.00';
  }

  return (
    <Card sx={{ maxWidth: 1000, margin: '0 auto' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>

        {/* Display loading indicator if parent is fetching data */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            <Typography>載入產品資料中...</Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width="5%">#</TableCell>
                  <TableCell width="15%">藥品代碼</TableCell>
                  <TableCell width="15%">健保代碼</TableCell>
                  <TableCell width="30%">藥品名稱</TableCell>
                  <TableCell width="10%" align="right">數量</TableCell>
                  <TableCell width="10%" align="right">單價</TableCell>
                  <TableCell width="15%" align="right">總金額</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items && items.length > 0 ? (
                  items.map((item, index) => {
                    // Get product details from props
                    const productCode = item[codeField];
                    const productDetail = productDetails[productCode] || {};
                    // Use healthInsuranceCode from productDetail passed via props
                    const healthInsuranceCode = productDetail.healthInsuranceCode || '-';

                    return (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{productCode || 'N/A'}</TableCell>
                        <TableCell>{healthInsuranceCode}</TableCell>
                        {/* Use name from item first, fallback to name from productDetail */}
                        <TableCell>{item[nameField] || productDetail.name || 'N/A'}</TableCell>
                        <TableCell align="right">{item[quantityField] || 0}</TableCell>
                        <TableCell align="right">{getUnitPrice(item)}</TableCell>
                        <TableCell align="right">{getItemSubtotal(item)}</TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      無藥品項目
                    </TableCell>
                  </TableRow>
                )}

                {/* Display total amount for the order */}
                <TableRow>
                  <TableCell colSpan={6} align="right" sx={{ fontWeight: 'bold' }}>
                    訂單總金額
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {/* Format total amount to 2 decimal places */}
                    {Number(totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 元
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductItemsTable;


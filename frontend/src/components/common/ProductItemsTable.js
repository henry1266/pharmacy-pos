import React, { useState } from 'react'; // Added useState
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
  CircularProgress,
  Box,
  IconButton, // Added IconButton
  Stack // Added Stack for title and button
} from '@mui/material';
import {
  Visibility, // Added Visibility icon
  VisibilityOff // Added VisibilityOff icon
} from '@mui/icons-material';

/**
 * 產品項目表格組件 (純 UI)
 * @param {Object} props 組件屬性
 * @param {Array} props.items 項目數組 (預期包含 profit 和 profitMargin)
 * @param {Object} props.productDetails 產品詳細資料映射 (code -> details)
 * @param {string} props.codeField 產品代碼字段名稱
 * @param {string} props.nameField 產品名稱字段名稱
 * @param {string} props.quantityField 數量字段名稱
 * @param {string} props.priceField 單價字段名稱
 * @param {string} props.totalCostField 項目總金額字段名稱 (通常是 item subtotal)
 * @param {number} props.totalAmount 訂單總金額
 * @param {string} props.title 表格標題
 * @param {boolean} props.isLoading 是否正在載入產品詳細資料 (由父元件控制)
 * @param {boolean} [props.defaultShowProfit=true] 是否預設顯示毛利欄位
 * @param {string} [props.profitField='profit'] 毛利欄位名稱
 * @param {string} [props.profitMarginField='profitMargin'] 毛利率欄位名稱
 * @returns {React.ReactElement} 產品項目表格組件
 */
const ProductItemsTable = ({
  items = [],
  productDetails = {}, 
  codeField = 'did',
  nameField = 'dname',
  quantityField = 'dquantity',
  priceField = 'dprice', 
  totalCostField = 'dtotalCost',
  totalAmount = 0,
  title = '藥品項目',
  isLoading = false,
  defaultShowProfit = true, // New prop for default visibility
  profitField = 'profit', // New prop for profit field name
  profitMarginField = 'profitMargin' // New prop for profit margin field name
}) => {
  const [showProfitColumns, setShowProfitColumns] = useState(defaultShowProfit);

  const handleToggleProfitColumns = () => {
    setShowProfitColumns(!showProfitColumns);
  };

  const getUnitPrice = (item) => {
    const price = Number(item[priceField]);
    if (!isNaN(price)) {
        return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    const quantity = Number(item[quantityField]);
    const totalCost = Number(item[totalCostField]);
    return quantity > 0
      ? (totalCost / quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '0.00';
  };

  const getItemSubtotal = (item) => {
      const total = Number(item[totalCostField]);
      if (!isNaN(total)) {
          return total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      const quantity = Number(item[quantityField]);
      const price = Number(item[priceField]);
      return (!isNaN(quantity) && !isNaN(price))
        ? (quantity * price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '0.00';
  };

  const showHealthInsuranceCode = Object.keys(productDetails).length > 0;
  
  // Determine if any item has profit data to decide if the toggle button should be shown
  const hasProfitData = items.some(item => item.hasOwnProperty(profitField) || item.hasOwnProperty(profitMarginField));

  let colspanBase = 5; // #, Code, Name, Qty, Unit Price, Subtotal
  if (showHealthInsuranceCode) colspanBase++;

  return (
    <Card sx={{ maxWidth: 1000, margin: '0 auto' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
            {title}
          </Typography>
          {hasProfitData && (
            <IconButton onClick={handleToggleProfitColumns} size="small" aria-label={showProfitColumns ? "隱藏毛利欄位" : "顯示毛利欄位"}>
              {showProfitColumns ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          )}
        </Stack>

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
                  <TableCell width="15%">產品編號</TableCell>
                  {showHealthInsuranceCode && (
                    <TableCell width="15%">健保代碼</TableCell>
                  )}
                  <TableCell width={showHealthInsuranceCode ? "20%" : "35%"}>名稱</TableCell> {/* Adjusted width */}
                  <TableCell width="10%" align="right">數量</TableCell>
                  <TableCell width="10%" align="right">單價</TableCell>
                  <TableCell width="10%" align="right">小計</TableCell> {/* Renamed from 總金額 to 小計 for item row */}
                  {showProfitColumns && hasProfitData && (
                    <>
                      <TableCell width="10%" align="right">毛利</TableCell>
                      <TableCell width="10%" align="right">毛利率</TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {items && items.length > 0 ? (
                  items.map((item, index) => {
                    const productCode = item[codeField];
                    const productDetail = productDetails[productCode] || {};
                    const healthInsuranceCode = productDetail.healthInsuranceCode || '-';
                    const itemProfit = Number(item[profitField]);
                    const itemProfitMargin = item[profitMarginField]; // Keep as string if it's like "25.00%"

                    return (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{productCode || 'N/A'}</TableCell>
                        {showHealthInsuranceCode && (
                          <TableCell>{healthInsuranceCode}</TableCell>
                        )}
                        <TableCell>{item[nameField] || productDetail.name || 'N/A'}</TableCell>
                        <TableCell align="right">{item[quantityField] || 0}</TableCell>
                        <TableCell align="right">{getUnitPrice(item)}</TableCell>
                        <TableCell align="right">{getItemSubtotal(item)}</TableCell>
                        {showProfitColumns && hasProfitData && (
                          <>
                            <TableCell align="right" sx={{ color: itemProfit >= 0 ? 'success.main' : 'error.main' }}>
                              {!isNaN(itemProfit) ? itemProfit.toFixed(2) : '-'}
                            </TableCell>
                            <TableCell align="right" sx={{ color: !isNaN(itemProfit) && itemProfit >= 0 ? 'success.main' : (!isNaN(itemProfit) && itemProfit < 0 ? 'error.main' : 'text.primary') }}>
                              {itemProfitMargin !== undefined ? itemProfitMargin : '-'}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={colspanBase + (showProfitColumns && hasProfitData ? 2 : 0)} align="center">
                      無項目
                    </TableCell>
                  </TableRow>
                )}

                <TableRow>
                  <TableCell colSpan={colspanBase -1 + (showProfitColumns && hasProfitData ? 2 : 0)} align="right" sx={{ fontWeight: 'bold' }}>
                    訂單總金額
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
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


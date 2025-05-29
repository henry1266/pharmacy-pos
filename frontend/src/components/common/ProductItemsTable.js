import React, { useState } from 'react';
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
  IconButton,
  Stack
} from '@mui/material';
import {
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import ProductCodeLink from './ProductCodeLink';
import GrossProfitCell from './GrossProfitCell';

/**
 * 計算單價的輔助函數
 * @param {Object} item 項目
 * @param {string} priceField 單價欄位名稱
 * @param {string} quantityField 數量欄位名稱
 * @param {string} totalCostField 總金額欄位名稱
 * @returns {string} 格式化的單價
 */
const calculateUnitPrice = (item, priceField, quantityField, totalCostField) => {
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

/**
 * 計算小計的輔助函數
 * @param {Object} item 項目
 * @param {string} totalCostField 總金額欄位名稱
 * @param {string} quantityField 數量欄位名稱
 * @param {string} priceField 單價欄位名稱
 * @returns {string} 格式化的小計
 */
const calculateItemSubtotal = (item, totalCostField, quantityField, priceField) => {
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

/**
 * 檢查是否有毛利數據的輔助函數
 * @param {Array} items 項目數組
 * @param {string} profitField 毛利欄位名稱
 * @param {string} profitMarginField 毛利率欄位名稱
 * @returns {boolean} 是否有毛利數據
 */
const checkHasProfitData = (items, profitField, profitMarginField) => {
  return items.some(item => 
    (item.hasOwnProperty(profitField) && typeof item[profitField] === 'number') || 
    item.hasOwnProperty(profitMarginField)
  );
};

/**
 * 渲染表格標題行的輔助函數
 * @param {boolean} showHealthInsuranceCode 是否顯示健保代碼
 * @param {boolean} showProfitColumns 是否顯示毛利欄位
 * @param {boolean} hasProfitData 是否有毛利數據
 * @returns {React.ReactElement} 表格標題行
 */
const renderTableHeader = (showHealthInsuranceCode, showProfitColumns, hasProfitData) => (
  <TableHead>
    <TableRow>
      <TableCell width="1%">#</TableCell>
      <TableCell width="1%">編號</TableCell>
      {showHealthInsuranceCode && (
        <TableCell width="1%">健保代碼</TableCell>
      )}
      <TableCell width={showHealthInsuranceCode ? "20%" : "25%"}>名稱</TableCell>
      <TableCell width="4%" align="right">數量</TableCell>
      <TableCell width="4%" align="right">單價</TableCell>
      <TableCell width="4%" align="right">小計</TableCell>
      {showProfitColumns && hasProfitData && (
        <>
          <TableCell width="4%" align="right">毛利</TableCell>
          <TableCell width="4%" align="right">毛利率</TableCell>
        </>
      )}
    </TableRow>
  </TableHead>
);

/**
 * 渲染表格內容的輔助函數
 * @param {Array} items 項目數組
 * @param {Object} productDetails 產品詳細資料映射
 * @param {boolean} showHealthInsuranceCode 是否顯示健保代碼
 * @param {boolean} showProfitColumns 是否顯示毛利欄位
 * @param {boolean} hasProfitData 是否有毛利數據
 * @param {Object} fields 欄位名稱映射
 * @returns {React.ReactElement[]} 表格內容行
 */
const renderTableRows = (items, productDetails, showHealthInsuranceCode, showProfitColumns, hasProfitData, fields) => {
  const { codeField, nameField, quantityField, priceField, totalCostField, profitField, profitMarginField } = fields;
  
  return items.map((item, index) => {
    const productCode = item[codeField];
    const productDetail = productDetails[productCode] || {};
    const healthInsuranceCode = productDetail.healthInsuranceCode || 'N/A';
    
    // 構建毛利數據
    const fifoProfitData = {
      grossProfit: item.hasOwnProperty(profitField) ? Number(item[profitField]) : undefined
    };
    const itemProfitMargin = item[profitMarginField];

    // 決定毛利率顯示顏色
    let profitMarginColor = 'text.primary';
    if (fifoProfitData.grossProfit !== undefined) {
      profitMarginColor = fifoProfitData.grossProfit >= 0 ? 'success.main' : 'error.main';
    }

    // 使用更穩定的 key，避免使用純索引
    const rowKey = `item-${productCode || 'unknown'}-${item[nameField] || 'unnamed'}-${index}`;

    return (
      <TableRow key={rowKey}>
        <TableCell>{index + 1}</TableCell>
        <TableCell><ProductCodeLink product={{ _id: productDetail._id, code: productCode }} /></TableCell>
        {showHealthInsuranceCode && (
          <TableCell>{healthInsuranceCode}</TableCell>
        )}
        <TableCell>{item[nameField] || productDetail.name || 'N/A'}</TableCell>
        <TableCell align="right">{item[quantityField] || 0}</TableCell>
        <TableCell align="right">{calculateUnitPrice(item, priceField, quantityField, totalCostField)}</TableCell>
        <TableCell align="right">{calculateItemSubtotal(item, totalCostField, quantityField, priceField)}</TableCell>
        {showProfitColumns && hasProfitData && (
          <>
            <GrossProfitCell fifoProfit={fifoProfitData} />
            <TableCell align="right" sx={{ color: profitMarginColor }}>
              {itemProfitMargin !== undefined ? itemProfitMargin : 'N/A'}
            </TableCell>
          </>
        )}
      </TableRow>
    );
  });
};

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
  title = '項目',
  isLoading = false,
  defaultShowProfit = true,
  profitField = 'profit',
  profitMarginField = 'profitMargin'
}) => {
  const [showProfitColumns, setShowProfitColumns] = useState(defaultShowProfit);

  const handleToggleProfitColumns = () => {
    setShowProfitColumns(!showProfitColumns);
  };

  const showHealthInsuranceCode = Object.keys(productDetails).length > 0;
  const hasProfitData = checkHasProfitData(items, profitField, profitMarginField);
  const fields = { codeField, nameField, quantityField, priceField, totalCostField, profitField, profitMarginField };

  // 計算 colspan 基數
  let colspanBase = 5;
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
              {renderTableHeader(showHealthInsuranceCode, showProfitColumns, hasProfitData)}
              <TableBody>
                {items && items.length > 0 ? (
                  renderTableRows(items, productDetails, showHealthInsuranceCode, showProfitColumns, hasProfitData, fields)
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

// 新增 props validation
ProductItemsTable.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  productDetails: PropTypes.object,
  codeField: PropTypes.string,
  nameField: PropTypes.string,
  quantityField: PropTypes.string,
  priceField: PropTypes.string,
  totalCostField: PropTypes.string,
  totalAmount: PropTypes.number,
  title: PropTypes.string,
  isLoading: PropTypes.bool,
  defaultShowProfit: PropTypes.bool,
  profitField: PropTypes.string,
  profitMarginField: PropTypes.string
};

export default ProductItemsTable;

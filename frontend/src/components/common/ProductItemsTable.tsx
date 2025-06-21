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
import ProductCodeLink from './ProductCodeLink.tsx';
import GrossProfitCell from './GrossProfitCell.tsx';

/**
 * 產品項目介面
 */
interface ProductItem {
  [key: string]: any;
}

/**
 * 產品詳細資料介面
 */
interface ProductDetail {
  _id?: string;
  name?: string;
  healthInsuranceCode?: string;
  [key: string]: any;
}

/**
 * 產品詳細資料映射介面
 */
interface ProductDetailsMap {
  [code: string]: ProductDetail;
}

/**
 * 欄位名稱映射介面
 */
interface FieldsMap {
  codeField: string;
  nameField: string;
  quantityField: string;
  priceField: string;
  totalCostField: string;
  profitField: string;
  profitMarginField: string;
}

/**
 * 計算單價的輔助函數
 */
const calculateUnitPrice = (item: ProductItem, priceField: string, quantityField: string, totalCostField: string): string => {
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
 */
const calculateItemSubtotal = (item: ProductItem, totalCostField: string, quantityField: string, priceField: string): string => {
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
 */
const checkHasProfitData = (items: ProductItem[], profitField: string, profitMarginField: string): boolean => {
  return items.some(item => 
    (item.hasOwnProperty(profitField) && typeof item[profitField] === 'number') || 
    item.hasOwnProperty(profitMarginField)
  );
};

/**
 * 渲染表格標題行的輔助函數
 */
const renderTableHeader = (showHealthInsuranceCode: boolean, showProfitColumns: boolean, hasProfitData: boolean): React.ReactElement => (
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
 */
const renderTableRows = (
  items: ProductItem[], 
  productDetails: ProductDetailsMap, 
  showHealthInsuranceCode: boolean, 
  showProfitColumns: boolean, 
  hasProfitData: boolean, 
  fields: FieldsMap
): React.ReactElement[] => {
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
    const rowKey = `item-${productCode ?? 'unknown'}-${item[nameField] ?? 'unnamed'}-${index}`;

    return (
      <TableRow key={rowKey}>
        <TableCell>{index + 1}</TableCell>
        <TableCell><ProductCodeLink product={{ _id: productDetail._id, code: productCode }} /></TableCell>
        {showHealthInsuranceCode && (
          <TableCell>{healthInsuranceCode}</TableCell>
        )}
        <TableCell>{item[nameField] ?? productDetail.name ?? 'N/A'}</TableCell>
        <TableCell align="right">{item[quantityField] ?? 0}</TableCell>
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
 */
interface ProductItemsTableProps {
  items: ProductItem[];
  productDetails?: ProductDetailsMap;
  codeField?: string;
  nameField?: string;
  quantityField?: string;
  priceField?: string;
  totalCostField?: string;
  totalAmount?: number;
  title?: string;
  isLoading?: boolean;
  defaultShowProfit?: boolean;
  profitField?: string;
  profitMarginField?: string;
}

const ProductItemsTable: React.FC<ProductItemsTableProps> = ({
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
  const [showProfitColumns, setShowProfitColumns] = useState<boolean>(defaultShowProfit);

  const handleToggleProfitColumns = () => {
    setShowProfitColumns(!showProfitColumns);
  };

  const showHealthInsuranceCode = Object.keys(productDetails).length > 0;
  const hasProfitData = checkHasProfitData(items, profitField, profitMarginField);
  const fields: FieldsMap = { codeField, nameField, quantityField, priceField, totalCostField, profitField, profitMarginField };

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

export default ProductItemsTable;
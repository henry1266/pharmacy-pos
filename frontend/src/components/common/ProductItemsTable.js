import React, { useEffect, useState } from 'react';
import axios from 'axios';
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
  TableRow
} from '@mui/material';
import { getApiBaseUrl } from '../../utils/apiConfig';

/**
 * 產品項目表格組件 - 可重用於出貨單和進貨單詳情頁面
 * @param {Object} props 組件屬性
 * @param {Array} props.items 項目數組
 * @param {string} props.codeField 產品代碼字段名稱 (默認: 'did')
 * @param {string} props.nameField 產品名稱字段名稱 (默認: 'dname')
 * @param {string} props.quantityField 數量字段名稱 (默認: 'dquantity')
 * @param {string} props.totalCostField 總金額字段名稱 (默認: 'dtotalCost')
 * @param {number} props.totalAmount 訂單總金額
 * @param {string} props.title 表格標題 (默認: '藥品項目')
 * @returns {React.ReactElement} 產品項目表格組件
 */
const ProductItemsTable = ({ 
  items = [], 
  codeField = 'did', 
  nameField = 'dname', 
  quantityField = 'dquantity', 
  totalCostField = 'dtotalCost',
  totalAmount = 0,
  title = '藥品項目'
}) => {
  const API_BASE_URL = getApiBaseUrl();
  const [productDetails, setProductDetails] = useState({});
  
  // 當items更新時，獲取完整的產品資料
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (items && items.length > 0) {
        const details = {};
        
        // 為每個產品獲取詳細資料
        for (const item of items) {
          const productCode = item[codeField];
          if (productCode) {
            try {
              const response = await axios.get(`${API_BASE_URL}/products/code/${productCode}`);
              if (response.data) {
                details[productCode] = response.data;
              }
            } catch (error) {
              console.error(`獲取產品詳情失敗: ${productCode}`, error);
            }
          }
        }
        
        setProductDetails(details);
      }
    };
    
    fetchProductDetails();
  }, [items, codeField, API_BASE_URL]);
  
  // 計算單價
  const calculateUnitPrice = (item) => {
    const quantity = Number(item[quantityField]);
    const totalCost = Number(item[totalCostField]);
    
    return quantity > 0 
      ? (totalCost / quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '0.00';
  };
  
  return (
    <Card sx={{ maxWidth: 1000, margin: '0 auto' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        
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
                  // 從productDetails中獲取健保代碼
                  const productCode = item[codeField];
                  const productDetail = productDetails[productCode] || {};
                  const healthInsuranceCode = productDetail.healthInsuranceCode || '-';
                  
                  return (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{productCode}</TableCell>
                      <TableCell>{healthInsuranceCode}</TableCell>
                      <TableCell>{item[nameField]}</TableCell>
                      <TableCell align="right">{item[quantityField]}</TableCell>
                      <TableCell align="right">{calculateUnitPrice(item)}</TableCell>
                      <TableCell align="right">{Number(item[totalCostField]).toLocaleString()}</TableCell>
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
              
              <TableRow>
                <TableCell colSpan={6} align="right" sx={{ fontWeight: 'bold' }}>
                  總金額
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  {Number(totalAmount).toLocaleString()} 元
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default ProductItemsTable;

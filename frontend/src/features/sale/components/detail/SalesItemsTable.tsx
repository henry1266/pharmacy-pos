/**
 * @file 銷售項目表格組件
 * @description 顯示銷售詳情頁面中的銷售項目表格
 */

import React, { FC } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import SalesItemRow from './SalesItemRow';
import { SalesItemsTableProps } from '../../types/detail';

/**
 * 銷售項目表格組件
 * 顯示銷售詳情頁面中的銷售項目表格，包含產品信息和毛利數據
 */
const SalesItemsTable: FC<SalesItemsTableProps> = ({ 
  sale, 
  fifoLoading, 
  fifoData, 
  showSalesProfitColumns 
}) => (
  <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>編號</TableCell>
          <TableCell>名稱</TableCell>
          <TableCell align="right">單價</TableCell>
          <TableCell align="right">數量</TableCell>
          <TableCell align="right">小計</TableCell>
          {!fifoLoading && fifoData?.items && showSalesProfitColumns && (
            <>
              <TableCell align="right">成本</TableCell>
              <TableCell align="right">毛利</TableCell>
              <TableCell align="right">毛利率</TableCell>
            </>
          )}
        </TableRow>
      </TableHead>
      <TableBody>
        {sale.items.map((item, index) => {
          const productId = (typeof item.product === 'object' && item.product !== null)
            ? item.product._id
            : undefined;

          return (
            <SalesItemRow 
              key={productId ?? `item-${index}`}
              item={item} 
              fifoLoading={fifoLoading} 
              fifoData={fifoData} 
              showSalesProfitColumns={showSalesProfitColumns} 
            />
          );
        })}
      </TableBody>
    </Table>
  </TableContainer>
);

export default SalesItemsTable;

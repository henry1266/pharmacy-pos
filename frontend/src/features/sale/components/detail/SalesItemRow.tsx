/**
 * @file 銷售項目行組件
 * @description 顯示銷售詳情頁面中的單個銷售項目行
 */

import React, { FC } from 'react';
import { TableRow, TableCell } from '@mui/material';
import ProductCodeLink from '@/components/common/ProductCodeLink';
import GrossProfitCell from '@/components/common/GrossProfitCell';
import { SalesItemRowProps } from '../../types/detail';

/**
 * 銷售項目行組件
 * 顯示銷售詳情頁面中的單個銷售項目行，包含產品信息和毛利數據
 */
const SalesItemRow: FC<SalesItemRowProps> = ({ 
  item, 
  fifoLoading, 
  fifoData, 
  showSalesProfitColumns 
}) => {
  // 查找對應的 FIFO 項目
  const productValue = item.product;
  const isObjectProduct =
    productValue !== null && typeof productValue === 'object' && !Array.isArray(productValue);
  const productId = typeof productValue === 'string'
    ? productValue
    : isObjectProduct
      ? ((productValue as { _id?: string; id?: string; productId?: string })._id
          ?? (productValue as { id?: string }).id
          ?? (productValue as { productId?: string }).productId)
      : undefined;
  const productCode = (() => {
    if (isObjectProduct && 'code' in (productValue as { code?: string })) {
      const code = (productValue as { code?: string }).code;
      if (typeof code === 'string' && code.trim().length > 0) {
        return code;
      }
    }
    if (typeof productValue === 'string') {
      return productValue;
    }
    return '';
  })();
  const productName =
    isObjectProduct && 'name' in (productValue as { name?: string })
      ? ((productValue as { name?: string }).name ?? item.name ?? 'N/A')
      : item.name ?? 'N/A';
  const fifoItem =
    !fifoLoading &&
    fifoData?.items?.find((fi) => {
      const fifoProduct = fi.product;
      if (typeof fifoProduct === 'string') {
        return fifoProduct === productId;
      }
      if (fifoProduct && typeof fifoProduct === 'object') {
        const fifoId =
          (fifoProduct as { _id?: string })._id ??
          (fifoProduct as { id?: string }).id ??
          (fifoProduct as { productId?: string }).productId;
        return fifoId === productId;
      }
        return false;
      });
  const productLinkData: { _id?: string; code?: string } | null =
    productId || productCode
      ? {
          ...(productId ? { _id: productId } : {}),
          ...(productCode ? { code: productCode } : {}),
        }
      : null;
  
  return (
    <TableRow hover>
      <TableCell>
        <ProductCodeLink product={productLinkData} />
      </TableCell>
      <TableCell>{productName}</TableCell>
      <TableCell align="right">{item.price.toFixed(2)}</TableCell>
      <TableCell align="right">{item.quantity}</TableCell>
      <TableCell align="right">{(item.price * item.quantity).toFixed(2)}</TableCell>
      {!fifoLoading && fifoData?.items && showSalesProfitColumns && (
        <>
          <TableCell align="right">
            {(fifoItem && typeof fifoItem === 'object') 
              ? fifoItem.fifoProfit?.totalCost?.toFixed(2) ?? 'N/A' 
              : 'N/A'}
          </TableCell>
          {/* 型別斷言在此是必要的，因為可能存在兩個不同的 FifoProfit 介面定義 */}
          <GrossProfitCell 
            fifoProfit={(fifoItem && typeof fifoItem === 'object') 
              ? fifoItem.fifoProfit as any 
              : undefined} 
          />
          <TableCell 
            align="right" 
            sx={{ 
              color: (fifoItem && typeof fifoItem === 'object') && 
                fifoItem.fifoProfit && 
                parseFloat(fifoItem.fifoProfit.profitMargin || '0') >= 0 
                  ? 'success.main' 
                  : 'error.main' 
            }}
          >
            {(fifoItem && typeof fifoItem === 'object') 
              ? fifoItem.fifoProfit?.profitMargin ?? 'N/A' 
              : 'N/A'}
          </TableCell>
        </>
      )}
    </TableRow>
  );
};

export default SalesItemRow;

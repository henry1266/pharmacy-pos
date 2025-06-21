import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Link as MuiLink } from '@mui/material';

/**
 * 產品介面
 */
interface Product {
  _id?: string;
  code?: string;
  [key: string]: any;
}

/**
 * 產品代碼連結組件
 */
interface ProductCodeLinkProps {
  product?: Product | null;
}

const ProductCodeLink: React.FC<ProductCodeLinkProps> = ({ product }) => {
  // 使用可選鏈運算子優化條件判斷
  if (product?._id) {
    return (
      <MuiLink 
        component={RouterLink} 
        to={`/products/${product._id}`} 
        sx={{ textDecoration: 'underline', color: 'inherit' }}
      >
        {product.code ?? 'N/A'}
      </MuiLink>
    );
  }
  return <>{product?.code ?? 'N/A'}</>;
};

export default ProductCodeLink;
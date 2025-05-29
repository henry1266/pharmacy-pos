import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Link as MuiLink } from '@mui/material';
import PropTypes from 'prop-types';

const ProductCodeLink = ({ product }) => {
  // 使用可選鏈運算子優化條件判斷
  if (product?._id) {
    return (
      <MuiLink 
        component={RouterLink} 
        to={`/products/${product._id}`} 
        sx={{ textDecoration: 'underline', color: 'inherit' }}
      >
        {product.code || 'N/A'}
      </MuiLink>
    );
  }
  return <>{product?.code || 'N/A'}</>;
};

// 添加 Props 驗證
ProductCodeLink.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string,
    code: PropTypes.string
  })
};

// 預設值
ProductCodeLink.defaultProps = {
  product: null
};

export default ProductCodeLink;

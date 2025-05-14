import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Link as MuiLink } from '@mui/material';

const ProductCodeLink = ({ product }) => {
  if (product && product._id) {
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

export default ProductCodeLink;


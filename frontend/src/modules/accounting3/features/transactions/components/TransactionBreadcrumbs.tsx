import React from 'react';
import { Breadcrumbs, Link, Typography } from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';

interface TransactionBreadcrumbsProps {
  onNavigateToList: () => void;
}

/**
 * 交易詳情麵包屑導航組件
 */
export const TransactionBreadcrumbs: React.FC<TransactionBreadcrumbsProps> = ({
  onNavigateToList
}) => {
  return (
    <Breadcrumbs sx={{ mb: 2 }}>
      <Link
        color="inherit"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onNavigateToList();
        }}
        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
      >
        <ReceiptIcon fontSize="small" />
        交易管理
      </Link>
      <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <DescriptionIcon fontSize="small" />
        交易詳情
      </Typography>
    </Breadcrumbs>
  );
};

export default TransactionBreadcrumbs;
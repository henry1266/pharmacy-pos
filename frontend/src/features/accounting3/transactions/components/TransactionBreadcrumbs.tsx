import React from 'react';
import {
  Receipt as ReceiptIcon,
  Description as DescriptionIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { BreadcrumbNavigation } from '../../components/BreadcrumbNavigation';

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
    <BreadcrumbNavigation
      items={[
        {
          label: '會計首頁',
          onClick: (e) => {
            e.preventDefault();
            onNavigateToList();
          },
          icon: <HomeIcon fontSize="small" />
        },
         {
          label: '交易列表',
          path: '/accounting3/transaction',
          icon: <ReceiptIcon fontSize="small" />
        },
        {
          label: '交易詳情',
          icon: <DescriptionIcon fontSize="small" />
        }
      ]}
      showShadow={true}
      fontSize="1.2rem"
      padding={8}
    />
  );
};

export default TransactionBreadcrumbs;
import React from 'react';
import { useParams } from 'react-router-dom';
import AccountingDetailPage from '../components/accounting2/AccountingDetailPage';

const AccountingDetailPageWrapper: React.FC = () => {
  const { categoryId, accountId } = useParams<{ categoryId?: string; accountId?: string }>();
  
  // 這裡可以從 Redux store 或其他地方獲取當前選中的組織 ID
  // 暫時使用 localStorage 或其他方式獲取
  const selectedOrganizationId = localStorage.getItem('selectedOrganizationId');

  return (
    <AccountingDetailPage 
      organizationId={selectedOrganizationId}
    />
  );
};

export default AccountingDetailPageWrapper;
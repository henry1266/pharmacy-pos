import React from 'react';
import AllCategoriesDetail from '../components/accounting/AllCategoriesDetail.tsx';
import Layout from '../components/layout/MainLayout';

/**
 * 所有會計類別彙總頁面
 */
const AllCategoriesDetailPage: React.FC = () => {
  return (
    <Layout>
      <AllCategoriesDetail />
    </Layout>
  );
};

export default AllCategoriesDetailPage;
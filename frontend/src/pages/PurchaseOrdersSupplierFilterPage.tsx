import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import PurchaseOrdersPage from './PurchaseOrdersPage.tsx';

/**
 * 供應商篩選的進貨單頁面
 * 此頁面作為路由 /purchase-orders/supplier/:id 的入口點
 * 將 URL 參數中的供應商 ID 傳遞給 PurchaseOrdersPage
 */
const PurchaseOrdersSupplierFilterPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  
  // 如果沒有 ID 參數，導向基本進貨單頁面
  useEffect(() => {
    if (!id) {
      navigate('/purchase-orders');
    }
  }, [id, navigate]);

  return <PurchaseOrdersPage initialSupplierId={id} />;
};

export default PurchaseOrdersSupplierFilterPage;
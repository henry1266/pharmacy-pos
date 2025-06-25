import { useState, useEffect } from 'react';
import { productServiceV2 } from '../services/productServiceV2';

interface ProductDetails {
  [code: string]: any;
}

interface ShippingOrderItem {
  did?: string;
  [key: string]: any;
}

export const useProductDetails = (items?: ShippingOrderItem[]) => {
  const [productDetails, setProductDetails] = useState<ProductDetails>({});
  const [productDetailsLoading, setProductDetailsLoading] = useState<boolean>(false);
  const [productDetailsError, setProductDetailsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!items?.length) {
        setProductDetails({});
        return;
      }

      setProductDetailsLoading(true);
      setProductDetailsError(null);
      const details: ProductDetails = {};
      
      // 避免使用 Set 的展開運算符，改用 Array.from
      const productCodesSet = new Set(items.map(item => item.did).filter(Boolean));
      const productCodes = Array.from(productCodesSet);

      try {
        const promises = productCodes.map(async (code) => {
          try {
            const productData = await productServiceV2.getProductByCode(code);
            if (productData) {
              details[code] = productData;
            }
          } catch (err) {
            console.error(`獲取產品 ${code} 詳情失敗:`, err);
          }
        });
        
        await Promise.all(promises);
        setProductDetails(details);
      } catch (err) {
        console.error('獲取所有產品詳情過程中發生錯誤:', err);
        setProductDetailsError('無法載入部分或所有產品的詳細資料。');
      } finally {
        setProductDetailsLoading(false);
      }
    };

    fetchProductDetails();
  }, [items]);

  return {
    productDetails,
    productDetailsLoading,
    productDetailsError
  };
};
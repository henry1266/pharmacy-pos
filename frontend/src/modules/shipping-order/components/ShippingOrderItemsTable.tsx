import React, { useMemo } from 'react';
import {
  Typography,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import ProductItemsTable from '../../../components/common/ProductItemsTable';

interface ShippingOrderItem {
  did?: string;
  dname?: string;
  dquantity?: number;
  dprice?: number;
  dtotalCost?: number;
  totalPrice?: number;
  profit?: number;
  profitMargin?: number;
  packageQuantity?: number | string;
  boxQuantity?: number | string;
  [key: string]: any;
}

interface FifoData {
  items?: Array<{
    product?: {
      code?: string;
      [key: string]: any;
    };
    fifoProfit?: {
      grossProfit?: number;
      profitMargin?: number;
      [key: string]: any;
    };
    [key: string]: any;
  }>;
  [key: string]: any;
}

interface ProductDetails {
  [code: string]: any;
}

interface ShippingOrderItemsTableProps {
  items?: ShippingOrderItem[];
  fifoData: FifoData | null;
  productDetails: ProductDetails;
  totalAmount: number;
  productDetailsLoading: boolean;
  orderLoading: boolean;
  fifoLoading: boolean;
  productDetailsError?: string | null;
}

const ShippingOrderItemsTable: React.FC<ShippingOrderItemsTableProps> = ({
  items,
  fifoData,
  productDetails,
  totalAmount,
  productDetailsLoading,
  orderLoading,
  fifoLoading,
  productDetailsError
}) => {
  const processedItems = useMemo(() => {
    if (!items) {
      return [];
    }
    
    console.log('處理項目:', items);
    
    if (!fifoData?.items) {
      return items.map(item => ({...item}));
    }
    
    return items.map(item => {
      const matchedFifoItem = fifoData.items!.find(fi => fi?.product?.code === item.did);

      if (matchedFifoItem?.fifoProfit) {
        return {
          ...item,
          profit: matchedFifoItem.fifoProfit.grossProfit,
          profitMargin: matchedFifoItem.fifoProfit.profitMargin,
        };
      }
      return {...item};
    });
  }, [items, fifoData]);

  const isTableLoading = productDetailsLoading || orderLoading || fifoLoading;

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>項目</Typography>
        <Divider sx={{ mb: 2 }} />
        {productDetailsError && (
          <Typography color="error" sx={{ mb: 2 }}>{productDetailsError}</Typography>
        )}
        <ProductItemsTable
          items={processedItems}
          productDetails={productDetails}
          codeField="did"
          nameField="dname"
          quantityField="dquantity"
          priceField="dprice"
          totalCostField="dtotalCost"
          totalAmount={totalAmount}
          title=""
          isLoading={isTableLoading}
          showPackageQuantity={true}
          showBatchNumber={true}
        />
      </CardContent>
    </Card>
  );
};

export default ShippingOrderItemsTable;
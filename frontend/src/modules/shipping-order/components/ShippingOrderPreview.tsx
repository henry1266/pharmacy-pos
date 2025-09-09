import React, { FC } from 'react';
import ItemPreview from '../../../components/common/preview/ItemPreview';

// 定義項目介面
interface Item {
  _id?: string;
  dname?: string;
  name?: string;
  did?: string;
  id?: string;
  dquantity?: string | number;
  quantity?: string | number;
  dtotalCost?: string | number;
  totalCost?: string | number;
  [key: string]: any;
}

// 定義出貨單介面
interface ShippingOrder {
  _id?: string;
  items?: Item[];
  totalAmount?: number;
  [key: string]: any;
}

// 定義列配置介面
interface Column {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  render: (item: Item) => React.ReactNode;
}

// 定義組件 props 的介面
interface ShippingOrderPreviewProps {
  shippingOrder?: ShippingOrder;
  loading?: boolean;
  error?: string;
}

/**
 * 出貨單預覽組件
 * @param {ShippingOrderPreviewProps} props - 組件屬性
 * @returns {React.ReactElement} 出貨單預覽組件
 */
const ShippingOrderPreview: FC<ShippingOrderPreviewProps> = ({ shippingOrder, loading, error }) => {
  // 定義表格列配置
  const columns: Column[] = [
    { key: 'dname', label: '藥品名稱', render: (item) => item.dname || item.name },
    { key: 'did', label: '藥品代碼', render: (item) => item.did || item.id },
    { key: 'dquantity', label: '數量', align: 'right', render: (item) => item.dquantity || item.quantity },
    { key: 'dtotalCost', label: '金額', align: 'right', render: (item) => Number(item.dtotalCost || item.totalCost || 0).toLocaleString() }
  ];

  // 計算總計的函數
  const getTotal = (data: ShippingOrder): number => {
    return data.totalAmount ||
      (data.items?.reduce((sum, item) => sum + Number(item.dtotalCost || item.totalCost || 0), 0) || 0);
  };

  if (!shippingOrder && !loading && !error) {
    return null;
  }

  return (
    <ItemPreview
      data={shippingOrder || {} as ShippingOrder}
      loading={loading || false}
      {...(error && { error })}
      title="出貨單預覽"
      columns={columns}
      itemsKey="items"
      getTotal={getTotal}
      emptyText="無藥品項目"
      variant="table"
      containerProps={{
        sx: { width: 550, maxHeight: 600 }
      }}
    />
  );
};


export default ShippingOrderPreview;
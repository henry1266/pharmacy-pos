import React, { FC } from 'react';
import PropTypes from 'prop-types'; // Import PropTypes
import ItemPreview from '../common/preview/ItemPreview';

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
    { key: 'dtotalCost', label: '金額', align: 'right', render: (item) => (item.dtotalCost || item.totalCost || 0).toLocaleString() }
  ];

  // 計算總計的函數
  const getTotal = (data: ShippingOrder): number => {
    return data.totalAmount ||
      (data.items?.reduce((sum, item) => sum + Number(item.dtotalCost || item.totalCost || 0), 0) || 0);
  };

  return (
    <ItemPreview
      data={shippingOrder}
      loading={loading}
      error={error}
      title="出貨單預覽"
      columns={columns}
      itemsKey="items"
      getTotal={getTotal}
      emptyText="無藥品項目"
      variant="table"
      notesKey={null} // 使用自定義備註
      containerProps={{
        sx: { width: 550, maxHeight: 600 }
      }}
    />
  );
};

// Add prop types validation
ShippingOrderPreview.propTypes = {
  shippingOrder: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string,
} as any; // 使用 any 類型來避免 TypeScript 錯誤

export default ShippingOrderPreview;
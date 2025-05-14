import React from 'react';
import ItemPreview from '../common/preview/ItemPreview';
/**
 * 出貨單預覽組件
 * @param {Object} props - 組件屬性
 * @param {Object} props.shippingOrder - 出貨單數據
 * @param {boolean} props.loading - 是否正在加載
 * @param {string} props.error - 錯誤信息
 * @returns {React.ReactElement} 出貨單預覽組件
 */
const ShippingOrderPreview = ({ shippingOrder, loading, error }) => {
  // 定義表格列配置
  const columns = [
    { key: 'dname', label: '藥品名稱', render: (item) => item.dname || item.name },
    { key: 'did', label: '藥品代碼', render: (item) => item.did || item.id },
    { key: 'dquantity', label: '數量', align: 'right', render: (item) => item.dquantity || item.quantity },
    { key: 'dtotalCost', label: '金額', align: 'right', render: (item) => (item.dtotalCost || item.totalCost || 0).toLocaleString() }
  ];

  // 計算總計的函數
  const getTotal = (data) => {
    return data.totalAmount || 
      (data.items && data.items.reduce((sum, item) => sum + Number(item.dtotalCost || item.totalCost || 0), 0));
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

export default ShippingOrderPreview;

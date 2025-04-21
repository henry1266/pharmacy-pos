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

  // 獲取狀態顯示文本
  const getStatusText = (status) => {
    const statusMap = {
      'pending': '處理中',
      'shipped': '已出貨',
      'delivered': '已送達',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  };

  // 自定義備註內容
  const getNotes = (data) => {
    if (!data) return '';
    
    let notes = data.notes || '';
    
    // 添加收件人信息
    if (data.recipient) {
      notes = `收件人: ${data.recipient}\n${notes ? notes + '\n' : ''}`;
    }
    
    // 添加狀態信息
    if (data.status) {
      notes = `${notes ? notes + '\n' : ''}狀態: ${getStatusText(data.status)}`;
    }
    
    return notes;
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
      notes={shippingOrder ? getNotes(shippingOrder) : ''}
      notesKey={null} // 使用自定義備註
      containerProps={{
        sx: { width: 550, maxHeight: 600 }
      }}
    />
  );
};

export default ShippingOrderPreview;

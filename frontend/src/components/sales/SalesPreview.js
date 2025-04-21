import React from 'react';
import ItemPreview from '../common/preview/ItemPreview';

/**
 * 銷售訂單預覽組件
 * @param {Object} props - 組件屬性
 * @param {Object} props.sale - 銷售訂單數據
 * @param {boolean} props.loading - 是否正在加載
 * @param {string} props.error - 錯誤信息
 * @returns {React.ReactElement} 銷售訂單預覽組件
 */
const SalesPreview = ({ sale, loading, error }) => {
  // 定義表格列配置
  const columns = [
    { key: 'name', label: '產品名稱', render: (item) => item.product?.name || item.name },
    { key: 'quantity', label: '數量', align: 'right', render: (item) => item.quantity },
    { key: 'price', label: '單價', align: 'right', render: (item) => item.price?.toFixed(2) || '0.00' },
    { key: 'amount', label: '金額', align: 'right', render: (item) => (item.amount || (item.price * item.quantity))?.toFixed(2) || '0.00' }
  ];

  // 計算總計的函數
  const getTotal = (data) => {
    return data.totalAmount || 
      (data.items && data.items.reduce((sum, item) => sum + (item.amount || (item.price * item.quantity) || 0), 0));
  };

  // 獲取付款方式顯示文本
  const getPaymentMethodText = (method) => {
    const methodMap = {
      'cash': '現金',
      'credit_card': '信用卡',
      'debit_card': '金融卡',
      'mobile_payment': '行動支付',
      'other': '其他'
    };
    return methodMap[method] || method;
  };

  // 獲取付款狀態顯示文本
  const getPaymentStatusText = (status) => {
    const statusMap = {
      'paid': '已付款',
      'pending': '待付款',
      'partial': '部分付款',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  };

  // 自定義備註內容
  const getNotes = (data) => {
    if (!data) return '';
    
    let notes = data.notes || '';
    
    // 添加客戶信息
    if (data.customer?.name) {
      notes = `客戶: ${data.customer.name}\n${notes ? notes + '\n' : ''}`;
    }
    
    // 添加付款信息
    if (data.paymentMethod || data.paymentStatus) {
      const paymentInfo = [
        data.paymentMethod ? `付款方式: ${getPaymentMethodText(data.paymentMethod)}` : '',
        data.paymentStatus ? `付款狀態: ${getPaymentStatusText(data.paymentStatus)}` : ''
      ].filter(Boolean).join(' | ');
      
      notes = `${notes ? notes + '\n' : ''}${paymentInfo}`;
    }
    
    return notes;
  };

  return (
    <ItemPreview
      data={sale}
      loading={loading}
      error={error}
      title="銷售訂單詳情"
      columns={columns}
      itemsKey="items"
      getTotal={getTotal}
      emptyText="沒有產品項目"
      variant="table"
      notes={sale ? getNotes(sale) : ''}
      notesKey={null} // 使用自定義備註
      containerProps={{
        sx: { width: 550, maxHeight: 600 }
      }}
    />
  );
};

export default SalesPreview;

import React from 'react';
import ItemPreview from '../common/preview/ItemPreview';
import { Customer } from '../../types/entities';

// 定義銷售項目的型別
interface SaleItem {
  product?: {
    name: string;
  };
  name?: string;
  quantity: number;
  price: number;
  amount?: number;
}

// 擴展 Sale 型別以包含可能的額外屬性
interface ExtendedSale {
  _id?: string;
  saleNumber?: string;
  date?: string | Date;
  items?: SaleItem[];
  totalAmount?: number;
  customer?: Customer | { name: string };
  paymentMethod?: string;
  paymentStatus?: string;
  status?: 'completed' | 'pending' | 'cancelled';
  notes?: string;
  createdBy?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// 定義表格列的型別
interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  render: (item: SaleItem) => string | number;
}

interface SalesPreviewProps {
  sale?: ExtendedSale | null;
  loading?: boolean;
  error?: string | null;
}

/**
 * 銷售訂單預覽組件
 */
const SalesPreview: React.FC<SalesPreviewProps> = ({ sale, loading, error }) => {
  // 定義表格列配置
  const columns: TableColumn[] = [
    { key: 'name', label: '產品名稱', render: (item) => item.product?.name || item.name || '' },
    { key: 'quantity', label: '數量', align: 'right', render: (item) => item.quantity },
    { key: 'price', label: '單價', align: 'right', render: (item) => item.price?.toFixed(2) || '0.00' },
    { key: 'amount', label: '金額', align: 'right', render: (item) => (item.price * item.quantity)?.toFixed(2) || '0.00' }
  ];

  // 計算總計的函數
  const getTotal = (data: ExtendedSale): number => {
    return data.totalAmount || 
      (data.items?.reduce((sum, item) => sum + (item.amount || (item.price * item.quantity) || 0), 0) || 0);
  };

  // 獲取付款方式顯示文本
  const getPaymentMethodText = (method: string): string => {
    const methodMap: { [key: string]: string } = {
      'cash': '現金',
      'credit_card': '信用卡',
      'debit_card': '金融卡',
      'mobile_payment': '行動支付',
      'other': '其他'
    };
    return methodMap[method] || method;
  };

  // 獲取付款狀態顯示文本
  const getPaymentStatusText = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'paid': '已付款',
      'pending': '待付款',
      'partial': '部分付款',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  };

  // 自定義備註內容
  const getNotes = (data: ExtendedSale): string => {
    if (!data) return '';
    
    let notes = data.notes || '';
    
    // 添加客戶信息
    if (data.customer && typeof data.customer === 'object' && 'name' in data.customer) {
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
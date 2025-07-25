import React from 'react';
import { Chip, Typography } from '@mui/material';
import { LocalShipping as LocalShippingIcon, Business as BusinessIcon } from '@mui/icons-material';
import type { ShippingOrder } from '@pharmacy-pos/shared/types/entities';
import { shippingOrderServiceV2 } from '../../../services/shippingOrderServiceV2';
import {
  DailyPanel,
  DailyPanelConfig,
  ItemSummary,
  ItemDetailHeader,
  ItemList,
  DetailLink,
  createDateFilter,
  getSupplierName,
  getProductName,
  formatDate,
  convertToStandardItems,
  DAILY_PANEL_STYLES
} from './shared';

interface DailyShippingPanelProps {
  shippingOrders: ShippingOrder[];
  loading: boolean;
  error: string | null;
  targetDate: string; // 目標日期，用於過濾
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onShippingOrderClick?: (shippingOrder: ShippingOrder) => void;
  // 新增萬用字元搜尋相關屬性
  wildcardMode?: boolean;
  onWildcardModeChange?: (enabled: boolean) => void;
}

// 出貨單總金額計算器
const calculateShippingTotal = (orders: ShippingOrder[]): number => {
  return orders.reduce((sum, order) => {
    return sum + (order.items?.reduce((itemSum, item) => itemSum + (item.quantity * item.price), 0) || 0);
  }, 0);
};

// 配置出貨面板
const createShippingConfig = (onShippingOrderClick?: (order: ShippingOrder) => void): DailyPanelConfig<ShippingOrder> => ({
  title: '當日出貨',
  icon: <LocalShippingIcon />,
  iconColor: 'success.main',
  loadingText: '載入出貨單記錄中...',
  emptyText: '出貨單記錄',
  searchPlaceholder: '搜索出貨單記錄...',
  
  // 資料處理函數
  filterItemsForDate: createDateFilter<ShippingOrder>(
    (order) => order.shippingDate
  ),
  getSearchableFields: (order: ShippingOrder): string[] => [
    getSupplierName(order.supplier),
    order.items.map(item => getProductName(item.product)).join(' '),
    String(order._id ?? ''),
    String(order.orderNumber ?? ''),
    formatDate(order.shippingDate, 'yyyy-MM-dd')
  ],
  calculateTotalAmount: calculateShippingTotal,
  
  // 渲染函數
  renderItemSummary: (order: ShippingOrder) => {
    const orderTotal = order.items?.reduce((sum, item) => sum + (item.quantity * item.price), 0) || 0;
    
    return (
      <ItemSummary
        orderNumber={order.orderNumber}
        amount={orderTotal}
        amountColor="success.main"
        rightContent={
          <>
            <Typography
              variant="caption"
              color="textSecondary"
              sx={{
                ...DAILY_PANEL_STYLES.typography.small,
                ...DAILY_PANEL_STYLES.typography.ellipsis,
                maxWidth: '80px'
              }}
            >
              {getSupplierName(order.supplier)}
            </Typography>
            <Chip
              label={shippingOrderServiceV2.formatOrderStatus(order.status || 'pending')}
              color={order.status === 'completed' ? 'success' : order.status === 'cancelled' ? 'error' : 'warning'}
              size="small"
              sx={DAILY_PANEL_STYLES.chip.medium}
            />
          </>
        }
      />
    );
  },
  
  renderItemDetails: (order: ShippingOrder) => (
    <>
      {/* 供應商和狀態資訊 */}
      <ItemDetailHeader
        icon={<BusinessIcon />}
        text={getSupplierName(order.supplier)}
        rightContent={
          <>
            <Chip
              label={shippingOrderServiceV2.formatOrderStatus(order.status || 'pending')}
              color={order.status === 'completed' ? 'success' : order.status === 'cancelled' ? 'error' : 'warning'}
              size="small"
              variant="outlined"
              sx={DAILY_PANEL_STYLES.chip.small}
            />
            <Chip
              label={shippingOrderServiceV2.formatPaymentStatus(order.paymentStatus || '未收')}
              color={order.paymentStatus === '已收款' ? 'success' : order.paymentStatus === '已開立' ? 'info' : 'warning'}
              size="small"
              sx={DAILY_PANEL_STYLES.chip.small}
            />
          </>
        }
      />
      
      {/* 商品明細 */}
      <ItemList
        title="商品明細"
        items={convertToStandardItems(order.items)}
      />

      {/* 詳情連結 */}
      <DetailLink
        href={`/shipping-orders/${order._id}`}
        onClick={(e) => {
          if (onShippingOrderClick) {
            e.preventDefault();
            onShippingOrderClick(order);
          }
        }}
      />
    </>
  )
});

const DailyShippingPanel: React.FC<DailyShippingPanelProps> = ({
  shippingOrders,
  loading,
  error,
  targetDate,
  searchTerm,
  onSearchChange,
  onShippingOrderClick,
  wildcardMode = false,
  onWildcardModeChange
}) => {
  const config = React.useMemo(() => createShippingConfig(onShippingOrderClick), [onShippingOrderClick]);

  return (
    <DailyPanel
      items={shippingOrders}
      loading={loading}
      error={error}
      targetDate={targetDate}
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      wildcardMode={wildcardMode}
      onWildcardModeChange={onWildcardModeChange}
      onItemClick={onShippingOrderClick}
      config={config}
    />
  );
};

export default DailyShippingPanel;
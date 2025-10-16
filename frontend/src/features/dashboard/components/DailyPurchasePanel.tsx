import React from 'react';
import { Chip, Typography } from '@mui/material';
import { ShoppingCart as ShoppingCartIcon, Business as BusinessIcon } from '@mui/icons-material';
import type { PurchaseOrder } from '@pharmacy-pos/shared/types/entities';
import {
  DailyPanel,
  DailyPanelConfig,
  ItemSummary,
  ItemDetailHeader,
  ItemList,
  DetailLink,
  createDateFilter,
  createSearchFieldsExtractor,
  createTotalAmountCalculator,
  getSupplierName,
  getProductName,
  formatDate,
  convertToStandardItems,
  DAILY_PANEL_STYLES
} from '.';

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: '待處理',
  approved: '已核准',
  received: '已接收',
  completed: '已完成',
  cancelled: '已取消',
};

const ORDER_STATUS_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  pending: 'warning',
  approved: 'info',
  received: 'primary',
  completed: 'success',
  cancelled: 'error',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  '未付': '未付款',
  '已付款': '已付款',
  '已下收': '已下收',
  '已匯款': '已匯款',
};

const PAYMENT_STATUS_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  '未付': 'error',
  '已付款': 'primary',
  '已下收': 'warning',
  '已匯款': 'success',
};

const formatOrderStatus = (status?: string) => ORDER_STATUS_LABELS[status ?? ''] ?? (status ?? '');
const getStatusColor = (status?: string) => ORDER_STATUS_COLORS[status ?? ''] ?? 'default';
const formatPaymentStatus = (status?: string) => PAYMENT_STATUS_LABELS[status ?? ''] ?? (status ?? '');
const getPaymentStatusColor = (status?: string) => PAYMENT_STATUS_COLORS[status ?? ''] ?? 'default';

interface DailyPurchasePanelProps {
  purchaseOrders: PurchaseOrder[];
  loading: boolean;
  error: string | null;
  targetDate: string; // 目標日期，用於過濾
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onPurchaseOrderClick?: (purchaseOrder: PurchaseOrder) => void;
  // 新增萬用字元搜尋相關屬性
  wildcardMode?: boolean;
  onWildcardModeChange?: (enabled: boolean) => void;
}

// 配置進貨面板
const createPurchaseConfig = (onPurchaseOrderClick?: (order: PurchaseOrder) => void): DailyPanelConfig<PurchaseOrder> => ({
  title: '當日進貨',
  icon: <ShoppingCartIcon />,
  iconColor: 'primary.main',
  loadingText: '載入進貨單記錄中...',
  emptyText: '進貨單記錄',
  searchPlaceholder: '搜索進貨單記錄...',
  
  // 資料處理函數
  filterItemsForDate: createDateFilter<PurchaseOrder>(
    (order) => order.orderDate
  ),
  getSearchableFields: createSearchFieldsExtractor<PurchaseOrder>([
    (order) => getSupplierName(order.supplier),
    (order) => order.items.map(item => getProductName(item.product)).join(' '),
    (order) => String(order._id ?? ''),
    (order) => String(order.orderNumber ?? ''),
    (order) => formatDate(order.orderDate, 'yyyy-MM-dd')
  ]),
  calculateTotalAmount: createTotalAmountCalculator<PurchaseOrder>(
    (order) => order.totalAmount || 0
  ),
  
  // 渲染函數
  renderItemSummary: (order: PurchaseOrder) => (
    <ItemSummary
      orderNumber={order.orderNumber}
      amount={order.totalAmount || 0}
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
            label={formatPaymentStatus(order.paymentStatus || '未付')}
            color={getPaymentStatusColor(order.paymentStatus || '未付')}
            size="small"
            sx={DAILY_PANEL_STYLES.chip.medium}
          />
        </>
      }
    />
  ),
  
  renderItemDetails: (order: PurchaseOrder) => (
    <>
      {/* 廠商和狀態資訊 */}
      <ItemDetailHeader
        icon={<BusinessIcon />}
        text={getSupplierName(order.supplier)}
        rightContent={
          <>
            <Chip
              label={formatOrderStatus(order.status)}
              color={getStatusColor(order.status)}
              size="small"
              variant="outlined"
              sx={DAILY_PANEL_STYLES.chip.small}
            />
            <Chip
              label={formatPaymentStatus(order.paymentStatus || '未付')}
              color={getPaymentStatusColor(order.paymentStatus || '未付')}
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
        href={`/purchase-orders/${order._id}`}
        onClick={(e) => {
          if (onPurchaseOrderClick) {
            e.preventDefault();
            onPurchaseOrderClick(order);
          }
        }}
      />
    </>
  )
});

const DailyPurchasePanel: React.FC<DailyPurchasePanelProps> = ({
  purchaseOrders,
  loading,
  error,
  targetDate,
  searchTerm,
  onSearchChange,
  onPurchaseOrderClick,
  wildcardMode = false,
  onWildcardModeChange
}) => {
  const config = React.useMemo(() => createPurchaseConfig(onPurchaseOrderClick), [onPurchaseOrderClick]);

  return (
    <DailyPanel
      items={purchaseOrders}
      loading={loading}
      error={error}
      targetDate={targetDate}
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      wildcardMode={wildcardMode}
      {...(onWildcardModeChange && { onWildcardModeChange })}
      {...(onPurchaseOrderClick && { onItemClick: onPurchaseOrderClick })}
      config={config}
    />
  );
};

export default DailyPurchasePanel;
import React from 'react';
import { Chip, Typography } from '@mui/material';
import { ShoppingCart as ShoppingCartIcon, Business as BusinessIcon } from '@mui/icons-material';
import type { PurchaseOrder } from '@pharmacy-pos/shared/types/entities';
import { purchaseOrderServiceV2 } from '../../../services/purchaseOrderServiceV2';
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
} from './shared';

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
            label={purchaseOrderServiceV2.formatPaymentStatus(order.paymentStatus || '未付')}
            color={purchaseOrderServiceV2.getPaymentStatusColor(order.paymentStatus || '未付')}
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
              label={purchaseOrderServiceV2.formatOrderStatus(order.status)}
              color={purchaseOrderServiceV2.getStatusColor(order.status)}
              size="small"
              variant="outlined"
              sx={DAILY_PANEL_STYLES.chip.small}
            />
            <Chip
              label={purchaseOrderServiceV2.formatPaymentStatus(order.paymentStatus || '未付')}
              color={purchaseOrderServiceV2.getPaymentStatusColor(order.paymentStatus || '未付')}
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
      onWildcardModeChange={onWildcardModeChange}
      onItemClick={onPurchaseOrderClick}
      config={config}
    />
  );
};

export default DailyPurchasePanel;
import React from 'react';
import { Chip, Typography } from '@mui/material';
import { Receipt as ReceiptIcon, Person as PersonIcon } from '@mui/icons-material';
import {
  DailyPanel,
  DailyPanelConfig,
  ItemSummary,
  ItemDetailHeader,
  ItemList,
  DetailLink,
  createSalesDateFilter,
  createSearchFieldsExtractor,
  createTotalAmountCalculator,
  getCustomerName,
  getProductName,
  formatDate,
  getPaymentMethodText,
  getPaymentStatusInfo,
  convertToStandardItems,
  DAILY_PANEL_STYLES
} from '@components/dashboard/panels/shared';

// 支援兩種不同的 Sale 型別
type SaleFromHook = import('@/hooks/useSalesListData').Sale;
type SaleFromShared = import('@pharmacy-pos/shared/types/entities').Sale;

// 創建一個聯合型別來支援兩種 Sale 型別
export type Sale = SaleFromHook | SaleFromShared;

export interface DailySalesPanelProps {
  sales: Sale[];
  loading: boolean;
  error: string | null;
  targetDate: string; // 目標日期，用於過濾
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSaleClick?: (sale: Sale) => void;
  // 新增萬用字元搜尋相關屬性
  wildcardMode?: boolean;
  onWildcardModeChange?: (enabled: boolean) => void;
}

// 配置銷售面板
const createSalesConfig = (onSaleClick?: (sale: Sale) => void): DailyPanelConfig<Sale> => ({
  title: '當日銷售',
  icon: <ReceiptIcon />,
  iconColor: 'primary.main',
  loadingText: '載入銷售記錄中...',
  emptyText: '銷售記錄',
  searchPlaceholder: '搜索銷售記錄...',
  
  // 資料處理函數
  filterItemsForDate: createSalesDateFilter<Sale>(),
  getSearchableFields: createSearchFieldsExtractor<Sale>([
    (sale) => getCustomerName(sale.customer),
    (sale) => sale.items.map(item => getProductName(item.product)).join(' '),
    (sale) => String(sale._id ?? ''),
    (sale) => String(sale.saleNumber ?? ''),
    (sale) => formatDate(sale.date, 'yyyy-MM-dd')
  ]),
  calculateTotalAmount: createTotalAmountCalculator<Sale>(
    (sale) => sale.totalAmount || 0
  ),
  
  // 渲染函數
  renderItemSummary: (sale: Sale) => (
    <ItemSummary
      orderNumber={sale.saleNumber || ''}
      amount={sale.totalAmount || 0}
      rightContent={
        <Typography
          variant="caption"
          color="textSecondary"
          sx={{
            ...DAILY_PANEL_STYLES.typography.medium,
            ...DAILY_PANEL_STYLES.typography.ellipsis,
            textAlign: 'right',
            flexShrink: 0
          }}
        >
          {formatDate(sale.date)}
        </Typography>
      }
    />
  ),
  
  renderItemDetails: (sale: Sale) => (
    <>
      {/* 客戶和付款資訊 */}
      <ItemDetailHeader
        icon={<PersonIcon />}
        text={getCustomerName(sale.customer)}
        rightContent={
          <>
            <Chip
              label={getPaymentMethodText(sale.paymentMethod)}
              size="small"
              variant="outlined"
              sx={DAILY_PANEL_STYLES.chip.small}
            />
            <Chip
              label={getPaymentStatusInfo(sale.paymentStatus || 'pending').text}
              color={getPaymentStatusInfo(sale.paymentStatus || 'pending').color}
              size="small"
              sx={DAILY_PANEL_STYLES.chip.small}
            />
          </>
        }
      />
      
      {/* 商品明細 */}
      <ItemList
        title="商品明細"
        items={convertToStandardItems(sale.items)}
      />

      {/* 詳情連結 */}
      <DetailLink
        href={`/sales/${sale._id}`}
        onClick={(e) => {
          if (onSaleClick) {
            e.preventDefault();
            onSaleClick(sale);
          }
        }}
      />
    </>
  )
});

/**
 * 當日銷售面板
 * 顯示當日的銷售記錄
 */
const DailySalesPanel: React.FC<DailySalesPanelProps> = ({
  sales,
  loading,
  error,
  targetDate,
  searchTerm,
  onSearchChange,
  onSaleClick,
  wildcardMode = false,
  onWildcardModeChange
}) => {
  const config = React.useMemo(() => createSalesConfig(onSaleClick), [onSaleClick]);

  return (
    <DailyPanel
      items={sales}
      loading={loading}
      error={error}
      targetDate={targetDate}
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      wildcardMode={wildcardMode}
      {...(onWildcardModeChange && { onWildcardModeChange })}
      {...(onSaleClick && { onItemClick: onSaleClick })}
      config={config}
    />
  );
};

export { DailySalesPanel };
export default DailySalesPanel;
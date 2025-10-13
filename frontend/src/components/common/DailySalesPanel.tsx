import React from 'react';
import { Chip, Typography } from '@mui/material';
import { Receipt as ReceiptIcon, Person as PersonIcon } from '@mui/icons-material';
import type { Sale } from '@pharmacy-pos/shared/types/entities';
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
} from './daily-panel';

// 最小化型別以相容 shared 與 hooks 兩種 Sale 來源
export type SaleLike = {
  _id: string;
  saleNumber?: string;
  totalAmount?: number;
  date?: string | Date;
  paymentMethod?: string;
  paymentStatus?: string;
  customer?: any;
  items?: any[];
};

type DailySaleInput = SaleLike | Sale | Record<string, any>;

export interface DailySalesPanelProps {
  sales: DailySaleInput[];
  loading: boolean;
  error: string | null;
  targetDate: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSaleClick?: (sale: SaleLike) => void;
  wildcardMode?: boolean;
  onWildcardModeChange?: (enabled: boolean) => void;
}

const normalizeSale = (sale: DailySaleInput): SaleLike => {
  const source = sale as Record<string, unknown>;
  const normalized: SaleLike = {
    _id: typeof source._id === 'string' ? source._id : String(source._id ?? ''),
    items: Array.isArray(source.items) ? (source.items as any[]) : [],
    customer: source.customer,
  };

  if (typeof source.saleNumber === 'string') {
    normalized.saleNumber = source.saleNumber;
  }
  if (typeof source.totalAmount === 'number') {
    normalized.totalAmount = source.totalAmount;
  }
  if (source.date !== undefined) {
    normalized.date = source.date as string | Date;
  }
  if (typeof source.paymentMethod === 'string') {
    normalized.paymentMethod = source.paymentMethod;
  }
  if (typeof source.paymentStatus === 'string') {
    normalized.paymentStatus = source.paymentStatus;
  }

  return normalized;
};

const createSalesConfig = (onSaleClick?: (sale: SaleLike) => void): DailyPanelConfig<SaleLike> => ({
  title: '今日銷售',
  icon: <ReceiptIcon />,
  iconColor: 'primary.main',
  loadingText: '載入銷售紀錄中...',
  emptyText: '銷售紀錄',
  searchPlaceholder: '搜尋銷售紀錄...',
  
  filterItemsForDate: createSalesDateFilter<SaleLike>(),
  getSearchableFields: createSearchFieldsExtractor<SaleLike>([
    (sale) => getCustomerName(sale.customer),
    (sale) => (sale.items || []).map((item: any) => getProductName(item.product)).join(' '),
    (sale) => String(sale._id ?? ''),
    (sale) => String(sale.saleNumber ?? ''),
    (sale) => formatDate(sale.date, 'yyyy-MM-dd')
  ]),
  calculateTotalAmount: createTotalAmountCalculator<SaleLike>(
    (sale) => sale.totalAmount || 0
  ),
  
  renderItemSummary: (sale: SaleLike, _isExpanded: boolean, _onToggle: () => void) => (
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
  
  renderItemDetails: (sale: SaleLike) => (
    <>
      <ItemDetailHeader
        icon={<PersonIcon />}
        text={getCustomerName(sale.customer)}
        rightContent={
          <>
            <Chip
              label={getPaymentMethodText(sale.paymentMethod || '')}
              size="small"
              variant="outlined"
              sx={DAILY_PANEL_STYLES.chip.small}
            />
            <Chip
              label={getPaymentStatusInfo((sale.paymentStatus || 'pending') as string).text}
              color={getPaymentStatusInfo((sale.paymentStatus || 'pending') as string).color}
              size="small"
              sx={DAILY_PANEL_STYLES.chip.small}
            />
          </>
        }
      />
      
      <ItemList
        title="明細"
        items={convertToStandardItems(sale.items || [])}
      />

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
  const normalizedSales = React.useMemo(() => sales.map(normalizeSale), [sales]);
  const config = React.useMemo(() => createSalesConfig(onSaleClick), [onSaleClick]);

  return (
    <DailyPanel
      items={normalizedSales}
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

export default DailySalesPanel;

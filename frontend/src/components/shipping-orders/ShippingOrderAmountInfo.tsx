import React from 'react';
import {
  CircularProgress,
  Box,
  Typography
} from '@mui/material';
import {
  AccountBalanceWallet as AccountBalanceWalletIcon,
  ReceiptLong as ReceiptLongIcon,
  MonetizationOn as MonetizationOnIcon,
  TrendingUp as TrendingUpIcon,
  Percent as PercentIcon
} from '@mui/icons-material';
import CollapsibleAmountInfo from '../common/CollapsibleAmountInfo';
import { createDetailItem } from './shared/utils';

interface ShippingOrder {
  totalAmount?: number;
  discountAmount?: number;
  [key: string]: any;
}

interface FifoData {
  summary?: {
    totalCost?: number;
    totalProfit?: number;
    totalProfitMargin?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

interface CollapsibleDetail {
  label: string;
  value: any;
  icon?: React.ReactElement;
  color?: string;
  fontWeight?: string;
  condition: boolean;
  valueFormatter?: (val: any) => string;
  customContent?: React.ReactNode;
}

interface ShippingOrderAmountInfoProps {
  shippingOrder: ShippingOrder;
  fifoData: FifoData | null;
  fifoLoading: boolean;
  fifoError: string | null;
  orderLoading?: boolean;
}

const ShippingOrderAmountInfo: React.FC<ShippingOrderAmountInfoProps> = ({
  shippingOrder,
  fifoData,
  fifoLoading,
  fifoError,
  orderLoading = false
}) => {
  const getCollapsibleDetails = (): CollapsibleDetail[] => {
    const details: CollapsibleDetail[] = [];
    const subtotal = (shippingOrder.totalAmount ?? 0) + (shippingOrder.discountAmount ?? 0);

    // 小計項目
    details.push(createDetailItem('小計', subtotal, {
      icon: <ReceiptLongIcon color="action" fontSize="small" />,
      valueFormatter: val => val.toFixed(2)
    }));

    // 折扣項目（條件性顯示）
    if (shippingOrder.discountAmount && shippingOrder.discountAmount > 0) {
      details.push(createDetailItem('折扣', -shippingOrder.discountAmount, {
        icon: <PercentIcon color="secondary" fontSize="small" />,
        color: 'secondary.main',
        valueFormatter: val => val.toFixed(2)
      }));
    }

    // FIFO 相關項目
    if (!fifoLoading && fifoData?.summary) {
      // 總成本
      details.push(createDetailItem('總成本', fifoData.summary.totalCost, {
        icon: <MonetizationOnIcon color="action" fontSize="small"/>,
        valueFormatter: val => typeof val === 'number' ? val.toFixed(2) : 'N/A'
      }));
      
      // 總毛利
      const totalProfit = fifoData.summary.totalProfit ?? 0;
      details.push(createDetailItem('總毛利', totalProfit, {
        icon: <TrendingUpIcon color={totalProfit >= 0 ? 'success' : 'error'} fontSize="small"/>,
        color: totalProfit >= 0 ? 'success.main' : 'error.main',
        fontWeight: 'bold',
        valueFormatter: val => typeof val === 'number' ? val.toFixed(2) : 'N/A'
      }));
      
      // 毛利率
      const profitMarginStr = fifoData.summary.totalProfitMargin ?? '0';
      const profitMargin = parseFloat(profitMarginStr);
      details.push(createDetailItem('毛利率', profitMarginStr, {
        icon: <PercentIcon color={profitMargin >= 0 ? 'success' : 'error'} fontSize="small"/>,
        color: profitMargin >= 0 ? 'success.main' : 'error.main',
        fontWeight: 'bold'
      }));
    } else if (fifoLoading) {
      // 載入中狀態
      details.push(createDetailItem('毛利資訊', '', {
        customContent: (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CircularProgress size={16} sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">計算中...</Typography>
          </Box>
        )
      }));
    } else if (fifoError) {
      // 錯誤狀態
      details.push(createDetailItem('毛利資訊', '', {
        customContent: <Typography variant="body2" color="error">{fifoError}</Typography>
      }));
    }

    return details;
  };

  return (
    <CollapsibleAmountInfo
      title="金額信息"
      titleIcon={<AccountBalanceWalletIcon />}
      mainAmountLabel="總金額"
      mainAmountValue={shippingOrder.totalAmount ?? 0}
      mainAmountIcon={<ReceiptLongIcon />}
      collapsibleDetails={getCollapsibleDetails()}
      initialOpenState={true}
      isLoading={orderLoading}
    />
  );
};

export default ShippingOrderAmountInfo;
/**
 * @file 銷售信息側邊欄組件
 * @description 顯示銷售詳情頁面中的基本信息側邊欄
 */

import React, { FC } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Divider,
  Stack,
  Chip,
} from '@mui/material';
import {
  Info as InfoIcon,
  Person as PersonIcon,
  CalendarToday as CalendarTodayIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { PaymentStatusIconType } from '../../types/detail';
import { SaleInfoSidebarProps } from '../../types/detail';
import {
  getPaymentMethodText,
  getPaymentStatusInfo,
} from '../../utils/paymentUtils';

/**
 * 根據圖標類型獲取對應的圖標組件
 *
 * @param iconType - 圖標類型
 * @returns 對應的圖標組件
 */
const getIconByType = (iconType: PaymentStatusIconType) => {
  switch (iconType) {
    case 'CheckCircle':
      return <CheckCircleIcon fontSize="small" />;
    case 'Pending':
      return <PendingIcon fontSize="small" />;
    case 'AccountBalanceWallet':
      return <AccountBalanceWalletIcon fontSize="small" />;
    case 'Cancel':
      return <CancelIcon fontSize="small" />;
    case 'Info':
    default:
      return <InfoIcon fontSize="small" />;
  }
};

/**
 * 銷售信息側邊欄組件
 * 顯示銷售詳情頁面中的基本信息，包括銷售單號、客戶、付款方式、付款狀態和備註
 */
const SaleInfoSidebar: FC<SaleInfoSidebarProps> = ({ sale }) => {
  const paymentStatus = sale.paymentStatus ?? 'pending';
  const paymentStatusInfo = getPaymentStatusInfo(paymentStatus);

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <InfoIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          基本信息
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarTodayIcon fontSize="small" color="action" />
            <Typography variant="body2">
              銷售單號: {sale.saleNumber ?? 'N/A'}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <PersonIcon fontSize="small" color="action" />
            <Typography variant="body2">
              客戶: {sale.customer?.name ?? '一般客戶'}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <PaymentIcon fontSize="small" color="action" />
            <Typography variant="body2">
              付款方式: {getPaymentMethodText(sale.paymentMethod)}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            {getIconByType(paymentStatusInfo.iconType)}
            <Typography variant="body2">
              付款狀態:
              <Chip
                label={paymentStatusInfo.text}
                color={paymentStatusInfo.color || 'default'}
                size="small"
                sx={{ ml: 1 }}
              />
            </Typography>
          </Stack>
          <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>
            備註:
          </Typography>
          <Typography
            variant="body2"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {sale.notes ?? '無'}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default SaleInfoSidebar;

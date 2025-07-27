import React from 'react';
import {
  Typography,
  Card,
  CardContent,
  Divider,
  Stack
} from '@mui/material';
import {
  CalendarToday as CalendarTodayIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Info as InfoIcon,
  CurrencyExchange as CurrencyExchangeIcon
} from '@mui/icons-material';
import { format, isValid } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import StatusChip from '../common/StatusChip';
import PaymentStatusChip from '../common/PaymentStatusChip';

interface ShippingOrder {
  soid?: string;
  status?: string;
  paymentStatus?: string;
  customer?: {
    name?: string;
    [key: string]: any;
  } | string;
  sosupplier?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

interface ShippingOrderBasicInfoProps {
  shippingOrder: ShippingOrder;
}


const formatDateSafe = (dateValue: string | Date | null | undefined, formatString: string = 'yyyy-MM-dd HH:mm'): string => {
  if (!dateValue) return 'N/A';
  const date = new Date(dateValue);
  return isValid(date) ? format(date, formatString, { locale: zhTW }) : 'N/A';
};

const ShippingOrderBasicInfo: React.FC<ShippingOrderBasicInfoProps> = ({ shippingOrder }) => {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <InfoIcon sx={{ verticalAlign: 'middle', mr: 1 }}/>
          基本信息
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <ReceiptIcon fontSize="small" color="action"/>
            <Typography variant="body2">單號: {shippingOrder.soid ?? 'N/A'}</Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <PersonIcon fontSize="small" color="action"/>
            <Typography variant="body2">客戶: {
              typeof shippingOrder.customer === 'object'
                ? shippingOrder.customer?.name
                : shippingOrder.customer ?? shippingOrder.sosupplier ?? '未指定'
            }</Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <InfoIcon fontSize="small" color="action"/>
            <Typography variant="body2">狀態: <StatusChip status={shippingOrder.status || ''} /></Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <CurrencyExchangeIcon fontSize="small" color="action"/>
            <Typography variant="body2">付款狀態: <PaymentStatusChip status={shippingOrder.paymentStatus} /></Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarTodayIcon fontSize="small" color="action"/>
            <Typography variant="body2">建立日期: {formatDateSafe(shippingOrder.createdAt)}</Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarTodayIcon fontSize="small" color="action"/>
            <Typography variant="body2">更新日期: {formatDateSafe(shippingOrder.updatedAt)}</Typography>
          </Stack>
          <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>備註:</Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {shippingOrder.notes ?? '無'}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default ShippingOrderBasicInfo;
import React from 'react';
import { Button, IconButton } from '@mui/material';
import { Print as PrintIcon, Edit as EditIcon, PrintOutlined as PrintOutlinedIcon, Lock as LockIcon } from '@mui/icons-material';
import { downloadShippingOrderPdf, downloadShippingOrderPdfV2 } from '../../services/pdf/shippingOrderPdf';

interface ShippingOrder {
  soid?: string;
  status?: string;
  [key: string]: any;
}

interface ShippingOrderActionsProps {
  shippingOrder: ShippingOrder | null;
  orderId?: string;
  orderLoading: boolean;
  productDetailsLoading: boolean;
  fifoLoading: boolean;
  onEdit: () => void;
  onUnlock?: () => void;
}

export const useShippingOrderActions = ({
  shippingOrder,
  orderId,
  orderLoading,
  productDetailsLoading,
  fifoLoading,
  onEdit,
  onUnlock
}: ShippingOrderActionsProps): React.ReactNode[] => {
  const handlePrintClick = async () => {
    try {
      if (!shippingOrder || !orderId) return;
      await downloadShippingOrderPdf(orderId, shippingOrder.soid);
    } catch (error) {
      console.error('列印出貨單時發生錯誤:', error);
    }
  };

  const handlePrintV2Click = async () => {
    try {
      if (!shippingOrder || !orderId) return;
      await downloadShippingOrderPdfV2(orderId, shippingOrder.soid);
    } catch (error) {
      console.error('列印出貨單簡化版時發生錯誤:', error);
    }
  };

  const isEditButtonDisabled = !shippingOrder || orderLoading;
  const isPrintButtonDisabled = !shippingOrder || orderLoading || productDetailsLoading || fifoLoading;
  const isCompleted = shippingOrder?.status === 'completed';

  // 根據狀態決定顯示編輯按鈕還是鎖符號
  const editOrLockButton = isCompleted ? (
    <IconButton
      key="unlock"
      size="small"
      onClick={onUnlock}
      title="點擊解鎖並改為待處理"
      disabled={orderLoading}
    >
      <LockIcon fontSize="small" />
    </IconButton>
  ) : (
    <Button
      key="edit"
      variant="contained"
      color="primary"
      size="small"
      startIcon={<EditIcon />}
      onClick={onEdit}
      disabled={isEditButtonDisabled}
    >
      編輯
    </Button>
  );

  const printButton = (
    <Button
      key="print"
      variant="outlined"
      color="secondary"
      size="small"
      startIcon={<PrintIcon />}
      onClick={handlePrintClick}
      disabled={isPrintButtonDisabled}
    >
      列印
    </Button>
  );

  const printV2Button = (
    <Button
      key="print-v2"
      variant="outlined"
      color="info"
      size="small"
      startIcon={<PrintOutlinedIcon />}
      onClick={handlePrintV2Click}
      disabled={isPrintButtonDisabled}
      sx={{ ml: 1 }}
    >
      簡化列印
    </Button>
  );

  return [editOrLockButton, printButton, printV2Button];
};

// 保持向後兼容的組件導出
const ShippingOrderActions: React.FC<ShippingOrderActionsProps> = ({ onEdit, ...restProps }) => {
  const actions = useShippingOrderActions({ onEdit, ...restProps });
  return <>{actions}</>;
};

export default ShippingOrderActions;
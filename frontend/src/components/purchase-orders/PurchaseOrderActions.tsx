import React from 'react';
import { Button, IconButton } from '@mui/material';
import { Print as PrintIcon, Edit as EditIcon, PrintOutlined as PrintOutlinedIcon, Lock as LockIcon } from '@mui/icons-material';

interface PurchaseOrder {
  poid?: string;
  status?: string;
  [key: string]: any;
}

interface PurchaseOrderActionsProps {
  purchaseOrder: PurchaseOrder | null;
  orderId?: string;
  orderLoading: boolean;
  productDetailsLoading: boolean;
  fifoLoading: boolean;
  onEdit: () => void;
  onUnlock?: () => void;
}

export const usePurchaseOrderActions = ({
  purchaseOrder,
  orderId,
  orderLoading,
  productDetailsLoading,
  fifoLoading,
  onEdit,
  onUnlock
}: PurchaseOrderActionsProps): React.ReactNode[] => {
  const handlePrintClick = async () => {
    try {
      if (!purchaseOrder || !orderId) return;
      // TODO: 實現進貨單 PDF 下載功能
      console.log('列印進貨單:', orderId, purchaseOrder.poid);
      alert('列印功能開發中...');
    } catch (error) {
      console.error('列印進貨單時發生錯誤:', error);
    }
  };

  const handlePrintV2Click = async () => {
    try {
      if (!purchaseOrder || !orderId) return;
      // TODO: 實現進貨單簡化版 PDF 下載功能
      console.log('列印進貨單簡化版:', orderId, purchaseOrder.poid);
      alert('簡化列印功能開發中...');
    } catch (error) {
      console.error('列印進貨單簡化版時發生錯誤:', error);
    }
  };

  const isEditButtonDisabled = !purchaseOrder || orderLoading;
  const isPrintButtonDisabled = !purchaseOrder || orderLoading || productDetailsLoading || fifoLoading;
  const isCompleted = purchaseOrder?.status === 'completed';

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
const PurchaseOrderActions: React.FC<PurchaseOrderActionsProps> = ({ onEdit, ...restProps }) => {
  const actions = usePurchaseOrderActions({ onEdit, ...restProps });
  return <>{actions}</>;
};

export default PurchaseOrderActions;
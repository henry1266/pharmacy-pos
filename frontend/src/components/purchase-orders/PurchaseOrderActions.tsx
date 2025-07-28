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

// 按鈕配置類型
interface ButtonConfig {
  variant: 'outlined';
  color: 'secondary' | 'info';
  icon: any;
  text: string;
  logMessage: string;
  alertMessage: string;
  sx?: any;
}

// 共用的按鈕配置
const BUTTON_CONFIGS: Record<string, ButtonConfig> = {
  print: {
    variant: 'outlined',
    color: 'secondary',
    icon: PrintIcon,
    text: '列印',
    logMessage: '列印進貨單',
    alertMessage: '列印功能開發中...'
  },
  printV2: {
    variant: 'outlined',
    color: 'info',
    icon: PrintOutlinedIcon,
    text: '簡化列印',
    logMessage: '列印進貨單簡化版',
    alertMessage: '簡化列印功能開發中...',
    sx: { ml: 1 }
  }
};

// 共用的錯誤處理函數
const createPrintHandler = (config: ButtonConfig) =>
  async (purchaseOrder: PurchaseOrder | null, orderId?: string) => {
    try {
      if (!purchaseOrder || !orderId) return;
      console.log(`${config.logMessage}:`, orderId, purchaseOrder.poid);
      alert(config.alertMessage);
    } catch (error) {
      console.error(`${config.logMessage}時發生錯誤:`, error);
    }
  };

export const usePurchaseOrderActions = ({
  purchaseOrder,
  orderId,
  orderLoading,
  productDetailsLoading,
  fifoLoading,
  onEdit,
  onUnlock
}: PurchaseOrderActionsProps): React.ReactNode[] => {
  // 使用工廠函數創建處理器
  const handlePrintClick = createPrintHandler(BUTTON_CONFIGS.print);
  const handlePrintV2Click = createPrintHandler(BUTTON_CONFIGS.printV2);

  const isEditButtonDisabled = !purchaseOrder || orderLoading;
  const isPrintButtonDisabled = !purchaseOrder || orderLoading || productDetailsLoading || fifoLoading;
  const isCompleted = purchaseOrder?.status === 'completed';

  // 共用的按鈕創建函數
  const createPrintButton = (configKey: string, onClick: () => void) => {
    const config = BUTTON_CONFIGS[configKey];
    const IconComponent = config.icon;
    
    return (
      <Button
        key={configKey}
        variant={config.variant}
        color={config.color}
        size="small"
        startIcon={<IconComponent />}
        onClick={onClick}
        disabled={isPrintButtonDisabled}
        sx={config.sx}
      >
        {config.text}
      </Button>
    );
  };

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

  const printButton = createPrintButton('print', () => handlePrintClick(purchaseOrder, orderId));
  const printV2Button = createPrintButton('printV2', () => handlePrintV2Click(purchaseOrder, orderId));

  return [editOrLockButton, printButton, printV2Button];
};

// 保持向後兼容的組件導出
const PurchaseOrderActions: React.FC<PurchaseOrderActionsProps> = ({ onEdit, ...restProps }) => {
  const actions = usePurchaseOrderActions({ onEdit, ...restProps });
  return <>{actions}</>;
};

export default PurchaseOrderActions;
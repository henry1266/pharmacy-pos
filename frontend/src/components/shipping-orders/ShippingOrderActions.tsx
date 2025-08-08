import React, { useState } from 'react';
import { Button, IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import {
  Print as PrintIcon,
  Edit as EditIcon,
  PrintOutlined as PrintOutlinedIcon,
  Lock as LockIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import {
  downloadShippingOrderPdf,
  downloadShippingOrderPdfV2,
  downloadShippingOrderPdfV3
} from '../../services/pdf/shippingOrderPdf';

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
  // 使用 useState 管理下拉選單狀態
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // 打開下拉選單
  const handlePrintMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  // 關閉下拉選單
  const handleClose = () => {
    setAnchorEl(null);
  };

  // 標準版列印（含健保代碼）
  const handlePrintStandardClick = async () => {
    try {
      if (!shippingOrder || !orderId) return;
      await downloadShippingOrderPdf(orderId, shippingOrder.soid);
      handleClose();
    } catch (error) {
      console.error('列印標準版出貨單時發生錯誤:', error);
    }
  };

  // 簡化版列印（無健保代碼）
  const handlePrintSimpleClick = async () => {
    try {
      if (!shippingOrder || !orderId) return;
      await downloadShippingOrderPdfV2(orderId, shippingOrder.soid);
      handleClose();
    } catch (error) {
      console.error('列印簡化版出貨單時發生錯誤:', error);
    }
  };

  // 大包裝版列印（含健保代碼和大包裝信息）
  const handlePrintPackageClick = async () => {
    try {
      if (!shippingOrder || !orderId) return;
      await downloadShippingOrderPdfV3(orderId, shippingOrder.soid);
      handleClose();
    } catch (error) {
      console.error('列印大包裝版出貨單時發生錯誤:', error);
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

  // 列印下拉選單按鈕
  const printMenuButton = (
    <React.Fragment key="print-menu">
      <Button
        variant="outlined"
        color="secondary"
        size="small"
        startIcon={<PrintIcon />}
        onClick={handlePrintMenuClick}
        disabled={isPrintButtonDisabled}
        aria-controls={open ? 'print-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        列印
      </Button>
      <Menu
        id="print-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'print-button',
        }}
      >
        <MenuItem onClick={handlePrintStandardClick}>
          <ListItemIcon>
            <PrintIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>標準版（含健保代碼）</ListItemText>
        </MenuItem>
        <MenuItem onClick={handlePrintSimpleClick}>
          <ListItemIcon>
            <PrintOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>簡化版（無健保代碼）</ListItemText>
        </MenuItem>
        <MenuItem onClick={handlePrintPackageClick}>
          <ListItemIcon>
            <InventoryIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>大包裝版（含健保代碼）</ListItemText>
        </MenuItem>
      </Menu>
    </React.Fragment>
  );

  return [editOrLockButton, printMenuButton];
};

// 保持向後兼容的組件導出
const ShippingOrderActions: React.FC<ShippingOrderActionsProps> = ({ onEdit, ...restProps }) => {
  const actions = useShippingOrderActions({ onEdit, ...restProps });
  return <>{actions}</>;
};

export default ShippingOrderActions;
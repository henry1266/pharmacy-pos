/**
 * @file 銷售預覽彈窗組件
 * @description 顯示銷售記錄的預覽彈窗
 */

import React, { FC } from 'react';
import { Popover } from '@mui/material';
import SalesPreview from '../SalesPreview';
import { Sale } from '../../types/list';

interface SalesPreviewPopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  sale: Sale | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  id?: string;
}

/**
 * 銷售預覽彈窗組件
 * 顯示銷售記錄的詳細信息
 */
const SalesPreviewPopover: FC<SalesPreviewPopoverProps> = ({
  open,
  anchorEl,
  sale,
  loading,
  error,
  onClose,
  id
}) => {
  return (
    <Popover
      id={id}
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
      transformOrigin={{ vertical: 'center', horizontal: 'left' }}
    >
      <SalesPreview
        sale={sale as any}
        loading={loading}
        error={error || ''}
      />
    </Popover>
  );
};

export default SalesPreviewPopover;
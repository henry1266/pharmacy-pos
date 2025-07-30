import React, { useState } from 'react';
import {
  Popover,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  StickyNote2 as NoteIcon
} from '@mui/icons-material';
import ProductSummaryDisplay from './ProductSummaryDisplay';

interface ProductNotePopoverProps {
  productId: string;
  productName: string;
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

/**
 * 產品筆記懸浮視窗組件
 * 用於在產品列表中快速查看產品筆記
 */
const ProductNotePopover: React.FC<ProductNotePopoverProps> = ({
  productId,
  productName,
  anchorEl,
  open,
  onClose
}) => {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'center',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'center',
        horizontal: 'left',
      }}
      PaperProps={{
        sx: {
          maxWidth: 400,
          minWidth: 300,
          maxHeight: 500,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          border: '1px solid',
          borderColor: 'divider'
        }
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%'
      }}>
        {/* 標題列 */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NoteIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
              產品筆記
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ ml: 1 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* 產品名稱 */}
        <Box sx={{ px: 2, py: 1, backgroundColor: 'grey.50' }}>
          <Typography variant="body2" sx={{ 
            fontWeight: 'medium',
            color: 'text.secondary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {productName}
          </Typography>
        </Box>

        {/* 筆記內容 */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto',
          p: 2
        }}>
          <ProductSummaryDisplay
            productId={productId}
            variant="detailed"
            expandable={true}
            clickable={false}
          />
        </Box>
      </Box>
    </Popover>
  );
};

export default ProductNotePopover;
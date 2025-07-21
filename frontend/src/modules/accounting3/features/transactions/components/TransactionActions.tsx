import React from 'react';
import { Box, Button, IconButton, Tooltip } from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as CopyIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

interface TransactionActionsProps {
  showActions?: boolean;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onBackToList: () => void;
}

/**
 * 交易操作按鈕組件
 */
export const TransactionActions: React.FC<TransactionActionsProps> = ({
  showActions = true,
  onEdit,
  onCopy,
  onDelete,
  onBackToList
}) => {
  if (!showActions) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={onBackToList}
      >
        返回列表
      </Button>
      <Tooltip title="編輯交易">
        <IconButton color="primary" onClick={onEdit}>
          <EditIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="複製交易">
        <IconButton color="secondary" onClick={onCopy}>
          <CopyIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="刪除交易">
        <IconButton color="error" onClick={onDelete}>
          <DeleteIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default TransactionActions;
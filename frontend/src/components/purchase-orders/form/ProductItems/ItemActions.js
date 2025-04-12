import React from 'react';
import { 
  Box,
  IconButton
} from '@mui/material';
import { 
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

/**
 * 項目操作按鈕組件
 * @param {Object} props - 組件屬性
 * @param {number} props.index - 項目索引
 * @param {number} props.itemsLength - 項目總數
 * @param {Function} props.onEdit - 編輯按鈕點擊處理函數
 * @param {Function} props.onDelete - 刪除按鈕點擊處理函數
 * @param {Function} props.onMove - 移動項目處理函數
 * @returns {React.ReactElement} 項目操作按鈕組件
 */
const ItemActions = ({
  index,
  itemsLength,
  onEdit,
  onDelete,
  onMove
}) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <IconButton size="small" onClick={() => onMove(index, 'up')} disabled={index === 0}>
        <ArrowUpwardIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" onClick={() => onMove(index, 'down')} disabled={index === itemsLength - 1}>
        <ArrowDownwardIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" onClick={() => onEdit(index)}>
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" onClick={() => onDelete(index)}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default ItemActions;

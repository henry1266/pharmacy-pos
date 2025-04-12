import React from 'react';
import { 
  Box, 
  IconButton
} from '@mui/material';
import { 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

/**
 * 表格操作按鈕組件
 * @param {Object} props - 組件屬性
 * @param {Object} props.row - 行數據
 * @param {Function} props.onView - 查看按鈕點擊處理函數
 * @param {Function} props.onEdit - 編輯按鈕點擊處理函數
 * @param {Function} props.onDelete - 刪除按鈕點擊處理函數
 * @param {Function} props.onPreviewMouseEnter - 滑鼠懸停在檢視按鈕上的處理函數
 * @param {Function} props.onPreviewMouseLeave - 滑鼠離開檢視按鈕的處理函數
 * @returns {React.ReactElement} 表格操作按鈕組件
 */
const TableActions = ({
  row,
  onView,
  onEdit,
  onDelete,
  onPreviewMouseEnter,
  onPreviewMouseLeave
}) => {
  return (
    <Box>
      <IconButton 
        size="small" 
        onClick={() => onView(row._id)}
        onMouseEnter={(e) => onPreviewMouseEnter(e, row._id)}
        onMouseLeave={onPreviewMouseLeave}
      >
        <VisibilityIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" onClick={() => onEdit(row._id)}>
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton 
        size="small" 
        onClick={() => onDelete(row)}
        disabled={row.status === 'completed'}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default TableActions;

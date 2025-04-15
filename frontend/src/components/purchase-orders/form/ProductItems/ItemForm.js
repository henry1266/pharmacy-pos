import React from 'react';
import { 
  TextField,
  TableRow,
  TableCell,
  Typography,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';

/**
 * 項目編輯表單組件
 * @param {Object} props - 組件屬性
 * @param {Object} props.editingItem - 當前正在編輯的項目數據
 * @param {number} props.index - 項目索引
 * @param {Function} props.onChange - 編輯項目變更處理函數
 * @param {Function} props.onSave - 保存編輯項目處理函數
 * @param {Function} props.onCancel - 取消編輯項目處理函數
 * @returns {React.ReactElement} 項目編輯表單組件
 */
const ItemForm = ({
  editingItem,
  index,
  onChange,
  onSave,
  onCancel
}) => {
  /**
   * 處理數量輸入框按下ENTER鍵
   * @param {Object} event - 鍵盤事件對象
   */
  const handleQuantityKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      // 聚焦到總成本輸入框
      document.querySelector('input[name="dtotalCost"]')?.focus();
    }
  };

  /**
   * 生成進價提示文本
   * @returns {string} 提示文本
   */
  const getPriceTooltipText = () => {
    if (!editingItem.product || !editingItem.dquantity) return "請先選擇產品並輸入數量";
    
    // 這裡假設有一個獲取產品進價的函數，實際應根據項目數據結構調整
    const purchasePrice = editingItem.dquantity > 0 && editingItem.dtotalCost > 0 
      ? (editingItem.dtotalCost / editingItem.dquantity).toFixed(2)
      : '0.00';
    const totalCost = editingItem.dquantity * purchasePrice;
    
    return `上次進價: ${purchasePrice} 元\n建議總成本: ${totalCost} 元`;
  };
  return (
    <TableRow>
      <TableCell align="center">
        <Typography variant="body2">{index + 1}</Typography>
      </TableCell>
      <TableCell>
        <TextField
          fullWidth
          size="small"
          value={editingItem.did}
          disabled
        />
      </TableCell>
      <TableCell>
        <TextField
          fullWidth
          size="small"
          value={editingItem.dname}
          disabled
        />
      </TableCell>
      <TableCell align="right">
        <TextField
          fullWidth
          size="small"
          name="dquantity"
          type="number"
          value={editingItem.dquantity}
          onChange={onChange}
          onKeyDown={handleQuantityKeyDown}
          inputProps={{ min: 1 }}
        />
      </TableCell>
      <TableCell align="right">
        <Tooltip 
          title={getPriceTooltipText()}
          placement="top"
          arrow
          enterDelay={500}
          leaveDelay={200}
          PopperProps={{
            sx: { 
              whiteSpace: 'pre-line',
              '& .MuiTooltip-tooltip': { 
                fontSize: '0.875rem',
                padding: '8px 12px'
              }
            }
          }}
        >
          <TextField
            fullWidth
            size="small"
            name="dtotalCost"
            type="number"
            value={editingItem.dtotalCost}
            onChange={onChange}
            inputProps={{ min: 0 }}
          />
        </Tooltip>
      </TableCell>
      <TableCell align="right">
        {editingItem.dquantity > 0 ? (editingItem.dtotalCost / editingItem.dquantity).toFixed(2) : '0.00'}
      </TableCell>
      <TableCell align="center">
        <IconButton color="primary" onClick={onSave}>
          <CheckIcon />
        </IconButton>
        <IconButton color="error" onClick={onCancel}>
          <CloseIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

export default ItemForm;

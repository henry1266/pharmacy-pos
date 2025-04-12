import React from 'react';
import { 
  TextField,
  TableRow,
  TableCell,
  Typography,
  IconButton
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
          inputProps={{ min: 1 }}
        />
      </TableCell>
      <TableCell align="right">
        <TextField
          fullWidth
          size="small"
          name="dtotalCost"
          type="number"
          value={editingItem.dtotalCost}
          onChange={onChange}
          inputProps={{ min: 0 }}
        />
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

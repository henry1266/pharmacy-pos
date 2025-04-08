import React from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Typography
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  Edit as EditIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';

/**
 * 藥品項目表格組件
 * @param {Object} props - 組件屬性
 * @param {Array} props.items - 藥品項目列表
 * @param {number} props.editingItemIndex - 當前正在編輯的項目索引
 * @param {Object} props.editingItem - 當前正在編輯的項目數據
 * @param {Function} props.handleEditItem - 開始編輯項目的函數
 * @param {Function} props.handleSaveEditItem - 保存編輯項目的函數
 * @param {Function} props.handleCancelEditItem - 取消編輯項目的函數
 * @param {Function} props.handleRemoveItem - 刪除項目的函數
 * @param {Function} props.handleMoveItem - 移動項目順序的函數
 * @param {Function} props.handleEditingItemChange - 處理編輯中項目變更的函數
 * @param {number} props.totalAmount - 總金額
 * @returns {React.ReactElement} 藥品項目表格組件
 */
const ProductItemsTable = ({
  items,
  editingItemIndex,
  editingItem,
  handleEditItem,
  handleSaveEditItem,
  handleCancelEditItem,
  handleRemoveItem,
  handleMoveItem,
  handleEditingItemChange,
  totalAmount
}) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>藥品代碼</TableCell>
            <TableCell>藥品名稱</TableCell>
            <TableCell align="right">數量</TableCell>
            <TableCell align="right">總成本</TableCell>
            <TableCell align="right">單價</TableCell>
            <TableCell align="center">操作</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={index}>
              {editingItemIndex === index ? (
                // 編輯模式
                <>
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
                      onChange={handleEditingItemChange}
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
                      onChange={handleEditingItemChange}
                      inputProps={{ min: 0 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {editingItem.dquantity > 0 ? (editingItem.dtotalCost / editingItem.dquantity).toFixed(2) : '0.00'}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" onClick={handleSaveEditItem}>
                      <CheckIcon />
                    </IconButton>
                    <IconButton color="error" onClick={handleCancelEditItem}>
                      <CloseIcon />
                    </IconButton>
                  </TableCell>
                </>
              ) : (
                // 顯示模式
                <>
                  <TableCell>{item.did}</TableCell>
                  <TableCell>{item.dname}</TableCell>
                  <TableCell align="right">{item.dquantity}</TableCell>
                  <TableCell align="right">{Number(item.dtotalCost).toLocaleString()}</TableCell>
                  <TableCell align="right">
                    {item.dquantity > 0 ? (item.dtotalCost / item.dquantity).toFixed(2) : '0.00'}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleMoveItem(index, 'up')} disabled={index === 0}>
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleMoveItem(index, 'down')} disabled={index === items.length - 1}>
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleEditItem(index)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleRemoveItem(index)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center">
                尚未添加藥品項目
              </TableCell>
            </TableRow>
          )}
          <TableRow>
            <TableCell colSpan={3} align="right">
              <Typography variant="subtitle1">總計：</Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="subtitle1">{totalAmount.toLocaleString()}</Typography>
            </TableCell>
            <TableCell colSpan={2}></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ProductItemsTable;

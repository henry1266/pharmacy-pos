import React, { useEffect, useRef } from 'react';
import { 
  Box,
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
import PriceSummary from '../../../common/PriceSummary';

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
const ItemsTable = ({
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
  const tableContainerRef = useRef(null);
  
  // 當項目數量變化時，滾動到底部
  useEffect(() => {
    if (tableContainerRef.current && items.length > 0) {
      // 使用setTimeout確保在DOM更新後執行滾動
      setTimeout(() => {
        const scrollHeight = tableContainerRef.current.scrollHeight;
        tableContainerRef.current.scrollTop = scrollHeight;
      }, 100);
    }
  }, [items.length]);
  
  return (
    <TableContainer 
      component={Paper}
      sx={{ 
        maxHeight: '350px', 
        overflow: 'auto' 
      }}
      ref={tableContainerRef}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell align="center" width="60px">序號</TableCell>
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
                  <TableCell align="center">
                    <Typography variant="body2">{index + 1}</Typography>
                  </TableCell>
                  <TableCell>{item.did}</TableCell>
                  <TableCell>{item.dname}</TableCell>
                  <TableCell align="right">{item.dquantity}</TableCell>
                  <TableCell align="right">{Number(item.dtotalCost).toLocaleString()}</TableCell>
                  <TableCell align="right">
                    {item.dquantity > 0 ? (item.dtotalCost / item.dquantity).toFixed(2) : '0.00'}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
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
                    </Box>
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center">
                尚未添加藥品項目
              </TableCell>
            </TableRow>
          )}
          {/* 使用通用價格加總元件 */}
          <PriceSummary 
            totalAmount={totalAmount} 
            colSpan={3} 
            totalColumns={7} 
          />
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ItemsTable;

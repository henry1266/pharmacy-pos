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
  Box, 
  Typography,
  TextField,
  Button
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Edit as EditIcon, 
  Save as SaveIcon, 
  Cancel as CancelIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';

/**
 * 藥品項目表格組件
 * @param {Object} props - 組件屬性
 * @param {Array} props.items - 藥品項目列表
 * @param {number} props.editingItemIndex - 正在編輯的項目索引
 * @param {Object} props.editingItem - 正在編輯的項目
 * @param {Function} props.handleEditItem - 編輯項目處理函數
 * @param {Function} props.handleSaveEditItem - 保存編輯項目處理函數
 * @param {Function} props.handleCancelEditItem - 取消編輯項目處理函數
 * @param {Function} props.handleRemoveItem - 刪除項目處理函數
 * @param {Function} props.handleMoveItem - 移動項目處理函數
 * @param {Function} props.handleEditingItemChange - 編輯項目變更處理函數
 * @param {number} props.totalAmount - 總金額
 * @param {Object} props.inventoryData - 庫存數據
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
  totalAmount,
  inventoryData
}) => {
  // 獲取藥品的庫存數量
  const getInventoryQuantity = (productId) => {
    if (!productId || !inventoryData) return 0;
    
    const productInventory = inventoryData[productId];
    return productInventory ? productInventory.quantity : 0;
  };
  
  // 檢查庫存是否足夠
  const isInventorySufficient = (item) => {
    if (!item.product || !item.dquantity) return true;
    
    const availableQuantity = getInventoryQuantity(item.product);
    return availableQuantity >= parseInt(item.dquantity);
  };
  
  return (
    <Box>
      <TableContainer component={Paper} sx={{ maxHeight: 400, overflow: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell width="5%">#</TableCell>
              <TableCell width="15%">藥品代碼</TableCell>
              <TableCell width="30%">藥品名稱</TableCell>
              <TableCell width="10%">數量</TableCell>
              <TableCell width="10%">庫存</TableCell>
              <TableCell width="15%">總金額</TableCell>
              <TableCell width="15%">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  尚未添加藥品項目
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    {editingItemIndex === index ? (
                      <TextField
                        fullWidth
                        name="did"
                        value={editingItem.did}
                        onChange={handleEditingItemChange}
                        variant="outlined"
                        size="small"
                        disabled
                      />
                    ) : (
                      item.did
                    )}
                  </TableCell>
                  <TableCell>
                    {editingItemIndex === index ? (
                      <TextField
                        fullWidth
                        name="dname"
                        value={editingItem.dname}
                        onChange={handleEditingItemChange}
                        variant="outlined"
                        size="small"
                        disabled
                      />
                    ) : (
                      item.dname
                    )}
                  </TableCell>
                  <TableCell>
                    {editingItemIndex === index ? (
                      <TextField
                        fullWidth
                        name="dquantity"
                        type="number"
                        value={editingItem.dquantity}
                        onChange={handleEditingItemChange}
                        variant="outlined"
                        size="small"
                        error={!isInventorySufficient(editingItem)}
                        helperText={!isInventorySufficient(editingItem) ? "庫存不足" : ""}
                        InputProps={{
                          inputProps: { min: 1 }
                        }}
                      />
                    ) : (
                      item.dquantity
                    )}
                  </TableCell>
                  <TableCell>
                    {getInventoryQuantity(item.product)}
                    {!isInventorySufficient(item) && (
                      <Typography variant="caption" color="error" display="block">
                        庫存不足
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingItemIndex === index ? (
                      <TextField
                        fullWidth
                        name="dtotalCost"
                        type="number"
                        value={editingItem.dtotalCost}
                        onChange={handleEditingItemChange}
                        variant="outlined"
                        size="small"
                        InputProps={{
                          inputProps: { min: 0 }
                        }}
                      />
                    ) : (
                      `${Number(item.dtotalCost).toLocaleString()} 元`
                    )}
                  </TableCell>
                  <TableCell>
                    {editingItemIndex === index ? (
                      <Box>
                        <IconButton 
                          size="small" 
                          onClick={handleSaveEditItem}
                          disabled={!isInventorySufficient(editingItem)}
                        >
                          <SaveIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={handleCancelEditItem}>
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : (
                      <Box>
                        <IconButton 
                          size="small" 
                          onClick={() => handleMoveItem(index, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleMoveItem(index, 'down')}
                          disabled={index === items.length - 1}
                        >
                          <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleEditItem(index)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleRemoveItem(index)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Typography variant="h6">
          總金額: {totalAmount.toLocaleString()} 元
        </Typography>
      </Box>
    </Box>
  );
};

export default ItemsTable;

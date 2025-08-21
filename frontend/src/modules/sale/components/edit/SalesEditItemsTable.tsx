import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  Box,
  Typography
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  SyncAlt as SyncAltIcon
} from '@mui/icons-material';
import { SalesEditItemsTableProps } from '../../types/edit';

/**
 * 銷售編輯項目表格組件
 * 用於顯示和編輯銷售項目
 * 
 * @param props 組件屬性
 * @returns 銷售編輯項目表格組件
 */
const SalesEditItemsTable: React.FC<SalesEditItemsTableProps> = ({
  items,
  inputModes,
  handleQuantityChange,
  handlePriceChange,
  handlePriceBlur,
  handleSubtotalChange,
  toggleInputMode,
  handleRemoveItem,
  onQuantityInputComplete
}) => {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>藥品/商品</TableCell>
            <TableCell align="center" sx={{ width: '150px' }}>數量</TableCell>
            <TableCell align="right">單價/小計</TableCell>
            <TableCell align="center">操作</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} align="center">
                <Typography variant="body2" color="textSecondary">
                  尚無銷售項目，請掃描條碼添加
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            items.map((item, index) => (
              <TableRow key={item.product + index}>
                <TableCell>{item.name}</TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconButton
                      size="small"
                      onClick={() => handleQuantityChange(index, Number(item.quantity) - 1)}
                      disabled={Number(item.quantity) <= 1}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <TextField
                      type="number"
                      size="small"
                      value={item.quantity}
                      onChange={(e) => {
                        const newQuantityStr = e.target.value;
                        // 暫時允許空字串
                        if (newQuantityStr === '') {
                            handleQuantityChange(index, '');
                        } else {
                            const newQuantity = parseInt(newQuantityStr);
                            if (!isNaN(newQuantity) && newQuantity >= 1) {
                                handleQuantityChange(index, newQuantity);
                            }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          // 在 Enter 時驗證並可能重置
                          if ((typeof item.quantity === 'string' && item.quantity === '') || isNaN(parseInt(String(item.quantity))) || parseInt(String(item.quantity)) < 1) {
                            handleQuantityChange(index, 1);
                          }
                          onQuantityInputComplete?.();
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      onBlur={() => {
                        // 在失去焦點時驗證並可能重置
                        if ((typeof item.quantity === 'string' && item.quantity === '') || isNaN(parseInt(String(item.quantity))) || parseInt(String(item.quantity)) < 1) {
                          handleQuantityChange(index, 1);
                        }
                        onQuantityInputComplete?.();
                      }}
                      InputProps={{
                        inputProps: { min: 1, style: { textAlign: 'center', width: '80px' } }
                      }}
                      sx={{ mx: 1, '.MuiInputBase-input': { textAlign: 'center' } }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleQuantityChange(index, Number(item.quantity) + 1)}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    {inputModes[index] === 'price' ? (
                      <TextField
                        type="number"
                        label="單價"
                        size="small"
                        value={item.price}
                        onChange={(e) => handlePriceChange(index, e.target.value)}
                        onBlur={() => handlePriceBlur(index)}
                        InputProps={{
                          inputProps: { min: 0, step: 0.01 }
                        }}
                        sx={{
                          width: '90px',
                          '.MuiInputBase-input': { textAlign: 'right' }
                        }}
                      />
                    ) : (
                      <TextField
                        type="number"
                        label="小計"
                        size="small"
                        value={item.subtotal ?? 0}
                        onChange={(e) => handleSubtotalChange(index, parseFloat(e.target.value) || 0)}
                        InputProps={{
                          inputProps: { min: 0, step: 0.01 }
                        }}
                        sx={{
                          width: '90px',
                          '.MuiInputBase-input': { textAlign: 'right' }
                        }}
                      />
                    )}
                    <IconButton
                      size="small"
                      onClick={() => toggleInputMode(index)}
                      sx={{ ml: 0.5 }}
                      title={inputModes[index] === 'price' ? "切換為輸入小計" : "切換為輸入單價"}
                    >
                      <SyncAltIcon fontSize="inherit" />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveItem(index)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SalesEditItemsTable;
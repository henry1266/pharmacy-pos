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
  Delete as DeleteIcon
} from '@mui/icons-material';

const SalesEditItemsTable = ({
  items,
  handleQuantityChange,
  handlePriceChange,
  handlePriceBlur,
  handleRemoveItem,
  onQuantityInputComplete // New prop for focus management
}) => {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>藥品/商品</TableCell>
            <TableCell align="right">單價</TableCell>
            <TableCell align="center" sx={{ width: '150px' }}>數量</TableCell> {/* Adjusted header width slightly */} 
            <TableCell align="right">小計</TableCell>
            <TableCell align="center">操作</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center">
                <Typography variant="body2" color="textSecondary">
                  尚無銷售項目，請掃描條碼添加
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            items.map((item, index) => (
              <TableRow key={item.product + index}> {/* Use a more stable key if possible */}
                <TableCell>{item.name}</TableCell>
                <TableCell align="right">
                  <TextField
                    type="number"
                    size="small"
                    value={item.price} // Controlled component
                    onChange={(e) => handlePriceChange(index, e.target.value)} // Pass the string value
                    onBlur={() => handlePriceBlur(index)} // Call blur handler
                    InputProps={{
                      inputProps: { min: 0, step: 0.01 },
                      style: { textAlign: 'right', width: '80px' } // Price field width
                    }}
                    sx={{ '.MuiInputBase-input': { textAlign: 'right' } }} // Ensure text aligns right
                  />
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconButton
                      size="small"
                      onClick={() => handleQuantityChange(index, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <TextField
                      type="number"
                      size="small"
                      value={item.quantity}
                      onChange={(e) => {
                        const newQuantityStr = e.target.value;
                        // Allow empty string temporarily
                        if (newQuantityStr === '') {
                            handleQuantityChange(index, ''); // Update state to allow empty
                        } else {
                            const newQuantity = parseInt(newQuantityStr);
                            if (!isNaN(newQuantity) && newQuantity >= 1) {
                                handleQuantityChange(index, newQuantity);
                            }
                            // Do nothing if input is invalid (e.g., negative, non-numeric after parsing)
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          // Validate and potentially reset if empty/invalid on Enter
                          if (item.quantity === '' || isNaN(parseInt(item.quantity)) || parseInt(item.quantity) < 1) {
                            handleQuantityChange(index, 1); // Reset to 1 if invalid
                          }
                          onQuantityInputComplete && onQuantityInputComplete(); // Trigger focus return
                          e.target.blur(); // Optional: remove focus from current field
                        }
                      }}
                      onBlur={() => {
                        // Validate and potentially reset if empty/invalid on Blur
                        if (item.quantity === '' || isNaN(parseInt(item.quantity)) || parseInt(item.quantity) < 1) {
                          handleQuantityChange(index, 1); // Reset to 1 if invalid
                        }
                        onQuantityInputComplete && onQuantityInputComplete(); // Trigger focus return
                      }}
                      InputProps={{
                        inputProps: { min: 1, style: { textAlign: 'center', width: '80px' } } // Increased width
                      }}
                      sx={{ mx: 1, '.MuiInputBase-input': { textAlign: 'center' } }}
                    />
                    {/* Add button removed as barcode scanning adds items */}
                     <IconButton
                      size="small"
                      onClick={() => handleQuantityChange(index, item.quantity + 1)}
                      // disabled={item.quantity >= item.stock} // Optional: Disable if exceeding stock
                    >
                      <AddIcon fontSize="small" /> {/* Assuming AddIcon is imported */} 
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  ${(item.subtotal || 0).toFixed(2)}
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


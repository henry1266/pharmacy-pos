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
  Remove as RemoveIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const SalesEditItemsTable = ({
  items,
  handleQuantityChange,
  handlePriceChange,
  handlePriceBlur, // Pass down the blur handler
  handleRemoveItem
}) => {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>藥品/商品</TableCell>
            <TableCell align="right">單價</TableCell>
            <TableCell align="center">數量</TableCell>
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
                      style: { textAlign: 'right', width: '80px' } // Adjust width as needed
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
                        const newQuantity = parseInt(e.target.value);
                        if (!isNaN(newQuantity) && newQuantity >= 1) {
                          handleQuantityChange(index, newQuantity);
                        } else if (e.target.value === '') {
                           // Allow clearing the field, maybe reset to 1 on blur if empty?
                           // For now, just update state to allow empty temporarily
                           // handleQuantityChange(index, ''); // Or handle appropriately
                        }
                      }}
                      InputProps={{
                        inputProps: { min: 1, style: { textAlign: 'center', width: '50px' } } // Adjust width
                      }}
                      sx={{ mx: 1, '.MuiInputBase-input': { textAlign: 'center' } }}
                    />
                    {/* Add button removed as barcode scanning adds items */}
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

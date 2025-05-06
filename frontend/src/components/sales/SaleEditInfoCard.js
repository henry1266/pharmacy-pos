import React, { useRef, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

const SaleEditInfoCard = ({
  customers,
  currentSale,
  handleInputChange,
  barcode,
  handleBarcodeChange,
  handleBarcodeSubmit
}) => {
  const barcodeInputRef = useRef(null);

  // Auto-focus barcode input
  useEffect(() => {
    const focusTimeout = setTimeout(() => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }, 100); // Delay slightly to ensure it focuses after potential re-renders
    
    return () => clearTimeout(focusTimeout);
  }, [currentSale.items]); // Refocus after item list changes (e.g., adding item via barcode)

  return (
    <Card>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>客戶</InputLabel>
              <Select
                name="customer"
                value={currentSale.customer || ''} // Ensure value is controlled
                onChange={handleInputChange}
                label="客戶"
              >
                <MenuItem value="">
                  <em>一般客戶</em>
                </MenuItem>
                {customers.map((customer) => (
                  <MenuItem key={customer._id} value={customer._id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="條碼"
              value={barcode}
              onChange={handleBarcodeChange}
              onKeyDown={handleBarcodeSubmit}
              placeholder="掃描或輸入條碼後按 Enter"
              inputRef={barcodeInputRef}
              autoComplete="off"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default SaleEditInfoCard;

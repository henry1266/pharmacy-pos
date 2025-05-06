import React, { useRef, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  TextField
} from '@mui/material';

// This component is now focused only on barcode input, similar to SalesProductInput in SalesPage
const SaleEditInfoCard = ({
  barcode,
  handleBarcodeChange,
  handleBarcodeSubmit,
  currentSaleItems // Used to re-focus after item list changes
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
  }, [currentSaleItems]); // Refocus after item list changes (e.g., adding item via barcode)

  return (
    <Card sx={{ mb: 3 }}> {/* Added margin bottom for spacing */}
      <CardContent>
        <Grid container spacing={2}>
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

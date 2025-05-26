import React, { useEffect } from 'react'; // Removed useRef as it's passed from parent
import PropTypes from 'prop-types'; // 新增 PropTypes 引入
import {
  Grid,
  Card,
  CardContent,
  TextField
} from '@mui/material';

// This component now receives the ref from the parent
const SaleEditInfoCard = ({
  barcode,
  handleBarcodeChange,
  handleBarcodeSubmit,
  barcodeInputRef // Receive ref from parent
}) => {

  // Auto-focus logic remains, but uses the passed ref
  // Removed the dependency on currentSaleItems as focus is now managed explicitly by parent
  useEffect(() => {
    const focusTimeout = setTimeout(() => {
      if (barcodeInputRef.current) {
        // Initial focus or refocus after barcode scan (handled by parent potentially)
        // Let's ensure initial focus on mount if needed
        // barcodeInputRef.current.focus(); 
        // Decided against auto-focus on every render here, parent controls explicit focus.
      }
    }, 100);
    return () => clearTimeout(focusTimeout);
  }, [barcodeInputRef]); // Depend on the ref itself

  return (
    <Card sx={{ mb: 3 }}>
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
              inputRef={barcodeInputRef} // Use the passed ref
              autoComplete="off"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// 新增 PropTypes 驗證
SaleEditInfoCard.propTypes = {
  barcode: PropTypes.string.isRequired,
  handleBarcodeChange: PropTypes.func.isRequired,
  handleBarcodeSubmit: PropTypes.func.isRequired,
  barcodeInputRef: PropTypes.shape({
    current: PropTypes.any
  }).isRequired
};

export default SaleEditInfoCard;

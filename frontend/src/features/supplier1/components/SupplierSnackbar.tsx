import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import { SnackbarState } from '../types/supplier.types';

interface SupplierSnackbarProps {
  snackbar: SnackbarState;
  onClose: (event?: React.SyntheticEvent | Event, reason?: string) => void;
  isTestMode: boolean;
}

const SupplierSnackbar: React.FC<SupplierSnackbarProps> = ({
  snackbar,
  onClose,
  isTestMode
}) => {
  return (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={isTestMode ? 5000 : 3000} // Longer for test mode info messages
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert onClose={onClose} severity={snackbar.severity || 'info'} sx={{ width: '100%' }}>
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
};

export default SupplierSnackbar;
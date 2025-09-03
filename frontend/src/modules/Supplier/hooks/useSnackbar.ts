import { useState } from 'react';
import { AlertProps } from '@mui/material';
import { SnackbarState } from '../types/supplier.types';

export const useSnackbar = () => {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });

  const showSnackbar = (message: string, severity: AlertProps['severity'] = 'success'): void => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string): void => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  return {
    snackbar,
    showSnackbar,
    handleCloseSnackbar
  };
};
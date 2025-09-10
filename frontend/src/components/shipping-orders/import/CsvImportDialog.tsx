import React, { FC } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  Typography
} from '@mui/material';
import {
  CsvImportDialogProps,
  FileUpload,
  StatusMessage,
  LoadingButton,
  CSV_IMPORT_TABS
} from '../../../modules/shipping-order/shared';

/**
 * CSV導入對話框組件
 * @param {CsvImportDialogProps} props - 組件屬性
 * @returns {React.ReactElement} CSV導入對話框組件
 */
const CsvImportDialog: FC<CsvImportDialogProps> = ({
  open,
  onClose,
  tabValue,
  onTabChange,
  csvFile,
  onFileChange,
  onImport,
  loading,
  error,
  success
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>CSV導入</DialogTitle>
      <DialogContent>
        <Tabs
          value={tabValue}
          onChange={onTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="基本資訊" />
          <Tab label="藥品項目" />
        </Tabs>
        
        <Box sx={{ mt: 2 }}>
          {tabValue === CSV_IMPORT_TABS.basicInfo.index && (
            <Typography variant="body2" gutterBottom>
              {CSV_IMPORT_TABS.basicInfo.description}
            </Typography>
          )}
          
          {tabValue === CSV_IMPORT_TABS.items.index && (
            <Typography variant="body2" gutterBottom>
              {CSV_IMPORT_TABS.items.description}
            </Typography>
          )}
          
          <FileUpload
            csvFile={csvFile}
            onFileChange={onFileChange}
            loading={loading}
          />
          
          <StatusMessage
            {...(error && { error })}
            success={success ?? false}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          取消
        </Button>
        <LoadingButton
          onClick={onImport}
          loading={loading}
          disabled={!csvFile || success}
        >
          導入
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

// PropTypes 驗證
CsvImportDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  tabValue: PropTypes.number.isRequired,
  onTabChange: PropTypes.func.isRequired,
  csvFile: PropTypes.object,
  onFileChange: PropTypes.func.isRequired,
  onImport: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  success: PropTypes.bool.isRequired
} as any;

export default CsvImportDialog;
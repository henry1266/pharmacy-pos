import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Divider,
  Box
} from '@mui/material';
import { SupplierFormState } from '../types/supplier.types';
import SupplierAccountMappingForm from './SupplierAccountMappingForm';

interface SupplierFormDialogProps {
  open: boolean;
  onClose: () => void;
  editMode: boolean;
  isTestMode: boolean;
  currentSupplierState: SupplierFormState;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSave: () => void;
}

const SupplierFormDialog: React.FC<SupplierFormDialogProps> = ({
  open,
  onClose,
  editMode,
  isTestMode,
  currentSupplierState,
  onInputChange,
  onSave
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editMode ? '編輯供應商' : '添加供應商'} {isTestMode && "(模擬)"}
      </DialogTitle>
      <DialogContent>
        {/* 基本資料區塊 */}
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          基本資料
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <TextField
              name="code"
              label="供應商編號"
              value={currentSupplierState.code}
              onChange={onInputChange}
              fullWidth
              margin="dense"
              size="small"
              helperText={isTestMode ? "測試模式：可留空" : "留空將自動生成"}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="shortCode"
              label="簡碼"
              value={currentSupplierState.shortCode}
              onChange={onInputChange}
              fullWidth
              margin="dense"
              size="small"
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="name"
              label="供應商名稱"
              value={currentSupplierState.name}
              onChange={onInputChange}
              fullWidth
              margin="dense"
              size="small"
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="contactPerson"
              label="聯絡人"
              value={currentSupplierState.contactPerson}
              onChange={onInputChange}
              fullWidth
              margin="dense"
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="phone"
              label="電話"
              value={currentSupplierState.phone}
              onChange={onInputChange}
              fullWidth
              margin="dense"
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="taxId"
              label="稅號"
              value={currentSupplierState.taxId}
              onChange={onInputChange}
              fullWidth
              margin="dense"
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="paymentTerms"
              label="付款條件"
              value={currentSupplierState.paymentTerms}
              onChange={onInputChange}
              fullWidth
              margin="dense"
              size="small"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="notes"
              label="備註"
              value={currentSupplierState.notes}
              onChange={onInputChange}
              fullWidth
              margin="dense"
              size="small"
              multiline
              rows={3}
            />
          </Grid>
        </Grid>

        {/* 會計科目配對區塊 - 只在編輯模式且有供應商ID時顯示 */}
        {editMode && currentSupplierState.id ? (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              會計科目配對
            </Typography>
            <Box sx={{ mt: 1 }}>
              <SupplierAccountMappingForm
                supplierId={currentSupplierState.id}
                supplierName={currentSupplierState.name}
                onMappingChange={(mapping) => {
                  console.log('Mapping changed:', mapping);
                }}
              />
            </Box>
          </>
        ) : editMode ? (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              請先保存供應商基本資料，然後重新編輯以設定會計科目配對。
            </Typography>
          </>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={onSave} variant="contained">保存</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SupplierFormDialog;
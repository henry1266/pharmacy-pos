import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  TextField,
  InputAdornment,
  SelectChangeEvent
} from '@mui/material';
import { Calculate } from '@mui/icons-material';
import { Employee } from '@pharmacy-pos/shared/types/entities';
import { OvertimeStatus } from '@pharmacy-pos/shared/utils/overtimeDataProcessor';

// 定義表單數據介面
interface ManualFormData {
  employeeId: string;
  date: string;
  hours: string | number;
  description: string;
  status: OvertimeStatus;
}

// 定義表單錯誤介面
interface FormErrors {
  employeeId?: string;
  date?: string;
  hours?: string;
  description?: string;
  status?: string;
  [key: string]: string | undefined;
}

// 定義元件 Props 介面
interface ManualOvertimeDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  formData: ManualFormData;
  formErrors: FormErrors;
  employees?: Employee[];
  employeeId: string | null;
  isAdmin: boolean;
  submitting: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => void;
  onSubmit: () => void;
  submitButtonText?: string;
}

/**
 * 手動輸入加班記錄對話框組件
 * 專門處理手動輸入加班時數的對話框
 */
const ManualOvertimeDialog: React.FC<ManualOvertimeDialogProps> = ({
  open,
  onClose,
  title,
  formData,
  formErrors,
  employees = [],
  employeeId,
  isAdmin,
  submitting,
  onInputChange,
  onSubmit,
  submitButtonText = '確認'
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calculate color="primary" />
          {title}
        </div>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth error={!!formErrors.employeeId}>
              <InputLabel id="employee-select-label">員工</InputLabel>
              <Select
                labelId="employee-select-label"
                name="employeeId"
                value={formData.employeeId}
                onChange={onInputChange}
                label="員工"
                disabled={!!employeeId}
              >
                {employees && employees.length > 0 ? employees.map((employee) => (
                  <MenuItem key={employee._id} value={employee._id}>
                    {employee.name}
                  </MenuItem>
                )) : (
                  <MenuItem value="" disabled>
                    沒有可選擇的員工
                  </MenuItem>
                )}
              </Select>
              {formErrors.employeeId && (
                <Typography color="error" variant="caption">
                  {formErrors.employeeId}
                </Typography>
              )}
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              label="加班日期"
              name="date"
              type="date"
              value={formData.date}
              onChange={onInputChange}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              error={!!formErrors.date}
              helperText={formErrors.date}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              label="加班時數"
              name="hours"
              value={formData.hours}
              onChange={onInputChange}
              fullWidth
              type="number"
              inputProps={{ min: 0.5, max: 24, step: 0.5 }}
              error={!!formErrors.hours}
              helperText={formErrors.hours || '請輸入加班時數（小時）'}
              InputProps={{
                endAdornment: <InputAdornment position="end">小時</InputAdornment>,
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="加班原因/說明"
              name="description"
              value={formData.description}
              onChange={onInputChange}
              fullWidth
              multiline
              rows={3}
              placeholder="請描述加班原因或工作內容..."
            />
          </Grid>
          
          {isAdmin && (
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="status-select-label">狀態</InputLabel>
                <Select
                  labelId="status-select-label"
                  name="status"
                  value={formData.status}
                  onChange={onInputChange}
                  label="狀態"
                >
                  <MenuItem value="pending">待審核</MenuItem>
                  <MenuItem value="approved">已核准</MenuItem>
                  <MenuItem value="rejected">已拒絕</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button
          onClick={onSubmit}
          disabled={submitting}
          variant="contained"
          color="primary"
          startIcon={<Calculate />}
        >
          {submitting ? '處理中...' : submitButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManualOvertimeDialog;
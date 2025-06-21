/**
 * 員工模組共用組件
 */

import React, { FC } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Tooltip,
  IconButton,
  TableCell,
  TableRow
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  LockReset as LockResetIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import {
  DialogProps,
  FormFieldProps,
  MonthFilterProps,
  AccountInfoProps,
  StatusChipProps,
  OvertimeRecordRowProps
} from './types';
import {
  ROLE_OPTIONS,
  YEAR_OPTIONS,
  MONTH_OPTIONS,
  DIALOG_CONFIG
} from './constants';
import {
  getRoleName,
  getRoleColor,
  formatDate
} from './utils';

// 載入中組件
export const LoadingSpinner: FC<{ message?: string }> = ({ message = '載入中...' }) => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
    <CircularProgress size={24} />
    <Typography sx={{ ml: 2 }}>{message}</Typography>
  </Box>
);

// 錯誤警告組件
export const ErrorAlert: FC<{ message: string }> = ({ message }) => (
  <Alert severity="error" sx={{ mb: 2 }}>
    {message}
  </Alert>
);

// 成功訊息組件
export const SuccessAlert: FC<{ message: string }> = ({ message }) => (
  <Alert severity="success" sx={{ mb: 2 }}>
    {message}
  </Alert>
);

// 通用對話框組件
export const CommonDialog: FC<DialogProps> = ({
  open,
  onClose,
  title,
  description,
  onConfirm,
  confirmText,
  confirmColor = 'primary',
  submitting,
  maxWidth = 'sm',
  children
}) => (
  <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      {description && (
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
      )}
      {children}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={submitting}>
        取消
      </Button>
      <Button
        onClick={onConfirm}
        color={confirmColor}
        variant="contained"
        disabled={submitting}
        startIcon={submitting ? <CircularProgress size={20} /> : undefined}
      >
        {submitting ? '處理中...' : confirmText}
      </Button>
    </DialogActions>
  </Dialog>
);

// 表單欄位組件
export const FormField: FC<FormFieldProps> = ({
  name,
  label,
  type = 'text',
  value,
  onChange,
  error = false,
  helperText,
  required = false,
  options
}) => {
  if (type === 'select' && options) {
    return (
      <FormControl fullWidth margin="normal" error={error} required={required}>
        <InputLabel>{label}</InputLabel>
        <Select
          name={name}
          value={value}
          label={label}
          onChange={onChange as any}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {helperText && (
          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
            {helperText}
          </Typography>
        )}
      </FormControl>
    );
  }

  return (
    <TextField
      fullWidth
      margin="normal"
      name={name}
      label={label}
      type={type}
      value={value}
      onChange={onChange}
      error={error}
      helperText={helperText}
      required={required}
    />
  );
};

// 月份篩選器組件
export const MonthFilter: FC<MonthFilterProps> = ({
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
    <Typography variant="subtitle2">篩選：</Typography>
    <FormControl sx={{ minWidth: 120 }}>
      <InputLabel>年份</InputLabel>
      <Select
        value={selectedYear}
        label="年份"
        onChange={(e) => onYearChange(Number(e.target.value))}
        size="small"
      >
        {YEAR_OPTIONS.map((year) => (
          <MenuItem key={year} value={year}>
            {year}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
    
    <FormControl sx={{ minWidth: 120 }}>
      <InputLabel>月份</InputLabel>
      <Select
        value={selectedMonth}
        label="月份"
        onChange={(e) => onMonthChange(Number(e.target.value))}
        size="small"
      >
        {MONTH_OPTIONS.map((month) => (
          <MenuItem key={month.value} value={month.value}>
            {month.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Box>
);

// 帳號資訊顯示組件
export const AccountInfo: FC<AccountInfoProps> = ({
  account,
  onEdit,
  onResetPassword,
  onDelete
}) => (
  <Box>
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <Typography variant="subtitle2" color="textSecondary">
          用戶名
        </Typography>
        <Typography variant="body1">{account.username}</Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="subtitle2" color="textSecondary">
          角色
        </Typography>
        <Chip
          label={getRoleName(account.role)}
          color={getRoleColor(account.role)}
          size="small"
          sx={{ mt: 0.5 }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="subtitle2" color="textSecondary">
          電子郵件
        </Typography>
        <Typography variant="body1">{account.email || '未設定'}</Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="subtitle2" color="textSecondary">
          創建日期
        </Typography>
        <Typography variant="body1">
          {formatDate(String(account.createdAt))}
        </Typography>
      </Grid>
    </Grid>

    <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
      <Tooltip title="編輯帳號">
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={onEdit}
          size="small"
        >
          編輯
        </Button>
      </Tooltip>
      <Tooltip title="重設密碼">
        <Button
          variant="outlined"
          color="warning"
          startIcon={<LockResetIcon />}
          onClick={onResetPassword}
          size="small"
        >
          重設密碼
        </Button>
      </Tooltip>
      <Tooltip title="刪除帳號">
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={onDelete}
          size="small"
        >
          刪除
        </Button>
      </Tooltip>
    </Box>
  </Box>
);

// 狀態晶片組件
export const StatusChip: FC<StatusChipProps> = ({
  status,
  getStatusText,
  getStatusColor
}) => (
  <Chip
    label={getStatusText(status)}
    color={getStatusColor(status)}
    size="small"
  />
);

// 空狀態組件
export const EmptyState: FC<{
  message: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ message, description, action }) => (
  <Box sx={{ textAlign: 'center', p: 3 }}>
    <Typography color="textSecondary" sx={{ mb: 1 }}>
      {message}
    </Typography>
    {description && (
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        {description}
      </Typography>
    )}
    {action}
  </Box>
);

// 操作按鈕組
export const ActionButtons: FC<{
  onEdit?: () => void;
  onDelete?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  showApprove?: boolean;
  showReject?: boolean;
}> = ({
  onEdit,
  onDelete,
  onApprove,
  onReject,
  showApprove = false,
  showReject = false
}) => (
  <Box sx={{ display: 'flex', gap: 0.5 }}>
    {showApprove && onApprove && (
      <Tooltip title="核准">
        <IconButton size="small" color="success" onClick={onApprove}>
          <CheckIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    )}
    {showReject && onReject && (
      <Tooltip title="拒絕">
        <IconButton size="small" color="error" onClick={onReject}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    )}
    {onEdit && (
      <Tooltip title="編輯">
        <IconButton size="small" onClick={onEdit}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    )}
    {onDelete && (
      <Tooltip title="刪除">
        <IconButton size="small" color="error" onClick={onDelete}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    )}
  </Box>
);

// PropTypes 驗證
LoadingSpinner.propTypes = {
  message: PropTypes.string
} as any;

ErrorAlert.propTypes = {
  message: PropTypes.string.isRequired
} as any;

SuccessAlert.propTypes = {
  message: PropTypes.string.isRequired
} as any;

CommonDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  confirmText: PropTypes.string.isRequired,
  confirmColor: PropTypes.oneOf(['primary', 'error', 'warning']),
  submitting: PropTypes.bool.isRequired,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  children: PropTypes.node
} as any;

FormField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  options: PropTypes.array
} as any;

MonthFilter.propTypes = {
  selectedYear: PropTypes.number.isRequired,
  selectedMonth: PropTypes.number.isRequired,
  onYearChange: PropTypes.func.isRequired,
  onMonthChange: PropTypes.func.isRequired
} as any;

AccountInfo.propTypes = {
  account: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onResetPassword: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
} as any;

StatusChip.propTypes = {
  status: PropTypes.string.isRequired,
  getStatusText: PropTypes.func.isRequired,
  getStatusColor: PropTypes.func.isRequired
} as any;

EmptyState.propTypes = {
  message: PropTypes.string.isRequired,
  description: PropTypes.string,
  action: PropTypes.node
} as any;

ActionButtons.propTypes = {
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onApprove: PropTypes.func,
  onReject: PropTypes.func,
  showApprove: PropTypes.bool,
  showReject: PropTypes.bool
} as any;
/**
 * 進貨單模組共用組件
 */

import React, { FC } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  IconButton,
  TextField,
  Typography,
  TableCell,
  TableRow,
  Button,
  Input,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  CloudUpload as CloudUploadIcon,
  Lock as LockIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  SwapHoriz as SwapHorizIcon
} from '@mui/icons-material';
import StatusChip from '../../common/StatusChip';
import PaymentStatusChip from '../../common/PaymentStatusChip';
import {
  EditableRowProps,
  DisplayRowProps,
  ActionButtonsProps,
  FileUploadProps,
  StatusMessageProps
} from './types';
import { calculateUnitPrice, formatAmount } from './utils';

// 常數定義
const COLORS = {
  EXPENSE_ASSET: '#e49227ff',    // 綠色 - 支出-資產格式
  ASSET_LIABILITY: '#10ad5fff',  // 橙色 - 資產-負債格式
  DEFAULT: '#e91e63'           // 粉紅色 - 預設
} as const;

const TOOLTIPS = {
  EXPENSE_ASSET: '查看會計分錄 (支出)',
  ASSET_LIABILITY: '查看會計分錄 (資產)',
  DEFAULT: '查看會計分錄'
} as const;

// 共用樣式常數
const COMMON_STYLES = {
  hoverBackground: 'rgba(0, 0, 0, 0.04)',
  hoverBackgroundDark: 'rgba(0, 0, 0, 0.1)',
  flexCenter: { display: 'flex', justifyContent: 'center' },
  accountingButton: {
    border: '1px solid currentColor',
    borderWidth: '2px',
    borderRadius: '4px'
  },
  spacing: {
    mt2mb2: { mt: 2, mb: 2 },
    mt1: { mt: 1 }
  }
} as const;

// 工具函數：計算哈希值
const calculateHash = (id: string): number => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) & 0xffffffff;
  }
  return hash;
};

// 工具函數：根據記帳格式獲取配置
const getAccountingConfig = (accountingEntryType?: string, relatedTransactionGroupId?: string) => {
  // 優先使用明確的 accountingEntryType
  if (accountingEntryType === 'expense-asset') {
    return {
      color: COLORS.EXPENSE_ASSET,
      tooltip: TOOLTIPS.EXPENSE_ASSET,
      icon: <TrendingUpIcon fontSize="small" />
    };
  }
  
  if (accountingEntryType === 'asset-liability') {
    return {
      color: COLORS.ASSET_LIABILITY,
      tooltip: TOOLTIPS.ASSET_LIABILITY,
      icon: <SwapHorizIcon fontSize="small" />
    };
  }
  
  // 如果沒有明確的 accountingEntryType，但有 relatedTransactionGroupId
  // 這表示系統已經自動創建了分錄，但前端沒有正確的 accountingEntryType
  // 這種情況下，我們需要從後端 API 獲取實際的分錄類型，或者使用通用圖示
  if (relatedTransactionGroupId) {
    return {
      color: COLORS.DEFAULT,
      tooltip: TOOLTIPS.DEFAULT,
      icon: <AccountBalanceIcon fontSize="small" />
    };
  }
  
  return {
    color: COLORS.DEFAULT,
    tooltip: TOOLTIPS.DEFAULT,
    icon: <AccountBalanceIcon fontSize="small" />
  };
};

// 共用組件：序號欄位
const IndexCell: FC<{ index: number }> = ({ index }) => (
  <TableCell align="center">
    <Typography variant="body2">{index + 1}</Typography>
  </TableCell>
);

// 共用組件：可編輯文字欄位
const EditableTextField: FC<{
  name?: string;
  value: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  disabled?: boolean;
  inputProps?: any;
}> = ({ name, value, onChange, type = "text", disabled = false, inputProps }) => (
  <TextField
    fullWidth
    size="small"
    {...(name && { name })}
    type={type}
    value={value}
    {...(onChange && { onChange })}
    disabled={disabled}
    inputProps={inputProps}
  />
);

// 共用組件：操作按鈕組
const ActionIconButton: FC<{
  icon: React.ReactNode;
  onClick: () => void;
  color?: 'primary' | 'error' | 'default';
  disabled?: boolean;
  title?: string;
  sx?: any;
}> = ({ icon, onClick, color = 'default', disabled = false, title, sx }) => (
  <IconButton
    size="small"
    onClick={onClick}
    color={color}
    disabled={disabled}
    title={title}
    sx={sx}
  >
    {icon}
  </IconButton>
);

// 可編輯行組件
export const EditableRow: FC<EditableRowProps> = ({
  index,
  editingItem,
  handleEditingItemChange,
  handleSaveEditItem,
  handleCancelEditItem
}) => (
  <>
    <IndexCell index={index} />
    <TableCell>
      <EditableTextField value={editingItem.did} disabled />
    </TableCell>
    <TableCell>
      <EditableTextField value={editingItem.dname} disabled />
    </TableCell>
    <TableCell align="right">
      <EditableTextField
        name="dquantity"
        type="number"
        value={editingItem.dquantity}
        onChange={handleEditingItemChange as (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void}
        inputProps={{ min: 1 }}
      />
    </TableCell>
    <TableCell align="right">
      <EditableTextField
        name="dtotalCost"
        type="number"
        value={editingItem.dtotalCost}
        onChange={handleEditingItemChange as (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void}
        inputProps={{ min: 0 }}
      />
    </TableCell>
    <TableCell align="right">
      {calculateUnitPrice(editingItem.dtotalCost, editingItem.dquantity)}
    </TableCell>
    <TableCell align="center">
      <ActionIconButton
        icon={<CheckIcon />}
        onClick={handleSaveEditItem}
        color="primary"
      />
      <ActionIconButton
        icon={<CloseIcon />}
        onClick={handleCancelEditItem}
        color="error"
      />
    </TableCell>
  </>
);

// 顯示行組件
export const DisplayRow: FC<DisplayRowProps> = ({
  item,
  index,
  handleEditItem,
  handleRemoveItem,
  handleMoveItem,
  isFirst,
  isLast
}) => (
  <>
    <IndexCell index={index} />
    <TableCell>{item.did}</TableCell>
    <TableCell>{item.dname}</TableCell>
    <TableCell align="right">{item.dquantity}</TableCell>
    <TableCell align="right">{formatAmount(item.dtotalCost)}</TableCell>
    <TableCell align="right">
      {calculateUnitPrice(item.dtotalCost, item.dquantity)}
    </TableCell>
    <TableCell align="center">
      <Box sx={COMMON_STYLES.flexCenter}>
        <ActionIconButton
          icon={<ArrowUpwardIcon fontSize="small" />}
          onClick={() => handleMoveItem(index, 'up')}
          disabled={isFirst}
        />
        <ActionIconButton
          icon={<ArrowDownwardIcon fontSize="small" />}
          onClick={() => handleMoveItem(index, 'down')}
          disabled={isLast}
        />
        <ActionIconButton
          icon={<EditIcon fontSize="small" />}
          onClick={() => handleEditItem(index)}
        />
        <ActionIconButton
          icon={<DeleteIcon fontSize="small" />}
          onClick={() => handleRemoveItem(index)}
        />
      </Box>
    </TableCell>
  </>
);

// 操作按鈕組組件
export const ActionButtons: FC<ActionButtonsProps> = ({
  onView,
  onEdit,
  onDelete,
  onPreviewMouseEnter,
  onPreviewMouseLeave,
  isDeleteDisabled = false,
  status,
  onUnlock,
  relatedTransactionGroupId,
  accountingEntryType,
  onViewAccountingEntry
}) => {
  const isCompleted = status === 'completed';
  const hasAccountingEntry = !!relatedTransactionGroupId;
  
  // 使用統一的配置函數
  const accountingConfig = getAccountingConfig(accountingEntryType, relatedTransactionGroupId);

  return (
    <Box>
      <IconButton
        size="small"
        onClick={onView}
        onMouseEnter={onPreviewMouseEnter}
        onMouseLeave={onPreviewMouseLeave}
        sx={{ '&:hover': { backgroundColor: COMMON_STYLES.hoverBackground } }}
      >
        <VisibilityIcon fontSize="small" />
      </IconButton>
      
      {/* 會計分錄圖示 - 只有在有分錄時才顯示 */}
      {hasAccountingEntry && onViewAccountingEntry && (
        <ActionIconButton
          icon={accountingConfig.icon}
          onClick={onViewAccountingEntry}
          title={accountingConfig.tooltip}
          sx={{
            color: `${accountingConfig.color} !important`,
            '&:hover': { backgroundColor: COMMON_STYLES.hoverBackgroundDark },
            ...COMMON_STYLES.accountingButton
          }}
        />
      )}
      
      {isCompleted && onUnlock ? (
        // 已完成狀態：只顯示鎖符號
        <ActionIconButton
          icon={<LockIcon fontSize="small" />}
          onClick={onUnlock}
          title="點擊解鎖並改為待處理"
        />
      ) : !isCompleted ? (
        // 待處理或其他狀態：顯示編輯和刪除按鈕
        <>
          <ActionIconButton
            icon={<EditIcon fontSize="small" />}
            onClick={onEdit}
          />
          <ActionIconButton
            icon={<DeleteIcon fontSize="small" />}
            onClick={onDelete}
            disabled={isDeleteDisabled}
          />
        </>
      ) : null}
    </Box>
  );
};

// 檔案上傳組件
export const FileUpload: FC<FileUploadProps> = ({
  csvFile,
  onFileChange,
  loading
}) => (
  <Box sx={COMMON_STYLES.spacing.mt2mb2}>
    <Input
      type="file"
      inputProps={{ accept: '.csv' }}
      onChange={onFileChange}
      disabled={loading}
      sx={{ display: 'none' }}
      id="csv-file-input"
    />
    <label htmlFor="csv-file-input">
      <Button
        variant="outlined"
        component="span"
        startIcon={<CloudUploadIcon />}
        disabled={loading}
      >
        選擇CSV文件
      </Button>
    </label>
    
    {csvFile && (
      <Typography variant="body2" sx={COMMON_STYLES.spacing.mt1}>
        已選擇: {csvFile.name}
      </Typography>
    )}
  </Box>
);

// 狀態訊息組件
export const StatusMessage: FC<StatusMessageProps> = ({
  error,
  success
}) => (
  <>
    {error && (
      <Alert severity="error" sx={COMMON_STYLES.spacing.mt2mb2}>
        {error}
      </Alert>
    )}
    
    {success && (
      <Alert severity="success" sx={COMMON_STYLES.spacing.mt2mb2}>
        CSV導入成功！
      </Alert>
    )}
  </>
);

// 載入中按鈕組件
export const LoadingButton: FC<{
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ onClick, loading, disabled = false, children }) => (
  <Button
    onClick={onClick}
    color="primary"
    disabled={disabled || loading}
    startIcon={loading ? <CircularProgress size={20} /> : undefined}
  >
    {loading ? '導入中...' : children}
  </Button>
);

// 空狀態組件
export const EmptyState: FC<{
  message: string;
  colSpan: number;
}> = ({ message, colSpan }) => (
  <TableRow>
    <TableCell colSpan={colSpan} align="center">
      {message}
    </TableCell>
  </TableRow>
);

// 表格標題行組件
export const TableHeaderRow: FC = () => (
  <TableRow>
    <TableCell align="center" width="60px">序號</TableCell>
    <TableCell>藥品代碼</TableCell>
    <TableCell>藥品名稱</TableCell>
    <TableCell align="right">數量</TableCell>
    <TableCell align="right">總成本</TableCell>
    <TableCell align="right">單價</TableCell>
    <TableCell align="center">操作</TableCell>
  </TableRow>
);

// 狀態晶片渲染器
export const StatusChipRenderer: FC<{ status: string }> = ({ status }) => (
  <StatusChip status={status} />
);

// 付款狀態晶片渲染器
export const PaymentStatusChipRenderer: FC<{ status: '未付' | '已下收' | '已匯款' }> = ({ status }) => (
  <PaymentStatusChip status={status} />
);

// 金額格式化渲染器
export const AmountRenderer: FC<{ value: number }> = ({ value }) => (
  <span>{value ? formatAmount(value) : ''}</span>
);

// PropTypes 驗證 - 使用簡化的定義方式
const createPropTypes = (specificProps: Record<string, any>) => specificProps as any;

EditableRow.propTypes = createPropTypes({
  index: PropTypes.number.isRequired,
  editingItem: PropTypes.object.isRequired,
  handleEditingItemChange: PropTypes.func.isRequired,
  handleSaveEditItem: PropTypes.func.isRequired,
  handleCancelEditItem: PropTypes.func.isRequired
});

DisplayRow.propTypes = createPropTypes({
  item: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  handleEditItem: PropTypes.func.isRequired,
  handleRemoveItem: PropTypes.func.isRequired,
  handleMoveItem: PropTypes.func.isRequired,
  isFirst: PropTypes.bool.isRequired,
  isLast: PropTypes.bool.isRequired
});

ActionButtons.propTypes = createPropTypes({
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onPreviewMouseEnter: PropTypes.func.isRequired,
  onPreviewMouseLeave: PropTypes.func.isRequired,
  isDeleteDisabled: PropTypes.bool,
  status: PropTypes.string,
  onUnlock: PropTypes.func,
  relatedTransactionGroupId: PropTypes.string,
  accountingEntryType: PropTypes.oneOf(['expense-asset', 'asset-liability']),
  onViewAccountingEntry: PropTypes.func
});

FileUpload.propTypes = createPropTypes({
  csvFile: PropTypes.object,
  onFileChange: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired
});

StatusMessage.propTypes = createPropTypes({
  error: PropTypes.string,
  success: PropTypes.bool.isRequired
});

LoadingButton.propTypes = createPropTypes({
  onClick: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  disabled: PropTypes.bool,
  children: PropTypes.node.isRequired
});

EmptyState.propTypes = createPropTypes({
  message: PropTypes.string.isRequired,
  colSpan: PropTypes.number.isRequired
});

StatusChipRenderer.propTypes = createPropTypes({
  status: PropTypes.string.isRequired
});

PaymentStatusChipRenderer.propTypes = createPropTypes({
  status: PropTypes.string.isRequired
});

AmountRenderer.propTypes = createPropTypes({
  value: PropTypes.number.isRequired
});
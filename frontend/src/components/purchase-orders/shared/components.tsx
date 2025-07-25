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

// 可編輯行組件
export const EditableRow: FC<EditableRowProps> = ({
  item,
  index,
  editingItem,
  handleEditingItemChange,
  handleSaveEditItem,
  handleCancelEditItem
}) => (
  <>
    <TableCell align="center">
      <Typography variant="body2">{index + 1}</Typography>
    </TableCell>
    <TableCell>
      <TextField
        fullWidth
        size="small"
        value={editingItem.did}
        disabled
      />
    </TableCell>
    <TableCell>
      <TextField
        fullWidth
        size="small"
        value={editingItem.dname}
        disabled
      />
    </TableCell>
    <TableCell align="right">
      <TextField
        fullWidth
        size="small"
        name="dquantity"
        type="number"
        value={editingItem.dquantity}
        onChange={handleEditingItemChange}
        inputProps={{ min: 1 }}
      />
    </TableCell>
    <TableCell align="right">
      <TextField
        fullWidth
        size="small"
        name="dtotalCost"
        type="number"
        value={editingItem.dtotalCost}
        onChange={handleEditingItemChange}
        inputProps={{ min: 0 }}
      />
    </TableCell>
    <TableCell align="right">
      {calculateUnitPrice(editingItem.dtotalCost, editingItem.dquantity)}
    </TableCell>
    <TableCell align="center">
      <IconButton color="primary" onClick={handleSaveEditItem}>
        <CheckIcon />
      </IconButton>
      <IconButton color="error" onClick={handleCancelEditItem}>
        <CloseIcon />
      </IconButton>
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
    <TableCell align="center">
      <Typography variant="body2">{index + 1}</Typography>
    </TableCell>
    <TableCell>{item.did}</TableCell>
    <TableCell>{item.dname}</TableCell>
    <TableCell align="right">{item.dquantity}</TableCell>
    <TableCell align="right">{formatAmount(item.dtotalCost)}</TableCell>
    <TableCell align="right">
      {calculateUnitPrice(item.dtotalCost, item.dquantity)}
    </TableCell>
    <TableCell align="center">
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <IconButton 
          size="small" 
          onClick={() => handleMoveItem(index, 'up')} 
          disabled={isFirst}
        >
          <ArrowUpwardIcon fontSize="small" />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={() => handleMoveItem(index, 'down')} 
          disabled={isLast}
        >
          <ArrowDownwardIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => handleEditItem(index)}>
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => handleRemoveItem(index)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
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

  // 調試日誌
  console.log('🔍 ActionButtons props:', {
    relatedTransactionGroupId,
    accountingEntryType,
    hasAccountingEntry,
    onViewAccountingEntry: !!onViewAccountingEntry
  });

  // 根據記帳格式選擇圖示
  const getAccountingIcon = () => {
    if (accountingEntryType === 'expense-asset') {
      return <TrendingUpIcon fontSize="small" />; // 支出-資產格式：上升趨勢圖示
    } else if (accountingEntryType === 'asset-liability') {
      return <SwapHorizIcon fontSize="small" />; // 資產-負債格式：交換圖示
    }
    return <AccountBalanceIcon fontSize="small" />; // 預設：會計圖示
  };

  // 根據記帳格式選擇顏色
  const getAccountingColor = () => {
    if (accountingEntryType === 'expense-asset') {
      return 'primary'; // 支出-資產格式：藍色
    } else if (accountingEntryType === 'asset-liability') {
      return 'secondary'; // 資產-負債格式：紫色
    }
    return 'default';
  };

  // 根據記帳格式選擇提示文字
  const getAccountingTooltip = () => {
    if (accountingEntryType === 'expense-asset') {
      return '查看會計分錄 (支出-資產格式)';
    } else if (accountingEntryType === 'asset-liability') {
      return '查看會計分錄 (資產-負債格式)';
    }
    return '查看會計分錄';
  };

  return (
    <Box>
      <IconButton
        size="small"
        onClick={onView}
        onMouseEnter={onPreviewMouseEnter}
        onMouseLeave={onPreviewMouseLeave}
      >
        <VisibilityIcon fontSize="small" />
      </IconButton>
      
      {/* 會計分錄圖示 - 只有在有分錄時才顯示 */}
      {hasAccountingEntry && onViewAccountingEntry && (
        <IconButton
          size="small"
          onClick={onViewAccountingEntry}
          color={getAccountingColor()}
          title={getAccountingTooltip()}
        >
          {getAccountingIcon()}
        </IconButton>
      )}
      
      {/* 強制顯示會計分錄圖示用於測試 */}
      {relatedTransactionGroupId && (
        <IconButton
          size="small"
          onClick={() => console.log('測試會計分錄點擊:', relatedTransactionGroupId)}
          color="error"
          title="測試會計分錄圖示"
          sx={{
            border: '2px solid blue',
            backgroundColor: 'rgba(0, 0, 255, 0.1)'
          }}
        >
          <AccountBalanceIcon fontSize="small" />
        </IconButton>
      )}
      
      {isCompleted ? (
        // 已完成狀態：只顯示鎖符號
        <IconButton
          size="small"
          onClick={onUnlock}
          title="點擊解鎖並改為待處理"
        >
          <LockIcon fontSize="small" />
        </IconButton>
      ) : (
        // 待處理或其他狀態：顯示編輯和刪除按鈕
        <>
          <IconButton size="small" onClick={onEdit}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={onDelete}
            disabled={isDeleteDisabled}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      )}
    </Box>
  );
};

// 檔案上傳組件
export const FileUpload: FC<FileUploadProps> = ({
  csvFile,
  onFileChange,
  loading
}) => (
  <Box sx={{ mt: 2, mb: 2 }}>
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
      <Typography variant="body2" sx={{ mt: 1 }}>
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
      <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
        {error}
      </Alert>
    )}
    
    {success && (
      <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
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

// PropTypes 驗證
EditableRow.propTypes = {
  item: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  editingItem: PropTypes.object.isRequired,
  handleEditingItemChange: PropTypes.func.isRequired,
  handleSaveEditItem: PropTypes.func.isRequired,
  handleCancelEditItem: PropTypes.func.isRequired
} as any;

DisplayRow.propTypes = {
  item: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  handleEditItem: PropTypes.func.isRequired,
  handleRemoveItem: PropTypes.func.isRequired,
  handleMoveItem: PropTypes.func.isRequired,
  isFirst: PropTypes.bool.isRequired,
  isLast: PropTypes.bool.isRequired
} as any;

ActionButtons.propTypes = {
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
} as any;

FileUpload.propTypes = {
  csvFile: PropTypes.object,
  onFileChange: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired
} as any;

StatusMessage.propTypes = {
  error: PropTypes.string,
  success: PropTypes.bool.isRequired
} as any;

LoadingButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  disabled: PropTypes.bool,
  children: PropTypes.node.isRequired
} as any;

EmptyState.propTypes = {
  message: PropTypes.string.isRequired,
  colSpan: PropTypes.number.isRequired
} as any;

StatusChipRenderer.propTypes = {
  status: PropTypes.string.isRequired
} as any;

PaymentStatusChipRenderer.propTypes = {
  status: PropTypes.string.isRequired
} as any;

AmountRenderer.propTypes = {
  value: PropTypes.number.isRequired
} as any;
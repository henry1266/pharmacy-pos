/**
 * 出貨單模組共用組件
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
import { PackageInventoryDisplay } from '../../../components/package-units';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  CloudUpload as CloudUploadIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import StatusChip from '../../../components/common/StatusChip';
import PaymentStatusChip from '../../../components/common/PaymentStatusChip';
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <TextField
          fullWidth
          size="small"
          name="dquantity"
          type="number"
          value={editingItem.dquantity}
          onChange={handleEditingItemChange}
          inputProps={{ min: 1 }}
        />
        {editingItem.packageUnits && editingItem.packageUnits.length > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            基礎單位：{editingItem.dquantity} {editingItem.unit || '個'}
          </Typography>
        )}
      </Box>
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
    <TableCell align="right">
      {item.packageUnits && item.packageUnits.length > 0 ? (
        <PackageInventoryDisplay
          packageUnits={item.packageUnits}
          totalQuantity={Number(item.dquantity)}
          baseUnitName={item.unit || '個'}
          variant="compact"
        />
      ) : (
        item.dquantity
      )}
    </TableCell>
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
  onUnlock
}) => {
  const isCompleted = status === 'completed';

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
export const PaymentStatusChipRenderer: FC<{ status: '未付' | '未收' | '已收款' | '已下收' | '已匯款' | '已開立' }> = ({ status }) => (
  <PaymentStatusChip status={status} />
);

// 金額格式化渲染器
export const AmountRenderer: FC<{ value: number }> = ({ value }) => (
  <span>{value ? formatAmount(value) : ''}</span>
);

// 日期時間格式化渲染器
export const DateTimeRenderer: FC<{ value: string | Date }> = ({ value }) => {
  if (!value) return <span>-</span>;
  
  const date = value instanceof Date ? value : new Date(value);
  
  // 檢查日期是否有效
  if (isNaN(date.getTime())) return <span>-</span>;
  
  // 格式化日期時間：YYYY-MM-DD HH:MM
  const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  
  return <span>{formattedDate}</span>;
};

// PropTypes 驗證
EditableRow.propTypes = {
  item: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  editingItem: PropTypes.shape({
    did: PropTypes.string.isRequired,
    dname: PropTypes.string.isRequired,
    dquantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    dtotalCost: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    batchNumber: PropTypes.string,
    packageQuantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    boxQuantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    packageUnits: PropTypes.array,
    unit: PropTypes.string
  }).isRequired,
  handleEditingItemChange: PropTypes.func.isRequired,
  handleSaveEditItem: PropTypes.func.isRequired,
  handleCancelEditItem: PropTypes.func.isRequired
} as any;

DisplayRow.propTypes = {
  item: PropTypes.shape({
    did: PropTypes.string.isRequired,
    dname: PropTypes.string.isRequired,
    dquantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    dtotalCost: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    batchNumber: PropTypes.string,
    packageQuantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    boxQuantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    packageUnits: PropTypes.array,
    unit: PropTypes.string
  }).isRequired,
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
  onUnlock: PropTypes.func
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

DateTimeRenderer.propTypes = {
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date)
  ])
} as any;
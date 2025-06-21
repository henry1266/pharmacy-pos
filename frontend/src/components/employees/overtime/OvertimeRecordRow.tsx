import React from 'react';
import {
  TableRow,
  TableCell,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WorkIcon from '@mui/icons-material/Work';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventNoteIcon from '@mui/icons-material/EventNote';

/**
 * 加班記錄類型
 */
export type OvertimeRecordType = 'independent' | 'schedule';

/**
 * 加班記錄狀態
 */
export type OvertimeRecordStatus = 'pending' | 'approved' | 'rejected' | string;

/**
 * 加班記錄接口
 */
export interface OvertimeRecord {
  id: string;
  type: OvertimeRecordType;
  date: string | Date;
  originalRecord: any; // 原始記錄對象
  hours: string | number;
  description: string;
  status: OvertimeRecordStatus;
}

/**
 * 加班記錄行組件的 Props 接口
 */
interface OvertimeRecordRowProps {
  record: OvertimeRecord;
  isAdmin: boolean;
  onEdit: (record: any) => void;
  onDelete: (record: any) => void;
  onApprove: (record: any) => void;
  onReject: (record: any) => void;
  formatDate: (date: string | Date) => string;
  getStatusText: (status: string) => string;
  getStatusColor: (status: string) => "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";
}

/**
 * 加班記錄行組件
 * 統一處理加班記錄表格行的顯示邏輯，消除重複的表格結構
 */
/**
 * 獲取行背景顏色
 */
const getRowBackgroundColor = (isIndependent: boolean, status: string): string => {
  if (isIndependent) {
    return status === 'approved' ? 'rgba(76, 175, 80, 0.08)' : 'inherit';
  }
  return 'rgba(25, 118, 210, 0.05)';
};

/**
 * 獲取行文字顏色
 */
const getRowTextColor = (isIndependent: boolean, status: string): string => {
  return isIndependent && status === 'approved' ? 'text.primary' : 'text.secondary';
};

const OvertimeRecordRow: React.FC<OvertimeRecordRowProps> = ({
  record,
  isAdmin,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  formatDate,
  getStatusText,
  getStatusColor
}) => {
  const isIndependent = record.type === 'independent';
  const isSchedule = record.type === 'schedule';

  return (
    <TableRow
      sx={{
        bgcolor: getRowBackgroundColor(isIndependent, record.status),
        '& td': {
          color: getRowTextColor(isIndependent, record.status)
        }
      }}
    >
      <TableCell>
        <Tooltip title={isIndependent ? "獨立加班記錄" : "排班系統加班記錄"}>
          {isIndependent ? (
            <WorkIcon fontSize="small" sx={{ color: 'secondary.main' }} />
          ) : (
            <CalendarMonthIcon fontSize="small" sx={{ color: 'primary.main' }} />
          )}
        </Tooltip>
      </TableCell>
      
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <EventNoteIcon 
            fontSize="small" 
            sx={{ 
              mr: 1, 
              color: isIndependent ? 'secondary.main' : 'primary.main' 
            }} 
          />
          {formatDate(record.date)}
        </Box>
      </TableCell>
      
      <TableCell>{record.description}</TableCell>
      
      <TableCell>
        {typeof record.hours === 'number' ? record.hours.toFixed(1) : record.hours} 小時
      </TableCell>
      
      <TableCell>
        <Chip
          label={isSchedule ? "已核准" : getStatusText(record.status)}
          color={isSchedule ? "success" : getStatusColor(record.status)}
          size="small"
          {...({} as any)}
        />
      </TableCell>
      
      {isAdmin && (
        <TableCell>
          {isSchedule ? (
            <Typography variant="caption" color="text.secondary">
              (請在排班系統中管理)
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="編輯">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => onEdit(record.originalRecord)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              {record.status === 'pending' && (
                <>
                  <Tooltip title="核准">
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => onApprove(record.originalRecord)}
                    >
                      <CheckCircleIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="拒絕">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onReject(record.originalRecord)}
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
              
              <Tooltip title="刪除">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onDelete(record.originalRecord)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </TableCell>
      )}
    </TableRow>
  );
};

export default OvertimeRecordRow;
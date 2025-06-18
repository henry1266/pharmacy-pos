import React from 'react';
import PropTypes from 'prop-types';
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
 * 加班記錄行組件
 * 統一處理加班記錄表格行的顯示邏輯，消除重複的表格結構
 */
const OvertimeRecordRow = ({
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
        bgcolor: isIndependent 
          ? (record.status === 'approved' ? 'rgba(76, 175, 80, 0.08)' : 'inherit')
          : 'rgba(25, 118, 210, 0.05)',
        '& td': {
          color: isIndependent && record.status === 'approved' ? 'text.primary' : 'text.secondary'
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

OvertimeRecordRow.propTypes = {
  record: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['independent', 'schedule']).isRequired,
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
    originalRecord: PropTypes.object.isRequired,
    hours: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    description: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired
  }).isRequired,
  isAdmin: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired,
  getStatusText: PropTypes.func.isRequired,
  getStatusColor: PropTypes.func.isRequired
};

export default OvertimeRecordRow;
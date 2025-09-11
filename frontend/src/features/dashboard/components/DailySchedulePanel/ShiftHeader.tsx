import React, { memo } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { AccessTime as AccessTimeIcon } from '@mui/icons-material';
import { ShiftSchedule, isOvertimeShift, getShiftDisplayText } from '../../utils/scheduleUtils';

interface ShiftHeaderProps {
  shift: ShiftSchedule;
  onOvertimeClockIn?: (() => void) | undefined;
}

/**
 * 班次標題元件
 * 顯示班次名稱、時間範圍和人數
 */
const ShiftHeader: React.FC<ShiftHeaderProps> = ({ shift, onOvertimeClockIn }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 1.5,
        bgcolor: 'grey.50',
        borderRadius: 1,
        mb: 1
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* 班次顏色標記 */}
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: shift.color
          }}
        />
        
        {/* 班次名稱 */}
        <Typography variant="subtitle2" fontWeight="medium">
          {shift.shiftName}
        </Typography>
        
        {/* 加班打卡按鈕或時間範圍 */}
        {isOvertimeShift(shift) ? (
          <Button
            size="small"
            variant="outlined"
            color="primary"
            startIcon={<AccessTimeIcon />}
            onClick={onOvertimeClockIn}
            sx={{
              ml: 1,
              minWidth: 'auto',
              fontSize: '0.75rem',
              py: 0.5,
              px: 1
            }}
          >
            打卡
          </Button>
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            {shift.timeRange}
          </Typography>
        )}
      </Box>
      
      {/* 人數或記錄數 */}
      <Typography variant="body2" color="text.secondary">
        {getShiftDisplayText(shift)}
      </Typography>
    </Box>
  );
};

export default memo(ShiftHeader);
import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  IconButton,
  Typography,
  Button
} from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import TodayIcon from '@mui/icons-material/Today';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';

/**
 * 月份導航組件
 * 提供月份切換、今天按鈕、工時統計和編輯模式控制
 */
const MonthNavigation = ({
  currentDate,
  formatMonth,
  onPrevMonth,
  onNextMonth,
  onToday,
  onWorkHoursClick,
  isAdmin,
  editMode,
  onToggleEditMode
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {/* 月份導航 */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={onPrevMonth} size="small">
          <ArrowBackIosIcon />
        </IconButton>
        <Typography variant="h5" sx={{ mx: 2, minWidth: '150px', textAlign: 'center' }}>
          {formatMonth(currentDate)}
        </Typography>
        <IconButton onClick={onNextMonth} size="small">
          <ArrowForwardIosIcon />
        </IconButton>
      </Box>
      
      {/* 操作按鈕 */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<TodayIcon />}
          onClick={onToday}
        >
          今天
        </Button>
        
        <Button
          variant="outlined"
          size="small"
          color="info"
          onClick={onWorkHoursClick}
        >
          本月工時統計
        </Button>
        
        {isAdmin && (
          <Button
            variant={editMode ? "contained" : "outlined"}
            size="small"
            color={editMode ? "primary" : "secondary"}
            startIcon={editMode ? <SaveIcon /> : <EditIcon />}
            onClick={onToggleEditMode}
          >
            {editMode ? '儲存' : '編輯模式'}
          </Button>
        )}
      </Box>
    </Box>
  );
};

MonthNavigation.propTypes = {
  currentDate: PropTypes.instanceOf(Date).isRequired,
  formatMonth: PropTypes.func.isRequired,
  onPrevMonth: PropTypes.func.isRequired,
  onNextMonth: PropTypes.func.isRequired,
  onToday: PropTypes.func.isRequired,
  onWorkHoursClick: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool,
  editMode: PropTypes.bool,
  onToggleEditMode: PropTypes.func
};

MonthNavigation.defaultProps = {
  isAdmin: false,
  editMode: false,
  onToggleEditMode: () => {}
};

export default MonthNavigation;
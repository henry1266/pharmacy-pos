import React from 'react';
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

// 定義元件 Props 介面
interface MonthNavigationProps {
  currentDate: Date;
  formatMonth: (date: Date) => string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onWorkHoursClick: () => void;
  isAdmin?: boolean;
  editMode?: boolean;
  onToggleEditMode?: () => void;
}

/**
 * 月份導航組件
 * 提供月份切換、今天按鈕、工時統計和編輯模式控制
 */
const MonthNavigation: React.FC<MonthNavigationProps> = ({
  currentDate,
  formatMonth,
  onPrevMonth,
  onNextMonth,
  onToday,
  onWorkHoursClick,
  isAdmin = false,
  editMode = false,
  onToggleEditMode = () => {}
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

export default MonthNavigation;
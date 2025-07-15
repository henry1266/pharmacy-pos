import React, { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Button
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon
} from '@mui/icons-material';

interface DashboardCalendarProps {
  selectedDate?: string;
}

const DashboardCalendar: FC<DashboardCalendarProps> = ({ selectedDate }) => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  // 獲取當月的第一天和最後一天
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // 獲取當月第一天是星期幾（0=星期日, 1=星期一, ...）
  // 由於我們的星期標題是「日一二三四五六」，所以不需要調整
  const firstDayWeekday = firstDayOfMonth.getDay();
  
  // 獲取當月天數
  const daysInMonth = lastDayOfMonth.getDate();

  // 生成日曆格子
  const generateCalendarDays = () => {
    const days = [];
    
    // 添加上個月的空白格子
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(null);
    }
    
    // 添加當月的日期
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

  const formatDateForUrl = (day: number) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    const dateStr = formatDateForUrl(day);
    return dateStr === selectedDate;
  };

  const handleDateClick = (day: number) => {
    const dateStr = formatDateForUrl(day);
    navigate(`/dashboard/${dateStr}`);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ];

  return (
    <Card elevation={2}>
      <CardContent>
        {/* 日曆標題 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="600">
            營業日曆
          </Typography>
          <Button
            size="small"
            startIcon={<TodayIcon />}
            onClick={handleToday}
            variant="outlined"
          >
            今天
          </Button>
        </Box>

        {/* 月份導航 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handlePrevMonth} size="small">
            <ChevronLeftIcon />
          </IconButton>
          
          <Typography variant="h6" fontWeight="600">
            {currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}
          </Typography>
          
          <IconButton onClick={handleNextMonth} size="small">
            <ChevronRightIcon />
          </IconButton>
        </Box>

        {/* 星期標題 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1 }}>
          {weekdays.map((weekday) => (
            <Box key={weekday} sx={{ textAlign: 'center' }}>
              <Typography
                variant="body2"
                fontWeight="600"
                color="text.secondary"
                sx={{ py: 1 }}
              >
                {weekday}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* 日曆格子 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
          {calendarDays.map((day, index) => (
            <Box key={index} sx={{ textAlign: 'center' }}>
              {day ? (
                <Box
                  onClick={() => handleDateClick(day)}
                  sx={{
                    width: '100%',
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    bgcolor: isSelected(day)
                      ? 'primary.main'
                      : isToday(day)
                        ? 'primary.light'
                        : 'transparent',
                    color: isSelected(day)
                      ? 'primary.contrastText'
                      : isToday(day)
                        ? 'primary.main'
                        : 'text.primary',
                    fontWeight: isToday(day) || isSelected(day) ? 'bold' : 'normal',
                    '&:hover': {
                      bgcolor: isSelected(day)
                        ? 'primary.dark'
                        : 'action.hover',
                      transform: 'scale(1.05)'
                    }
                  }}
                >
                  <Typography variant="body2">
                    {day}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ height: 40 }} />
              )}
            </Box>
          ))}
        </Box>

        {/* 說明文字 */}
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            點擊日期查看當日營業報表
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: 1, 
                  bgcolor: 'primary.light' 
                }} 
              />
              <Typography variant="caption" color="text.secondary">
                今天
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: 1, 
                  bgcolor: 'primary.main' 
                }} 
              />
              <Typography variant="caption" color="text.secondary">
                已選擇
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DashboardCalendar;
import React, { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
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

/**
 * 儀表板日曆組件屬性
 */
interface DashboardCalendarProps {
  /** 當前選中的日期，格式為 'YYYY-MM-DD' */
  selectedDate?: string;
  /** 日期選擇回調函數 */
  onDateSelect?: (date: string) => void;
}

/**
 * 儀表板日曆組件
 *
 * @description 顯示月份視圖的日曆，允許用戶選擇日期查看當日營業報表。
 * 支持導航到上個月、下個月和今天，並高亮顯示當前選中的日期和今天的日期。
 *
 * @component
 * @example
 * ```tsx
 * <DashboardCalendar
 *   selectedDate="2025-08-21"
 *   onDateSelect={(date) => console.log(`選擇了日期: ${date}`)}
 * />
 * ```
 */
const DashboardCalendar: FC<DashboardCalendarProps> = ({ selectedDate, onDateSelect }) => {
  const navigate = useNavigate();
  /** 當前顯示的月份 */
  const [currentDate, setCurrentDate] = useState(new Date());

  // 獲取當月的第一天和最後一天
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // 獲取當月第一天是星期幾（0=星期日, 1=星期一, ...）
  // 由於我們的星期標題是「日一二三四五六」，所以不需要調整
  const firstDayWeekday = firstDayOfMonth.getDay();
  
  // 獲取當月天數
  const daysInMonth = lastDayOfMonth.getDate();

  /**
   * 星期名稱
   */
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

  /**
   * 月份名稱
   */
  const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ];

  /**
   * 生成日曆格子
   *
   * @description 生成包含當月所有日期的數組，並在前面添加空白格子以對齊星期
   * @returns {(number | null)[]} 日曆格子數組，null 表示空白格子
   */
  const generateCalendarDays = (): (number | null)[] => {
    try {
      const days: (number | null)[] = [];
      
      // 檢查 firstDayWeekday 是否有效
      if (firstDayWeekday < 0 || firstDayWeekday > 6) {
        console.warn(`無效的星期幾: ${firstDayWeekday}`);
        return [];
      }
      
      // 檢查 daysInMonth 是否有效
      if (daysInMonth <= 0 || daysInMonth > 31) {
        console.warn(`無效的月份天數: ${daysInMonth}`);
        return [];
      }
      
      // 添加上個月的空白格子
      for (let i = 0; i < firstDayWeekday; i++) {
        days.push(null);
      }
      
      // 添加當月的日期
      for (let day = 1; day <= daysInMonth; day++) {
        days.push(day);
      }
      
      return days;
    } catch (error) {
      console.error('生成日曆格子時發生錯誤:', error);
      return [];
    }
  };

  const calendarDays = generateCalendarDays();

  /**
   * 將日期格式化為 URL 格式
   *
   * @description 將日期格式化為 'YYYY-MM-DD' 格式，用於 URL 路徑
   * @param {number} day - 日期（1-31）
   * @returns {string} 格式化後的日期字符串，如果日期無效則返回空字符串
   */
  const formatDateForUrl = (day: number): string => {
    // 檢查日期是否有效
    if (!day || isNaN(day) || day < 1 || day > daysInMonth) {
      console.warn(`無效的日期: ${day}`);
      return '';
    }
    
    try {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      return `${year}-${month}-${dayStr}`;
    } catch (error) {
      console.error('格式化日期時發生錯誤:', error);
      return '';
    }
  };

  /**
   * 檢查日期是否為今天
   *
   * @description 檢查指定的日期是否為今天
   * @param {number} day - 日期（1-31）
   * @returns {boolean} 如果是今天則返回 true，否則返回 false
   */
  const isToday = (day: number): boolean => {
    // 檢查日期是否有效
    if (!day || isNaN(day) || day < 1 || day > daysInMonth) {
      return false;
    }
    
    try {
      const today = new Date();
      return (
        day === today.getDate() &&
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear()
      );
    } catch (error) {
      console.error('檢查日期是否為今天時發生錯誤:', error);
      return false;
    }
  };

  /**
   * 檢查日期是否被選中
   *
   * @description 檢查指定的日期是否為當前選中的日期
   * @param {number} day - 日期（1-31）
   * @returns {boolean} 如果是選中的日期則返回 true，否則返回 false
   */
  const isSelected = (day: number): boolean => {
    // 如果沒有選中的日期，直接返回 false
    if (!selectedDate) return false;
    
    // 檢查日期是否有效
    if (!day || isNaN(day) || day < 1 || day > daysInMonth) {
      return false;
    }
    
    try {
      const dateStr = formatDateForUrl(day);
      return dateStr === selectedDate;
    } catch (error) {
      console.error('檢查日期是否被選中時發生錯誤:', error);
      return false;
    }
  };

  /**
   * 處理日期點擊事件
   *
   * @description 當用戶點擊日期時，調用 onDateSelect 回調或導航到該日期的儀表板詳情頁面
   * @param {number} day - 被點擊的日期（1-31）
   */
  const handleDateClick = (day: number): void => {
    const dateStr = formatDateForUrl(day);
    
    // 如果日期無效，不執行任何操作
    if (!dateStr) {
      console.warn(`無法處理無效的日期: ${day}`);
      return;
    }
    
    if (onDateSelect) {
      onDateSelect(dateStr);
    } else {
      navigate(`/dashboard/${dateStr}`);
    }
  };

  /**
   * 處理上個月按鈕點擊事件
   *
   * @description 將日曆視圖切換到上個月
   */
  const handlePrevMonth = (): void => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  /**
   * 處理下個月按鈕點擊事件
   *
   * @description 將日曆視圖切換到下個月
   */
  const handleNextMonth = (): void => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  /**
   * 處理今天按鈕點擊事件
   *
   * @description 將日曆視圖切換到當前月份
   */
  const handleToday = (): void => {
    setCurrentDate(new Date());
  };

  return (
    <Card
      elevation={2}
      sx={{
        width: '100%',
        aspectRatio: '1 / 1.2',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <CardContent sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'space-between'
      }}>
        {/* 日曆標題 */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: '2%',
          fontSize: 'clamp(0.7rem, 1.5vw, 1rem)'
        }}>
          <Typography
            variant="h6"
            fontWeight="600"
            sx={{ fontSize: 'inherit' }}
          >
            營業日曆
          </Typography>
          <Button
            size="small"
            startIcon={<TodayIcon sx={{ fontSize: 'inherit' }} />}
            onClick={handleToday}
            variant="outlined"
            sx={{
              fontSize: 'inherit',
              padding: '2px 8px',
              minWidth: 'auto'
            }}
          >
            今天
          </Button>
        </Box>

        {/* 月份導航 */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: '3%',
          fontSize: 'clamp(0.7rem, 1.5vw, 1rem)'
        }}>
          <IconButton
            onClick={handlePrevMonth}
            size="small"
            sx={{ padding: '2%' }}
          >
            <ChevronLeftIcon sx={{ fontSize: 'inherit' }} />
          </IconButton>
          
          <Typography
            variant="h6"
            fontWeight="600"
            sx={{ fontSize: 'inherit' }}
          >
            {currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}
          </Typography>
          
          <IconButton
            onClick={handleNextMonth}
            size="small"
            sx={{ padding: '2%' }}
          >
            <ChevronRightIcon sx={{ fontSize: 'inherit' }} />
          </IconButton>
        </Box>

        {/* 星期標題 */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '1%',
          mb: '1%',
          fontSize: 'clamp(0.6rem, 1.2vw, 0.9rem)'
        }}>
          {weekdays.map((weekday) => (
            <Box key={weekday} sx={{ textAlign: 'center' }}>
              <Typography
                variant="body2"
                fontWeight="600"
                color="text.secondary"
                sx={{
                  py: '4%',
                  fontSize: 'inherit'
                }}
              >
                {weekday}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* 日曆格子 */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '1%',
          flex: 1
        }}>
          {calendarDays.map((day, index) => (
            <Box key={index} sx={{ textAlign: 'center' }}>
              {day ? (
                <Box
                  onClick={() => handleDateClick(day)}
                  sx={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4%',
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
                    fontSize: 'clamp(0.6rem, 1.2vw, 0.9rem)',
                    '&:hover': {
                      bgcolor: isSelected(day)
                        ? 'primary.dark'
                        : 'action.hover',
                      transform: 'scale(1.05)'
                    }
                  }}
                >
                  <Typography sx={{ fontSize: 'inherit' }}>
                    {day}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{
                  width: '100%',
                  aspectRatio: '1 / 1'
                }} />
              )}
            </Box>
          ))}
        </Box>

        {/* 說明文字 */}
        <Box sx={{
          mt: '2%',
          pt: '2%',
          borderTop: '1px solid',
          borderColor: 'divider',
          fontSize: 'clamp(0.5rem, 1vw, 0.8rem)'
        }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              mb: '1%',
              fontSize: 'inherit'
            }}
          >
            點擊日期查看當日營業報表
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DashboardCalendar;
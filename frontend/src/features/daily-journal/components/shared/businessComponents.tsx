/**
 * 日常記帳模組共用業務邏輯組件
 */

import React, { FC } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  Tab,
  Tabs
} from '@mui/material';
import { getDaysInMonth } from 'date-fns';
import {
  MonthlyData,
  DailyData
} from './types';
import {
  MonthListItem,
  CalendarCell,
  BarChartComponent,
  LineChartComponent,
  PieChartComponent
} from './components';
import {
  MONTH_NAMES,
  WEEKDAYS,
  CHART_COLORS
} from './constants';
import {
  prepareChartData,
  calculateYearlyTotal
} from './utils';

// 月份列表組件介面
interface MonthListProps {
  currentYear: number;
  monthlyData: MonthlyData;
  selectedMonth: number;
  onMonthSelect: (month: number) => void;
}

// 月份列表組件
export const MonthList: FC<MonthListProps> = ({
  currentYear,
  monthlyData,
  selectedMonth,
  onMonthSelect
}) => {
  return (
    <Paper sx={{ p: 1, height: '100%' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center' }}>
        {currentYear}年月度統計
      </Typography>
      <List 
        dense
        sx={{ 
          width: '100%',
          maxHeight: 'calc(100vh - 280px)',
          overflow: 'auto',
          '& .MuiListItem-root': {
            py: 0.5
          }
        }}
      >
        {MONTH_NAMES.map((month, index) => (
          <MonthListItem
            key={`month-${month}`}
            month={month}
            index={index}
            isSelected={selectedMonth === index}
            amount={monthlyData[index] ?? 0}
            onSelect={onMonthSelect}
          />
        ))}
        <ListItem sx={{ backgroundColor: '#f5f5f5', py: 0.5 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            width: '100%',
            px: 1
          }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              總計
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              ${calculateYearlyTotal(monthlyData)}
            </Typography>
          </Box>
        </ListItem>
      </List>
    </Paper>
  );
};

// 年份選擇器組件介面
interface YearSelectorProps {
  currentYear: number;
  onYearChange: (year: number) => void;
}

// 年份選擇器組件
export const YearSelector: FC<YearSelectorProps> = ({
  currentYear,
  onYearChange
}) => {
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
  
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
      {years.map(year => (
        <Button
          key={`year-${year}`}
          variant={year === currentYear ? "contained" : "outlined"}
          onClick={() => onYearChange(year)}
        >
          {year}年
        </Button>
      ))}
    </Box>
  );
};

// 日曆網格組件介面
interface CalendarGridProps {
  currentYear: number;
  selectedMonth: number;
  dailyData: DailyData;
}

// 日曆網格組件
export const CalendarGrid: FC<CalendarGridProps> = ({
  currentYear,
  selectedMonth,
  dailyData
}) => {
  if (!dailyData[selectedMonth]) return null;
  
  const daysInMonth = getDaysInMonth(new Date(currentYear, selectedMonth));
  const firstDayOfMonth = new Date(currentYear, selectedMonth, 1).getDay(); // 0 = 星期日, 1 = 星期一, ...
  
  // 計算需要的行數
  const totalDays = firstDayOfMonth + daysInMonth;
  const rows = Math.ceil(totalDays / 7);
  
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        {currentYear}年 {MONTH_NAMES[selectedMonth]} 日曆
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
        {/* 星期標題 */}
        {WEEKDAYS.map((day) => (
          <Box key={`header-${day}`} sx={{
            width: 'calc(100% / 7)',
            p: 1,
            textAlign: 'center',
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: '#f5f5f5',
            fontWeight: 'bold'
          }}>
            {day}
          </Box>
        ))}
        
        {/* 日曆格子 */}
        {Array.from({ length: rows * 7 }).map((_, index) => {
          const dayOffset = index - firstDayOfMonth + 1;
          const isCurrentMonth = dayOffset > 0 && dayOffset <= daysInMonth;
          const dayAmount = isCurrentMonth ? (dailyData[selectedMonth]?.[dayOffset] ?? 0) : 0;
          
          return (
            <CalendarCell
              key={`cell-${currentYear}-${selectedMonth}-${dayOffset}-${isCurrentMonth ? 'current' : 'other'}`}
              dayOffset={dayOffset}
              isCurrentMonth={isCurrentMonth}
              dayAmount={dayAmount}
              year={currentYear}
              month={selectedMonth}
            />
          );
        })}
      </Box>
    </Box>
  );
};
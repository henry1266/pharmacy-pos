/**
 * 會計模組共用組件
 */

import React, { FC } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  IconButton,
  ListItem,
  ListItemButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  ContentSectionProps,
  StatusDisplayProps,
  PageHeaderProps,
  MonthListItemProps,
  InfoCardProps,
  ChartCommonElementsProps,
  CalendarCellProps,
  BarChartComponentProps,
  LineChartComponentProps,
  PieChartComponentProps
} from './types';
import { CALENDAR_CELL_STYLES } from './constants';

// 內容區塊組件
export const ContentSection: FC<ContentSectionProps> = ({
  children,
  maxWidth,
  withPaper = false
}) => {
  const content = withPaper ? <Paper sx={{ p: 1 }}>{children}</Paper> : children;
  
  return (
    <Box
      sx={{
        flex: '1 1 100%',
        maxWidth: maxWidth ?? { xs: '100%' }
      }}
    >
      {content}
    </Box>
  );
};

// 狀態顯示組件
export const StatusDisplay: FC<StatusDisplayProps> = ({ type, message }) => {
  switch (type) {
    case 'loading':
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    case 'error':
      return <Alert severity="error">{message}</Alert>;
    case 'info':
      return <Alert severity="info">{message}</Alert>;
    default:
      return null;
  }
};

// 頁面標題組件
export const PageHeader: FC<PageHeaderProps> = ({
  title,
  onBack,
  onExport,
  exportDisabled
}) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <IconButton onClick={onBack} sx={{ mr: 1 }}>
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h4">
        {title}
      </Typography>
    </Box>
    <Box>
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={onExport}
        sx={{ ml: 1 }}
        disabled={exportDisabled}
      >
        導出CSV
      </Button>
    </Box>
  </Box>
);

// 月份列表項目組件
export const MonthListItem: FC<MonthListItemProps> = ({
  month,
  index,
  isSelected,
  amount,
  onSelect
}) => (
  <ListItem
    key={`month-${month}`}
    disablePadding
    divider
    sx={{
      backgroundColor: isSelected ? '#e3f2fd' : 'transparent',
      '&:hover': {
        backgroundColor: isSelected ? '#e3f2fd' : '#f5f5f5'
      }
    }}
  >
    <ListItemButton
      onClick={() => onSelect(index)}
      sx={{ py: 0.5 }}
    >
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%'
      }}>
        <Typography
          variant="body2"
          sx={{
            color: 'text.primary',
            fontWeight: isSelected ? 'bold' : 'normal'
          }}
        >
          {month}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: amount > 0 ? 'primary.main' : 'text.secondary',
            fontWeight: 'bold'
          }}
        >
          ${amount}
        </Typography>
      </Box>
    </ListItemButton>
  </ListItem>
);

// 通用資訊卡片組件
export const InfoCard: FC<InfoCardProps> = ({ title, content }) => (
  <Card>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {content}
    </CardContent>
  </Card>
);

// 圖表共用元素組件
export const ChartCommonElements: FC<ChartCommonElementsProps> = ({ dataKey = "月份" }) => (
  <>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey={dataKey} />
    <YAxis />
    <RechartsTooltip
      formatter={(value: number) => [`$${value}`, '金額']}
      labelFormatter={(label: string) => `${label}月`}
    />
    <Legend />
  </>
);

// 日曆格子組件
export const CalendarCell: FC<CalendarCellProps> = ({
  dayOffset,
  isCurrentMonth,
  dayAmount,
  year,
  month
}) => {
  // 使用日期作為唯一識別符
  const cellKey = `day-${year}-${month}-${dayOffset}`;
  
  return (
    <Box
      key={cellKey}
      sx={{
        ...CALENDAR_CELL_STYLES.base,
        ...(isCurrentMonth ? CALENDAR_CELL_STYLES.current : CALENDAR_CELL_STYLES.other)
      }}
    >
      {isCurrentMonth && (
        <>
          <Typography variant="body2" sx={{
            position: 'absolute',
            top: '5px',
            left: '5px'
          }}>
            {dayOffset}
          </Typography>
          {dayAmount > 0 && (
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%'
            }}>
              <Typography variant="body1" color="primary" sx={{ fontWeight: 'bold' }}>
                ${dayAmount}
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

// 長條圖組件
export const BarChartComponent: FC<BarChartComponentProps> = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>
      <ChartCommonElements />
      <Bar dataKey="金額" fill="#8884d8" name="金額" />
    </BarChart>
  </ResponsiveContainer>
);

// 折線圖組件
export const LineChartComponent: FC<LineChartComponentProps> = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
      <ChartCommonElements />
      <Line
        type="monotone"
        dataKey="金額"
        stroke="#8884d8"
        activeDot={{ r: 8 }}
        name="金額"
      />
    </LineChart>
  </ResponsiveContainer>
);

// 圓餅圖組件
export const PieChartComponent: FC<PieChartComponentProps> = ({ data, colors }) => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={true}
        outerRadius={100}
        fill="#8884d8"
        dataKey="金額"
        nameKey="name"
        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${entry.name}`} fill={colors[index % colors.length]} />
        ))}
      </Pie>
      <RechartsTooltip formatter={(value: number) => [`$${value}`, '金額']} />
      <Legend />
    </PieChart>
  </ResponsiveContainer>
);
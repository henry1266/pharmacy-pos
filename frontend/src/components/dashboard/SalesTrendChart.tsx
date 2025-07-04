import React, { FC } from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardContent,
  Typography
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

/**
 * 銷售趨勢資料項目介面
 */
interface SalesTrendItem {
  date: string;
  totalSales: number;
}

/**
 * SalesTrendChart 元件的 Props 介面
 */
interface SalesTrendChartProps {
  salesTrendData: SalesTrendItem[];
}

// Helper function to format currency (can be moved to a utils file later)
const formatCurrency = (amount?: number): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0
  }).format(amount || 0); // Ensure amount is not null/undefined
};

/**
 * 銷售趨勢圖表元件
 */
const SalesTrendChart: FC<SalesTrendChartProps> = ({ salesTrendData }) => {
  return (
    <Card sx={{ 
      borderRadius: 'var(--border-radius)',
      boxShadow: 'var(--card-shadow)',
      transition: 'all 0.3s',
      '&:hover': {
        boxShadow: 'var(--card-shadow-hover)'
      },
      height: '100%' // Ensure card takes full height of grid item
    }}>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="600" color="var(--text-primary)">
          銷售趨勢
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={salesTrendData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize="0.75rem" />
            <YAxis 
              stroke="var(--text-secondary)" 
              fontSize="0.75rem" 
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip 
              formatter={(value) => formatCurrency(value as number)}
              contentStyle={{ 
                backgroundColor: 'var(--background-paper)', 
                borderColor: 'var(--border-color)',
                borderRadius: 'var(--border-radius)'
              }}
              labelStyle={{ color: 'var(--text-primary)' }}
              itemStyle={{ color: 'var(--text-primary)' }}
            />
            <Legend wrapperStyle={{ fontSize: '0.875rem' }} />
            <Line 
              type="monotone" 
              dataKey="totalSales" 
              name="銷售額"
              stroke="var(--primary-color)" 
              strokeWidth={2}
              activeDot={{ r: 8, fill: 'var(--primary-color)' }}
              dot={{ stroke: 'var(--primary-color)', strokeWidth: 1, r: 4, fill: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// 添加 SalesTrendChart 的 PropTypes 驗證
SalesTrendChart.propTypes = {
  salesTrendData: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      totalSales: PropTypes.number.isRequired
    })
  ).isRequired
} as any; // 使用 any 類型來避免 TypeScript 錯誤

export default SalesTrendChart;
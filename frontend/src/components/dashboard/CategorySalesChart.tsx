import React, { FC } from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardContent,
  Typography,
  useTheme
} from '@mui/material';
import {
  PieChart,
  Pie,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import PieChartCell from './PieChartCell.tsx';
import LegendFormatter from './LegendFormatter.tsx';

/**
 * 類別銷售資料項目介面
 */
interface CategorySalesItem {
  category: string;
  totalSales: number;
}

/**
 * CategorySalesChart 元件的 Props 介面
 */
interface CategorySalesChartProps {
  categorySalesData: CategorySalesItem[];
}

// Helper function to format currency (can be moved to a utils file later)
const formatCurrency = (amount?: number): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0
  }).format(amount ?? 0); // Ensure amount is not null/undefined
};

// Formatter functions - moved outside of component
const renderLegendFormatter = (value: string, entry: any) => (
  <LegendFormatter value={value} color={entry.color} />
);

// Tooltip formatter function
const formatTooltipValue = (value: number, name: string): [string, string] => [formatCurrency(value), name];

/**
 * 類別銷售圖表元件
 */
const CategorySalesChart: FC<CategorySalesChartProps> = ({ categorySalesData }) => {
  const theme = useTheme();
  // Define colors, potentially using theme colors or a predefined palette
  const COLORS = [theme.palette.primary.main, theme.palette.success.main, theme.palette.warning.main, theme.palette.error.main, theme.palette.info.main, theme.palette.grey[500]];

  // Ensure data is an array
  const data = Array.isArray(categorySalesData) ? categorySalesData : [];

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
          類別銷售佔比
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              // label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="totalSales"
              nameKey="category"
            >
              {data.map((entry, index) => (
                <PieChartCell
                  key={entry.category ?? `category-${index}`}
                  entry={entry}
                  index={index}
                  colors={COLORS}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={formatTooltipValue as any}
              contentStyle={{ 
                backgroundColor: 'var(--background-paper)', 
                borderColor: 'var(--border-color)',
                borderRadius: 'var(--border-radius)'
              }}
              labelStyle={{ color: 'var(--text-primary)' }}
              itemStyle={{ color: 'var(--text-primary)' }}
            />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{ fontSize: '0.875rem', lineHeight: '1.5' }}
              formatter={renderLegendFormatter as any}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

CategorySalesChart.propTypes = {
  categorySalesData: PropTypes.arrayOf(
    PropTypes.shape({
      category: PropTypes.string.isRequired,
      totalSales: PropTypes.number.isRequired
    })
  ).isRequired
} as any; // 使用 any 類型來避免 TypeScript 錯誤

export default CategorySalesChart;
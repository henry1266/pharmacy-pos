import React from 'react';
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
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Helper function to format currency (can be moved to a utils file later)
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0
  }).format(amount || 0); // Ensure amount is not null/undefined
};

// 將 Cell 元件定義移出父元件
const PieChartCell = ({ entry, index, colors }) => (
  <Cell key={`cell-${entry.category}`} fill={colors[index % colors.length]} />
);

PieChartCell.propTypes = {
  entry: PropTypes.shape({
    category: PropTypes.string.isRequired,
    totalSales: PropTypes.number.isRequired
  }).isRequired,
  index: PropTypes.number.isRequired,
  colors: PropTypes.arrayOf(PropTypes.string).isRequired
};

const CategorySalesChart = ({ categorySalesData }) => {
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
                  key={entry.category || `category-${index}`} 
                  entry={entry} 
                  index={index} 
                  colors={COLORS} 
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name) => [formatCurrency(value), name]}
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
              formatter={(value, entry) => {
                const { color } = entry;
                return <span style={{ color }}>{value}</span>;
              }}
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
};

export default CategorySalesChart;

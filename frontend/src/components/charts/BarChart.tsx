import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Paper, Box, Typography } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js';

// 註冊Chart.js組件
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * 柱狀圖組件
 */
interface BarChartProps {
  data: ChartData<'bar'>;
  options?: Partial<ChartOptions<'bar'>>;
  title?: string;
  [key: string]: any;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  options = {},
  title,
  ...rest
}) => {
  const defaultOptions: Partial<ChartOptions<'bar'>> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: !!title,
        text: title,
      },
    },
  };

  const mergedOptions = { ...defaultOptions, ...options };

  return (
    <Paper elevation={2} sx={{ p: 2, width: '100%' }}>
      {title && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
      )}
      <Bar data={data} options={mergedOptions} {...rest} />
    </Paper>
  );
};

export default BarChart;
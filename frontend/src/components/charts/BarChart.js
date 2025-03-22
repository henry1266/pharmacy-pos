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
 * @param {Object} props - 組件屬性
 * @param {Object} props.data - 圖表數據
 * @param {Object} props.options - 圖表選項
 * @param {string} props.title - 圖表標題
 * @returns {React.ReactElement} 柱狀圖組件
 */
const BarChart = ({
  data,
  options = {},
  title,
  ...rest
}) => {
  const defaultOptions = {
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

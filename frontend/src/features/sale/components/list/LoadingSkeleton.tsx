/**
 * @file 載入骨架屏組件
 * @description 顯示銷售列表頁面載入中的骨架屏效果
 */

import React, { FC } from 'react';
import { Box, Skeleton } from '@mui/material';

interface LoadingSkeletonProps {
  rowCount?: number;
  columnCount?: number;
}

/**
 * 載入骨架屏組件
 * 顯示銷售列表頁面載入中的骨架屏效果
 */
const LoadingSkeleton: FC<LoadingSkeletonProps> = ({
  rowCount = 15,
  columnCount = 8
}) => {
  return (
    <Box sx={{
      width: '100%',
      mt: 1,
      bgcolor: 'background.paper', // 使用主題的背景色
      borderRadius: 1,
      height: '100%',
      minHeight: '70vh' // 確保至少佔據70%的視窗高度
    }}>
      {[...Array(rowCount)].map((_, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            mb: 1,
            opacity: 0,
            animation: 'fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
            animationDelay: `${index * 0.05}s`
          }}
        >
          {[...Array(columnCount)].map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="rectangular"
              width={`${100 / columnCount}%`}
              height={52}
              animation="wave"
              sx={{
                mx: 0.5,
                borderRadius: 1,
                opacity: 1 - (index * 0.1), // 漸變效果
                bgcolor: 'action.hover', // 使用主題的懸停色，通常是淺灰色
                '&::after': {
                  background: 'linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.04), transparent)'
                }
              }}
            />
          ))}
        </Box>
      ))}
    </Box>
  );
};

export default LoadingSkeleton;
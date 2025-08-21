/**
 * @file 自定義內容渲染器組件
 * @description 根據自定義內容類型渲染相應的內容
 */

import React, { FC } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { CustomContentType } from '../../types/detail';

interface CustomContentRendererProps {
  content: CustomContentType;
}

/**
 * 自定義內容渲染器組件
 * 根據自定義內容類型渲染相應的內容
 */
const CustomContentRenderer: FC<CustomContentRendererProps> = ({ content }) => {
  switch (content.type) {
    case 'loading':
      return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CircularProgress size={16} sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary">{content.message}</Typography>
        </Box>
      );
    case 'error':
      return <Typography variant="body2" color="error">{content.message}</Typography>;
    default:
      return null;
  }
};

export default CustomContentRenderer;
import React, { ReactNode } from 'react';
import {
  Paper,
  Box,
  Button,
  SxProps,
  Theme
} from '@mui/material';
import BreadcrumbNavigation from './BreadcrumbNavigation';
import { BreadcrumbItem } from './BreadcrumbNavigation';

interface PageHeaderSectionProps {
  /**
   * 麵包屑導航項目
   */
  breadcrumbItems: BreadcrumbItem[];
  
  /**
   * 右側的操作按鈕或其他元素
   */
  actions?: ReactNode;
  
  /**
   * 自定義樣式
   */
  sx?: SxProps<Theme>;
}

/**
 * 頁面標題區域組件
 * 
 * 用於顯示頁面標題、麵包屑導航和操作按鈕
 */
const PageHeaderSection: React.FC<PageHeaderSectionProps> = ({
  breadcrumbItems,
  actions,
  sx
}) => {
  return (
    <Paper sx={{
      mb: 3,
      bgcolor: 'background.paper',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      position: 'relative',
      zIndex: 1,
      ...sx
    }}>
      <Box sx={{
        p: 1.5,
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 48
      }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          height: '100%'
        }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            height: 44
          }}>
            <Box sx={{
              '& > div': {
                marginBottom: 0,
                display: 'flex',
                alignItems: 'center'
              }
            }}>
              <BreadcrumbNavigation
                items={breadcrumbItems}
                fontSize="0.975rem"
                padding={0}
              />
            </Box>
          </Box>
        </Box>
        {actions && (
          <Box sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            height: '100%',
            marginLeft: 'auto'
          }}>
            {actions}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default PageHeaderSection;
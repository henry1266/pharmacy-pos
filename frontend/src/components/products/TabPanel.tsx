import React from 'react';
import { Box } from '@mui/material';

/**
 * TabPanel 組件的 Props 接口
 */
interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
  [key: string]: any; // 用於支持 ...other 屬性
}

/**
 * TabPanel 組件
 * 用於在 Tabs 組件中顯示對應的內容
 */
const TabPanel: React.FC<TabPanelProps> = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`product-tabpanel-${index}`}
      aria-labelledby={`product-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

export default TabPanel;
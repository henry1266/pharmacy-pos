import React from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import { useState } from 'react';
import UnifiedThemeSettings from '../components/settings/UnifiedThemeSettings';
import { useTheme } from '../contexts/ThemeContext';
import {
  Palette as PaletteIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  AccountBalance as AccountingIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { Button, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';

/**
 * 設定頁面標籤介面
 */
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

/**
 * 標籤面板組件
 */
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

/**
 * 設定頁面主組件
 */
const SettingsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const { currentTheme } = useTheme();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ overflow: 'hidden' }}>
        {/* 頁面標題 */}
        <Box sx={{ p: 3, pb: 0 }}>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon />
            系統設定
          </Typography>
          <Typography variant="body1" color="text.secondary">
            管理系統的各項設定，包括主題、通知和安全性設定
          </Typography>
        </Box>

        <Divider sx={{ mt: 2 }} />

        {/* 設定標籤 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="設定標籤"
            sx={{ px: 3 }}
          >
            <Tab
              icon={<PaletteIcon />}
              label="主題設定"
              id="settings-tab-0"
              aria-controls="settings-tabpanel-0"
            />
            <Tab
              icon={<AccountingIcon />}
              label="會計設定"
              id="settings-tab-1"
              aria-controls="settings-tabpanel-1"
            />
            <Tab
              icon={<NotificationsIcon />}
              label="通知設定"
              id="settings-tab-2"
              aria-controls="settings-tabpanel-2"
              disabled
            />
            <Tab
              icon={<SecurityIcon />}
              label="安全性設定"
              id="settings-tab-3"
              aria-controls="settings-tabpanel-3"
              disabled
            />
          </Tabs>
        </Box>

        {/* 標籤內容 */}
        <TabPanel value={tabValue} index={0}>
          <UnifiedThemeSettings />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              會計系統設定
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              管理會計系統的各項設定，包括帳戶類型、科目設定等
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <AccountingIcon />
                </ListItemIcon>
                <ListItemText
                  primary="帳戶類型管理"
                  secondary="設定和管理會計科目的類型分類（資產、負債、權益、收入、費用）"
                />
                <Button
                  component={RouterLink}
                  to="/settings/account-types"
                  variant="outlined"
                  size="small"
                >
                  管理
                </Button>
              </ListItem>
            </List>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              通知設定
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              此功能即將推出...
            </Typography>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              安全性設定
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              此功能即將推出...
            </Typography>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default SettingsPage;
/**
 * 統一主題設定組件
 * 整合傳統主題設定與 Material 3 主題選擇器
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Slider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  Divider,
  Tabs,
  Tab,
  Switch,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Palette as PaletteIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  RestoreFromTrash as ResetIcon,
  ColorLens as ColorLensIcon,
  AutoAwesome as Material3Icon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Preview as PreviewIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

import { useTheme } from '../../contexts/ThemeContext';
import { ColorPicker } from './ColorPicker';
import { ThemePreview } from './ThemePreview';
import { themeServiceV2 } from '../../services/themeServiceV2';
import { EnhancedGeneratedPalette, UserTheme } from '@pharmacy-pos/shared/types/theme';
import { Material3SchemeType } from '@pharmacy-pos/shared/utils';
import { DEFAULT_THEME_COLORS } from '@pharmacy-pos/shared/types/theme';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`theme-tabpanel-${index}`}
      aria-labelledby={`theme-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
};

/**
 * 統一主題設定主組件
 */
const UnifiedThemeSettings: React.FC = () => {
  const {
    currentTheme,
    userThemes,
    loading,
    error,
    switchTheme,
    createTheme,
    updateCurrentTheme,
    deleteTheme,
    refreshThemes,
    previewTheme,
    applyPreviewedTheme,
    cancelPreview,
    isPreviewMode,
  } = useTheme();

  // 狀態管理
  const [tabValue, setTabValue] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeColor, setNewThemeColor] = useState<string>(DEFAULT_THEME_COLORS?.blue || '#1976d2');
  const [useMaterial3, setUseMaterial3] = useState(false);
  const [material3Scheme, setMaterial3Scheme] = useState<Material3SchemeType>('tonalSpot');
  const [material3Loading, setMaterial3Loading] = useState(false);
  const [previewPalette, setPreviewPalette] = useState<EnhancedGeneratedPalette | null>(null);
  
  // 滑桿暫時值狀態
  const [tempBorderRadius, setTempBorderRadius] = useState(currentTheme?.customSettings.borderRadius || 8);
  const [tempElevation, setTempElevation] = useState(currentTheme?.customSettings.elevation || 4);
  const [tempFontScale, setTempFontScale] = useState(currentTheme?.customSettings.fontScale || 1.0);

  const schemeOptions = themeServiceV2.getMaterial3SchemeOptions();

  // 同步暫時值與當前主題
  React.useEffect(() => {
    if (currentTheme?.customSettings) {
      setTempBorderRadius(currentTheme.customSettings.borderRadius);
      setTempElevation(currentTheme.customSettings.elevation);
      setTempFontScale(currentTheme.customSettings.fontScale);
    }
  }, [currentTheme?.customSettings]);

  // 標籤切換
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 建立新主題
  const handleCreateTheme = async () => {
    if (!newThemeName.trim()) return;

    try {
      if (useMaterial3) {
        // 建立 Material 3 主題
        // 建立 Material 3 主題
        await themeServiceV2.createMaterial3Theme(newThemeColor, newThemeName.trim(), material3Scheme);
      } else {
        // 建立傳統主題
        await createTheme({
          themeName: newThemeName.trim(),
          primaryColor: newThemeColor,
          mode: 'light'
        });
      }
      
      setCreateDialogOpen(false);
      setNewThemeName('');
      setNewThemeColor(DEFAULT_THEME_COLORS?.blue || '#1976d2');
      setUseMaterial3(false);
    } catch (error) {
      console.error('建立主題失敗:', error);
    }
  };

  // 預覽 Material 3 主題
  const handleMaterial3Preview = useCallback(async (color: string, scheme: Material3SchemeType) => {
    setMaterial3Loading(true);
    try {
      const palette = await themeServiceV2.previewMaterial3Theme(color, scheme);
      setPreviewPalette(palette);
      
      // 創建臨時主題用於預覽
      const tempTheme: UserTheme = {
        _id: 'temp-material3-preview',
        themeName: `Material 3 ${schemeOptions.find(opt => opt.value === scheme)?.label}`,
        primaryColor: color,
        mode: currentTheme?.mode || 'light',
        customSettings: currentTheme?.customSettings || {
          borderRadius: 8,
          elevation: 4,
          fontScale: 1.0
        },
        generatedPalette: palette,
        userId: currentTheme?.userId || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      previewTheme(tempTheme);
    } catch (error) {
      console.error('Material 3 預覽失敗:', error);
    } finally {
      setMaterial3Loading(false);
    }
  }, [currentTheme, schemeOptions, previewTheme]);


  // 更新主色
  const handlePrimaryColorChange = async (color: string) => {
    if (!currentTheme?._id) return;
    
    try {
      await updateCurrentTheme(currentTheme._id, { primaryColor: color });
    } catch (error) {
      console.error('更新主色失敗:', error);
    }
  };

  // 更新模式
  const handleModeChange = async (mode: 'light' | 'dark' | 'auto') => {
    if (!currentTheme?._id) return;
    
    try {
      await updateCurrentTheme(currentTheme._id, { mode });
    } catch (error) {
      console.error('更新模式失敗:', error);
    }
  };

  // 更新自定義設定
  const handleCustomSettingChange = async (key: string, value: number) => {
    if (!currentTheme?._id) return;
    
    try {
      await updateCurrentTheme(currentTheme._id, {
        customSettings: {
          ...currentTheme.customSettings,
          [key]: value,
        },
      });
    } catch (error) {
      console.error('更新自定義設定失敗:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* 預覽模式提示 */}
      {isPreviewMode && (
        <Alert
          severity="info"
          sx={{
            mb: 3,
            backgroundColor: '#e3f2fd',
            borderLeft: '4px solid #2196f3',
            '& .MuiAlert-icon': {
              color: '#1976d2'
            }
          }}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                color="inherit"
                size="small"
                onClick={applyPreviewedTheme}
                startIcon={<SaveIcon />}
                sx={{
                  color: '#1976d2',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.1)'
                  }
                }}
              >
                套用
              </Button>
              <Button
                color="inherit"
                size="small"
                onClick={cancelPreview}
                sx={{
                  color: '#1976d2',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.1)'
                  }
                }}
              >
                取消
              </Button>
            </Box>
          }
        >
          <Typography variant="body2" sx={{ color: '#1565c0' }}>
            🎨 <strong>預覽模式</strong> - 您正在預覽主題效果
          </Typography>
        </Alert>
      )}

      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ColorLensIcon />
        主題設定
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
            backgroundColor: '#ffebee',
            borderLeft: '4px solid #f44336',
            '& .MuiAlert-icon': {
              color: '#d32f2f'
            },
            color: '#c62828'
          }}
        >
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* 主要設定區域 */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              {/* 主題類型標籤 */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                  <Tab
                    icon={<Material3Icon />}
                    label="Material 3"
                    id="theme-tab-0"
                  />
                  <Tab
                    icon={<SettingsIcon />}
                    label="進階設定"
                    id="theme-tab-1"
                  />
                </Tabs>
              </Box>

              {/* Material 3 設定 */}
              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                  {/* 選色器 - 放在最上方 */}
                  <Grid item xs={12}>
                    <ColorPicker
                      value={currentTheme?.primaryColor || '#1976d2'}
                      onChange={(color) => {
                        if (currentTheme?.primaryColor !== color) {
                          handlePrimaryColorChange(color);
                          // 自動預覽新顏色的 Material 3 效果
                          handleMaterial3Preview(color, material3Scheme);
                        }
                      }}
                      title="選擇 Material 3 主題色彩"
                      showPresets={true}
                      showInput={true}
                    />
                  </Grid>

                  {/* Material 3 調色方案選擇 */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <FormLabel component="legend">調色方案</FormLabel>
                      <RadioGroup
                        value={material3Scheme}
                        onChange={(e) => {
                          const newScheme = e.target.value as Material3SchemeType;
                          setMaterial3Scheme(newScheme);
                          // 如果有主色，立即預覽新的調色方案
                          if (currentTheme?.primaryColor) {
                            handleMaterial3Preview(currentTheme.primaryColor, newScheme);
                          }
                        }}
                      >
                        {schemeOptions.map((option) => (
                          <FormControlLabel
                            key={option.value}
                            value={option.value}
                            control={<Radio />}
                            label={
                              <Box>
                                <Typography variant="body2">
                                  {option.label}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {option.description}
                                </Typography>
                              </Box>
                            }
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </Grid>

                  {/* Material 3 預覽控制 */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<PreviewIcon />}
                        onClick={() => handleMaterial3Preview(currentTheme?.primaryColor || '#1976d2', material3Scheme)}
                        disabled={material3Loading}
                        fullWidth
                      >
                        {material3Loading ? '生成中...' : '預覽 Material 3'}
                      </Button>

                      {previewPalette?.material3 && (
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Material 3 色彩預覽
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {Object.entries(previewPalette.material3.lightScheme).slice(0, 6).map(([name, color]) => (
                              <Tooltip key={name} title={`${name}: ${color}`}>
                                <Box
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    backgroundColor: color,
                                    borderRadius: 0.5,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                  }}
                                />
                              </Tooltip>
                            ))}
                          </Box>
                        </Paper>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </TabPanel>

              {/* 進階設定 */}
              <TabPanel value={tabValue} index={1}>
                {currentTheme && (
                  <Grid container spacing={3}>
                    {/* 主題模式設定 */}
                    <Grid item xs={12}>
                      <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                          主題模式設定
                        </Typography>
                        <FormControl component="fieldset">
                          <FormLabel component="legend">選擇主題模式</FormLabel>
                          <RadioGroup
                            value={currentTheme.mode}
                            onChange={(e) => handleModeChange(e.target.value as any)}
                            row
                          >
                            <FormControlLabel value="light" control={<Radio />} label="淺色模式" />
                            <FormControlLabel value="dark" control={<Radio />} label="深色模式" />
                            <FormControlLabel value="auto" control={<Radio />} label="自動切換" />
                          </RadioGroup>
                        </FormControl>
                      </Paper>
                    </Grid>

                    {/* 自訂樣式設定 */}
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        自訂樣式設定
                      </Typography>
                    </Grid>

                    {/* 邊框圓角 */}
                    <Grid item xs={12} sm={4}>
                      <FormLabel component="legend">
                        邊框圓角 ({tempBorderRadius}px)
                      </FormLabel>
                      <Slider
                        value={tempBorderRadius}
                        onChange={(_, value) => setTempBorderRadius(value as number)}
                        onChangeCommitted={(_, value) => handleCustomSettingChange('borderRadius', value as number)}
                        min={0}
                        max={50}
                        step={1}
                        marks
                        valueLabelDisplay="auto"
                        sx={{ mt: 2 }}
                      />
                    </Grid>

                    {/* 陰影層級 */}
                    <Grid item xs={12} sm={4}>
                      <FormLabel component="legend">
                        陰影層級 ({tempElevation})
                      </FormLabel>
                      <Slider
                        value={tempElevation}
                        onChange={(_, value) => setTempElevation(value as number)}
                        onChangeCommitted={(_, value) => handleCustomSettingChange('elevation', value as number)}
                        min={0}
                        max={24}
                        step={1}
                        marks
                        valueLabelDisplay="auto"
                        sx={{ mt: 2 }}
                      />
                    </Grid>

                    {/* 字體縮放 */}
                    <Grid item xs={12} sm={4}>
                      <FormLabel component="legend">
                        字體縮放 ({tempFontScale.toFixed(1)}x)
                      </FormLabel>
                      <Slider
                        value={tempFontScale}
                        onChange={(_, value) => setTempFontScale(value as number)}
                        onChangeCommitted={(_, value) => handleCustomSettingChange('fontScale', value as number)}
                        min={0.5}
                        max={2.0}
                        step={0.1}
                        marks
                        valueLabelDisplay="auto"
                        sx={{ mt: 2 }}
                      />
                    </Grid>
                  </Grid>
                )}
              </TabPanel>
            </CardContent>
          </Card>

          {/* 主題預覽 */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                主題預覽
              </Typography>
              <ThemePreview
                themeName={currentTheme?.themeName || '預設主題'}
                showTitle={false}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* 側邊欄 - 主題管理 */}
        <Grid item xs={12} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">我的主題</Typography>
                <Box>
                  <IconButton onClick={refreshThemes} size="small">
                    <RefreshIcon />
                  </IconButton>
                  <IconButton onClick={() => setCreateDialogOpen(true)} size="small" color="primary">
                    <AddIcon />
                  </IconButton>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {userThemes.map((theme) => (
                  <Box
                    key={theme._id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      border: currentTheme?._id === theme._id ? '2px solid' : '1px solid',
                      borderColor: currentTheme?._id === theme._id ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                    onClick={() => switchTheme(theme)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          backgroundColor: theme.primaryColor,
                          borderRadius: '50%',
                          border: '2px solid',
                          borderColor: 'background.paper',
                          boxShadow: 1,
                        }}
                      />
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {theme.themeName}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                          <Chip
                            label={theme.mode}
                            size="small"
                            variant="outlined"
                          />
                          {theme.generatedPalette?.material3 && (
                            <Chip
                              label="M3"
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>
                    {userThemes.length > 1 && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTheme(theme._id!);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                ))}
              </Box>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<ResetIcon />}
                onClick={refreshThemes}
                sx={{ mt: 2 }}
              >
                重新整理主題
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 建立主題對話框 */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>建立新主題</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="主題名稱"
            value={newThemeName}
            onChange={(e) => setNewThemeName(e.target.value)}
            sx={{ mb: 3, mt: 1 }}
          />
          
          {/* Material 3 開關 */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={useMaterial3}
                  onChange={(e) => setUseMaterial3(e.target.checked)}
                />
              }
              label="使用 Material 3 設計系統"
            />
          </Box>

          {/* 調色方案選擇 (僅 Material 3) */}
          {useMaterial3 && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <FormLabel component="legend">調色方案</FormLabel>
              <RadioGroup
                value={material3Scheme}
                onChange={(e) => setMaterial3Scheme(e.target.value as Material3SchemeType)}
                row
              >
                {schemeOptions.slice(0, 3).map((option) => (
                  <FormControlLabel
                    key={option.value}
                    value={option.value}
                    control={<Radio />}
                    label={option.label}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          )}
          
          {/* 顏色選擇 */}
          <ColorPicker
            value={newThemeColor}
            onChange={setNewThemeColor}
            title="選擇主題色彩"
            showPresets={true}
            showInput={true}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>取消</Button>
          <Button 
            onClick={handleCreateTheme} 
            variant="contained"
            disabled={!newThemeName.trim()}
          >
            建立
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UnifiedThemeSettings;
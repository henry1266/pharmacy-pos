/**
 * 主題設定組件
 * 提供用戶自定義主題的完整介面
 */

import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Palette as PaletteIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  RestoreFromTrash as ResetIcon,
  ColorLens as ColorLensIcon,
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { DEFAULT_THEME_COLORS } from '@pharmacy-pos/shared';

/**
 * 顏色選擇器組件
 */
interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, label }) => {
  const [open, setOpen] = useState(false);
  const [tempColor, setTempColor] = useState(color);

  const handleConfirm = () => {
    onChange(tempColor);
    setOpen(false);
  };

  const handleCancel = () => {
    setTempColor(color);
    setOpen(false);
  };

  const isValidHex = (hex: string) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            backgroundColor: color,
            border: '2px solid #ccc',
            borderRadius: 1,
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.8,
            },
          }}
          onClick={() => setOpen(true)}
        />
        <Typography variant="body2">{label}</Typography>
      </Box>

      <Dialog open={open} onClose={handleCancel} maxWidth="sm">
        <DialogTitle>選擇顏色 - {label}</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2 }}>
            {/* 顏色輸入框 */}
            <TextField
              fullWidth
              label="十六進制顏色碼"
              value={tempColor}
              onChange={(e) => setTempColor(e.target.value)}
              error={!isValidHex(tempColor)}
              helperText={!isValidHex(tempColor) ? '請輸入有效的十六進制顏色碼 (例如: #1976d2)' : ''}
              sx={{ mb: 3 }}
            />

            {/* 顏色預覽 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Typography variant="body2">預覽:</Typography>
              <Box
                sx={{
                  width: 60,
                  height: 40,
                  backgroundColor: isValidHex(tempColor) ? tempColor : '#ccc',
                  border: '1px solid #ccc',
                  borderRadius: 1,
                }}
              />
            </Box>
            
            {/* 預設顏色選項 */}
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              預設顏色
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {Object.entries(DEFAULT_THEME_COLORS).map(([name, colorValue]) => (
                <Tooltip key={name} title={name}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: colorValue,
                      border: tempColor === colorValue ? '3px solid #000' : '1px solid #ccc',
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'scale(1.1)',
                      },
                      transition: 'all 0.2s',
                    }}
                    onClick={() => setTempColor(colorValue as string)}
                  />
                </Tooltip>
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>取消</Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            disabled={!isValidHex(tempColor)}
          >
            確認
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

/**
 * 主題設定主組件
 */
const ThemeSettings: React.FC = () => {
  const {
    currentTheme,
    userThemes,
    loading,
    error,
    switchTheme,
    createNewTheme,
    updateCurrentTheme,
    deleteTheme,
    refreshThemes,
    resetToDefault,
  } = useTheme();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeColor, setNewThemeColor] = useState<string>(DEFAULT_THEME_COLORS.blue);

  /**
   * 建立新主題
   */
  const handleCreateTheme = async () => {
    if (!newThemeName.trim()) return;

    try {
      await createNewTheme(newThemeColor, newThemeName.trim());
      setCreateDialogOpen(false);
      setNewThemeName('');
      setNewThemeColor(DEFAULT_THEME_COLORS.blue);
    } catch (error) {
      console.error('建立主題失敗:', error);
    }
  };

  /**
   * 更新主色
   */
  const handlePrimaryColorChange = async (color: string) => {
    if (!currentTheme) return;
    await updateCurrentTheme({ primaryColor: color });
  };

  /**
   * 更新模式
   */
  const handleModeChange = async (mode: 'light' | 'dark' | 'auto') => {
    if (!currentTheme) return;
    await updateCurrentTheme({ mode });
  };

  /**
   * 更新自定義設定
   */
  const handleCustomSettingChange = async (key: string, value: number) => {
    if (!currentTheme) return;
    await updateCurrentTheme({
      customSettings: {
        ...currentTheme.customSettings,
        [key]: value,
      },
    });
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
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ColorLensIcon />
        主題設定
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* 當前主題設定 */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                當前主題設定
              </Typography>

              {currentTheme && (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={3}>
                    {/* 主色設定 */}
                    <Grid item xs={12} sm={6}>
                      <FormLabel component="legend">主要顏色</FormLabel>
                      <Box sx={{ mt: 1 }}>
                        <ColorPicker
                          color={currentTheme.primaryColor}
                          onChange={handlePrimaryColorChange}
                          label="主色"
                        />
                      </Box>
                    </Grid>

                    {/* 模式設定 */}
                    <Grid item xs={12} sm={6}>
                      <FormControl component="fieldset">
                        <FormLabel component="legend">主題模式</FormLabel>
                        <RadioGroup
                          value={currentTheme.mode}
                          onChange={(e) => handleModeChange(e.target.value as any)}
                        >
                          <FormControlLabel value="light" control={<Radio />} label="淺色模式" />
                          <FormControlLabel value="dark" control={<Radio />} label="深色模式" />
                          <FormControlLabel value="auto" control={<Radio />} label="自動切換" />
                        </RadioGroup>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle1" gutterBottom>
                        進階設定
                      </Typography>
                    </Grid>

                    {/* 邊框圓角 */}
                    <Grid item xs={12} sm={4}>
                      <FormLabel component="legend">邊框圓角</FormLabel>
                      <Slider
                        value={currentTheme.customSettings.borderRadius}
                        onChange={(_, value) => handleCustomSettingChange('borderRadius', value as number)}
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
                      <FormLabel component="legend">陰影層級</FormLabel>
                      <Slider
                        value={currentTheme.customSettings.elevation}
                        onChange={(_, value) => handleCustomSettingChange('elevation', value as number)}
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
                      <FormLabel component="legend">字體縮放</FormLabel>
                      <Slider
                        value={currentTheme.customSettings.fontScale}
                        onChange={(_, value) => handleCustomSettingChange('fontScale', value as number)}
                        min={0.5}
                        max={2.0}
                        step={0.1}
                        marks
                        valueLabelDisplay="auto"
                        sx={{ mt: 2 }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 主題管理 */}
        <Grid item xs={12} md={4}>
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
                      p: 1,
                      border: currentTheme?._id === theme._id ? '2px solid' : '1px solid',
                      borderColor: currentTheme?._id === theme._id ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                    onClick={() => switchTheme(theme._id!)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          backgroundColor: theme.primaryColor,
                          borderRadius: '50%',
                        }}
                      />
                      <Typography variant="body2">{theme.themeName}</Typography>
                    </Box>
                    <Box>
                      <Chip
                        label={theme.mode}
                        size="small"
                        variant="outlined"
                      />
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
                  </Box>
                ))}
              </Box>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<ResetIcon />}
                onClick={resetToDefault}
                sx={{ mt: 2 }}
              >
                重設為預設
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
          
          <FormLabel component="legend">選擇主色</FormLabel>
          <Box sx={{ mt: 1 }}>
            <ColorPicker
              color={newThemeColor}
              onChange={(color) => setNewThemeColor(color)}
              label="主色"
            />
          </Box>
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

export default ThemeSettings;
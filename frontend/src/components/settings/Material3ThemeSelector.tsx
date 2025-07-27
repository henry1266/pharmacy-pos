/**
 * Material 3 主題選擇器組件
 * 提供 Material Design 3 調色方案選擇和預覽功能
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Palette as PaletteIcon,
  Preview as PreviewIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon
} from '@mui/icons-material';

import { themeServiceV2 } from '../../services/themeServiceV2';
import { EnhancedGeneratedPalette, UserTheme } from '@pharmacy-pos/shared';
import { Material3SchemeType } from '@pharmacy-pos/shared/utils';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemePreview } from './ThemePreview';
import { ColorPicker } from './ColorPicker';

interface Material3ThemeSelectorProps {
  primaryColor?: string;
  onThemeChange?: (palette: EnhancedGeneratedPalette) => void;
  onSave?: (themeName: string, palette: EnhancedGeneratedPalette) => void;
}

interface ColorDisplayProps {
  color: string;
  label: string;
  size?: 'small' | 'medium' | 'large';
}

const ColorDisplay: React.FC<ColorDisplayProps> = ({ color, label, size = 'medium' }) => {
  const sizeMap = {
    small: 24,
    medium: 32,
    large: 48
  };

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Box
        sx={{
          width: sizeMap[size],
          height: sizeMap[size],
          backgroundColor: color || '#transparent',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 1
        }}
      />
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
};

export const Material3ThemeSelector: React.FC<Material3ThemeSelectorProps> = ({
  primaryColor: initialPrimaryColor,
  onThemeChange,
  onSave
}) => {
  const [selectedScheme, setSelectedScheme] = useState<Material3SchemeType>('tonalSpot');
  const [previewPalette, setPreviewPalette] = useState<EnhancedGeneratedPalette | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPrimaryColor, setCurrentPrimaryColor] = useState<string>(
    initialPrimaryColor || '#1976d2'
  );

  const schemeOptions = themeServiceV2.getMaterial3SchemeOptions();
  const {
    currentTheme,
    previewTheme: contextPreviewTheme,
    applyPreviewedTheme,
    cancelPreview,
    isPreviewMode
  } = useTheme();

  // 預覽 Material 3 主題效果
  const previewMaterial3Theme = async (schemeType: Material3SchemeType) => {
    setLoading(true);
    setError(null);
    
    try {
      const palette = await themeServiceV2.previewMaterial3Theme(currentPrimaryColor, schemeType);
      setPreviewPalette(palette);
      onThemeChange?.(palette);
      
      // 創建臨時主題對象用於預覽
      const tempTheme: UserTheme = {
        _id: 'temp-material3-preview',
        themeName: `Material 3 ${schemeOptions.find(opt => opt.value === schemeType)?.label}`,
        primaryColor: currentPrimaryColor,
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
      
      // 使用 ThemeContext 的預覽功能
      contextPreviewTheme(tempTheme);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '預覽失敗');
    } finally {
      setLoading(false);
    }
  };

  // 當主色或方案改變時自動預覽
  useEffect(() => {
    if (currentPrimaryColor) {
      previewMaterial3Theme(selectedScheme);
    }
  }, [currentPrimaryColor, selectedScheme]);

  // 處理方案選擇
  const handleSchemeChange = (schemeType: Material3SchemeType) => {
    setSelectedScheme(schemeType);
  };

  // 處理顏色變化
  const handleColorChange = (color: string) => {
    setCurrentPrimaryColor(color);
  };

  // 保存主題
  const handleSave = async () => {
    if (!previewPalette) return;
    
    try {
      await applyPreviewedTheme();
    } catch (error) {
      console.error('保存 Material 3 主題失敗:', error);
    }
  };

  // 取消預覽
  const handleCancel = () => {
    cancelPreview();
    setPreviewPalette(null);
  };

  // 渲染 Material 3 色彩方案
  const renderMaterial3Scheme = (scheme: any, title: string) => {
    if (!scheme) return null;

    return (
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="subtitle2" gutterBottom>
                主要色彩
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <ColorDisplay color={scheme.primary} label="Primary" />
                <ColorDisplay color={scheme.onPrimary} label="On Primary" />
                <ColorDisplay color={scheme.primaryContainer} label="Primary Container" />
                <ColorDisplay color={scheme.onPrimaryContainer} label="On Primary Container" />
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="subtitle2" gutterBottom>
                次要色彩
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <ColorDisplay color={scheme.secondary} label="Secondary" />
                <ColorDisplay color={scheme.onSecondary} label="On Secondary" />
                <ColorDisplay color={scheme.secondaryContainer} label="Secondary Container" />
                <ColorDisplay color={scheme.onSecondaryContainer} label="On Secondary Container" />
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="subtitle2" gutterBottom>
                表面色彩
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <ColorDisplay color={scheme.surface} label="Surface" />
                <ColorDisplay color={scheme.onSurface} label="On Surface" />
                <ColorDisplay color={scheme.surfaceVariant} label="Surface Variant" />
                <ColorDisplay color={scheme.onSurfaceVariant} label="On Surface Variant" />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      {/* 預覽模式提示 */}
      {isPreviewMode && (
        <Alert
          severity="info"
          sx={{
            mb: 2,
            backgroundColor: '#e3f2fd',
            borderLeft: '4px solid #2196f3',
            '& .MuiAlert-icon': {
              color: '#1976d2'
            }
          }}
        >
          <Typography variant="body2" sx={{ color: '#1565c0' }}>
            🎨 <strong>預覽模式</strong> - 您正在預覽 Material 3 主題效果。點擊「應用主題」保存，或「取消預覽」恢復原始主題。
          </Typography>
        </Alert>
      )}

      {/* 選色盤 - 移到最上方 */}
      <Box sx={{ mb: 3 }}>
        <ColorPicker
          value={currentPrimaryColor}
          onChange={handleColorChange}
          title="選擇 Material 3 主題色彩"
          showPresets={true}
          showInput={true}
        />
      </Box>

      {/* 控制面板 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <PaletteIcon color="primary" />
            <Typography variant="h6">
              Material Design 3 調色方案
            </Typography>
            <Tooltip title="Material 3 提供更精確的色彩系統和更好的無障礙支援">
              <IconButton size="small">
                <InfoIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>調色方案</InputLabel>
                <Select
                  value={selectedScheme}
                  label="調色方案"
                  onChange={(e) => handleSchemeChange(e.target.value as Material3SchemeType)}
                >
                  {schemeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box>
                        <Typography variant="body2">
                          {option.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => previewMaterial3Theme(selectedScheme)}
                  disabled={loading}
                >
                  重新預覽
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={!previewPalette || loading}
                >
                  {isPreviewMode ? '應用主題' : '保存主題'}
                </Button>
                {isPreviewMode && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    取消預覽
                  </Button>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" color="text.secondary">
                  主色：
                </Typography>
                <ColorDisplay color={currentPrimaryColor} label={currentPrimaryColor} size="small" />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 錯誤提示 */}
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

      {/* 載入狀態 */}
      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {/* Material 3 預覽 */}
      {previewPalette?.material3 && !loading && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Material 3 色彩預覽
          </Typography>
          
          {/* 亮色主題 */}
          {renderMaterial3Scheme(previewPalette.material3.lightScheme, '亮色主題')}
          
          {/* 暗色主題 */}
          {renderMaterial3Scheme(previewPalette.material3.darkScheme, '暗色主題')}

          {/* 色調調色板 */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                色調調色板
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(previewPalette.material3.corePalette).map(([name, palette]) => (
                  <Grid item xs={12} sm={6} md={4} key={name}>
                    <Typography variant="subtitle2" gutterBottom sx={{ textTransform: 'capitalize' }}>
                      {name}
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {Object.entries(palette).map(([tone, color]) => (
                        <Tooltip key={tone} title={`${tone}: ${color}`}>
                          <Box
                            component="div"
                            sx={{
                              width: 24,
                              height: 24,
                              backgroundColor: color as string,
                              borderRadius: 0.5,
                              border: '1px solid',
                              borderColor: 'divider',
                              cursor: 'pointer'
                            }}
                          />
                        </Tooltip>
                      ))}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* 實際主題預覽 */}
          <Box sx={{ mt: 3 }}>
            <ThemePreview
              themeName={`Material 3 ${schemeOptions.find(opt => opt.value === selectedScheme)?.label}`}
              showTitle={true}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Material3ThemeSelector;
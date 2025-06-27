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
import { EnhancedGeneratedPalette } from '@pharmacy-pos/shared/types/theme';
import { Material3SchemeType } from '@pharmacy-pos/shared/utils';

interface Material3ThemeSelectorProps {
  primaryColor: string;
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
          backgroundColor: color,
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
  primaryColor,
  onThemeChange,
  onSave
}) => {
  const [selectedScheme, setSelectedScheme] = useState<Material3SchemeType>('tonalSpot');
  const [previewPalette, setPreviewPalette] = useState<EnhancedGeneratedPalette | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schemeOptions = themeServiceV2.getMaterial3SchemeOptions();

  // 預覽主題效果
  const previewTheme = async (schemeType: Material3SchemeType) => {
    setLoading(true);
    setError(null);
    
    try {
      const palette = await themeServiceV2.previewMaterial3Theme(primaryColor, schemeType);
      setPreviewPalette(palette);
      onThemeChange?.(palette);
    } catch (err) {
      setError(err instanceof Error ? err.message : '預覽失敗');
    } finally {
      setLoading(false);
    }
  };

  // 當主色或方案改變時自動預覽
  useEffect(() => {
    if (primaryColor) {
      previewTheme(selectedScheme);
    }
  }, [primaryColor, selectedScheme]);

  // 處理方案選擇
  const handleSchemeChange = (schemeType: Material3SchemeType) => {
    setSelectedScheme(schemeType);
  };

  // 保存主題
  const handleSave = async () => {
    if (!previewPalette) return;
    
    const themeName = `Material 3 ${schemeOptions.find(opt => opt.value === selectedScheme)?.label} 主題`;
    onSave?.(themeName, previewPalette);
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
                  onClick={() => previewTheme(selectedScheme)}
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
                  保存主題
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" color="text.secondary">
                  主色：
                </Typography>
                <ColorDisplay color={primaryColor} label={primaryColor} size="small" />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 錯誤提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
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
                            sx={{
                              width: 24,
                              height: 24,
                              backgroundColor: color,
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
        </Box>
      )}
    </Box>
  );
};

export default Material3ThemeSelector;
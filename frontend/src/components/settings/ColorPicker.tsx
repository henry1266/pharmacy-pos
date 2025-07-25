/**
 * 無段調整選色盤組件
 * 提供自由選色和預設色彩快選功能
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Paper,
  Tooltip,
  IconButton,
  Divider,
  Chip
} from '@mui/material';
import {
  Palette as PaletteIcon,
  Refresh as RefreshIcon,
  Colorize as ColorizeIcon
} from '@mui/icons-material';
import { HexColorPicker, HexColorInput } from 'react-colorful';

interface ColorPickerProps {
  /** 當前選中的顏色 */
  value: string;
  /** 顏色變化回調 */
  onChange: (color: string) => void;
  /** 標題 */
  title?: string;
  /** 是否顯示預設色彩 */
  showPresets?: boolean;
  /** 是否顯示色彩輸入框 */
  showInput?: boolean;
  /** 自訂預設色彩 */
  presetColors?: string[];
}

// 預設的 Material Design 色彩
const DEFAULT_PRESET_COLORS = [
  // Material Design Primary Colors
  '#1976d2', // Blue
  '#388e3c', // Green
  '#f57c00', // Orange
  '#d32f2f', // Red
  '#7b1fa2', // Purple
  '#303f9f', // Indigo
  '#0097a7', // Cyan
  '#689f38', // Light Green
  '#fbc02d', // Yellow
  '#e64a19', // Deep Orange
  '#5d4037', // Brown
  '#455a64', // Blue Grey
  
  // Additional Popular Colors
  '#e91e63', // Pink
  '#9c27b0', // Purple
  '#673ab7', // Deep Purple
  '#3f51b5', // Indigo
  '#2196f3', // Blue
  '#03a9f4', // Light Blue
  '#00bcd4', // Cyan
  '#009688', // Teal
  '#4caf50', // Green
  '#8bc34a', // Light Green
  '#cddc39', // Lime
  '#ffeb3b', // Yellow
  '#ffc107', // Amber
  '#ff9800', // Orange
  '#ff5722', // Deep Orange
  '#795548', // Brown
  '#9e9e9e', // Grey
  '#607d8b', // Blue Grey
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  title = '選擇主題色彩',
  showPresets = true,
  showInput = true,
  presetColors = DEFAULT_PRESET_COLORS
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [tempColor, setTempColor] = useState(value);

  // 處理顏色變化（暫存）
  const handleColorChange = useCallback((color: string) => {
    setTempColor(color);
  }, []);

  // 處理預設色彩點擊（暫存）
  const handlePresetClick = useCallback((color: string) => {
    setTempColor(color);
  }, []);

  // 確認選擇
  const handleConfirm = useCallback(() => {
    onChange(tempColor);
    setIsPickerOpen(false);
  }, [tempColor, onChange]);

  // 取消選擇
  const handleCancel = useCallback(() => {
    setTempColor(value);
    setIsPickerOpen(false);
  }, [value]);

  // 打開選色器時重置暫存顏色
  const handleOpenPicker = useCallback(() => {
    setTempColor(value);
    setIsPickerOpen(true);
  }, [value]);

  // 隨機選擇顏色
  const handleRandomColor = useCallback(() => {
    const randomColor = presetColors[Math.floor(Math.random() * presetColors.length)];
    handleColorChange(randomColor);
  }, [presetColors, handleColorChange]);

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <PaletteIcon color="primary" />
          <Typography variant="h6">
            {title}
          </Typography>
          <Tooltip title="隨機選色">
            <IconButton size="small" onClick={handleRandomColor}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Grid container spacing={3}>
          {/* 當前選中的顏色顯示 */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Typography variant="body2" color="text.secondary">
                當前顏色：
              </Typography>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  backgroundColor: value,
                  borderRadius: 1,
                  border: '2px solid',
                  borderColor: 'divider',
                  boxShadow: 2,
                  cursor: 'pointer'
                }}
                onClick={handleOpenPicker}
              />
              <Chip
                label={value.toUpperCase()}
                variant="outlined"
                size="small"
                icon={<ColorizeIcon />}
              />
            </Box>
          </Grid>

          {/* 選色器 */}
          {isPickerOpen && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="subtitle2" gutterBottom>
                  自訂色彩選擇器
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <HexColorPicker
                    color={tempColor}
                    onChange={handleColorChange}
                    style={{ width: '200px', height: '200px' }}
                  />
                </Box>
                {showInput && (
                  <Box sx={{ width: '100%', maxWidth: '200px', mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      HEX 色碼：
                    </Typography>
                    <HexColorInput
                      color={tempColor}
                      onChange={handleColorChange}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px',
                        textAlign: 'center',
                        textTransform: 'uppercase'
                      }}
                    />
                  </Box>
                )}
                {/* 預覽當前選擇的顏色 */}
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Typography variant="caption" color="text.secondary">
                    預覽：
                  </Typography>
                  <Box
                    sx={{
                      width: 30,
                      height: 30,
                      backgroundColor: tempColor,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {tempColor.toUpperCase()}
                  </Typography>
                </Box>
                {/* 確認/取消按鈕 */}
                <Box display="flex" gap={1} width="100%">
                  <Button
                    variant="outlined"
                    color="secondary"
                    fullWidth
                    onClick={handleCancel}
                  >
                    取消
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleConfirm}
                  >
                    確認
                  </Button>
                </Box>
              </Paper>
            </Grid>
          )}

          {/* 預設色彩快選 - 只在選色器打開時顯示 */}
          {showPresets && isPickerOpen && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  預設色彩快選
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={1} sx={{ maxHeight: 200, overflowY: 'auto' }}>
                  {presetColors.map((color, index) => (
                    <Grid item key={index}>
                      <Tooltip title={color.toUpperCase()}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            backgroundColor: color,
                            borderRadius: 1,
                            border: tempColor === color ? '3px solid' : '1px solid',
                            borderColor: tempColor === color ? 'primary.main' : 'divider',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'scale(1.1)',
                              boxShadow: 2
                            }
                          }}
                          onClick={() => handlePresetClick(color)}
                        />
                      </Tooltip>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          )}

          {/* 操作按鈕 */}
          {!isPickerOpen && (
            <Grid item xs={12}>
              <Box display="flex" gap={1} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  startIcon={<ColorizeIcon />}
                  onClick={handleOpenPicker}
                >
                  打開選色器
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleRandomColor}
                >
                  隨機選色
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ColorPicker;
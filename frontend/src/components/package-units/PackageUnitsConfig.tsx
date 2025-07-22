import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  TextField,
  IconButton,
  Alert,
  Collapse,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';
import { ProductPackageUnit } from '@pharmacy-pos/shared/types/package';
import { PackageUnitsConfigProps, ValidationError } from './types';
import { validatePackageUnits } from './utils';

/**
 * 包裝單位配置組件
 * 用於管理產品的包裝單位設定
 */
const PackageUnitsConfig: React.FC<PackageUnitsConfigProps> = ({
  productId,
  packageUnits,
  onPackageUnitsChange,
  disabled = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // 狀態管理
  const [editingUnit, setEditingUnit] = useState<ProductPackageUnit | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showValidation, setShowValidation] = useState(false);

  // 新增單位的表單狀態
  const [newUnit, setNewUnit] = useState<Partial<ProductPackageUnit>>({
    unitName: '',
    unitValue: 1,
    priority: 0,
    isBaseUnit: false
  });

  // 排序後的包裝單位
  const sortedUnits = useMemo(() => {
    return [...packageUnits].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }, [packageUnits]);

  // 基礎單位
  const baseUnit = useMemo(() => {
    return packageUnits.find(u => u.isBaseUnit) || 
           packageUnits.find(u => u.unitValue === Math.min(...packageUnits.map(p => p.unitValue)));
  }, [packageUnits]);

  // 驗證包裝單位配置
  const validateConfig = useCallback(() => {
    const errors = validatePackageUnits(packageUnits);
    setValidationErrors(errors);
    setShowValidation(errors.length > 0);
    return errors.length === 0;
  }, [packageUnits]);

  // 處理新增單位
  const handleAddUnit = useCallback(() => {
    if (!newUnit.unitName || !newUnit.unitValue) {
      return;
    }

    const unit: ProductPackageUnit = {
      _id: '', // 前端暫時使用空字符串，後端會生成實際ID
      productId: productId || '',
      unitName: newUnit.unitName,
      unitValue: newUnit.unitValue,
      priority: newUnit.priority || 0,
      isBaseUnit: newUnit.isBaseUnit || false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedUnits = [...packageUnits, unit];
    onPackageUnitsChange(updatedUnits);
    
    // 重置表單
    setNewUnit({
      unitName: '',
      unitValue: 1,
      priority: 0,
      isBaseUnit: false
    });
    setShowAddDialog(false);
  }, [newUnit, packageUnits, onPackageUnitsChange]);

  // 處理編輯單位
  const handleEditUnit = useCallback((unit: ProductPackageUnit) => {
    setEditingUnit({ ...unit });
  }, []);

  // 處理保存編輯
  const handleSaveEdit = useCallback(() => {
    if (!editingUnit) return;

    const updatedUnits = packageUnits.map(unit => 
      unit.unitName === editingUnit.unitName ? editingUnit : unit
    );
    onPackageUnitsChange(updatedUnits);
    setEditingUnit(null);
  }, [editingUnit, packageUnits, onPackageUnitsChange]);

  // 處理刪除單位
  const handleDeleteUnit = useCallback((unitName: string) => {
    const updatedUnits = packageUnits.filter(unit => unit.unitName !== unitName);
    onPackageUnitsChange(updatedUnits);
  }, [packageUnits, onPackageUnitsChange]);

  // 處理設為基礎單位
  const handleSetBaseUnit = useCallback((unitName: string) => {
    const updatedUnits = packageUnits.map(unit => ({
      ...unit,
      isBaseUnit: unit.unitName === unitName
    }));
    onPackageUnitsChange(updatedUnits);
  }, [packageUnits, onPackageUnitsChange]);

  // 單位行組件
  const UnitRow: React.FC<{ unit: ProductPackageUnit; index: number }> = ({ unit, index }) => {
    const isEditing = editingUnit?.unitName === unit.unitName;
    const canDelete = packageUnits.length > 1;

    return (
      <Card
        elevation={1}
        sx={{
          mb: isMobile ? 1.5 : 1,
          border: unit.isBaseUnit ? `2px solid ${theme.palette.primary.main}` : undefined,
          backgroundColor: unit.isBaseUnit ? theme.palette.primary.light + '10' : undefined,
          borderRadius: isMobile ? 2 : 1,
          '&:hover': {
            elevation: 2,
            transform: 'translateY(-1px)',
            transition: 'all 0.2s ease-in-out'
          }
        }}
      >
        <CardContent sx={{
          pb: isMobile ? 2 : 1,
          px: isMobile ? 2 : 2,
          pt: isMobile ? 2 : 2,
          '&:last-child': {
            pb: isMobile ? 2 : 1
          }
        }}>
          <Grid container spacing={2} alignItems="center">
            {/* 拖拽手柄 */}
            <Grid item xs="auto">
              <DragIcon color="disabled" />
            </Grid>

            {/* 單位名稱 */}
            <Grid item xs={12} sm={isMobile ? 12 : 3}>
              {isEditing ? (
                <TextField
                  size={isMobile ? "medium" : "small"}
                  label="單位名稱"
                  value={editingUnit.unitName}
                  onChange={(e) => setEditingUnit({ ...editingUnit, unitName: e.target.value })}
                  fullWidth
                  sx={{
                    '& .MuiInputBase-root': {
                      height: isMobile ? 48 : 'auto'
                    }
                  }}
                />
              ) : (
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 0.5
                }}>
                  <Typography
                    variant={isMobile ? "body1" : "subtitle2"}
                    fontWeight="bold"
                    sx={{ fontSize: isMobile ? '1rem' : '0.875rem' }}
                  >
                    {unit.unitName}
                  </Typography>
                  {unit.isBaseUnit && (
                    <Chip
                      label="基礎單位"
                      size={isMobile ? "medium" : "small"}
                      color="primary"
                      sx={{
                        fontSize: isMobile ? '0.75rem' : '0.7rem',
                        height: isMobile ? 24 : 20
                      }}
                    />
                  )}
                </Box>
              )}
            </Grid>

            {/* 單位值 */}
            <Grid item xs={12} sm={isMobile ? 6 : 2}>
              {isEditing ? (
                <TextField
                  size={isMobile ? "medium" : "small"}
                  type="number"
                  label="單位值"
                  value={editingUnit.unitValue}
                  onChange={(e) => setEditingUnit({ ...editingUnit, unitValue: parseInt(e.target.value) || 1 })}
                  fullWidth
                  inputProps={{ min: 1 }}
                  sx={{
                    '& .MuiInputBase-root': {
                      height: isMobile ? 48 : 'auto'
                    }
                  }}
                />
              ) : (
                <Box>
                  <Typography
                    variant={isMobile ? "body2" : "body2"}
                    sx={{
                      fontSize: isMobile ? '0.875rem' : '0.875rem',
                      fontWeight: isMobile ? 500 : 'normal'
                    }}
                  >
                    {unit.unitValue} {baseUnit?.unitName || '個'}
                  </Typography>
                  {isMobile && (
                    <Typography variant="caption" color="text.secondary">
                      單位值
                    </Typography>
                  )}
                </Box>
              )}
            </Grid>

            {/* 優先級 */}
            <Grid item xs={12} sm={isMobile ? 6 : 2}>
              {isEditing ? (
                <TextField
                  size={isMobile ? "medium" : "small"}
                  type="number"
                  label="優先級"
                  value={editingUnit.priority || 0}
                  onChange={(e) => setEditingUnit({ ...editingUnit, priority: parseInt(e.target.value) || 0 })}
                  fullWidth
                  sx={{
                    '& .MuiInputBase-root': {
                      height: isMobile ? 48 : 'auto'
                    }
                  }}
                />
              ) : (
                <Box>
                  <Typography
                    variant={isMobile ? "body2" : "body2"}
                    color="text.secondary"
                    sx={{
                      fontSize: isMobile ? '0.875rem' : '0.875rem',
                      fontWeight: isMobile ? 500 : 'normal'
                    }}
                  >
                    {isMobile ? unit.priority || 0 : `優先級: ${unit.priority || 0}`}
                  </Typography>
                  {isMobile && (
                    <Typography variant="caption" color="text.secondary">
                      優先級
                    </Typography>
                  )}
                </Box>
              )}
            </Grid>

            {/* 操作按鈕 */}
            <Grid item xs={12} sm="auto">
              <Box sx={{
                display: 'flex',
                gap: 0.5,
                flexDirection: isMobile ? 'row' : 'row',
                justifyContent: isMobile ? 'flex-end' : 'flex-start',
                flexWrap: 'wrap'
              }}>
                {isEditing ? (
                  <>
                    <IconButton
                      size={isMobile ? "medium" : "small"}
                      onClick={handleSaveEdit}
                      color="primary"
                      sx={{ minWidth: isMobile ? 44 : 'auto' }}
                    >
                      <SaveIcon />
                    </IconButton>
                    <IconButton
                      size={isMobile ? "medium" : "small"}
                      onClick={() => setEditingUnit(null)}
                      sx={{ minWidth: isMobile ? 44 : 'auto' }}
                    >
                      <CancelIcon />
                    </IconButton>
                  </>
                ) : (
                  <>
                    <Tooltip title="編輯">
                      <IconButton
                        size={isMobile ? "medium" : "small"}
                        onClick={() => handleEditUnit(unit)}
                        disabled={disabled}
                        sx={{ minWidth: isMobile ? 44 : 'auto' }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    
                    {!unit.isBaseUnit && (
                      <Tooltip title="設為基礎單位">
                        <Button
                          size={isMobile ? "medium" : "small"}
                          variant="outlined"
                          onClick={() => handleSetBaseUnit(unit.unitName)}
                          disabled={disabled}
                          sx={{
                            minWidth: 'auto',
                            px: isMobile ? 1.5 : 1,
                            fontSize: isMobile ? '0.875rem' : '0.75rem'
                          }}
                        >
                          基礎
                        </Button>
                      </Tooltip>
                    )}
                    
                    <Tooltip title="刪除">
                      <IconButton
                        size={isMobile ? "medium" : "small"}
                        onClick={() => handleDeleteUnit(unit.unitName)}
                        disabled={disabled || !canDelete}
                        color="error"
                        sx={{ minWidth: isMobile ? 44 : 'auto' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      {/* 標題和操作 */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        mb: 2,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 1 : 0
      }}>
        <Typography
          variant={isMobile ? "subtitle1" : "h6"}
          fontWeight="bold"
          sx={{ mb: isMobile ? 1 : 0 }}
        >
          包裝單位配置
        </Typography>
        <Box sx={{
          display: 'flex',
          gap: 1,
          flexDirection: isMobile ? 'column' : 'row',
          width: isMobile ? '100%' : 'auto'
        }}>
          <Button
            variant="outlined"
            size={isMobile ? "medium" : "small"}
            onClick={validateConfig}
            startIcon={<CheckCircleIcon />}
            fullWidth={isMobile}
          >
            驗證配置
          </Button>
          <Button
            variant="contained"
            size={isMobile ? "medium" : "small"}
            onClick={() => setShowAddDialog(true)}
            startIcon={<AddIcon />}
            disabled={disabled}
            fullWidth={isMobile}
          >
            新增單位
          </Button>
        </Box>
      </Box>

      {/* 驗證錯誤提示 */}
      <Collapse in={showValidation}>
        <Alert 
          severity={validationErrors.length > 0 ? "error" : "success"} 
          sx={{ mb: 2 }}
          onClose={() => setShowValidation(false)}
        >
          {validationErrors.length > 0 ? (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                配置驗證失敗：
              </Typography>
              {validationErrors.map((error, index) => (
                <Typography key={index} variant="body2">
                  • {error.message}
                </Typography>
              ))}
            </Box>
          ) : (
            "包裝單位配置驗證通過！"
          )}
        </Alert>
      </Collapse>

      {/* 包裝單位列表 */}
      <Box>
        {sortedUnits.length === 0 ? (
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                尚未配置包裝單位，請點擊「新增單位」開始設定
              </Typography>
            </CardContent>
          </Card>
        ) : (
          sortedUnits.map((unit, index) => (
            <UnitRow key={unit.unitName} unit={unit} index={index} />
          ))
        )}
      </Box>

      {/* 新增單位對話框 */}
      <Dialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2,
            m: isMobile ? 0 : 2
          }
        }}
      >
        <DialogTitle sx={{
          pb: isMobile ? 1 : 2,
          fontSize: isMobile ? '1.25rem' : '1.5rem'
        }}>
          新增包裝單位
        </DialogTitle>
        <DialogContent sx={{
          px: isMobile ? 2 : 3,
          pb: isMobile ? 2 : 3
        }}>
          <Grid container spacing={isMobile ? 2 : 2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size={isMobile ? "medium" : "medium"}
                label="單位名稱"
                value={newUnit.unitName}
                onChange={(e) => setNewUnit({ ...newUnit, unitName: e.target.value })}
                placeholder="例如：盒、排、瓶"
                variant="outlined"
                sx={{
                  '& .MuiInputBase-root': {
                    height: isMobile ? 56 : 'auto'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size={isMobile ? "medium" : "medium"}
                type="number"
                label="單位值"
                value={newUnit.unitValue}
                onChange={(e) => setNewUnit({ ...newUnit, unitValue: parseInt(e.target.value) || 1 })}
                inputProps={{ min: 1 }}
                helperText={`相當於 ${newUnit.unitValue || 1} ${baseUnit?.unitName || '個'}`}
                variant="outlined"
                sx={{
                  '& .MuiInputBase-root': {
                    height: isMobile ? 56 : 'auto'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size={isMobile ? "medium" : "medium"}
                type="number"
                label="優先級"
                value={newUnit.priority}
                onChange={(e) => setNewUnit({ ...newUnit, priority: parseInt(e.target.value) || 0 })}
                helperText="數字越大優先級越高"
                variant="outlined"
                sx={{
                  '& .MuiInputBase-root': {
                    height: isMobile ? 56 : 'auto'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl
                fullWidth
                size={isMobile ? "medium" : "medium"}
                sx={{
                  '& .MuiInputBase-root': {
                    height: isMobile ? 56 : 'auto'
                  }
                }}
              >
                <InputLabel>單位類型</InputLabel>
                <Select
                  value={newUnit.isBaseUnit ? 'base' : 'package'}
                  onChange={(e) => setNewUnit({ ...newUnit, isBaseUnit: e.target.value === 'base' })}
                  label="單位類型"
                  variant="outlined"
                >
                  <MenuItem value="package">包裝單位</MenuItem>
                  <MenuItem value="base">基礎單位</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{
          px: isMobile ? 2 : 3,
          pb: isMobile ? 2 : 2,
          gap: isMobile ? 1 : 0.5,
          flexDirection: isMobile ? 'column-reverse' : 'row'
        }}>
          <Button
            onClick={() => setShowAddDialog(false)}
            size={isMobile ? "large" : "medium"}
            fullWidth={isMobile}
            sx={{
              height: isMobile ? 48 : 'auto',
              fontSize: isMobile ? '1rem' : '0.875rem'
            }}
          >
            取消
          </Button>
          <Button
            onClick={handleAddUnit}
            variant="contained"
            size={isMobile ? "large" : "medium"}
            disabled={!newUnit.unitName || !newUnit.unitValue}
            fullWidth={isMobile}
            sx={{
              height: isMobile ? 48 : 'auto',
              fontSize: isMobile ? '1rem' : '0.875rem'
            }}
          >
            新增
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PackageUnitsConfig;
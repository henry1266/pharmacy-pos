import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Tooltip,
  useTheme,
  useMediaQuery,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';
import axios from 'axios';
import { ProductPackageUnit } from '@pharmacy-pos/shared/types/package';
import { PackageUnitsConfigProps } from './types';
import { useUserSettings } from '../../hooks/useUserSettings';

/**
 * 包裝單位配置組件
 * 用於管理產品的包裝單位設定
 */
const PackageUnitsConfig: React.FC<PackageUnitsConfigProps> = ({
  productId,
  packageUnits,
  onPackageUnitsChange,
  disabled = false,
  baseUnitName,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { settings } = useUserSettings();
  
  // 使用設定中的預設單位，如果沒有則使用傳入的 baseUnitName，最後才使用 '個' 作為預設值
  const defaultUnit = settings.defaultUnit || baseUnitName || '個';
  
  // 狀態管理
  const [editingUnit, setEditingUnit] = useState<ProductPackageUnit | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 新增單位的表單狀態
  const [newUnit, setNewUnit] = useState<Partial<ProductPackageUnit>>({
    unitName: '',
    unitValue: 1,
    isBaseUnit: false
  });

  // 排序後的包裝單位（按 unitValue 從大到小排序）
  const sortedUnits = useMemo(() => {
    return [...packageUnits].sort((a, b) => b.unitValue - a.unitValue);
  }, [packageUnits]);

  // 保存包裝單位到後端
  const savePackageUnits = useCallback(async (units: ProductPackageUnit[]) => {
    if (!productId) {
      setError('產品ID不能為空');
      return false;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      console.log('🔄 開始保存包裝單位:', {
        productId,
        units,
        apiUrl: `/api/products/${productId}/package-units`
      });

      const response = await axios.put(`/api/products/${productId}/package-units`, {
        packageUnits: units
      });

      console.log('✅ API 響應:', response);

      if (response.data.success) {
        console.log('✅ 保存成功:', response.data);
        setSuccess('包裝單位保存成功');
        
        // 更新父組件狀態，確保其他頁面能看到最新數據
        if (response.data.data && Array.isArray(response.data.data)) {
          onPackageUnitsChange(response.data.data);
        }
        
        // 清除成功訊息
        setTimeout(() => setSuccess(null), 3000);
        return true;
      } else {
        console.error('❌ 保存失敗 - 響應不成功:', response.data);
        setError(response.data.message || '保存失敗');
        return false;
      }
    } catch (err: any) {
      console.error('❌ 保存包裝單位失敗:', err);
      console.error('❌ 錯誤詳情:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
      setError(err.response?.data?.message || err.message || '保存包裝單位失敗');
      return false;
    } finally {
      setSaving(false);
    }
  }, [productId]);

  // 處理新增單位
  const handleAddUnit = useCallback(async () => {
    if (!newUnit.unitName || !newUnit.unitValue) {
      return;
    }

    const unit: ProductPackageUnit = {
      _id: `temp_${Date.now()}_${Math.random()}`, // 使用臨時ID，後端會替換
      productId: productId || '',
      unitName: newUnit.unitName,
      unitValue: newUnit.unitValue,
      isBaseUnit: newUnit.unitValue === 1, // 如果數值為1，設為基礎單位
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedUnits = [...packageUnits, unit];
    
    // 立即保存到後端
    const saveSuccess = await savePackageUnits(updatedUnits);
    if (saveSuccess) {
      onPackageUnitsChange(updatedUnits);
      
      // 重置表單
      setNewUnit({
        unitName: '',
        unitValue: 1,
        isBaseUnit: false
      });
      setShowAddDialog(false);
    }
  }, [newUnit, packageUnits, onPackageUnitsChange, productId, savePackageUnits]);

  // 處理編輯單位
  const handleEditUnit = useCallback((unit: ProductPackageUnit) => {
    setEditingUnit({ ...unit });
  }, []);

  // 處理保存編輯
  const handleSaveEdit = useCallback(async () => {
    if (!editingUnit) return;

    const updatedUnits = packageUnits.map(unit =>
      unit.unitName === editingUnit.unitName ? editingUnit : unit
    );
    
    // 立即保存到後端
    const saveSuccess = await savePackageUnits(updatedUnits);
    if (saveSuccess) {
      onPackageUnitsChange(updatedUnits);
      setEditingUnit(null);
    }
  }, [editingUnit, packageUnits, onPackageUnitsChange, savePackageUnits]);

  // 處理刪除單位
  const handleDeleteUnit = useCallback(async (unitName: string) => {
    const updatedUnits = packageUnits.filter(unit => unit.unitName !== unitName);
    
    // 立即保存到後端
    const saveSuccess = await savePackageUnits(updatedUnits);
    if (saveSuccess) {
      onPackageUnitsChange(updatedUnits);
    }
  }, [packageUnits, onPackageUnitsChange, savePackageUnits]);


  // 單位行組件
  const UnitRow: React.FC<{ unit: ProductPackageUnit; index: number }> = ({ unit }) => {
    const isEditing = editingUnit?.unitName === unit.unitName;
    const canDelete = packageUnits.length > 1;

    return (
      <Card
        elevation={1}
        sx={{
          mb: isMobile ? 1.5 : 1,
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
                <Typography
                  variant={isMobile ? "body1" : "subtitle2"}
                  fontWeight="bold"
                  sx={{ fontSize: isMobile ? '1rem' : '0.875rem' }}
                >
                  {unit.unitName}
                </Typography>
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
                    {unit.unitValue} {defaultUnit}
                  </Typography>
                  {isMobile && (
                    <Typography variant="caption" color="text.secondary">
                      單位值
                    </Typography>
                  )}
                </Box>
              )}
            </Grid>

            {/* 排序說明 */}
            <Grid item xs={12} sm={isMobile ? 6 : 2}>
              <Box>
                <Typography
                  variant={isMobile ? "body2" : "body2"}
                  color="text.secondary"
                  sx={{
                    fontSize: isMobile ? '0.875rem' : '0.875rem',
                    fontWeight: isMobile ? 500 : 'normal'
                  }}
                >
                  {isMobile ? '自動排序' : '按數量排序'}
                </Typography>
                {isMobile && (
                  <Typography variant="caption" color="text.secondary">
                    數量越大優先級越高
                  </Typography>
                )}
              </Box>
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
                        disabled={disabled || saving}
                        sx={{ minWidth: isMobile ? 44 : 'auto' }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="刪除">
                      <IconButton
                        size={isMobile ? "medium" : "small"}
                        onClick={() => handleDeleteUnit(unit.unitName)}
                        disabled={disabled || !canDelete || saving}
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
      {/* 錯誤和成功訊息 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

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
          {saving && (
            <CircularProgress size={16} sx={{ ml: 1 }} />
          )}
        </Typography>
        <Button
          variant="contained"
          size={isMobile ? "medium" : "small"}
          onClick={() => setShowAddDialog(true)}
          startIcon={<AddIcon />}
          disabled={disabled || saving}
          fullWidth={isMobile}
        >
          新增單位
        </Button>
      </Box>


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
                helperText={`相當於 ${newUnit.unitValue || 1} ${defaultUnit}`}
                variant="outlined"
                sx={{
                  '& .MuiInputBase-root': {
                    height: isMobile ? 56 : 'auto'
                  }
                }}
              />
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
            disabled={!newUnit.unitName || !newUnit.unitValue || saving}
            fullWidth={isMobile}
            sx={{
              height: isMobile ? 48 : 'auto',
              fontSize: isMobile ? '1rem' : '0.875rem'
            }}
          >
            {saving ? '保存中...' : '新增'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PackageUnitsConfig;
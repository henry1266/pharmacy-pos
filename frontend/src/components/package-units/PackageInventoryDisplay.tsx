import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Inventory as InventoryIcon } from '@mui/icons-material';
import { ProductPackageUnit } from '@pharmacy-pos/shared/types/package';
import { PackageInventoryDisplayProps } from './types';
import { convertToPackageDisplay, formatPackageDisplay } from './utils';

/**
 * 包裝庫存顯示組件
 * 用於顯示庫存數量的包裝分解格式
 */
const PackageInventoryDisplay: React.FC<PackageInventoryDisplayProps> = ({
  totalQuantity,
  packageUnits,
  showBreakdown = true,
  variant = 'default'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const displayResult = useMemo(() => {
    return convertToPackageDisplay(totalQuantity, packageUnits);
  }, [totalQuantity, packageUnits]);

  const baseUnit = useMemo(() => {
    return packageUnits.find(u => u.unitValue === Math.min(...packageUnits.map(p => p.unitValue)));
  }, [packageUnits]);

  // 緊湊模式
  if (variant === 'compact') {
    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 'medium',
            color: totalQuantity > 0 ? 'text.primary' : 'text.secondary'
          }}
        >
          {displayResult.displayText}
        </Typography>
        {totalQuantity > 0 && (
          <Tooltip title={`基礎單位：${totalQuantity} ${baseUnit?.unitName || '個'}`}>
            <Chip 
              label={`${totalQuantity}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.75rem', height: '20px' }}
            />
          </Tooltip>
        )}
      </Box>
    );
  }

  // 詳細模式
  if (variant === 'detailed') {
    return (
      <Card elevation={1} sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <InventoryIcon 
              color={totalQuantity > 0 ? 'primary' : 'disabled'} 
              fontSize="small" 
            />
            <Typography 
              variant="subtitle2" 
              color="text.secondary" 
              fontWeight="medium" 
              sx={{ ml: 1 }}
            >
              庫存數量
            </Typography>
          </Box>
          
          {/* 主要顯示 */}
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 'bold', 
              color: totalQuantity > 0 ? 'primary.main' : 'text.secondary',
              mb: 1
            }}
          >
            {displayResult.displayText}
          </Typography>
          
          {/* 詳細分解 */}
          {showBreakdown && displayResult.packageBreakdown.length > 1 && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                詳細分解：
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {displayResult.packageBreakdown
                  .filter(item => item.quantity > 0)
                  .map((item, index) => (
                    <Chip
                      key={index}
                      label={`${item.quantity}${item.unitName}`}
                      size="small"
                      variant="outlined"
                      color="primary"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  ))}
              </Box>
            </Box>
          )}
          
          {/* 基礎單位顯示 */}
          <Typography variant="caption" color="text.secondary">
            基礎單位：{totalQuantity} {baseUnit?.unitName || '個'}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // 預設模式
  return (
    <Box>
      {/* 主要顯示 */}
      <Typography 
        variant={isMobile ? "body1" : "h6"} 
        sx={{ 
          fontWeight: 'bold', 
          color: totalQuantity > 0 ? 'primary.main' : 'text.secondary',
          mb: showBreakdown ? 1 : 0
        }}
      >
        {displayResult.displayText}
      </Typography>
      
      {/* 詳細分解（可選） */}
      {showBreakdown && displayResult.packageBreakdown.length > 1 && (
        <Box sx={{ mb: 1 }}>
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ mb: 0.5, display: 'block' }}
          >
            詳細分解：
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {displayResult.packageBreakdown
              .filter(item => item.quantity > 0)
              .map((item, index) => (
                <Chip
                  key={index}
                  label={`${item.quantity}${item.unitName}`}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    height: isMobile ? '24px' : '28px'
                  }}
                />
              ))}
          </Box>
        </Box>
      )}
      
      {/* 基礎單位顯示 */}
      <Typography 
        variant="caption" 
        color="text.secondary" 
        sx={{ display: 'block', mt: 0.5 }}
      >
        基礎單位：{totalQuantity} {baseUnit?.unitName || '個'}
      </Typography>
    </Box>
  );
};

export default PackageInventoryDisplay;
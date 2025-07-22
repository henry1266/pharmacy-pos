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
      <Box sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isMobile ? 0.5 : 1,
        flexWrap: 'wrap'
      }}>
        <Typography
          variant={isMobile ? "caption" : "body2"}
          sx={{
            fontWeight: 'medium',
            color: totalQuantity > 0 ? 'text.primary' : 'text.secondary',
            fontSize: isMobile ? '0.75rem' : '0.875rem'
          }}
        >
          {displayResult.displayText}
        </Typography>
        {totalQuantity > 0 && (
          <Tooltip title={`基礎單位：${totalQuantity} ${baseUnit?.unitName || '個'}`}>
            <Chip
              label={`${totalQuantity}`}
              size={isMobile ? "small" : "small"}
              variant="outlined"
              sx={{
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                height: isMobile ? '18px' : '20px',
                minWidth: isMobile ? '24px' : 'auto'
              }}
            />
          </Tooltip>
        )}
      </Box>
    );
  }

  // 詳細模式
  if (variant === 'detailed') {
    return (
      <Card
        elevation={1}
        sx={{
          borderRadius: isMobile ? 1 : 2,
          maxWidth: isMobile ? '100%' : 'none'
        }}
      >
        <CardContent sx={{
          p: isMobile ? 1.5 : 2,
          '&:last-child': { pb: isMobile ? 1.5 : 2 }
        }}>
          <Box sx={{
            display: 'flex',
            alignItems: isMobile ? 'flex-start' : 'center',
            mb: isMobile ? 0.5 : 1,
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 0.5 : 0
          }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              mb: isMobile ? 0.5 : 0
            }}>
              <InventoryIcon
                color={totalQuantity > 0 ? 'primary' : 'disabled'}
                fontSize={isMobile ? "small" : "small"}
              />
              <Typography
                variant={isMobile ? "caption" : "subtitle2"}
                color="text.secondary"
                fontWeight="medium"
                sx={{
                  ml: 1,
                  fontSize: isMobile ? '0.75rem' : '0.875rem'
                }}
              >
                庫存數量
              </Typography>
            </Box>
          </Box>
          
          {/* 主要顯示 */}
          <Typography
            variant={isMobile ? "subtitle1" : "h6"}
            sx={{
              fontWeight: 'bold',
              color: totalQuantity > 0 ? 'primary.main' : 'text.secondary',
              mb: isMobile ? 0.5 : 1,
              fontSize: isMobile ? '1.1rem' : '1.25rem',
              lineHeight: 1.2
            }}
          >
            {displayResult.displayText}
          </Typography>
          
          {/* 詳細分解 */}
          {showBreakdown && displayResult.packageBreakdown.length > 1 && (
            <Box sx={{ mb: isMobile ? 0.5 : 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  mb: 0.5,
                  display: 'block',
                  fontSize: isMobile ? '0.7rem' : '0.75rem'
                }}
              >
                詳細分解：
              </Typography>
              <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: isMobile ? 0.25 : 0.5
              }}>
                {displayResult.packageBreakdown
                  .filter(item => item.quantity > 0)
                  .map((item, index) => (
                    <Chip
                      key={index}
                      label={`${item.quantity}${item.unitName}`}
                      size={isMobile ? "small" : "small"}
                      variant="outlined"
                      color="primary"
                      sx={{
                        fontSize: isMobile ? '0.7rem' : '0.75rem',
                        height: isMobile ? '20px' : '24px'
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
            sx={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              display: 'block',
              mt: isMobile ? 0.5 : 0
            }}
          >
            基礎單位：{totalQuantity} {baseUnit?.unitName || '個'}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // 預設模式
  return (
    <Box sx={{
      width: '100%',
      maxWidth: isMobile ? '100%' : 'none'
    }}>
      {/* 主要顯示 */}
      <Typography
        variant={isMobile ? "body1" : "h6"}
        sx={{
          fontWeight: 'bold',
          color: totalQuantity > 0 ? 'primary.main' : 'text.secondary',
          mb: showBreakdown ? (isMobile ? 0.5 : 1) : 0,
          fontSize: isMobile ? '1rem' : '1.25rem',
          lineHeight: isMobile ? 1.3 : 1.2,
          wordBreak: 'break-word'
        }}
      >
        {displayResult.displayText}
      </Typography>
      
      {/* 詳細分解（可選） */}
      {showBreakdown && displayResult.packageBreakdown.length > 1 && (
        <Box sx={{ mb: isMobile ? 0.5 : 1 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              mb: 0.5,
              display: 'block',
              fontSize: isMobile ? '0.7rem' : '0.75rem'
            }}
          >
            詳細分解：
          </Typography>
          <Box sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: isMobile ? 0.25 : 0.5,
            alignItems: 'center'
          }}>
            {displayResult.packageBreakdown
              .filter(item => item.quantity > 0)
              .map((item, index) => (
                <Chip
                  key={index}
                  label={`${item.quantity}${item.unitName}`}
                  size={isMobile ? "small" : "small"}
                  variant="outlined"
                  sx={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    height: isMobile ? '20px' : '24px',
                    '& .MuiChip-label': {
                      px: isMobile ? 0.5 : 0.75
                    }
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
        sx={{
          display: 'block',
          mt: isMobile ? 0.25 : 0.5,
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          opacity: 0.8
        }}
      >
        基礎單位：{totalQuantity} {baseUnit?.unitName || '個'}
      </Typography>
    </Box>
  );
};

export default PackageInventoryDisplay;
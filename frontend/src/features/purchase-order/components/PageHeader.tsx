import React from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  ShoppingCart as ShoppingCartIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import BreadcrumbNavigation from '../../../components/common/BreadcrumbNavigation';

interface PageHeaderProps {
  mode: 'list' | 'new' | 'edit';
  onNavigateToList: () => void;
  onNavigateToNew?: () => void;
  editId?: string | undefined;
  actionButtons?: React.ReactNode;
}

/**
 * 進貨單頁面標題組件
 * 包含麵包屑導航和操作按鈕
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  mode,
  onNavigateToList,
  onNavigateToNew,
  editId,
  actionButtons
}) => {
  // 新增或編輯模式的標題
  if (mode === 'new' || mode === 'edit') {
    return (
      <Paper sx={{
        mb: 3,
        bgcolor: 'background.paper',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        position: 'relative',
        zIndex: 1
      }}>
        <Box sx={{
          p: 1,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 48
        }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            height: '100%'
          }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              height: 44
            }}>
              <Box sx={{
                '& > div': {
                  marginBottom: 0,
                  display: 'flex',
                  alignItems: 'center'
                }
              }}>
                <BreadcrumbNavigation
                  items={[
                    {
                      label: '進貨單管理',
                      path: '/purchase-orders',
                      icon: <ShoppingCartIcon sx={{ fontSize: '1.1rem' }} />
                    },
                    {
                      label: mode === 'new' ? '新增進貨單' : `編輯進貨單${editId ? ` ${editId}` : ''}`,
                      icon: <AddIcon sx={{ fontSize: '1.1rem' }} />
                    }
                  ]}
                  fontSize="0.975rem"
                  padding={0}
                />
              </Box>
            </Box>
          </Box>
          <Box sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            height: '100%',
            marginLeft: 'auto'
          }}>
            {actionButtons ? (
              actionButtons
            ) : (
              <Button
                variant="contained"
                size="small"
                startIcon={<ArrowBackIcon />}
                onClick={onNavigateToList}
                sx={{
                  height: 44,
                  minWidth: 110
                }}
              >
                返回列表
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    );
  }

  // 列表模式的標題
  return (
    <Paper sx={{
      mb: 3,
      bgcolor: 'background.paper',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      position: 'relative',
      zIndex: 1
    }}>
      <Box sx={{
        p: 1,
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 48
      }}>
        {/* 左側區域：麵包屑 */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          height: '100%'
        }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            height: 44
          }}>
            <Box sx={{
              '& > div': {
                marginBottom: 0,
                display: 'flex',
                alignItems: 'center'
              }
            }}>
              <BreadcrumbNavigation
                items={[
                  {
                    label: '首頁',
                    path: '/',
                    icon: <HomeIcon sx={{ fontSize: '1.1rem' }} />
                  },
                  {
                    label: '進貨單管理',
                    icon: <ShoppingCartIcon sx={{ fontSize: '1.1rem' }} />
                  }
                ]}
                fontSize="0.975rem"
                padding={0}
              />
            </Box>
          </Box>
        </Box>
        
        {/* 右側區域：按鈕 */}
        <Box sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          height: '100%',
          marginLeft: 'auto'
        }}>
          {onNavigateToNew && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={onNavigateToNew}
              sx={{
                height: 44,
                minWidth: 110
              }}
            >
              新增進貨單
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default PageHeader;
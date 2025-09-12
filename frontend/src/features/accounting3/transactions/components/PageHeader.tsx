import React from 'react';
import { Box, Paper, Typography, Button, TextField, InputAdornment } from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Receipt as ReceiptIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { BreadcrumbNavigation } from '../../components/ui/BreadcrumbNavigation';

interface PageHeaderProps {
  mode: 'list' | 'new';
  showFilters: boolean;
  searchTerm: string;
  pagination?: { total: number };
  onSearchChange: (value: string) => void;
  onToggleFilters: () => void;
  onNavigateToNew: () => void;
  onNavigateToList: () => void;
}

/**
 * 交易頁面標題組件
 * 包含麵包屑導航、搜索框和操作按鈕
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  mode,
  showFilters,
  searchTerm,
  pagination,
  onSearchChange,
  onToggleFilters,
  onNavigateToNew,
  onNavigateToList
}) => {
  // 新增模式的標題
  if (mode === 'new') {
    return (
      <Paper sx={{
        mb: 3,
        bgcolor: 'background.paper',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        position: 'relative',
        zIndex: 1
      }}>
        <Box sx={{
          p: 1.5,
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
                      label: '會計首頁',
                      path: '/accounting3',
                      icon: <HomeIcon sx={{ fontSize: '1.1rem' }} />
                    },
                    {
                      label: '交易管理',
                      path: '/accounting3/transaction',
                      icon: <ReceiptIcon sx={{ fontSize: '1.1rem' }} />
                    },
                    {
                      label: '新增交易',
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
        p: 1.5,
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 48
      }}>
        {/* 左側區域：麵包屑和總筆數 */}
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
                    label: '會計首頁',
                    path: '/accounting3',
                    icon: <HomeIcon sx={{ fontSize: '1.1rem' }} />
                  },
                  {
                    label: '交易管理',
                    icon: <ReceiptIcon sx={{ fontSize: '1.1rem' }} />
                  }
                ]}
                fontSize="0.975rem"
                padding={0}
              />
            </Box>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'secondary.main',
              color: 'secondary.contrastText',
              px: 2,
              py: 0.5,
              ml: 2,
              borderRadius: 2,
              minWidth: 'fit-content',
              height: 36
            }}>
              <Typography variant="caption" sx={{ fontSize: '0.85rem', mr: 0.75 }}>
                總筆數
              </Typography>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'bold', lineHeight: 1 }}>
                {pagination?.total || 0}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        {/* 右側區域：搜尋框和按鈕 */}
        <Box sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          height: '100%',
          marginLeft: 'auto'
        }}>
          <TextField
            size="small"
            label="搜尋"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="交易..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              sx: { height: 44 }
            }}
            sx={{
              '& .MuiInputBase-root': {
                height: 44
              }
            }}
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={<FilterListIcon />}
            onClick={onToggleFilters}
            sx={{
              height: 44,
              minWidth: 110
            }}
          >
            {showFilters ? '隱藏篩選' : '顯示篩選'}
          </Button>
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
            新增交易
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default PageHeader;
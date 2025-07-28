import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Divider,
  Collapse,
  IconButton,
  ToggleButton,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  UnfoldMore as UnfoldMoreIcon,
  UnfoldLess as UnfoldLessIcon,
  FilterAlt as FilterAltIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import WildcardSearchHelp from '../../../common/WildcardSearchHelp';
import { useExpandableList } from './hooks/useExpandableList';
import { useDailyFilter } from './hooks/useDailyFilter';
import { DAILY_PANEL_STYLES } from './styles';

export interface DailyPanelConfig<T> {
  // 基本配置
  title: string;
  icon: React.ReactNode;
  iconColor?: string;
  loadingText: string;
  emptyText: string;
  searchPlaceholder: string;
  
  // 資料處理函數
  filterItemsForDate: (items: T[], targetDate: string) => T[];
  getSearchableFields: (item: T) => string[];
  calculateTotalAmount: (items: T[]) => number;
  
  // 渲染函數
  renderItemSummary: (item: T, isExpanded: boolean, onToggle: () => void) => React.ReactNode;
  renderItemDetails: (item: T) => React.ReactNode;
}

export interface DailyPanelProps<T extends { _id: string }> {
  // 資料
  items: T[];
  loading: boolean;
  error: string | null;
  targetDate: string;
  
  // 搜尋相關
  searchTerm: string;
  onSearchChange: (value: string) => void;
  wildcardMode?: boolean;
  onWildcardModeChange?: (enabled: boolean) => void;
  
  // 事件處理
  onItemClick?: (item: T) => void;
  
  // 配置
  config: DailyPanelConfig<T>;
}

export const DailyPanel = <T extends { _id: string }>({
  items,
  loading,
  error,
  targetDate,
  searchTerm,
  onSearchChange,
  wildcardMode = false,
  onWildcardModeChange,
  onItemClick: _onItemClick,
  config
}: DailyPanelProps<T>) => {
  const {
    title,
    icon,
    iconColor = 'primary.main',
    loadingText,
    emptyText,
    searchPlaceholder,
    filterItemsForDate,
    getSearchableFields,
    calculateTotalAmount,
    renderItemSummary,
    renderItemDetails
  } = config;

  // 使用共用的過濾 Hook
  const { dailyItems, filteredItems } = useDailyFilter(
    items,
    targetDate,
    searchTerm,
    filterItemsForDate,
    getSearchableFields
  );

  // 使用共用的展開 Hook
  const { expandedItems, toggleExpanded, toggleAllExpanded, isAllExpanded } = useExpandableList(
    filteredItems,
    searchTerm
  );

  // 計算總金額
  const totalAmount = React.useMemo(() => {
    return calculateTotalAmount(dailyItems);
  }, [dailyItems, calculateTotalAmount]);

  // 搜尋變更處理
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onSearchChange(e.target.value);
  };

  // 載入狀態
  if (loading) {
    return (
      <Card sx={DAILY_PANEL_STYLES.loading.container}>
        <CardContent sx={DAILY_PANEL_STYLES.loading.content}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>{loadingText}</Typography>
        </CardContent>
      </Card>
    );
  }

  // 錯誤狀態
  if (error) {
    return (
      <Card sx={DAILY_PANEL_STYLES.loading.container}>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={DAILY_PANEL_STYLES.card.container}>
      {/* 固定頂部區域 */}
      <Box sx={DAILY_PANEL_STYLES.card.header}>
        <Box sx={{ display: 'flex', flexDirection: 'column', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {React.cloneElement(icon as React.ReactElement, {
                sx: { mr: 1, color: iconColor }
              })}
              <Typography variant="h6" component="h2" sx={DAILY_PANEL_STYLES.typography.title}>
                {title}
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              總計：${totalAmount.toFixed(0)}
            </Typography>
          </Box>
          <Typography variant="caption" color="textSecondary" sx={DAILY_PANEL_STYLES.typography.small}>
            {format(new Date(targetDate), 'yyyy年MM月dd日', { locale: zhTW })} - 僅顯示當天記錄
          </Typography>
        </Box>
        
        <Box sx={DAILY_PANEL_STYLES.searchControls.container}>
          <TextField
            fullWidth
            size="small"
            placeholder={wildcardMode ? `${searchPlaceholder} (支援 * 和 ?)` : searchPlaceholder}
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: wildcardMode ? (
                <InputAdornment position="end">
                  <Chip
                    label="萬用字元"
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={DAILY_PANEL_STYLES.chip.small}
                  />
                </InputAdornment>
              ) : undefined
            }}
          />
          
          {/* 萬用字元模式切換 */}
          {onWildcardModeChange && (
            <Tooltip title={wildcardMode ? "切換到一般搜尋" : "切換到萬用字元搜尋"}>
              <ToggleButton
                value="wildcard"
                selected={wildcardMode}
                onChange={() => onWildcardModeChange(!wildcardMode)}
                size="small"
                sx={DAILY_PANEL_STYLES.searchControls.toggleButton}
              >
                <FilterAltIcon fontSize="small" />
              </ToggleButton>
            </Tooltip>
          )}
          
          {/* 萬用字元搜尋說明按鈕 */}
          <WildcardSearchHelp />
          
          {/* 一鍵展開/收起按鈕 */}
          <IconButton
            size="small"
            onClick={toggleAllExpanded}
            disabled={filteredItems.length === 0}
            sx={DAILY_PANEL_STYLES.searchControls.expandButton}
            title={isAllExpanded ? '收起全部' : '展開全部'}
          >
            {isAllExpanded ? 
              <UnfoldLessIcon fontSize="small" /> : 
              <UnfoldMoreIcon fontSize="small" />
            }
          </IconButton>
        </Box>
      </Box>
      
      {/* 可滾動內容區域 */}
      <Box sx={DAILY_PANEL_STYLES.card.content}>
        {filteredItems.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="textSecondary">
              {searchTerm ? `沒有符合搜索條件的${emptyText}` : `今日無${emptyText}`}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {filteredItems.map((item, index) => {
              const isExpanded = expandedItems.has(item._id);
              const handleToggle = () => toggleExpanded(item._id);
              
              return (
                <React.Fragment key={item._id}>
                  <ListItem
                    sx={{
                      ...DAILY_PANEL_STYLES.listItem.container,
                      maxHeight: isExpanded ? 'none' : DAILY_PANEL_STYLES.spacing.expandedMinHeight
                    }}
                  >
                    {/* 摺疊狀態：僅顯示基本資訊 */}
                    <Box
                      sx={DAILY_PANEL_STYLES.listItem.summary}
                      onClick={handleToggle}
                    >
                      <Box sx={DAILY_PANEL_STYLES.listItem.content}>
                        {renderItemSummary(item, isExpanded, handleToggle)}
                      </Box>
                      
                      <IconButton
                        size="small"
                        sx={{
                          p: 0.25,
                          flexShrink: 0,
                          alignSelf: 'center'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle();
                        }}
                      >
                        {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                      </IconButton>
                    </Box>

                    {/* 展開狀態：顯示詳細資訊 */}
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box sx={DAILY_PANEL_STYLES.listItem.details}>
                        {renderItemDetails(item)}
                      </Box>
                    </Collapse>
                  </ListItem>
                  {index < filteredItems.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Box>
    </Card>
  );
};

export default DailyPanel;
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
import WildcardSearchHelp from '../WildcardSearchHelp';
import { useExpandableList } from './hooks/useExpandableList';
import { useDailyFilter } from './hooks/useDailyFilter';
import { DAILY_PANEL_STYLES } from './styles';

export interface DailyPanelConfig<T> {
  title: string;
  icon: React.ReactNode;
  iconColor?: string;
  loadingText: string;
  emptyText: string;
  searchPlaceholder: string;
  
  filterItemsForDate: (items: T[], targetDate: string) => T[];
  getSearchableFields: (item: T) => string[];
  calculateTotalAmount: (items: T[]) => number;
  
  renderItemSummary: (item: T, isExpanded: boolean, onToggle: () => void) => React.ReactNode;
  renderItemDetails: (item: T) => React.ReactNode;
}

export interface DailyPanelProps<T extends { _id: string }> {
  items: T[];
  loading: boolean;
  error: string | null;
  targetDate: string;
  
  searchTerm: string;
  onSearchChange: (value: string) => void;
  wildcardMode?: boolean;
  onWildcardModeChange?: (enabled: boolean) => void;
  
  onItemClick?: (item: T) => void;
  
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

  const { dailyItems, filteredItems } = useDailyFilter(
    items,
    targetDate,
    searchTerm,
    filterItemsForDate,
    getSearchableFields
  );

  const { expandedItems, toggleExpanded, toggleAllExpanded, isAllExpanded } = useExpandableList(
    filteredItems,
    searchTerm
  );

  const totalAmount = React.useMemo(() => {
    return calculateTotalAmount(dailyItems);
  }, [dailyItems, calculateTotalAmount]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onSearchChange(e.target.value);
  };

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
              總金額 {totalAmount.toFixed(0)}
            </Typography>
          </Box>
          <Typography variant="caption" color="textSecondary" sx={DAILY_PANEL_STYLES.typography.small}>
            {format(new Date(targetDate), 'yyyy年MM月dd日', { locale: zhTW })} - 僅顯示當日資料
          </Typography>
        </Box>
        
        <Box sx={DAILY_PANEL_STYLES.searchControls.container}>
          <TextField
            fullWidth
            size="small"
            placeholder={wildcardMode ? `${searchPlaceholder} (支援 * 萬用)` : searchPlaceholder}
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
          
          {onWildcardModeChange && (
            <Tooltip title={wildcardMode ? '停用萬用字元' : '啟用萬用字元'}>
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
          
          <WildcardSearchHelp />
          
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
      
      <Box sx={DAILY_PANEL_STYLES.card.content}>
        {filteredItems.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="textSecondary">
              {searchTerm ? `沒有符合搜尋條件的${emptyText}` : `今日無${emptyText}`}
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


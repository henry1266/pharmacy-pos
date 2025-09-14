/**
 * 共用常數 - Daily Panel 組件
 */

export const DAILY_PANEL_STYLES = {
  // 字體樣式
  typography: {
    small: { fontSize: '0.75rem', lineHeight: 1.2 },
    medium: { fontSize: '0.8rem', lineHeight: 1.2 },
    large: { fontSize: '0.9rem', lineHeight: 1.2 },
    title: { fontSize: '1.1rem' },
    ellipsis: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const
    }
  },

  // Chip 樣式
  chip: {
    small: { fontSize: '0.7rem', height: 20 },
    medium: { fontSize: '0.7rem', height: 18 }
  },

  // 版面配置
  spacing: {
    itemPadding: { py: 0.25, px: 1.5 },
    minHeight: '44px',
    expandedMinHeight: '48px'
  },

  // Card 容器樣式
  card: {
    container: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      maxHeight: '100%',
      overflow: 'hidden'
    },
    header: {
      flexShrink: 0,
      borderBottom: '1px solid',
      borderColor: 'divider',
      p: 2
    },
    content: {
      flexGrow: 1,
      overflow: 'auto',
      minHeight: 0
    }
  },

  // 載入狀態樣式
  loading: {
    container: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const
    },
    content: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexGrow: 1
    }
  },

  // 列表項樣式
  listItem: {
    container: {
      py: 0.25,
      px: 1.5,
      flexDirection: 'column' as const,
      alignItems: 'stretch' as const,
      minHeight: '48px',
      '&:hover': {
        backgroundColor: 'action.hover'
      }
    },
    summary: {
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      cursor: 'pointer',
      minHeight: '44px',
      py: 0.25,
      gap: 0.5
    },
    content: {
      flex: 1,
      minWidth: 0,
      overflow: 'hidden',
      pr: 0.75
    },
    details: {
      mt: 1,
      pt: 1,
      borderTop: '1px solid',
      borderColor: 'divider'
    }
  },

  // 搜尋控制樣式
  searchControls: {
    container: {
      display: 'flex',
      gap: 1,
      alignItems: 'center'
    },
    toggleButton: {
      flexShrink: 0,
      px: 1,
      minWidth: 'auto',
      '&:hover': {},
      '&.Mui-selected': {
        backgroundColor: 'primary.main',
        color: 'primary.contrastText',
        '&:hover': {
          backgroundColor: 'primary.dark'
        }
      }
    },
    expandButton: {
      flexShrink: 0,
      color: 'text.secondary',
      '&:hover': {
        color: 'primary.main'
      }
    }
  }
} as const;


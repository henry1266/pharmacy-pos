import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Breadcrumbs,
  Link,
  Typography,
  Paper,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// 定義麵包屑項目的類型
export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

// 定義組件的屬性類型
interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  fontSize?: string;
  backgroundColor?: string;
  showShadow?: boolean;
  padding?: string | number;
}

// 創建樣式化的麵包屑容器
const StyledBreadcrumbContainer = styled(Paper, {
  shouldForwardProp: (prop) => 
    prop !== 'showShadow' && prop !== 'backgroundColor' && prop !== 'padding',
})<{ 
  showShadow?: boolean; 
  backgroundColor?: string | undefined;
  padding?: string | number | undefined;
}>(({ theme, showShadow, backgroundColor, padding }) => ({
  padding: padding || theme.spacing(1.5, 2),
  marginBottom: theme.spacing(2),
  backgroundColor: backgroundColor || theme.palette.background.paper,
  boxShadow: showShadow ? theme.shadows[1] : 'none',
  borderRadius: theme.shape.borderRadius,
  display: 'inline-block',
}));

/**
 * 美化的麵包屑導航組件
 * 
 * 可配置項目：
 * - items: 麵包屑項目數組
 * - fontSize: 字體大小
 * - backgroundColor: 背景顏色
 * - showShadow: 是否顯示陰影
 * - padding: 內邊距
 */
export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  items,
  fontSize = '1.2rem',
  backgroundColor,
  showShadow = true,
  padding,
}) => {
  const navigate = useNavigate();

  return (
    <StyledBreadcrumbContainer 
      showShadow={showShadow} 
      backgroundColor={backgroundColor}
      padding={padding}
    >
      <Breadcrumbs aria-label="breadcrumb" separator="›">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          // 處理點擊事件
          const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault();
            if (item.onClick) {
              item.onClick(e);
            } else if (item.path) {
              navigate(item.path);
            }
          };

          return isLast ? (
            // 最後一個項目顯示為文字
            <Typography
              key={`breadcrumb-${index}`}
              color="text.primary"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.8,
                fontSize,
                fontWeight: 500,
              }}
            >
              {item.icon}
              {item.label}
            </Typography>
          ) : (
            // 其他項目顯示為鏈接
            <Link
              key={`breadcrumb-${index}`}
              color="inherit"
              href={item.path || '#'}
              onClick={handleClick}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.8,
                fontSize,
                fontWeight: 500,
                '&:hover': {
                  textDecoration: 'none',
                  color: 'primary.main',
                },
              }}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </Breadcrumbs>
    </StyledBreadcrumbContainer>
  );
};

export default BreadcrumbNavigation;
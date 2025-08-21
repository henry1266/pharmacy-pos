/**
 * @file 詳情圖標渲染器組件
 * @description 根據圖標類型渲染相應的圖標
 */

import React, { FC } from 'react';
import {
  ReceiptLong as ReceiptLongIcon,
  Percent as PercentIcon,
  MonetizationOn as MonetizationOnIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { DetailIconType } from '../../types/detail';

interface DetailIconRendererProps {
  iconType: DetailIconType;
  iconColor?: string;
}

/**
 * 詳情圖標渲染器組件
 * 根據圖標類型渲染相應的圖標
 */
const DetailIconRenderer: FC<DetailIconRendererProps> = ({ iconType, iconColor = 'action' }) => {
  switch (iconType) {
    case 'ReceiptLong':
      return <ReceiptLongIcon color={iconColor as any} fontSize="small" />;
    case 'Percent':
      return <PercentIcon color={iconColor as any} fontSize="small" />;
    case 'MonetizationOn':
      return <MonetizationOnIcon color={iconColor as any} fontSize="small" />;
    case 'TrendingUp':
      return <TrendingUpIcon color={iconColor as any} fontSize="small" />;
    default:
      return null;
  }
};

export default DetailIconRenderer;
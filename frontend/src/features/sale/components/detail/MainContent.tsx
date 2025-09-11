/**
 * @file 銷售詳情主要內容組件
 * @description 顯示銷售詳情頁面中的主要內容區域
 */

import React, { FC } from 'react';
import {
  Stack,
  Card,
  CardContent,
  Typography,
  Divider,
  IconButton
} from '@mui/material';
import {
  AccountBalanceWallet as AccountBalanceWalletIcon,
  ListAlt as ListAltIcon,
  ReceiptLong as ReceiptLongIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import CollapsibleAmountInfo from '@/components/common/CollapsibleAmountInfo';
import SalesItemsTable from './SalesItemsTable';
import DetailIconRenderer from './DetailIconRenderer';
import CustomContentRenderer from './CustomContentRenderer';
import { MainContentProps, CollapsibleDetail, CustomContentType } from '../../types/detail';
import { getCollapsibleDetails } from '../../utils/fifoUtils';

// 從 CollapsibleAmountInfo 組件導入 DetailItem 類型
interface DetailItem {
  label: string;
  value: string | number;
  icon?: React.ReactElement;
  color?: string;
  fontWeight?: string;
  condition?: boolean | (() => boolean);
  valueFormatter?: (val: any) => string;
  customContent?: React.ReactNode;
}

/**
 * 處理 collapsibleDetails，將 iconType 和 CustomContentType 轉換為 ReactElement 和 React.ReactNode
 *
 * @param details - 原始的 collapsibleDetails
 * @returns 處理後的 collapsibleDetails，符合 DetailItem 接口
 */
const processCollapsibleDetails = (details: CollapsibleDetail[]): DetailItem[] => {
  return details.map(detail => {
    // 創建一個基本的 DetailItem 對象，不包含可選屬性
    const processedDetail: DetailItem = {
      label: detail.label,
      value: detail.value,
      condition: detail.condition
    };
    
    // 只有在有值時才添加可選屬性
    if (detail.color) {
      processedDetail.color = detail.color;
    }
    
    if (detail.fontWeight) {
      processedDetail.fontWeight = detail.fontWeight;
    }
    
    if (detail.valueFormatter) {
      processedDetail.valueFormatter = detail.valueFormatter;
    }
    
    // 處理 icon
    if (detail.icon) {
      processedDetail.icon = detail.icon;
    } else if (detail.iconType) {
      processedDetail.icon = detail.iconColor
        ? <DetailIconRenderer iconType={detail.iconType} iconColor={detail.iconColor} />
        : <DetailIconRenderer iconType={detail.iconType} />;
    }
    
    // 處理 customContent
    if (detail.customContent) {
      if (typeof detail.customContent === 'object' && 'type' in detail.customContent) {
        processedDetail.customContent = <CustomContentRenderer content={detail.customContent as CustomContentType} />;
      } else {
        processedDetail.customContent = detail.customContent as React.ReactNode;
      }
    }
    
    return processedDetail;
  });
};

/**
 * 銷售詳情主要內容組件
 * 顯示銷售詳情頁面中的主要內容區域，包括金額信息和銷售項目表格
 */
const MainContent: FC<MainContentProps> = ({
  sale,
  fifoLoading,
  fifoError,
  fifoData,
  showSalesProfitColumns,
  handleToggleSalesProfitColumns
}) => (
  <Stack spacing={3}>
    {sale && (
      <CollapsibleAmountInfo
        title="金額信息"
        titleIcon={<AccountBalanceWalletIcon />}
        mainAmountLabel="總金額"
        mainAmountValue={sale.totalAmount ?? 0}
        mainAmountIcon={<ReceiptLongIcon />}
        collapsibleDetails={processCollapsibleDetails(getCollapsibleDetails(sale, fifoLoading, fifoError, fifoData))}
        initialOpenState={true}
        isLoading={false}
      />
    )}

    {sale?.items && (
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <ListAltIcon sx={{ verticalAlign: 'middle', mr: 1 }}/>銷售項目
            </Typography>
            {!fifoLoading && fifoData?.items && (
              <IconButton 
                onClick={handleToggleSalesProfitColumns} 
                size="small" 
                aria-label={showSalesProfitColumns ? "隱藏毛利欄位" : "顯示毛利欄位"}
                title={showSalesProfitColumns ? "隱藏毛利欄位" : "顯示毛利欄位"}
              >
                {showSalesProfitColumns ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            )}
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <SalesItemsTable
            sale={sale}
            fifoLoading={fifoLoading}
            fifoData={fifoData}
            showSalesProfitColumns={showSalesProfitColumns}
          />
        </CardContent>
      </Card>
    )}
  </Stack>
);

export default MainContent;
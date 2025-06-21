import React, { FC } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid
} from '@mui/material';
import { Theme } from '@mui/material/styles';
import { SxProps } from '@mui/system';
import {
  TrendingUp,
  Inventory,
  BarChart
} from '@mui/icons-material';
import {
  InventoryFilterValues
} from './shared/types';
import {
  formatCurrency,
  getProfitLossColor
} from './shared/utils';
import {
  CARD_STYLES,
  CONNECTOR_STYLES
} from './shared/constants';
import { CustomTooltip } from './shared/components';
import {
  useInventorySummaryData,
  useTooltip
} from './shared/hooks';

// 定義 InventorySummary 的 props 型別
interface InventorySummaryProps {
  filters?: InventoryFilterValues;
}

const InventorySummary: FC<InventorySummaryProps> = ({ filters }) => {
  // 使用共用 Hooks
  const {
    totalProfitLoss,
    totalInventoryValue,
    totalGrossProfit,
    totalIncome,
    totalCost
  } = useInventorySummaryData(filters);
  
  const {
    showTooltip,
    tooltipPosition,
    handleMouseEnter,
    handleMouseLeave
  } = useTooltip();

  return (
    <Box>
      <Grid container spacing={2} alignItems="center">
      {/* 總毛利 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              ...CARD_STYLES,
              position: 'relative',
              cursor: 'pointer'
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <CardContent sx={{ 
              display: 'flex', 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'flex-start',
              textAlign: 'left',
              flexGrow: 1,
              padding: 3
            }}>
              <TrendingUp 
                sx={{ 
                  fontSize: 40, 
                  color: getProfitLossColor(totalGrossProfit),
                  mr: 2
                }} 
              />
              <Box>
                <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                  總毛利
                </Typography>
                <Typography 
                  variant="h5" 
                  component="div" 
                  fontWeight="600" 
                  color={getProfitLossColor(totalGrossProfit)}
                >
                  {formatCurrency(totalGrossProfit)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      {/* 插入 "—" 符號 */}
        <Grid item xs={12} sm={6} md={1} sx={CONNECTOR_STYLES as SxProps<Theme>}>
          <Typography variant="h4" fontWeight="700" color="text.secondary">
            —
          </Typography>
        </Grid>

        {/* 總庫存價值 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ ...CARD_STYLES }}>
            <CardContent sx={{ 
              display: 'flex', 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'flex-start',
              textAlign: 'left',
              flexGrow: 1,
              padding: 3
            }}>
              <Inventory 
                sx={{ 
                  fontSize: 40, 
                  color: 'info.main',
                  mr: 2
                }} 
              />
              <Box>
                <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                  總庫存價值
                </Typography>
                <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                  {formatCurrency(totalInventoryValue)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
          {/* 插入 "=" 符號 */}
        <Grid item xs={12} sm={6} md={1} sx={CONNECTOR_STYLES as SxProps<Theme>}>
          <Typography variant="h4" fontWeight="700" color="text.secondary">
            =
          </Typography>
        </Grid>
        {/* 損益總和 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ ...CARD_STYLES }}>
            <CardContent sx={{ 
              display: 'flex', 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'flex-start',
              textAlign: 'left',
              flexGrow: 1,
              padding: 3
            }}>
              <BarChart 
                sx={{ 
                  fontSize: 40, 
                  color: getProfitLossColor(totalProfitLoss),
                  mr: 2
                }} 
              />
              <Box>
                <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                  損益總和
                </Typography>
                <Typography 
                  variant="h5" 
                  component="div" 
                  fontWeight="600" 
                  color={getProfitLossColor(totalProfitLoss)}
                >
                  {formatCurrency(totalProfitLoss)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* 自定義懸浮視窗 */}
      <CustomTooltip 
        show={showTooltip}
        position={tooltipPosition}
        totalIncome={totalIncome}
        totalCost={totalCost}
        formatCurrency={formatCurrency}
      />
    </Box>
  );
};

// PropTypes 驗證
InventorySummary.propTypes = {
  filters: PropTypes.shape({
    supplier: PropTypes.string,
    category: PropTypes.string,
    productCode: PropTypes.string,
    productName: PropTypes.string,
    productType: PropTypes.string
  })
};

// 設定默認值
InventorySummary.defaultProps = {
  filters: {}
};

export default InventorySummary;
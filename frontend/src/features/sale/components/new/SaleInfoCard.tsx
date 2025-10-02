import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  TextField,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  CardHeader,
  SelectChangeEvent,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Customer } from '@pharmacy-pos/shared/types/entities';

interface SaleData {
  saleNumber: string;
  customer: string;
  paymentMethod: string;
  discount: string | number;
  notes: string;
}

interface SaleInfoCardProps {
  saleData: SaleData;
  customers: Customer[];
  isMobile?: boolean;
  expanded: boolean;
  onExpandToggle: () => void;
  onInputChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => void;
}

const SaleInfoCard: React.FC<SaleInfoCardProps> = ({
  saleData,
  customers,
  expanded,
  onExpandToggle,
  onInputChange
}) => {
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "lg"));
  const noteRows = isTablet ? 1 : 2; // 平板使用1行，其他使用2行

  return (
    <Card sx={{
      maxWidth: {
        xs: '100%',
        sm: '100%',      // 平板全寬
        md: '100%',      // 平板橫向全寬
        lg: 250,
        xl: 270
      },
      minWidth: {
        xs: '100%',
        sm: '100%',      // 平板全寬
        md: '100%',      // 平板橫向全寬
        lg: 200,
        xl: 220
      },
      boxShadow: {
        xs: 2,
        sm: 1,           // 平板：減少陰影
        md: 1,           // 平板橫向：減少陰影
        lg: 2            // 桌面：保持原有
      },
      // 平板專用的緊湊樣式
      ...(isTablet && {
        '& .MuiCardHeader-root': {
          pb: 0.5,       // 減少標題下方間距
        },
        '& .MuiCardContent-root': {
          pt: 0.5,       // 減少內容上方間距
          pb: 1,         // 減少內容下方間距
        }
      })
    }}>
      <CardHeader
        title="基本資訊"
        titleTypographyProps={{
          variant: 'h6',
          fontSize: {
            xs: '1rem',      // 小手機
            sm: '1.1rem',    // 平板
            md: '1.15rem',   // 平板橫向
            lg: '1.1rem'     // 桌面
          },
          fontWeight: 600
        }}
        action={
          <IconButton
            onClick={onExpandToggle}
            aria-expanded={expanded}
            aria-label="顯示/隱藏基本資訊"
            size="small"
          >
            <ExpandMoreIcon sx={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
          </IconButton>
        }
        sx={{
          pb: expanded ? 1 : 2,
          px: {
            xs: 0,           // 小手機
            sm: 1.5,         // 平板：減少內距
            md: 2,           // 平板橫向：減少內距
            lg: 2.5          // 桌面
          },
          pt: {
            xs: 0,           // 小手機
            sm: 1.5,         // 平板：減少內距
            md: 2,           // 平板橫向：減少內距
            lg: 2.5          // 桌面
          }
        }}
      />
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent sx={{
          pt: 0,
          px: {
            xs: 0,           // 小手機
            sm: 1.5,         // 平板：減少內距
            md: 2,           // 平板橫向：減少內距
            lg: 2.5          // 桌面
          },
          pb: {
            xs: 0,           // 小手機
            sm: 1.5,         // 平板：減少內距
            md: 2,           // 平板橫向：減少內距
            lg: 2.5          // 桌面
          }
        }}>
          <Grid container spacing={{
            xs: 1,         // 小手機
            sm: 1,           // 平板：減少間距
            md: 1.5,         // 平板橫向：減少間距
            lg: 2            // 桌面
          }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="銷貨單號"
                name="saleNumber"
                value={saleData.saleNumber}
                onChange={onInputChange}
                placeholder="選填，自動生成"
                helperText="格式: YYYYMMDDXXX"
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>客戶</InputLabel>
                <Select
                  name="customer"
                  value={saleData.customer}
                  onChange={onInputChange}
                  label="客戶"
                >
                  <MenuItem value=""><em>一般客戶</em></MenuItem>
                  {customers.map((customer) => (
                    <MenuItem key={customer._id} value={customer._id}>{customer.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>付款方式</InputLabel>
                <Select
                  name="paymentMethod"
                  value={saleData.paymentMethod}
                  onChange={onInputChange}
                  label="付款方式"
                >
                  <MenuItem value="cash">現金</MenuItem>
                  <MenuItem value="credit_card">信用卡</MenuItem>
                  <MenuItem value="debit_card">金融卡</MenuItem>
                  <MenuItem value="mobile_payment">行動支付</MenuItem>
                  {/* Add other payment methods as needed */}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="折扣金額"
                name="discount"
                type="number"
                value={saleData.discount}
                onChange={onInputChange}
                size="small"
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="備註"
                name="notes"
                value={saleData.notes}
                onChange={onInputChange}
                size="small"
                multiline
                rows={noteRows}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default SaleInfoCard;
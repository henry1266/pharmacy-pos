import React from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  CircularProgress,
  Divider
} from '@mui/material';

/**
 * 通用預覽組件
 * @param {Object} props - 組件屬性
 * @param {Object} props.data - 預覽數據
 * @param {boolean} props.loading - 是否正在加載
 * @param {string} props.error - 錯誤信息
 * @param {string} props.title - 預覽標題
 * @param {Array} props.columns - 表格列配置
 * @param {string} props.itemsKey - 數據項目的鍵名
 * @param {function} props.renderItem - 自定義項目渲染函數
 * @param {function} props.getTotal - 計算總計的函數
 * @param {string} props.emptyText - 無數據時顯示的文本
 * @param {string} props.variant - 預覽樣式變體 ('table' 或 'list')
 * @param {Object} props.containerProps - 容器組件的額外屬性
 * @returns {React.ReactElement} 通用預覽組件
 */
const ItemPreview = ({ 
  data, 
  loading, 
  error, 
  title = '預覽詳情',
  columns = [],
  itemsKey = 'items',
  renderItem,
  getTotal,
  emptyText = '沒有項目',
  variant = 'table',
  containerProps = {},
  maxItems = 5,
  notes,
  notesKey = 'notes'
}) => {
  // 處理加載狀態
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }
  
  // 處理錯誤狀態
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error" variant="body2">
          {error || '載入數據時發生錯誤'}
        </Typography>
      </Box>
    );
  }
  
  // 處理無數據狀態
  if (!data) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2">
          找不到數據
        </Typography>
      </Box>
    );
  }

  // 獲取項目數據
  const items = data[itemsKey] || [];
  
  // 獲取備註
  const noteContent = notes || (notesKey && data[notesKey]);
  
  // 計算總計
  const total = getTotal ? getTotal(data) : 
    (data.totalAmount || 
    (items.length > 0 && items.reduce((sum, item) => sum + Number(item.dtotalCost || 0), 0)));

  // 容器默認樣式
  const defaultContainerProps = {
    sx: { 
      width: 550, 
      maxHeight: 600, 
      overflow: 'auto',
      ...containerProps?.sx 
    }
  };
  
  // 表格變體
  const renderTableVariant = () => (
    <Card {...defaultContainerProps}>
      <CardContent sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>

        <TableContainer component={Paper} variant="outlined" sx={{ mb: 1 }}>
          <Table size="small">
            {columns.length > 0 && (
              <TableHead>
                <TableRow>
                  {columns.map((column, index) => (
                    <TableCell key={index} align={column.align || 'left'}>
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
            )}
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">{emptyText}</TableCell>
                </TableRow>
              ) : (
                <>
                  {items.slice(0, maxItems).map((item, index) => (
                    renderItem ? renderItem(item, index) : (
                      <TableRow key={index}>
                        {columns.map((column, colIndex) => (
                          <TableCell key={colIndex} align={column.align || 'left'}>
                            {column.render ? column.render(item) : item[column.key]}
                          </TableCell>
                        ))}
                      </TableRow>
                    )
                  ))}
                  {items.length > maxItems && (
                    <TableRow>
                      <TableCell colSpan={columns.length} align="center">
                        <Typography variant="body2" color="text.secondary">
                          還有 {items.length - maxItems} 個項目...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
              {total !== undefined && (
                <TableRow>
                  <TableCell colSpan={columns.length - 1} align="right">
                    <Typography variant="subtitle2" fontWeight="bold">
                      總計:
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" fontWeight="bold">
                      {typeof total === 'number' ? total.toLocaleString() : total}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {noteContent && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" gutterBottom>
              備註
            </Typography>
            <Typography variant="body2">
              {noteContent}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
  
  // 列表變體
  const renderListVariant = () => (
    <Paper {...defaultContainerProps}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        
        <Divider sx={{ my: 1 }} />
        
        <Typography variant="subtitle2" gutterBottom>
          項目
        </Typography>
        
        {items.length === 0 ? (
          <Typography variant="body2" color="textSecondary">
            {emptyText}
          </Typography>
        ) : (
          <>
            {items.slice(0, maxItems).map((item, index) => (
              renderItem ? renderItem(item, index) : (
                <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="body2">
                    {item.dname || item.name} ({item.did || item.id})
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="textSecondary">
                      數量: {item.dquantity || item.quantity}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      金額: {(item.dtotalCost || item.totalCost || 0).toLocaleString()} 元
                    </Typography>
                  </Box>
                </Box>
              )
            ))}
            {items.length > maxItems && (
              <Typography variant="body2" color="text.secondary" align="center">
                還有 {items.length - maxItems} 個項目...
              </Typography>
            )}
          </>
        )}
        
        {total !== undefined && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
            <Typography variant="subtitle2">總計:</Typography>
            <Typography variant="subtitle2">
              {typeof total === 'number' ? total.toLocaleString() : total} 元
            </Typography>
          </Box>
        )}
        
        {noteContent && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" gutterBottom>
              備註
            </Typography>
            <Typography variant="body2">
              {noteContent}
            </Typography>
          </>
        )}
      </Box>
    </Paper>
  );
  
  // 根據變體類型渲染不同的UI
  return variant === 'table' ? renderTableVariant() : renderListVariant();
};

ItemPreview.propTypes = {
  data: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string,
  title: PropTypes.string,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      label: PropTypes.string,
      align: PropTypes.string,
      render: PropTypes.func
    })
  ),
  itemsKey: PropTypes.string,
  renderItem: PropTypes.func,
  getTotal: PropTypes.func,
  emptyText: PropTypes.string,
  variant: PropTypes.oneOf(['table', 'list']),
  containerProps: PropTypes.object,
  maxItems: PropTypes.number,
  notes: PropTypes.string,
  notesKey: PropTypes.string
};

export default ItemPreview;

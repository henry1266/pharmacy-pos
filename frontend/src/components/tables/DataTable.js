import React, { useEffect, useState, useRef } from 'react';
import { DataGrid, GridColumnMenu, useGridApiContext } from '@mui/x-data-grid';
import { Paper, Box, Typography, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import PropTypes from 'prop-types';

// 自定義列菜單組件 - 移出父組件
const CustomColumnMenu = (props) => {
  const { hideMenu, colDef } = props;
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState(colDef?.width || 100);
  const apiRef = useGridApiContext();

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSave = () => {
    // 使用可選鏈運算符替代條件判斷
    apiRef?.current?.setColumnWidth(colDef?.field, width);
    console.log(`Setting column ${colDef?.field} width to ${width}px`);
    setOpen(false);
    hideMenu();
  };

  return (
    <>
      <GridColumnMenu
        {...props}
        slots={{
          // 添加自定義菜單項
          columnMenuUserItem: () => (
            <Button
              onClick={handleOpen}
              sx={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left', pl: 2 }}
            >
              設置列寬
            </Button>
          ),
        }}
        slotProps={{
          columnMenuUserItem: {
            displayOrder: 0, // 顯示在最上方
          },
        }}
      />
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>設置列寬</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="列寬 (像素)"
            type="number"
            fullWidth
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            inputProps={{ min: 50 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>取消</Button>
          <Button onClick={handleSave}>確定</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// 為 CustomColumnMenu 添加 PropTypes 驗證
CustomColumnMenu.propTypes = {
  hideMenu: PropTypes.func.isRequired,
  colDef: PropTypes.shape({
    field: PropTypes.string.isRequired,
    width: PropTypes.number
  }).isRequired
};

/**
 * 自定義數據表格組件
 * @param {Object} props - 組件屬性
 * @param {Array} props.columns - 表格列配置
 * @param {Array} props.rows - 表格數據行
 * @param {string} props.title - 表格標題
 * @param {boolean} props.loading - 是否正在加載數據
 * @param {number} props.pageSize - 每頁顯示行數
 * @param {boolean} props.checkboxSelection - 是否顯示選擇框
 * @returns {React.ReactElement} 數據表格組件
 */
const DataTable = ({
  columns,
  rows,
  title,
  loading = false,
  pageSize = 50,
  checkboxSelection = false,
  onRowClick,
  ...rest
}) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const gridRef = useRef(null);

  // 處理鍵盤事件
  const handleKeyDown = (event) => {
    if (!rows || rows.length === 0) return;
    
    // 只處理上下鍵
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      
      // 移除無用的變數賦值
      let updatedIndex = selectedIndex;
      
      if (event.key === 'ArrowUp') {
        // 上鍵：選擇上一行，如果已經是第一行則不變
        updatedIndex = Math.max(0, selectedIndex - 1);
      } else {
        // 下鍵：選擇下一行，如果已經是最後一行則不變
        updatedIndex = Math.min(rows.length - 1, selectedIndex + 1);
      }
      
      // 如果索引變化了，觸發行點擊事件
      if (updatedIndex !== selectedIndex) {
        setSelectedIndex(updatedIndex);
        if (onRowClick && rows[updatedIndex]) {
          onRowClick({ row: rows[updatedIndex] });
        }
      }
    }
  };

  // 處理行點擊，更新選中索引
  const handleRowClickInternal = (params) => {
    const index = rows.findIndex(row => row.id === params.row.id);
    setSelectedIndex(index);
    if (onRowClick) {
      onRowClick(params);
    }
  };

  // 添加和移除鍵盤事件監聽
  useEffect(() => {
    const gridElement = gridRef.current;
    if (gridElement) {
      gridElement.addEventListener('keydown', handleKeyDown);
      
      return () => {
        gridElement.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [rows, selectedIndex]);

  // 確保所有列都可調整大小
  const columnsWithResizing = columns.map(column => ({
    ...column,
    resizable: true, // 啟用列寬調整
    minWidth: 50, // 設置最小寬度
  }));

  // 設置所有列都固定在左側，實現表頭凍結效果
  const pinnedColumns = {
    left: columnsWithResizing.map(col => col.field)
  };

  return (
    <Paper elevation={2} sx={{ width: '100%', overflow: 'hidden' }}>
      {title && (
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
      )}
      <Box sx={{ width: '100%', height: 600 }} ref={gridRef} tabIndex="0">
        <DataGrid
          rows={rows}
          columns={columnsWithResizing}
          loading={loading}
          pageSize={pageSize}
          rowsPerPageOptions={[5, 10, 25, 50]}
          checkboxSelection={checkboxSelection}
          disableSelectionOnClick
          onRowClick={handleRowClickInternal}
          slots={{
            columnMenu: CustomColumnMenu, // 使用自定義列菜單
          }}
          initialState={{
            pinnedColumns: pinnedColumns, // 固定所有列，實現表頭凍結
            pagination: {
              pageSize: 50, // 設置初始頁面大小為50
            },
          }}
          sx={{
            height: '100%',
            width: '100%',
            '& .MuiDataGrid-main': { overflow: 'hidden' },
            '& .MuiDataGrid-virtualScroller': { overflow: 'auto' },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'background.paper',
              borderBottom: '1px solid',
              borderColor: 'divider',
              position: 'sticky',
              top: 0,
              zIndex: 1,
            }
          }}
          {...rest}
        />
      </Box>
    </Paper>
  );
};

// 為 DataTable 添加 PropTypes 驗證
DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      field: PropTypes.string.isRequired,
      headerName: PropTypes.string,
      width: PropTypes.number
    })
  ).isRequired,
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
    })
  ).isRequired,
  title: PropTypes.string,
  loading: PropTypes.bool,
  pageSize: PropTypes.number,
  checkboxSelection: PropTypes.bool,
  onRowClick: PropTypes.func
};

export default DataTable;

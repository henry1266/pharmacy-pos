import React, { useState } from 'react';
import { Grid, Box, IconButton, Tooltip } from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import PageContainer from '../../components/common/PageContainer';
import SearchInput from '../../components/common/SearchInput';
import ActionButton from '../../components/common/ActionButton';
import DataTable from '../../components/tables/DataTable';

// 模擬資料
const mockInventory = [
  { 
    id: '1', 
    productId: '1',
    productName: '阿斯匹靈', 
    batchNumber: 'ASP20230501',
    quantity: 500,
    location: 'A-12-3',
    expiryDate: '2025-12-31',
    purchaseDate: '2023-05-01',
    purchasePrice: 80,
    sellingPrice: 120,
    status: 'active'
  },
  { 
    id: '2', 
    productId: '2',
    productName: '普拿疼', 
    batchNumber: 'TYL20230315',
    quantity: 350,
    location: 'A-10-5',
    expiryDate: '2025-10-15',
    purchaseDate: '2023-03-15',
    purchasePrice: 50,
    sellingPrice: 80,
    status: 'active'
  },
  { 
    id: '3', 
    productId: '3',
    productName: '胃腸藥', 
    batchNumber: 'STM20230620',
    quantity: 200,
    location: 'B-05-2',
    expiryDate: '2026-03-20',
    purchaseDate: '2023-06-20',
    purchasePrice: 100,
    sellingPrice: 150,
    status: 'active'
  },
  { 
    id: '4', 
    productId: '4',
    productName: '感冒糖漿', 
    batchNumber: 'CLD20230410',
    quantity: 150,
    location: 'C-08-1',
    expiryDate: '2025-08-10',
    purchaseDate: '2023-04-10',
    purchasePrice: 120,
    sellingPrice: 180,
    status: 'active'
  },
  { 
    id: '5', 
    productId: '5',
    productName: '維他命C', 
    batchNumber: 'VTC20230725',
    quantity: 300,
    location: 'D-02-4',
    expiryDate: '2026-05-25',
    purchaseDate: '2023-07-25',
    purchasePrice: 180,
    sellingPrice: 250,
    status: 'active'
  }
];

const InventoryList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  // 表格列定義
  const columns = [
    { field: 'productName', headerName: '藥品名稱', minWidth: 150 },
    { field: 'batchNumber', headerName: '批次號碼', minWidth: 120 },
    { 
      field: 'quantity', 
      headerName: '庫存數量', 
      minWidth: 100,
      align: 'right'
    },
    { field: 'location', headerName: '儲存位置', minWidth: 100 },
    { field: 'expiryDate', headerName: '有效期限', minWidth: 120 },
    { 
      field: 'purchasePrice', 
      headerName: '進貨價', 
      minWidth: 100,
      align: 'right',
      render: (value) => `$${value}`
    },
    { 
      field: 'sellingPrice', 
      headerName: '售價', 
      minWidth: 100,
      align: 'right',
      render: (value) => `$${value}`
    },
    {
      field: 'status',
      headerName: '狀態',
      minWidth: 100,
      render: (value) => value === 'active' ? '正常' : '停用'
    },
    {
      field: 'actions',
      headerName: '操作',
      minWidth: 150,
      align: 'center',
      render: (_, row) => (
        <Box>
          <Tooltip title="查看詳情">
            <IconButton size="small" onClick={() => handleView(row.id)}>
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="編輯">
            <IconButton size="small" onClick={() => handleEdit(row.id)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="刪除">
            <IconButton size="small" onClick={() => handleDelete(row.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  // 處理搜索
  const handleSearch = (value) => {
    setSearchTerm(value);
    setPage(0);
  };

  // 處理頁碼變化
  const handlePageChange = (_, newPage) => {
    setPage(newPage);
  };

  // 處理每頁行數變化
  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 處理全選
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelected(mockInventory.map(item => item.id));
    } else {
      setSelected([]);
    }
  };

  // 處理選擇行
  const handleSelectRow = (id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = [...selected, id];
    } else {
      newSelected = selected.filter(item => item !== id);
    }

    setSelected(newSelected);
  };

  // 處理查看詳情
  const handleView = (id) => {
    navigate(`/inventory/${id}`);
  };

  // 處理編輯
  const handleEdit = (id) => {
    navigate(`/inventory/${id}/edit`);
  };

  // 處理刪除
  const handleDelete = (id) => {
    // 實際應用中應該顯示確認對話框
    console.log(`刪除庫存項目 ID: ${id}`);
  };

  // 處理新增
  const handleAdd = () => {
    navigate('/inventory/new');
  };

  // 過濾資料
  const filteredData = mockInventory.filter(item => 
    item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageContainer
      title="庫存管理"
      subtitle="管理所有藥品庫存"
      action={
        <ActionButton
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          新增庫存
        </ActionButton>
      }
    >
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <SearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={handleSearch}
            placeholder="搜索藥品名稱、批次號碼或儲存位置..."
          />
        </Grid>
      </Grid>

      <DataTable
        columns={columns}
        data={filteredData}
        loading={loading}
        selectable={true}
        selected={selected}
        onSelectAll={handleSelectAll}
        onSelectRow={handleSelectRow}
        pagination={true}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={filteredData.length}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </PageContainer>
  );
};

export default InventoryList;

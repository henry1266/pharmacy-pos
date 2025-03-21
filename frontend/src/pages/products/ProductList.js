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
const mockProducts = [
  { 
    id: '1', 
    name: '阿斯匹靈', 
    category: '止痛藥', 
    price: 120, 
    stock: 500,
    supplier: '永信藥品',
    expiry: '2025-12-31',
    status: 'active'
  },
  { 
    id: '2', 
    name: '普拿疼', 
    category: '止痛藥', 
    price: 80, 
    stock: 350,
    supplier: '台灣武田',
    expiry: '2025-10-15',
    status: 'active'
  },
  { 
    id: '3', 
    name: '胃腸藥', 
    category: '腸胃藥', 
    price: 150, 
    stock: 200,
    supplier: '信東生技',
    expiry: '2026-03-20',
    status: 'active'
  },
  { 
    id: '4', 
    name: '感冒糖漿', 
    category: '感冒藥', 
    price: 180, 
    stock: 150,
    supplier: '生達製藥',
    expiry: '2025-08-10',
    status: 'active'
  },
  { 
    id: '5', 
    name: '維他命C', 
    category: '維他命', 
    price: 250, 
    stock: 300,
    supplier: '杏輝藥品',
    expiry: '2026-05-25',
    status: 'active'
  }
];

const ProductList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  // 表格列定義
  const columns = [
    { field: 'name', headerName: '藥品名稱', minWidth: 150 },
    { field: 'category', headerName: '類別', minWidth: 120 },
    { 
      field: 'price', 
      headerName: '價格', 
      minWidth: 100,
      align: 'right',
      render: (value) => `$${value}`
    },
    { 
      field: 'stock', 
      headerName: '庫存', 
      minWidth: 100,
      align: 'right'
    },
    { field: 'supplier', headerName: '供應商', minWidth: 150 },
    { field: 'expiry', headerName: '有效期限', minWidth: 120 },
    {
      field: 'status',
      headerName: '狀態',
      minWidth: 100,
      render: (value) => value === 'active' ? '啟用' : '停用'
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
      setSelected(mockProducts.map(product => product.id));
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
    navigate(`/products/${id}`);
  };

  // 處理編輯
  const handleEdit = (id) => {
    navigate(`/products/${id}/edit`);
  };

  // 處理刪除
  const handleDelete = (id) => {
    // 實際應用中應該顯示確認對話框
    console.log(`刪除藥品 ID: ${id}`);
  };

  // 處理新增
  const handleAdd = () => {
    navigate('/products/new');
  };

  // 過濾資料
  const filteredData = mockProducts.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageContainer
      title="藥品管理"
      subtitle="管理所有藥品資訊"
      action={
        <ActionButton
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          新增藥品
        </ActionButton>
      }
    >
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <SearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={handleSearch}
            placeholder="搜索藥品名稱、類別或供應商..."
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

export default ProductList;

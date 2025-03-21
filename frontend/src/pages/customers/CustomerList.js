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
const mockCustomers = [
  { 
    id: '1', 
    name: '王小明', 
    phone: '0912-345-678', 
    email: 'wang@example.com', 
    address: '台北市信義區信義路五段7號',
    level: 'gold',
    registerDate: '2023-01-15',
    totalSpent: 12500,
    status: 'active'
  },
  { 
    id: '2', 
    name: '李小華', 
    phone: '0923-456-789', 
    email: 'lee@example.com', 
    address: '台北市大安區復興南路一段390號',
    level: 'silver',
    registerDate: '2023-02-20',
    totalSpent: 8300,
    status: 'active'
  },
  { 
    id: '3', 
    name: '張美玲', 
    phone: '0934-567-890', 
    email: 'chang@example.com', 
    address: '新北市板橋區文化路一段25號',
    level: 'bronze',
    registerDate: '2023-03-10',
    totalSpent: 4200,
    status: 'active'
  },
  { 
    id: '4', 
    name: '陳大偉', 
    phone: '0945-678-901', 
    email: 'chen@example.com', 
    address: '台中市西屯區台灣大道三段99號',
    level: 'gold',
    registerDate: '2023-01-05',
    totalSpent: 15800,
    status: 'active'
  },
  { 
    id: '5', 
    name: '林小芳', 
    phone: '0956-789-012', 
    email: 'lin@example.com', 
    address: '高雄市前鎮區中山二路2號',
    level: 'silver',
    registerDate: '2023-04-15',
    totalSpent: 7600,
    status: 'inactive'
  }
];

const CustomerList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  // 表格列定義
  const columns = [
    { field: 'name', headerName: '會員姓名', minWidth: 120 },
    { field: 'phone', headerName: '聯絡電話', minWidth: 150 },
    { field: 'email', headerName: '電子郵件', minWidth: 200 },
    { 
      field: 'level', 
      headerName: '會員等級', 
      minWidth: 120,
      render: (value) => {
        switch(value) {
          case 'gold': return '金卡會員';
          case 'silver': return '銀卡會員';
          case 'bronze': return '銅卡會員';
          default: return '一般會員';
        }
      }
    },
    { 
      field: 'totalSpent', 
      headerName: '累計消費', 
      minWidth: 120,
      align: 'right',
      render: (value) => `$${value.toLocaleString()}`
    },
    { field: 'registerDate', headerName: '註冊日期', minWidth: 120 },
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
      setSelected(mockCustomers.map(customer => customer.id));
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
    navigate(`/customers/${id}`);
  };

  // 處理編輯
  const handleEdit = (id) => {
    navigate(`/customers/${id}/edit`);
  };

  // 處理刪除
  const handleDelete = (id) => {
    // 實際應用中應該顯示確認對話框
    console.log(`刪除會員 ID: ${id}`);
  };

  // 處理新增
  const handleAdd = () => {
    navigate('/customers/new');
  };

  // 過濾資料
  const filteredData = mockCustomers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageContainer
      title="會員管理"
      subtitle="管理所有會員資訊"
      action={
        <ActionButton
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          新增會員
        </ActionButton>
      }
    >
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <SearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={handleSearch}
            placeholder="搜索會員姓名、電話或郵件..."
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

export default CustomerList;

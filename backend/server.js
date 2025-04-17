const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// 初始化Express應用
const app = express();

// 連接資料庫
connectDB();

// 初始化中間件
app.use(express.json({ extended: false }));
app.use(cors());
app.use(morgan('dev'));

// 定義路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/purchase-orders', require('./routes/purchaseOrders'));
app.use('/api/shipping-orders', require('./routes/shippingOrders'));
app.use('/api/fifo', require('./routes/fifo')); // 新增FIFO路由

// 設定靜態資源
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend', 'build', 'index.html'));
  });
}

// 設定端口
const PORT = process.env.PORT || 5000;

// 啟動伺服器
app.listen(PORT, () => console.log(`伺服器運行在端口 ${PORT}`));

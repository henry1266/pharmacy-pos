const express = require("express");
const connectDB = require("./config/db");
const path = require("path");
const cors = require("cors"); // 引入 cors 套件
// Removed mongoose import and debug setting

// 連接資料庫
connectDB();

const app = express();

// 初始化中間件
app.use(cors()); // 允許所有來源
app.use(express.json({ extended: false }));

// 定義路由
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/products", require("./routes/products"));
app.use("/api/inventory", require("./routes/inventory"));
app.use("/api/suppliers", require("./routes/suppliers"));
app.use("/api/customers", require("./routes/customers"));
app.use("/api/purchase-orders", require("./routes/purchaseOrders"));
app.use("/api/shipping-orders", require("./routes/shippingOrders"));
app.use("/api/shipping-orders", require("./routes/shippingOrderPdf")); // 新增出貨單PDF生成路由
app.use("/api/sales", require("./routes/sales"));
app.use("/api/accounting", require("./routes/accounting"));
app.use("/api/accounting-categories", require("./routes/accountingCategories"));
app.use("/api/product-categories", require("./routes/productCategories"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/fifo", require("./routes/fifo"));
app.use("/api/monitored-products", require("./routes/monitoredProducts")); // 新增監測產品路由
app.use("/api/settings", require("./routes/settings")); // *** Add the new settings route ***
app.use("/api/config", require("./routes/config")); // Add the new config route

// 在生產環境中提供靜態資源
if (process.env.NODE_ENV === "production") {
  // 設置靜態資料夾
  app.use(express.static("frontend/build"));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "build", "index.html"));
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`伺服器已啟動，監聽埠號: ${PORT}`));


import express, { Application, Request, Response } from "express";
import path from "path";
import cors from "cors";
import connectDB from "./config/db";

// 導入已轉換為 TypeScript 的路由
import authRoutes from "./routes/auth";
import usersRoutes from "./routes/users";
import suppliersRoutes from "./routes/suppliers";
import inventoryRoutes from "./routes/inventory";
import purchaseOrdersRoutes from "./routes/purchaseOrders";
import productCategoriesRoutes from "./routes/productCategories";
import productsRoutes from "./routes/products";
import customersRoutes from "./routes/customers";
import salesRoutes from "./routes/sales";
import accountingRoutes from "./routes/accounting";
import dashboardRoutes from "./routes/dashboard";
import reportsRoutes from "./routes/reports";
import employeesRoutes from "./routes/employees";
import employeeAccountsRoutes from "./routes/employeeAccounts";
import accountingCategoriesRoutes from "./routes/accountingCategories";
import shippingOrdersRoutes from "./routes/shippingOrders";
import shippingOrderPdfRoutes from "./routes/shippingOrderPdf";
import shippingOrdersImportRoutes from "./routes/shippingOrdersImport";
import fifoRoutes from "./routes/fifo";
import monitoredProductsRoutes from "./routes/monitoredProducts"; // 新增監測產品路由
import settingsRoutes from "./routes/settings"; // *** 新增設定路由 *** 
import configRoutes from "./routes/config"; // 新增配置路由
import csvImportApiRoutes from "./routes/csvImportApi"; // 新增CSV匯入REST API
import employeeSchedulesRoutes from "./routes/employeeSchedules"; // 新增員工排班API路由
import overtimeRecordsRoutes from "./routes/overtimeRecords"; // 新增加班記錄API路由

// 連接資料庫
connectDB();

const app: Application = express();

// 初始化中間件
app.use(cors()); // 允許所有來源
app.use(express.json({ extended: false } as any));

// 定義路由
// 使用 import 導入的 TypeScript 路由
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/suppliers", suppliersRoutes);
app.use("/api/purchase-orders", purchaseOrdersRoutes);
app.use("/api/product-categories", productCategoriesRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/accounting", accountingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/employee-accounts", employeeAccountsRoutes);
app.use("/api/accounting-categories", accountingCategoriesRoutes);
app.use("/api/shipping-orders", shippingOrdersRoutes); // 已轉換為 TypeScript
app.use("/api/shipping-orders", shippingOrderPdfRoutes); // 已轉換為 TypeScript
app.use("/api/shipping-orders", shippingOrdersImportRoutes); // 已轉換為 TypeScript
app.use("/api/fifo", fifoRoutes); // 已轉換為 TypeScript
app.use("/api/monitored-products", monitoredProductsRoutes); // 新增監測產品路由
app.use("/api/settings", settingsRoutes); // *** 新增設定路由 ***
app.use("/api/config", configRoutes); // 新增配置路由
app.use("/api/csv-import", csvImportApiRoutes); // 新增CSV匯入REST API
app.use("/api/employee-schedules", employeeSchedulesRoutes); // 新增員工排班API路由
app.use("/api/overtime-records", overtimeRecordsRoutes); // 新增加班記錄  API路由

// 在生產環境中提供靜態資源
if (process.env.NODE_ENV === "production") {
  // 設置靜態資料夾
  app.use(express.static("frontend/build"));

  app.get("*", (req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, "frontend", "build", "index.html"));
  });
}

const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 5000;

const server = app.listen(PORT, () => console.log(`伺服器已啟動，監聽埠號: ${PORT}`));

// 優雅地處理伺服器關閉
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信號，正在關閉伺服器...');
  server.close(() => {
    console.log('伺服器已關閉');
    process.exit(0);
  });
});

export default app;
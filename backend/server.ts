import express, { Application, Request, Response } from "express";
import path from "path";
import cors from "cors";
import { createServer } from "http";
import dotenv from "dotenv";
import connectDB from "./config/db";

// 載入環境變數
dotenv.config({ path: path.resolve(__dirname, '../.env') });


// 導入已轉換為 TypeScript 的路由
import authRoutes from "./routes/auth";
import usersRoutes from "./routes/users";
import suppliersRoutes from "./routes/suppliers";
import inventoryRoutes from "./routes/inventory";
import purchaseOrdersRoutes from "./routes/purchaseOrders";
import productCategoriesRoutes from "./routes/productCategories";
import productsRoutes from "./routes/products";
import packagesRoutes from "./routes/packages";
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
import shiftTimeConfigsRoutes from "./routes/shiftTimeConfigs"; // 新增班次時間配置API路由
import themesRoutes from "./routes/themes"; // 新增主題路由 V2
import packageUnitsRoutes from "./routes/packageUnits"; // 新增包裝單位路由
// import userThemesRoutes from "./routes/userThemes"; // 已整合到 authRoutes 中

// 新增 accounting2 模組路由 (舊版 - 保留相容性)
import accounts2Routes from "./routes/accounts2";
import categories2Routes from "./routes/categories2";
import accountingRecords2Routes from "./routes/accountingRecords2";
import transactionGroupsRoutes from "./routes/transactionGroups";
import transactionGroupsWithEntriesRoutes from "./routes/transactionGroupsWithEntries";
import accountingEntriesRoutes from "./routes/accountingEntries";
import accountBalancesRoutes from "./routes/accountBalances";

// 新增 accounting2 重構模組路由 (新版架構)
import { accountRoutes, transactionRoutes, fundingRoutes } from "./routes/accounting2";

// 新增機構管理路由
import organizationsRoutes from "./routes/organizations";

// 新增供應商科目配對路由
import supplierAccountMappingsRoutes from "./routes/supplierAccountMappings";

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
app.use("/api/packages", packagesRoutes);
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
app.use("/api/shift-time-configs", shiftTimeConfigsRoutes); // 新增班次時間配置API路由
app.use("/api/themes", themesRoutes); // 新增主題路由 V2
app.use("/api", packageUnitsRoutes); // 新增包裝單位路由

// 新增 accounting2 模組路由 - 獨立於現有 accounting 模組 (舊版 - 保留相容性)
app.use("/api/accounting2/accounts", accounts2Routes);
app.use("/api/accounting2/categories", categories2Routes);
app.use("/api/accounting2/records", accountingRecords2Routes);
app.use("/api/accounting2/transaction-groups", transactionGroupsRoutes);
app.use("/api/accounting2/transaction-groups-with-entries", transactionGroupsWithEntriesRoutes);
app.use("/api/accounting2/entries", accountingEntriesRoutes);
app.use("/api/accounting2/balances", accountBalancesRoutes);

// 新增 accounting2 重構模組路由 (新版架構) - 分別註冊各子路由
app.use("/api/accounting2/accounts", accountRoutes);
app.use("/api/accounting2/transactions", transactionRoutes);
app.use("/api/accounting2/funding", fundingRoutes);

// 新增直接路由支援 - 為了支援 accounting3 頁面的簡化路徑
app.use("/api/transaction-groups-with-entries", transactionGroupsWithEntriesRoutes);
app.use("/api/accounts", accounts2Routes);
app.use("/api/accounts2", accounts2Routes); // 添加 accounts2 路徑支援
app.use("/api/categories", categories2Routes);
app.use("/api/records", accountingRecords2Routes);
app.use("/api/entries", accountingEntriesRoutes);
app.use("/api/balances", accountBalancesRoutes);

// 新增機構管理路由 - 支援多機構集團化管理
app.use("/api/organizations", organizationsRoutes);

// 新增供應商科目配對路由 - 支援供應商與會計科目的配對管理
app.use("/api/supplier-account-mappings", supplierAccountMappingsRoutes);

// 在生產環境中提供靜態資源
if (process.env.NODE_ENV === "production") {
  // 設置靜態資料夾
  app.use(express.static("frontend/build"));

  app.get("*", (req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, "frontend", "build", "index.html"));
  });
}

const PORT: number = process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT) :
                     process.env.PORT ? parseInt(process.env.PORT) : 5000;
const HOST: string = process.env.SERVER_HOST || 'localhost';

// 創建 HTTP 伺服器
const server = createServer(app);

server.listen(PORT, HOST, () => {
  console.log(`伺服器已啟動，監聽位址: ${HOST}:${PORT}`);
  console.log(`API 基礎 URL: http://${HOST}:${PORT}/api`);
});

// 優雅地處理伺服器關閉
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信號，正在關閉伺服器...');
  server.close(() => {
    console.log('伺服器已關閉');
    process.exit(0);
  });
});

export default app;
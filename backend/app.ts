import express, { Application, Request, Response, NextFunction } from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger";

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
import monitoredProductsRoutes from "./routes/monitoredProducts";
import settingsRoutes from "./routes/settings";
import configRoutes from "./routes/config";
import csvImportApiRoutes from "./routes/csvImportApi";
import employeeSchedulesRoutes from "./routes/employeeSchedules";
import overtimeRecordsRoutes from "./routes/overtimeRecords";
import shiftTimeConfigsRoutes from "./routes/shiftTimeConfigs";
import themesRoutes from "./routes/themes";
import packageUnitsRoutes from "./routes/packageUnits";
import productDescriptionRoutes from "./routes/productDescriptionRoutes";
import linkReferencesRoutes from "./routes/linkReferences";
import linkGlobalUpdateRoutes from "./routes/linkGlobalUpdate";

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

// 監控路由
import monitoringRoutes from "./routes/monitoring";

/**
 * @description 創建Express應用程序實例
 * @returns {Application} 配置好的Express應用程序實例
 */
export function createApp(): Application {
  const app: Application = express();

  // 初始化中間件
  app.use(cors()); // 允許所有來源
  app.use(express.json({ extended: false } as any));

  // 定義路由
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
  app.use("/api/shipping-orders", shippingOrdersRoutes);
  app.use("/api/shipping-orders", shippingOrderPdfRoutes);
  app.use("/api/shipping-orders", shippingOrdersImportRoutes);
  app.use("/api/fifo", fifoRoutes);
  app.use("/api/monitored-products", monitoredProductsRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/config", configRoutes);
  app.use("/api/csv-import", csvImportApiRoutes);
  app.use("/api/employee-schedules", employeeSchedulesRoutes);
  app.use("/api/overtime-records", overtimeRecordsRoutes);
  app.use("/api/shift-time-configs", shiftTimeConfigsRoutes);
  app.use("/api/themes", themesRoutes);
  app.use("/api", packageUnitsRoutes);
  app.use("/api/products", productDescriptionRoutes);
  app.use("/api/link-references", linkReferencesRoutes);
  app.use("/api/link-global", linkGlobalUpdateRoutes);

  // accounting2 模組路由 (舊版 - 保留相容性)
  app.use("/api/accounting2/accounts", accounts2Routes);
  app.use("/api/accounting2/categories", categories2Routes);
  app.use("/api/accounting2/records", accountingRecords2Routes);
  app.use("/api/accounting2/transaction-groups", transactionGroupsRoutes);
  app.use("/api/accounting2/transaction-groups-with-entries", transactionGroupsWithEntriesRoutes);
  app.use("/api/accounting2/entries", accountingEntriesRoutes);
  app.use("/api/accounting2/balances", accountBalancesRoutes);

  // accounting2 重構模組路由 (新版架構)
  app.use("/api/accounting2/accounts", accountRoutes);
  app.use("/api/accounting2/transactions", transactionRoutes);
  app.use("/api/accounting2/funding", fundingRoutes);

  // 直接路由支援 - 為了支援 accounting3 頁面的簡化路徑
  app.use("/api/transaction-groups-with-entries", transactionGroupsWithEntriesRoutes);
  app.use("/api/accounts", accounts2Routes);
  app.use("/api/accounts2", accounts2Routes);
  app.use("/api/categories", categories2Routes);
  app.use("/api/records", accountingRecords2Routes);
  app.use("/api/entries", accountingEntriesRoutes);
  app.use("/api/balances", accountBalancesRoutes);

  // 機構管理路由
  app.use("/api/organizations", organizationsRoutes);

  // 供應商科目配對路由
  app.use("/api/supplier-account-mappings", supplierAccountMappingsRoutes);

  // 監控路由
  app.use("/api/monitoring", monitoringRoutes);

  // Swagger API文檔
  // 設置Swagger UI路由
  if (process.env.NODE_ENV === "production") {
    // 在生產環境中限制Swagger UI的訪問
    app.use("/api-docs", (req: Request, res: Response, next: NextFunction) => {
      const apiKey = req.query.apiKey as string || req.headers["x-api-key"] as string;
      if (!apiKey || apiKey !== process.env.SWAGGER_API_KEY) {
        res.status(401).json({
          success: false,
          message: "未授權訪問API文檔",
          timestamp: new Date()
        });
      } else {
        next();
      }
    });
    
    app.get("/api-docs.json", (req: Request, res: Response, next: NextFunction) => {
      const apiKey = req.query.apiKey as string || req.headers["x-api-key"] as string;
      if (!apiKey || apiKey !== process.env.SWAGGER_API_KEY) {
        res.status(401).json({
          success: false,
          message: "未授權訪問API文檔",
          timestamp: new Date()
        });
      } else {
        next();
      }
    });
  }
  
  // 設置Swagger UI
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
      }
    })
  );

  // 提供Swagger JSON端點
  app.get("/api-docs.json", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  // 在生產環境中提供靜態資源
  if (process.env.NODE_ENV === "production") {
    app.use(express.static("frontend/build"));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, "frontend", "build", "index.html"));
    });
  }

  return app;
}

/**
 * @description 連接到MongoDB資料庫
 * @async
 * @returns {Promise<void>} 連接成功時解析的Promise
 */
export async function initializeDatabase() {
  if (process.env.NODE_ENV !== 'test') {
    await connectDB();
  }
}

/**
 * @description 為了向後兼容，導出預先配置的Express應用程序實例
 * @type {Application} Express應用程序實例
 */
const app = createApp();
export default app;
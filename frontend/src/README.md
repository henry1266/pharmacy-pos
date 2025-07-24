# 藥房 POS 系統 - 前端源碼

## 📋 項目概述

這是一個基於 React + TypeScript 的現代化藥房 POS (Point of Sale) 系統前端應用程式。系統採用模組化架構設計，提供完整的藥房管理功能，包括銷售管理、庫存管理、會計系統、員工管理等核心業務功能。

## 🏗️ 技術架構

### 核心技術棧
- **框架**: React 18.2.0 + TypeScript 4.9.5
- **UI 框架**: Material-UI (MUI) 5.17.1
- **路由**: React Router DOM 6.8.2
- **狀態管理**: Redux + Redux Thunk
- **HTTP 客戶端**: Axios 1.3.4
- **表單處理**: Formik 2.2.9 + Yup 1.0.2
- **圖表**: Chart.js 4.2.1 + React-Chartjs-2 5.2.0
- **日期處理**: Date-fns 2.29.3 + Moment 2.29.4
- **動畫**: Framer Motion 12.9.2
- **構建工具**: CRACO 7.1.0

### 項目結構

```
frontend/src/
├── App.tsx                 # 主應用程式組件
├── AppRouter.tsx          # 路由配置
├── index.tsx              # 應用程式入口點
├── index.css              # 全域樣式
├── assets/                # 靜態資源
│   └── css/              # 樣式文件
├── components/           # 可重用組件
│   ├── accounting/       # 會計相關組件
│   ├── charts/          # 圖表組件
│   ├── common/          # 通用組件
│   ├── customers/       # 客戶管理組件
│   ├── dashboard/       # 儀表板組件
│   ├── filters/         # 篩選器組件
│   ├── form-widgets/    # 表單小工具
│   ├── layout/          # 佈局組件
│   ├── packages/        # 包裝管理組件
│   ├── products/        # 商品管理組件
│   ├── purchase-orders/ # 進貨單組件
│   ├── reports/         # 報表組件
│   ├── sales/           # 銷售組件
│   ├── settings/        # 設定組件
│   ├── shipping-orders/ # 出貨單組件
│   ├── suppliers/       # 供應商組件
│   └── tables/          # 表格組件
├── contexts/            # React Context
├── hooks/               # 自定義 Hooks
├── modules/             # 功能模組
│   ├── accounting3/     # 會計系統模組
│   └── employees/       # 員工管理模組
├── pages/               # 頁面組件
├── redux/               # Redux 狀態管理
├── services/            # API 服務層
├── testMode/            # 測試模式相關
├── types/               # TypeScript 類型定義
└── utils/               # 工具函數
```

## 🎯 核心功能模組

### 1. 主應用程式 ([`App.tsx`](App.tsx:1))
- **認證系統**: JWT Token 驗證與自動過期處理
- **測試模式**: 支援測試模式，跳過認證檢查
- **主題系統**: 動態主題切換與 Material-UI 主題配置
- **路由保護**: 受保護路由與公共路由分離

### 2. 路由系統 ([`AppRouter.tsx`](AppRouter.tsx:1))
完整的路由配置，包含以下主要路由群組：
- **儀表板**: `/dashboard`
- **商品管理**: `/products`, `/product-categories`
- **銷售管理**: `/sales/*`
- **進貨管理**: `/purchase-orders/*`
- **出貨管理**: `/shipping-orders/*`
- **供應商管理**: `/suppliers/*`
- **客戶管理**: `/customers/*`
- **會計系統**: `/accounting3/*`
- **員工管理**: `/employees/*`
- **系統設定**: `/settings/*`

### 3. 佈局系統 ([`components/layout/MainLayout.tsx`](components/layout/MainLayout.tsx:1))
- **響應式設計**: 支援桌面、平板、手機三種佈局
- **側邊欄導航**: 可摺疊的側邊欄選單
- **權限控制**: 基於角色的選單項目顯示
- **用戶狀態**: 登入狀態顯示與登出功能

### 4. 會計系統模組 ([`modules/accounting3/`](modules/accounting3/index.ts:1))
獨立的會計系統，提供：
- **科目管理**: 會計科目階層管理
- **交易記錄**: 複式記帳交易處理
- **機構管理**: 多機構支援
- **報表功能**: 財務報表生成

### 5. 員工管理模組 ([`modules/employees/`](modules/employees/index.ts:1))
完整的員工管理功能：
- **基本資料管理**: 員工個人資訊維護
- **帳號管理**: 員工登入帳號管理
- **排班系統**: 員工工作排程管理
- **加班記錄**: 加班時數記錄與統計

## 🔧 開發指南

### 環境要求
- Node.js 16+ 
- pnpm 8+
- TypeScript 4.9+

### 安裝與啟動
```bash
# 安裝依賴
pnpm install

# 啟動開發服務器
pnpm start

# 構建生產版本
pnpm build

# 運行測試
pnpm test
```

### 開發規範

#### 1. 組件開發
- 使用 TypeScript 進行類型安全開發
- 遵循 React Hooks 最佳實踐
- 組件應具備良好的可重用性

#### 2. 狀態管理
- 使用 Redux 管理全域狀態
- 本地狀態優先使用 useState
- 複雜狀態邏輯使用 useReducer

#### 3. API 整合
- 統一使用 Axios 進行 HTTP 請求
- API 服務層位於 `services/` 目錄
- 錯誤處理統一在服務層處理

#### 4. 樣式規範
- 優先使用 Material-UI 組件
- 自定義樣式使用 CSS-in-JS (sx prop)
- 全域樣式定義在 `assets/css/` 目錄

## 🔐 認證與權限

### 認證機制
- **JWT Token**: 基於 JSON Web Token 的認證
- **自動過期**: Token 過期自動登出
- **測試模式**: 開發時可啟用測試模式跳過認證

### 權限角色
- **admin**: 管理員 - 完整系統權限
- **pharmacist**: 藥師 - 業務操作權限
- **staff**: 員工 - 基本操作權限

### 權限控制
- 路由層級權限控制
- 組件層級權限顯示
- API 層級權限驗證

## 📱 響應式設計

系統支援三種設備類型：

### 桌面版 (≥1200px)
- 固定側邊欄導航
- 完整功能展示
- 多欄位佈局

### 平板版 (768px - 1199px)
- 可摺疊側邊欄
- 適中的內容密度
- 觸控友好的交互

### 手機版 (<768px)
- 隱藏式側邊欄
- 單欄佈局
- 大按鈕設計

## 🧪 測試模式

系統提供測試模式功能：
- 跳過 JWT 認證檢查
- 使用測試數據
- 橙色標識區分測試環境

啟用方式：
```javascript
localStorage.setItem('isTestMode', 'true');
```

## 🔗 相關連結

- [後端 API 文檔](../../backend/README.md)
- [共享類型定義](../../shared/README.md)
- [部署指南](../../README.md)

## 📝 更新日誌

### v1.0.0 (當前版本)
- ✅ 完整的 POS 系統功能
- ✅ 模組化架構設計
- ✅ 響應式 UI 設計
- ✅ 完整的認證與權限系統
- ✅ 會計系統整合
- ✅ 員工管理功能

## 🤝 貢獻指南

1. Fork 本項目
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權

本項目採用 MIT 授權 - 詳見 [LICENSE](../../LICENSE) 文件

---

**維護者**: 藥房 POS 開發團隊  
**最後更新**: 2025-01-24
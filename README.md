# 藥局POS系統

這是一個專為藥局設計的POS（銷售點）系統，提供藥品管理、供應商管理、銷售和庫存追蹤、記帳報表等功能。系統支援商品和藥品的分類管理，以及多種報表和數據分析工具。

#### 1. 克隆倉庫
```bash
git clone https://github.com/henry1266/pharmacy-pos.git
cd pharmacy-pos
```

#### 2. 安裝 pnpm（如果尚未安裝）
npm install -g pnpm

#### 3. 安裝所有依賴
pnpm install

#### 4. 建構 Shared 模組
```bash
# 建構共享型別定義
pnpm --filter shared build
```

#### 5. 配置數據庫
1. 確保 MongoDB 服務已啟動
2. 在 `backend/config` 目錄中創建或編輯 `default.json` 文件
3. 設置 MongoDB 連接字符串

#### 6. 啟動開發環境
pnpm run dev

### 快速啟動腳本
系統提供了便捷的安裝和啟動腳本：

#### Windows 用戶
```batch
setup.bat  # 首次安裝依賴
start.bat  # 啟動系統
```

#### Linux/Mac 用戶
```bash
chmod +x setup.sh  # 設置執行權限
./setup.sh         # 首次安裝依賴
```
## 開發團隊

- Henry Chen - 項目負責人
- 藥局POS開發團隊
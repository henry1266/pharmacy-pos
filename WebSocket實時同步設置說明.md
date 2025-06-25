# WebSocket 實時同步功能設置說明

## 功能概述

已成功實現 WebSocket 實時同步功能，當任何一台電腦在 sales/new2 頁面提交銷售記錄時，所有正在連接該頁面的其他用戶都會即時看到畫面刷新。

## 已實現的功能

### 後端 (Backend)
1. **Socket.IO 伺服器** - 在 `backend/server.ts` 中集成
2. **房間管理** - 支援 `sales-new2` 房間
3. **事件廣播** - 銷售記錄建立/更新時自動通知所有連接的用戶
4. **連接日誌** - 詳細的連接和斷線記錄

### 前端 (Frontend)
1. **WebSocket 服務** - `frontend/src/services/socketService.ts`
2. **React Hook** - `frontend/src/hooks/useSocket.ts`
3. **自動刷新** - SalesNew2Page 整合實時事件監聽
4. **測試頁面** - `/websocket-test` 用於調試和測試

## 設置步驟

### 1. 確認伺服器運行
```bash
# 在主伺服器電腦上執行
cd d:/pharmacy-pos
pnpm -w run dev
```

### 2. 配置其他電腦的連接

#### 方法一：使用環境變數 (推薦)
在其他電腦的前端目錄中創建 `.env.local` 檔案：

```bash
# 複製範例檔案
cp frontend/.env.example frontend/.env.local
```

編輯 `.env.local`，將 `localhost` 替換為伺服器電腦的實際 IP 位址：
```env
REACT_APP_API_URL=http://192.168.1.100:5000
REACT_APP_SERVER_URL=http://192.168.1.100:5000
```

#### 方法二：修改 hosts 檔案
在其他電腦的 hosts 檔案中添加：
```
192.168.1.100 localhost
```

### 3. 測試連接

1. 在瀏覽器中訪問 `http://localhost:3000/websocket-test`
2. 檢查連接狀態是否為「已連接」
3. 點擊「加入房間」
4. 在另一台電腦上建立銷售記錄，觀察是否收到通知

### 4. 使用 sales/new2 頁面

1. 訪問 `http://localhost:3000/sales/new2`
2. 頁面會自動連接 WebSocket 並加入 `sales-new2` 房間
3. 當任何用戶提交銷售記錄時，所有連接的用戶都會看到：
   - 自動刷新銷售清單
   - 顯示通知訊息

## 故障排除

### 問題 1：其他電腦無法連接
**解決方案：**
1. 確認伺服器電腦的防火牆允許 5000 埠號
2. 檢查網路連接和 IP 位址設定
3. 使用 `ping` 命令測試網路連通性

### 問題 2：WebSocket 連接失敗
**解決方案：**
1. 檢查瀏覽器控制台的錯誤訊息
2. 確認 `.env.local` 檔案中的 URL 設定正確
3. 嘗試直接訪問 API 端點測試連接

### 問題 3：事件未收到
**解決方案：**
1. 確認已成功加入 `sales-new2` 房間
2. 檢查後端日誌是否顯示事件廣播
3. 使用測試頁面驗證 WebSocket 功能

## 技術細節

### WebSocket 事件
- `join-sales-new2`: 加入銷售頁面房間
- `leave-sales-new2`: 離開銷售頁面房間
- `sale-created`: 新銷售記錄建立通知
- `sale-updated`: 銷售記錄更新通知

### 自動重連機制
- 連接斷線時自動嘗試重連
- 延遲重試避免頻繁連接
- 連接狀態實時監控

### 安全考量
- WebSocket 連接使用相同的 CORS 設定
- 支援 WebSocket 和 HTTP 長輪詢備援
- 連接超時設定為 20 秒

## 監控和調試

### 後端日誌
伺服器控制台會顯示：
```
用戶已連接: [Socket ID]
用戶 [Socket ID] 加入 sales-new2 房間
用戶已斷線: [Socket ID]
```

### 前端調試
1. 開啟瀏覽器開發者工具
2. 查看 Console 標籤的 WebSocket 連接日誌
3. 使用 `/websocket-test` 頁面進行詳細測試

## 效能優化建議

1. **限制房間數量** - 只在需要時加入特定房間
2. **事件節流** - 避免過於頻繁的事件廣播
3. **連接池管理** - 監控同時連接數量
4. **錯誤處理** - 完善的錯誤恢復機制

## 未來擴展

可以考慮添加以下功能：
1. 其他頁面的實時同步 (庫存、客戶等)
2. 用戶在線狀態顯示
3. 實時聊天功能
4. 系統通知廣播
5. 數據變更的細粒度通知

---

如有任何問題，請檢查瀏覽器控制台和伺服器日誌以獲取詳細的錯誤信息。
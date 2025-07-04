# WebSocket 實時同步故障排除指南

## 問題現象
- 主機（伺服器電腦）可以正常刷新
- 其他電腦無法接收到實時更新

## 解決步驟

### 1. 確認伺服器端修改已生效

**重要：必須重新啟動後端伺服器**

```bash
# 在主機上停止現有伺服器（Ctrl+C）
# 然後重新啟動
cd d:/pharmacy-pos
pnpm run dev
```

### 2. 獲取主機 IP 位址

在主機（伺服器電腦）上執行：

```bash
# Windows
ipconfig

# 尋找「乙太網路介面卡」或「無線區域網路介面卡」
# 記下 IPv4 位址，例如：192.168.1.100
```

### 3. 在其他電腦上設定環境變數

在每台其他電腦的 `frontend/.env.local` 檔案中：

```env
# 將 192.168.1.100 替換為您的實際主機 IP
REACT_APP_API_URL=http://192.168.1.100:5000
REACT_APP_SERVER_URL=http://192.168.1.100:5000
```

### 4. 檢查網路連通性

在其他電腦上測試：

```bash
# 測試 API 連接
curl http://192.168.1.100:5000/api/sales

# 或在瀏覽器中訪問
http://192.168.1.100:5000/api/sales
```

### 5. 檢查防火牆設定

**在主機（伺服器電腦）上：**

1. 開啟 Windows 防火牆設定
2. 點擊「允許應用程式或功能通過 Windows Defender 防火牆」
3. 點擊「變更設定」
4. 點擊「允許其他應用程式」
5. 瀏覽並選擇 Node.js 執行檔
6. 確保「私人」和「公用」都勾選

**或者暫時關閉防火牆進行測試：**
- 控制台 → 系統及安全性 → Windows Defender 防火牆
- 點擊「開啟或關閉 Windows Defender 防火牆」
- 暫時關閉私人和公用網路的防火牆

### 6. 使用 WebSocket 測試頁面

在每台電腦上訪問：
```
http://localhost:3000/websocket-test
```

檢查：
- 連接狀態是否為「已連接」
- 是否能成功加入房間
- 點擊「測試銷售事件」是否能收到訊息

### 7. 檢查瀏覽器控制台

按 F12 開啟開發者工具，查看 Console 標籤：

**正常連接應該看到：**
```
WebSocket 嘗試連接到: http://192.168.1.100:5000
✅ WebSocket 已連接: [socket-id]
🏠 已加入 sales-new2 房間
```

**連接失敗會看到：**
```
❌ WebSocket 連接錯誤: [錯誤訊息]
```

### 8. 重新啟動前端應用

在其他電腦上：

```bash
# 停止前端應用（Ctrl+C）
# 重新啟動
cd d:/pharmacy-pos/frontend
pnpm start
```

### 9. 測試實時同步

1. 在主機上開啟 `http://localhost:3000/sales/new2`
2. 在其他電腦上開啟 `http://localhost:3000/sales/new2`
3. 在任一台電腦上提交銷售記錄
4. 觀察其他電腦是否自動刷新

## 常見問題解決

### 問題 1：連接被拒絕
```
❌ WebSocket 連接錯誤: Error: connect ECONNREFUSED
```

**解決方案：**
- 確認主機 IP 位址正確
- 確認後端伺服器正在運行
- 檢查防火牆設定

### 問題 2：CORS 錯誤
```
❌ Access to XMLHttpRequest blocked by CORS policy
```

**解決方案：**
- 確認後端 CORS 設定已修改
- 重新啟動後端伺服器

### 問題 3：房間加入失敗
```
⚠️ 無法加入房間：WebSocket 未連接
```

**解決方案：**
- 等待 WebSocket 連接建立
- 手動點擊「加入房間」按鈕

### 問題 4：環境變數未生效
**解決方案：**
- 確認 `.env.local` 檔案位於 `frontend/` 目錄下
- 重新啟動前端應用
- 檢查檔案名稱是否正確（不是 `.env.local.txt`）

## 驗證步驟

### 最終測試清單：

1. ✅ 主機後端伺服器運行正常
2. ✅ 其他電腦能訪問主機的 API
3. ✅ WebSocket 測試頁面顯示「已連接」
4. ✅ 能成功加入 sales-new2 房間
5. ✅ 在任一台電腦提交銷售記錄時，其他電腦自動刷新

## 如果仍然無法解決

請提供以下資訊：

1. 主機 IP 位址
2. 其他電腦的瀏覽器控制台錯誤訊息
3. WebSocket 測試頁面的連接狀態
4. 網路拓撲（是否在同一區域網路）

## 網路架構說明

```
主機電腦 (192.168.1.100:5000)
├── 後端伺服器 (Node.js + Socket.IO)
├── 前端應用 (React)
└── WebSocket 伺服器

其他電腦 A (192.168.1.101)
├── 前端應用 → 連接到 192.168.1.100:5000
└── WebSocket 客戶端 → 連接到 192.168.1.100:5000

其他電腦 B (192.168.1.102)
├── 前端應用 → 連接到 192.168.1.100:5000
└── WebSocket 客戶端 → 連接到 192.168.1.100:5000
```

所有電腦都必須能夠訪問主機的 5000 埠號才能正常工作。
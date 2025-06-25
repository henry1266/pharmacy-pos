# 正確的 WebSocket 實時同步配置指南

## 🎯 關鍵發現
其他電腦應該直接訪問主機的前端應用，而不是在本地運行前端！

## 📋 正確的配置步驟

### 主機 (192.168.68.90) 設定

#### 1. 後端伺服器配置
```bash
cd d:/pharmacy-pos
pnpm run dev
```
確保後端運行在 5000 埠號

#### 2. 前端應用配置
```bash
cd d:/pharmacy-pos/frontend
pnpm start
```
確保前端運行在 3000 埠號

#### 3. 防火牆設定
```bash
# 允許 3000 和 5000 埠號
netsh advfirewall firewall add rule name="Pharmacy POS Frontend" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="Pharmacy POS Backend" dir=in action=allow protocol=TCP localport=5000
```

#### 4. 主機的 frontend/.env.local
```env
# 主機使用 localhost
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SERVER_URL=http://localhost:5000
```

### 其他電腦設定

#### ⚠️ 重要：其他電腦不需要運行任何服務！

其他電腦只需要：

1. **直接訪問主機的前端應用**
   ```
   http://192.168.68.90:3000/sales/new2
   ```

2. **測試 WebSocket 連接**
   ```
   http://192.168.68.90:3000/websocket-test
   ```

## 🧪 測試步驟

### 1. 主機測試
在主機上訪問：
```
http://localhost:3000/sales/new2
```

### 2. 其他電腦測試
在其他電腦上訪問：
```
http://192.168.68.90:3000/sales/new2
```

### 3. 實時同步測試
1. 主機開啟：`http://localhost:3000/sales/new2`
2. 其他電腦開啟：`http://192.168.68.90:3000/sales/new2`
3. 在任一台提交銷售記錄
4. 觀察其他台是否自動刷新

## 🔧 WebSocket 連接邏輯

### 主機 (localhost:3000)
- 前端連接到：`http://localhost:5000` (WebSocket)
- 後端廣播事件到所有連接的客戶端

### 其他電腦 (192.168.68.90:3000)
- 前端自動檢測並連接到：`http://192.168.68.90:5000` (WebSocket)
- 接收來自後端的廣播事件

## 📝 前端 WebSocket 連接邏輯

在 [`frontend/src/services/socketService.ts`](frontend/src/services/socketService.ts:15) 中：

```typescript
const serverUrl = process.env.REACT_APP_API_URL ||
                 process.env.REACT_APP_SERVER_URL ||
                 `${window.location.protocol}//${window.location.hostname}:5000` ||
                 'http://localhost:5000';
```

這意味著：
- 主機訪問 `localhost:3000` → 連接到 `localhost:5000`
- 其他電腦訪問 `192.168.68.90:3000` → 自動連接到 `192.168.68.90:5000`

## ✅ 成功標準

1. ✅ 主機能訪問 `http://localhost:3000/sales/new2`
2. ✅ 其他電腦能訪問 `http://192.168.68.90:3000/sales/new2`
3. ✅ 其他電腦的 WebSocket 測試頁面顯示「已連接」
4. ✅ 在任一台提交銷售記錄時，其他台自動刷新

## 🚨 常見錯誤

### ❌ 錯誤做法
- 在其他電腦上運行前端應用
- 在其他電腦上設定 .env.local
- 其他電腦訪問 `http://localhost:3000`

### ✅ 正確做法
- 只在主機運行前端和後端
- 其他電腦直接訪問主機的前端
- 其他電腦訪問 `http://192.168.68.90:3000`

## 🔍 故障排除

### 如果其他電腦無法訪問 192.168.68.90:3000

1. **檢查主機防火牆**
   ```bash
   netsh advfirewall firewall show rule name="Pharmacy POS Frontend"
   ```

2. **檢查前端是否綁定到所有介面**
   前端應該監聽 `0.0.0.0:3000` 而不是 `127.0.0.1:3000`

3. **測試連接**
   ```bash
   # 在其他電腦上測試
   telnet 192.168.68.90 3000
   ```

### 如果 WebSocket 連接失敗

1. **檢查瀏覽器開發者工具**
   - Network 標籤查看 WebSocket 連接
   - Console 標籤查看錯誤訊息

2. **檢查後端日誌**
   - 查看是否有連接請求
   - 查看是否有 CORS 錯誤

## 🎉 預期結果

當配置正確時：
- 主機和其他電腦都能正常使用銷售功能
- 任何一台電腦提交銷售記錄時，所有其他電腦都會即時看到更新
- WebSocket 連接穩定，無需手動刷新

---

**關鍵重點：其他電腦是客戶端，直接訪問主機提供的服務，不需要在本地運行任何程式！**
# WebSocket 實時同步修復指南 - IP: 192.168.68.90

## 🚨 立即執行步驟

### 步驟 1: 重新啟動後端伺服器（必須！）
```bash
# 在主機 (192.168.68.90) 上執行
# 停止現有伺服器 (Ctrl+C)
cd d:/pharmacy-pos
pnpm run dev
```

### 步驟 2: 確認主機設定
主機上的 `frontend/.env.local` 應該包含：
```env
REACT_APP_API_URL=http://192.168.68.90:5000
REACT_APP_SERVER_URL=http://192.168.68.90:5000
```

### 步驟 3: 在其他電腦上設定
在每台其他電腦的 `frontend/.env.local` 中設定：
```env
REACT_APP_API_URL=http://192.168.68.90:5000
REACT_APP_SERVER_URL=http://192.168.68.90:5000
```

### 步驟 4: 重新啟動所有前端應用
在每台電腦上：
```bash
# 停止前端 (Ctrl+C)
cd d:/pharmacy-pos/frontend
pnpm start
```

## 🔧 診斷工具

### 使用診斷腳本
在其他電腦上執行：
```bash
cd d:/pharmacy-pos
診斷-192.168.68.90.bat
```

### 手動測試步驟

#### 1. 測試網路連通性
```bash
ping 192.168.68.90
```
應該看到回應時間，如果超時則表示網路不通。

#### 2. 測試 API 連接
在瀏覽器中訪問：
```
http://192.168.68.90:5000/api/sales
```
應該看到 JSON 資料，如果無法連接則檢查防火牆。

#### 3. 測試 WebSocket 連接
在每台電腦上訪問：
```
http://localhost:3000/websocket-test
```

**成功標準：**
- 連接狀態顯示「已連接」
- 能成功「加入房間」
- 點擊「測試銷售事件」能收到訊息

## 🛠️ 故障排除

### 問題 1: WebSocket 顯示「未連接」

**檢查清單：**
1. ✅ 確認 `.env.local` 中的 IP 是 192.168.68.90
2. ✅ 確認後端伺服器已重新啟動
3. ✅ 確認前端應用已重新啟動
4. ✅ 確認能 ping 通 192.168.68.90

**解決方案：**
```bash
# 在其他電腦上檢查環境變數
echo %REACT_APP_API_URL%
# 應該顯示: http://192.168.68.90:5000
```

### 問題 2: 防火牆阻擋

**在主機 (192.168.68.90) 上執行：**
```bash
# 檢查防火牆狀態
netsh advfirewall show allprofiles state

# 允許 5000 埠號
netsh advfirewall firewall add rule name="Node.js Server" dir=in action=allow protocol=TCP localport=5000
```

**或暫時關閉防火牆測試：**
1. 控制台 → 系統及安全性 → Windows Defender 防火牆
2. 點擊「開啟或關閉 Windows Defender 防火牆」
3. 暫時關閉私人網路防火牆

### 問題 3: 瀏覽器快取

**清除瀏覽器快取：**
1. 按 Ctrl+Shift+R 強制重新整理
2. 或按 F12 → Network 標籤 → 勾選「Disable cache」

## 🧪 測試流程

### 完整測試步驟：

1. **主機測試**
   - 訪問 `http://localhost:3000/websocket-test`
   - 確認「已連接」狀態

2. **其他電腦測試**
   - 訪問 `http://localhost:3000/websocket-test`
   - 確認「已連接」狀態

3. **實時同步測試**
   - 在主機開啟 `http://localhost:3000/sales/new2`
   - 在其他電腦開啟 `http://localhost:3000/sales/new2`
   - 在任一台電腦提交銷售記錄
   - 觀察其他電腦是否自動刷新

## 📋 檢查清單

### 主機 (192.168.68.90) 設定：
- [ ] 後端伺服器運行在 5000 埠號
- [ ] 防火牆允許 5000 埠號
- [ ] frontend/.env.local 設定正確

### 其他電腦設定：
- [ ] 能 ping 通 192.168.68.90
- [ ] frontend/.env.local 設定為 192.168.68.90:5000
- [ ] 前端應用已重新啟動
- [ ] WebSocket 測試頁面顯示「已連接」

### 功能測試：
- [ ] 所有電腦都能訪問 WebSocket 測試頁面
- [ ] 所有電腦都顯示「已連接」狀態
- [ ] 提交銷售記錄時其他電腦自動刷新

## 🆘 如果仍然無法解決

請提供以下資訊：

1. **主機狀態**
   - 後端伺服器是否正常運行？
   - 防火牆設定如何？

2. **其他電腦狀態**
   - WebSocket 測試頁面連接狀態？
   - 瀏覽器控制台錯誤訊息？
   - 能否訪問 http://192.168.68.90:5000/api/sales？

3. **網路環境**
   - 所有電腦是否在同一區域網路？
   - 是否有路由器或交換器設定限制？

---

**重要提醒：每次修改 .env.local 後都必須重新啟動前端應用！**
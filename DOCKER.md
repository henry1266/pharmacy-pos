# Docker 部署指南

本專案已支援 Docker 容器化部署，提供完整的開發和生產環境。

## 系統架構

專案採用以下服務架構：

- **MongoDB**: 資料庫服務 (端口 27017)
- **Backend**: Node.js API 服務 (端口 5000)
- **Frontend**: React 應用服務 (端口 3000)

## 快速開始

### 1. 環境準備

確保系統已安裝 Docker 和 Docker Compose：

```bash
# 檢查 Docker 版本
docker --version
docker-compose --version
```

### 2. 複製專案

```bash
git clone <repository-url>
cd pharmacy-pos
```

### 3. 啟動服務

```bash
# 建置並啟動所有服務
docker-compose up --build

# 或在背景執行
docker-compose up -d --build
```

### 4. 訪問應用程式

- **前端應用**: http://localhost:3000
- **後端 API**: http://localhost:5000
- **MongoDB**: localhost:27017 (僅供內部訪問)

## 詳細說明

### 環境變數配置

專案使用 `.docker.env` 檔案管理環境變數：

```bash
# MongoDB 設定
MONGO_ROOT_USERNAME=henry1266
MONGO_ROOT_PASSWORD=Henry22133
MONGO_DATABASE=pharmacy-pos

# JWT 設定
JWT_SECRET=pharmacy-pos-docker-secret-key-2025
JWT_EXPIRATION=604800

# 應用程式設定
NODE_ENV=production
REACT_APP_TEST_MODE=false
```

**安全注意**: 生產環境請修改預設密碼和 JWT 密鑰。

### 服務管理命令

```bash
# 查看服務狀態
docker-compose ps

# 查看日誌
docker-compose logs [service-name]

# 停止服務
docker-compose down

# 重新建置特定服務
docker-compose up --build [service-name]

# 清理所有容器和映像
docker-compose down --rmi all --volumes
```

### 資料持久化

MongoDB 資料會持久化儲存在 Docker volume 中：

- `mongodb_data`: 資料庫資料
- `mongodb_config`: 設定資料

### 開發模式

如需開發模式，可以修改 `docker-compose.yml` 中的環境變數：

```yaml
environment:
  NODE_ENV: development
  REACT_APP_TEST_MODE: true
```

## 故障排除

### 常見問題

1. **端口衝突**
   - 確保 3000、5000、27017 端口未被其他服務占用
   - 修改 `docker-compose.yml` 中的端口映射

2. **建置失敗**
   ```bash
   # 清除快取並重新建置
   docker-compose build --no-cache
   ```

3. **資料庫連接問題**
   - 檢查 MongoDB 容器是否正常運行
   - 確認環境變數配置正確

4. **記憶體不足**
   - 增加 Docker Desktop 的記憶體配置
   - 或使用 `docker system prune` 清理系統

### 健康檢查

後端服務包含健康檢查端點：

```bash
# 檢查後端健康狀態
curl http://localhost:5000/health
```

### 日誌分析

```bash
# 查看所有服務日誌
docker-compose logs

# 即時查看日誌
docker-compose logs -f [service-name]

# 查看特定時間範圍的日誌
docker-compose logs --since "1h" [service-name]
```

## 生產部署

### 安全建議

1. **修改預設密碼**: 變更 MongoDB 和 JWT 的預設密碼
2. **網路隔離**: 使用內部網路，只暴露必要端口
3. **環境變數**: 使用 Docker secrets 或外部配置管理
4. **定期更新**: 保持 Docker 映像和依賴項更新

### 效能優化

1. **資源限制**: 在 `docker-compose.yml` 中設定 CPU 和記憶體限制
2. **多階段建置**: 生產映像已使用多階段建置優化大小
3. **快取**: 利用 Docker layer 快取加速建置

### 監控和維護

- 定期檢查容器健康狀態
- 監控資源使用情況
- 設定日誌輪替
- 備份 MongoDB 資料

## 開發者資訊

### 專案結構

```
pharmacy-pos/
├── backend/           # Node.js API 服務
│   ├── Dockerfile
│   └── ...
├── frontend/          # React 應用
│   ├── Dockerfile
│   ├── nginx.conf
│   └── ...
├── shared/            # 共用程式碼
├── docker-compose.yml # Docker 編排配置
├── .docker.env        # 環境變數
└── DOCKER.md         # 本文件
```

### 自訂配置

如需自訂配置，可以：

1. 修改 `docker-compose.yml` 中的服務配置
2. 調整 `.docker.env` 中的環境變數
3. 自訂 `nginx.conf` 配置前端服務
4. 修改 Dockerfile 以適應特殊需求

## 支援

如遇到問題，請檢查：

1. Docker 和 Docker Compose 版本
2. 系統資源是否充足
3. 網路連接是否正常
4. 日誌中的錯誤訊息

更多資訊請參考專案的 [README.md](README.md) 和 [AGENTS.md](AGENTS.md)。
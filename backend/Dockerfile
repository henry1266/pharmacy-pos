# 多階段建構 - 建構階段
FROM node:18-alpine AS builder

# 設置工作目錄
WORKDIR /app

# 安裝 pnpm
RUN npm install -g pnpm

# 複製 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安裝依賴
RUN pnpm install --frozen-lockfile

# 複製源代碼
COPY . .

# 建構應用
RUN pnpm run build

# 生產階段
FROM node:18-alpine AS production

# 安裝必要的系統依賴
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# 創建非 root 用戶
RUN addgroup -g 1001 -S nodejs && \
    adduser -S pharmacy -u 1001

# 設置工作目錄
WORKDIR /app

# 安裝 pnpm
RUN npm install -g pnpm

# 複製 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 只安裝生產依賴
RUN pnpm install --frozen-lockfile --prod

# 從建構階段複製建構結果
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# 複製其他必要檔案
COPY --chown=pharmacy:nodejs scripts/ ./scripts/
COPY --chown=pharmacy:nodejs config/ ./config/

# 設置檔案權限
RUN chown -R pharmacy:nodejs /app

# 切換到非 root 用戶
USER pharmacy

# 暴露端口
EXPOSE 3000

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# 使用 dumb-init 作為 PID 1
ENTRYPOINT ["dumb-init", "--"]

# 啟動應用
CMD ["node", "dist/server.js"]
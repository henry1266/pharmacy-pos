# 使用 Node.js 20 作為基礎映像
FROM node:20-alpine

# 設定工作目錄
WORKDIR /app

# 安裝 pnpm
RUN npm install -g pnpm@10.12.1

# 複製 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 安裝根目錄依賴
RUN pnpm install --frozen-lockfile

# 複製 shared 模組
COPY shared/ ./shared/

# 複製 backend 程式碼
COPY backend/ ./backend/

# 建置 shared 模組
RUN pnpm --filter shared build

# 建置 backend
RUN pnpm --filter backend build

# 設定環境變數
ENV NODE_ENV=production

# 暴露端口
EXPOSE 5000

# 啟動應用程式
CMD ["node", "backend/dist/server.js"]
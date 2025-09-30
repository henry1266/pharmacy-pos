# 多階段建置：第一階段建置
FROM node:20-alpine AS builder

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

# 複製 frontend 程式碼
COPY frontend/ ./frontend/

# 建置 shared 模組
RUN pnpm --filter shared build

# 建置 frontend
RUN pnpm --filter frontend build

# 第二階段：生產環境
FROM nginx:alpine

# 複製建置好的檔案到 nginx
COPY --from=builder /app/frontend/build /usr/share/nginx/html

# 複製 nginx 配置
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 3000

# 啟動 nginx
CMD ["nginx", "-g", "daemon off;"]
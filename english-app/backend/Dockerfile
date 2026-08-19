FROM node:20-slim

WORKDIR /app

# Cài openssl (cần cho Prisma)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Set DATABASE_URL mặc định (Railway sẽ override nếu có biến env riêng)
ENV DATABASE_URL="file:/app/prisma/dev.db"

# Copy package files trước
COPY package*.json ./
COPY prisma ./prisma/

# Cài TẤT CẢ dependencies (kể cả dev để có ts-node)
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy toàn bộ source code
COPY . .

# Build NestJS
RUN npm run build

EXPOSE 3000

# db push → tạo schema → start app (auto-seed chạy trong main.ts khi app start)
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/main"]

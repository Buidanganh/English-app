FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Cài TẤT CẢ dependencies kể cả devDependencies
RUN npm install --include=dev

# Cấp quyền execute cho các binary trong node_modules/.bin
RUN chmod -R +x node_modules/.bin

# Generate Prisma Client
RUN npx prisma generate

# Copy toàn bộ source code
COPY . .

# Build NestJS dùng npx để tránh permission issue
RUN npx nest build

# ================================
# Production stage
# ================================
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Chỉ cài production deps
RUN npm install --omit=dev

# Cấp quyền cho prisma binary
RUN chmod -R +x node_modules/.bin

# Copy Prisma client đã generate từ builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy built app
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push && node dist/main"]

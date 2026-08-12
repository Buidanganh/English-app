FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Cài TẤT CẢ dependencies (kể cả devDependencies để build được)
RUN npm install --include=dev

# Generate Prisma Client
RUN npx prisma generate

# Copy toàn bộ source code
COPY . .

# Build NestJS
RUN npm run build

# ================================
# Production stage — chỉ giữ thứ cần thiết
# ================================
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Chỉ cài production deps
RUN npm install --omit=dev

# Copy Prisma client đã generate
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy built app
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push && node dist/main"]

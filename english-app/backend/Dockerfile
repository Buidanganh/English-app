FROM node:20-slim

WORKDIR /app

# Cài openssl (cần cho Prisma)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files trước
COPY package*.json ./
COPY prisma ./prisma/

# Cài TẤT CẢ dependencies (kể cả dev)
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy toàn bộ source code
COPY . .

# Build NestJS
RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push && node dist/main"]

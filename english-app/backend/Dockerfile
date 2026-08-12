FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build NestJS app
RUN npm run build

EXPOSE 3000

# Push DB schema và start server
CMD ["sh", "-c", "npx prisma db push && node dist/main"]

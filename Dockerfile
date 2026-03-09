# FROM node:20-alpine AS base
FROM docker.m.daocloud.io/library/node:20-alpine AS base

WORKDIR /app

# 为 Next.js 提供更好的兼容性
RUN apk add --no-cache libc6-compat

ENV NEXT_TELEMETRY_DISABLED=1

########################
# 依赖安装阶段
########################
FROM base AS deps

COPY package.json pnpm-lock.yaml ./

# 使用 corepack 启用 pnpm，并根据锁文件安装依赖
RUN corepack enable && pnpm install --frozen-lockfile

########################
# 构建阶段
########################
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production

RUN corepack enable && pnpm run build

########################
# 运行阶段
########################
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 只复制运行时需要的内容
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=deps /app/node_modules ./node_modules

# 使用基础镜像内置的非 root 用户（node 官方镜像已创建）
USER node

EXPOSE 3000

CMD ["npm", "start"]


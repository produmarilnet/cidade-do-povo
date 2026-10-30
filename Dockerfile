FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
# O domínio do EasyPanel manda as visitas para a porta 80.
ENV PORT=80

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Build "standalone": só o que o site usa para rodar (inclui o driver postgres,
# que o script de migrations também usa).
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/scripts/migrar.mjs ./scripts/migrar.mjs
COPY --from=builder --chown=nextjs:nodejs /app/db ./db

# Roda como root: usuário comum não pode abrir a porta 80 em todo Docker.
EXPOSE 80
# Primeiro deixa o banco em dia, depois sobe o site. Se a migration falhar,
# o site não sobe e o erro aparece nos logs do EasyPanel.
CMD ["sh", "-c", "node scripts/migrar.mjs && node server.js"]

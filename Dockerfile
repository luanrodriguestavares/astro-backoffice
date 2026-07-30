FROM node:22.17.1-alpine3.22 AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

FROM base AS dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM dependencies AS build
ARG ASTRO_API_URL=http://api:3000
ARG NEXT_PUBLIC_APP_NAME=Astro
ARG NEXT_PUBLIC_CHECKOUT_URL
ENV ASTRO_API_URL=$ASTRO_API_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_CHECKOUT_URL=$NEXT_PUBLIC_CHECKOUT_URL
COPY . .
RUN pnpm check

FROM node:22.17.1-alpine3.22 AS runtime
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3001/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
CMD ["node", "server.js"]

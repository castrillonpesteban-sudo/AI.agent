# Imagen para dejar el asistente corriendo 24/7 (Fly.io, Render, un VPS, etc.).
#
#   docker build -t asistente .
#   docker run -d --env-file .env.local -p 3000:3000 -v asistente-datos:/data asistente
#
# El volumen en /data es lo que evita perder las tareas en cada redespliegue.

FROM node:22-alpine AS dependencias
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS constructor
WORKDIR /app
COPY --from=dependencias /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV SALIDA_STANDALONE=1
RUN npm run build

FROM node:22-alpine AS ejecucion
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# Las tareas y el hilo viven aquí; monta un volumen en esta ruta.
ENV DATA_DIR=/data

RUN addgroup -g 1001 -S nodejs && adduser -S asistente -u 1001
RUN mkdir -p /data && chown asistente:nodejs /data

COPY --from=constructor /app/public ./public
COPY --from=constructor --chown=asistente:nodejs /app/.next/standalone ./
COPY --from=constructor --chown=asistente:nodejs /app/.next/static ./.next/static

USER asistente
EXPOSE 3000
VOLUME ["/data"]

CMD ["node", "server.js"]

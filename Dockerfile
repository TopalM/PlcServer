# ---- Base ----
FROM node:20-slim AS base
ENV NODE_ENV=production
# Sinyalleri düzgün yakalamak için tini
RUN apt-get update && apt-get install -y --no-install-recommends tini \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /usr/src/app

# Bağımlılıkları ayrı layer'da kur
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Uygulama kaynakları
COPY . .

# Güvenlik: non-root kullanıcı
USER node

# Sağlıklı sinyal yönetimi
ENTRYPOINT ["/usr/bin/tini", "--"]

# Çalıştır
CMD ["npm", "start"]

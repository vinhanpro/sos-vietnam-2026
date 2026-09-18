FROM node:22-bookworm-slim

ENV NODE_ENV=production \
    PORT=3000 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# DOCX/XLSX exports are part of the service contract.  The runtime has no npm
# dependencies, so avoid an unnecessary package-install step for Node itself.
RUN apt-get update \
    && apt-get install --no-install-recommends -y python3 python3-pip \
    && pip3 install --break-system-packages --no-cache-dir python-docx openpyxl \
    && ln -sf /usr/bin/python3 /usr/bin/python \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY . .

RUN groupadd --system sos \
    && useradd --system --gid sos --home-dir /app --no-create-home sos \
    && mkdir -p /var/lib/sos-data \
    && chown -R sos:sos /app /var/lib/sos-data

USER sos

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/healthz').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]

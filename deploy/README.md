# Panduan Deployment — WORKSTATION

Target: **Kontabo VPS** (Ubuntu 24.04) + server kantor. Stack: Node 22+, PostgreSQL 16, systemd.

## 1. Prasyarat Server

```bash
# Node.js 22+ (via nvm atau nodesource)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql-client

# PostgreSQL 16 (container atau native) — pastikan sudah berjalan
```

## 2. Deploy Aplikasi

```bash
git clone <REMOTE_URL> /opt/workstation && cd /opt/workstation
npm install          # atau: bun install --frozen-lockfile

# Konfigurasi environment
cp .env.example .env
nano .env            # isi: DATABASE_URL (wajib), JWT_SECRET (min 32 char,
                     #       GANTI dari default!), GITHUB_WEBHOOK_SECRET,
                     #       AGENT_INGEST_TOKEN (token kuat, acak)

# Build & migrasi
npm run build
npm run db:migrate
npm run db:seed      # opsional: data demo
```

## 3. systemd — API Server

Salin `deploy/workstation.service` ke `/etc/systemd/system/`, lalu:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now workstation
sudo systemctl status workstation
```

## 4. systemd — Agent Daemon (di tiap server yang dimonitor)

```bash
# Salin folder agent/ + package.json minimal ke server target,
# lalu pasang unit:
sudo cp deploy/workstation-agent.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now workstation-agent
journalctl -u workstation-agent -f   # pantau
```

Env agent (di `/opt/workstation/.env` server target):
```
AGENT_SERVER_URL=https://workstation.<domain-anda>
AGENT_TOKEN=<samakan dengan AGENT_INGEST_TOKEN di server utama>
AGENT_SERVER_NAME=kantor-01        # nama unik per server
AGENT_SERVICES=nginx:http:127.0.0.1:80;mysql:tcp:127.0.0.1:3306;redis:tcp:127.0.0.1:6379
```

## 5. Nginx Reverse Proxy (server utama)

```nginx
server {
    server_name workstation.<domain-anda>;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header X-Real-IP $remote_addr;      # wajib: akurasi rate-limit per IP
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }
}
```

> **Catatan trust proxy:** pasang `app.set("trust proxy", 1)` bila di balik Nginx agar
> rate-limit & audit membaca IP asli klien.

## 6. Checklist Go-Live

- [ ] `JWT_SECRET` diganti (min 32 karakter acak) — jangan pakai default
- [ ] `AGENT_INGEST_TOKEN` kuat & sama antara server utama dan semua agen
- [ ] `npm run db:migrate` sukses di DB produksi
- [ ] HTTPS aktif (certbot)
- [ ] CI hijau di cabang main
- [ ] Backup harian PostgreSQL (`pg_dump` cron)

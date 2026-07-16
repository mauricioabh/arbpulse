# Deploy en VPS (Hetzner) — Arb Pulse

Despliegue con Docker Compose para correr 24/7 desde la rama `main`. El contenedor
`app` (Node + tsx) queda en `127.0.0.1:8080` y un **reverse proxy del host** expone
HTTPS. Dos modos:

- **Opción A — detrás de nginx existente (recomendado en este VPS).** El servidor ya
  corre nginx en 80/443 con certbot para otras apps (p. ej. `consumet.wayool.com`,
  `openclaw.wayool.com`). Se agrega un vhost para `arbpulse.wayool.com` y punto.
- **Opción B — Caddy bundleado.** Solo para un server **fresco** sin nada en 80/443.

## Prerrequisitos

1. VPS Ubuntu/Debian (recomendado 2 vCPU / 2 GB RAM — p. ej. Hetzner CX22).
2. Subdominio `arbpulse.wayool.com` con registro **A → IP del VPS** (ya creado en
   Cloudflare, ver abajo).
3. Docker + plugin compose (el `deploy.sh` los instala si faltan).

## DNS en Cloudflare (zona wayool.com)

- Registro **A**, nombre `arbpulse`, contenido = IP del VPS, **"DNS only" (nube gris)**.
  - Motivo: certbot/Caddy emiten el cert vía HTTP-01 (reto directo al origen) y el
    SSE de `/api/stream` fluye sin buffering del proxy de Cloudflare.
- Verificar: `dig +short arbpulse.wayool.com` debe devolver la IP del VPS.

---

## Opción A — detrás del nginx existente (recomendado)

No toca tus otras apps ni Caddy. Solo levanta el contenedor `app` en loopback y le
pone un vhost de nginx con certbot (mismo patrón que consumet/openclaw).

```bash
# 1) Traer y correr el script (1ra vez: crea .env y se detiene). App-only por default.
curl -fsSL https://raw.githubusercontent.com/mauricioabh/arbpulse/main/deploy/deploy.sh -o /tmp/arbpulse-deploy.sh
bash /tmp/arbpulse-deploy.sh

# 2) Editar el .env (DOMAIN + secretos opcionales)
nano /opt/arbpulse/deploy/.env       # DOMAIN=arbpulse.wayool.com ; SENTRY_TRACING=false ; ...

# 3) Volver a correr: build + up del contenedor app (127.0.0.1:8080)
bash /tmp/arbpulse-deploy.sh

# 4) Instalar el vhost de nginx y emitir el cert
sudo cp /opt/arbpulse/deploy/nginx/arbpulse.wayool.com.conf /etc/nginx/sites-available/arbpulse.wayool.com
sudo ln -s /etc/nginx/sites-available/arbpulse.wayool.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d arbpulse.wayool.com
```

El vhost (`deploy/nginx/arbpulse.wayool.com.conf`) trae `proxy_buffering off` y
timeouts largos para que el SSE funcione. certbot copia el bloque `location` al
server TLS que genera, así que los ajustes SSE se mantienen en HTTPS.

## Opción B — Caddy bundleado (server fresco, sin nginx)

Solo si nada más usa 80/443:

```bash
cd /opt/arbpulse/deploy
cp .env.vps.example .env && nano .env          # DOMAIN=arbpulse.wayool.com ...
WITH_CADDY=1 bash /tmp/arbpulse-deploy.sh       # o: docker compose --profile caddy up -d --build
```

---

## Verificar

```bash
docker compose -f /opt/arbpulse/deploy/docker-compose.yml ps   # app healthy/running
curl -s http://127.0.0.1:8080/api/health                        # local
curl -s https://arbpulse.wayool.com/api/health                  # público (HTTPS)
```

Dashboard: `https://arbpulse.wayool.com` → badge **LIVE** y los 4 exchanges.

## Variables de entorno

Ver `.env.vps.example`. Claves:

- `DOMAIN` — `arbpulse.wayool.com` (usado por Caddy en Opción B; informativo en A).
- `SENTRY_DSN` — opcional; activa error monitoring.
- `SENTRY_TRACING` — dejar en `false` (default) para no consumir la cuota free-tier
  de spans en operación 24/7.
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — opcionales (rate limit +
  cache). Vacío = desactivado.

> Nunca comitees el `.env` real. Solo `.env.vps.example` vive en el repo.

## Operación

```bash
cd /opt/arbpulse/deploy
docker compose logs -f app        # logs de la app
docker compose restart app        # reiniciar
docker compose down               # detener (app; agrega --profile caddy si aplica)
bash /tmp/arbpulse-deploy.sh      # actualizar (git pull main + rebuild)
```

## Notas

- El puerto 8080 se publica solo en `127.0.0.1` (no expuesto a Internet); el tráfico
  público entra por el reverse proxy del host (nginx o Caddy).
- La app ya envía `X-Accel-Buffering: no` en el SSE, que nginx respeta para no
  bufferear ese response.
- Región: Hetzner no tiene Asia; para menor latencia a Binance/Bybit/OKX evalúa un
  VPS en Singapur. Para Kraken (EU) Falkenstein/Helsinki va bien.

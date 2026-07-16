# Deploy en VPS (Hetzner) — Arb Pulse

Despliegue con Docker Compose: el contenedor `app` (Node + tsx) detrás de
`caddy`, que emite HTTPS automáticamente (Let's Encrypt). Pensado para correr
24/7 desde la rama `main`.

## Prerrequisitos

1. VPS Ubuntu/Debian (recomendado 2 vCPU / 2 GB RAM — p. ej. Hetzner CX22).
2. Subdominio en Cloudflare (zona `wayool.com`): `arbpulse.wayool.com` con un
   registro **A → IP del VPS**. Ver "DNS en Cloudflare" abajo.
3. Puertos abiertos:
   ```bash
   sudo ufw allow 22 && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw --force enable
   ```

## DNS en Cloudflare (zona wayool.com)

El dominio `wayool.com` está gestionado por Cloudflare. La app se sirve en el
subdominio **`arbpulse.wayool.com`**.

- Registro: **A**, nombre `arbpulse`, contenido = IP pública del VPS.
- **Proxy: "DNS only" (nube gris), NO proxied (nube naranja).**
  - Motivo: Caddy emite el cert Let's Encrypt vía HTTP-01 (requiere que el reto en
    el puerto 80 llegue directo al origen), y el stream SSE de `/api/stream` fluye
    sin el buffering/timeout del proxy de Cloudflare.
  - Si más adelante querés proxear con Cloudflare (naranja) para ocultar la IP,
    hay que cambiar Caddy a challenge DNS-01 (plugin `caddy-dns/cloudflare` + token
    de API) y poner SSL/TLS en "Full (strict)". No es necesario para arrancar.
- Verificar propagación: `dig +short arbpulse.wayool.com` debe devolver la IP del
  VPS antes de que Caddy pida el certificado.

## Deploy (para el agente del VPS)

Todo lo hace el script idempotente `deploy.sh` (instala Docker si falta, clona o
actualiza el repo, y levanta los contenedores). Es seguro re-ejecutarlo.

```bash
# 1) Traer el script y ejecutarlo (primera vez: crea .env y se detiene)
curl -fsSL https://raw.githubusercontent.com/mauricioabh/arbpulse/main/deploy/deploy.sh -o /tmp/arbpulse-deploy.sh
bash /tmp/arbpulse-deploy.sh

# 2) Editar el .env con el dominio y secretos
nano /opt/arbpulse/deploy/.env      # DOMAIN=... ; SENTRY_DSN=... (opcional) ; UPSTASH_* (opcional)

# 3) Volver a ejecutar para construir y arrancar
bash /tmp/arbpulse-deploy.sh
```

Alternativa (si ya está clonado el repo en `/opt/arbpulse`):

```bash
cd /opt/arbpulse/deploy
cp .env.vps.example .env && nano .env      # solo la primera vez
docker compose up -d --build
```

## Verificar

```bash
docker compose -f /opt/arbpulse/deploy/docker-compose.yml ps
curl -s http://127.0.0.1:8080/api/health          # local
curl -s https://TU_DOMINIO/api/health             # público (tras propagar DNS)
```

Dashboard: `https://TU_DOMINIO` → badge **LIVE** y los 4 exchanges en la matriz.

## Variables de entorno

Ver `.env.vps.example`. Claves:

- `DOMAIN` — dominio para Caddy/HTTPS (obligatorio).
- `SENTRY_DSN` — opcional; activa error monitoring.
- `SENTRY_TRACING` — dejar en `false` (default) para no consumir la cuota
  free-tier de spans en operación 24/7.
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — opcionales (rate limit
  + cache). Vacío = desactivado.

> Nunca comitees el `.env` real. Solo `.env.vps.example` vive en el repo.

## Operación

```bash
cd /opt/arbpulse/deploy
docker compose logs -f app        # logs de la app
docker compose restart app        # reiniciar
docker compose down               # detener
bash /tmp/arbpulse-deploy.sh      # actualizar (git pull main + rebuild)
```

## Notas

- Caddy usa `flush_interval -1` para que el SSE (`/api/stream`) fluya en tiempo
  real; no comprimir `text/event-stream`.
- El puerto 8080 se publica solo en `127.0.0.1` (no expuesto a Internet); el
  tráfico público entra por Caddy (80/443).
- Región: Hetzner no tiene Asia; para menor latencia a Binance/Bybit/OKX evalúa
  un VPS en Singapur. Para Kraken (EU) Falkenstein/Helsinki va bien.

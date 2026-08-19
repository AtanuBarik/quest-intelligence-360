# Docker deployment

Quest Intelligence 360 is a static frontend. The Docker image serves the complete repository runtime through Nginx, including `index.html`, `chunks/`, `integrations/`, assets, data files, and other relative paths used by the frontend.

## 1. Build and run locally

```bash
docker compose up -d --build
```

Open:

```text
http://localhost:8080
```

Check container health:

```bash
docker compose ps
curl http://localhost:8080/healthz
```

Stop it with:

```bash
docker compose down
```

## 2. Use another host port

The Compose file publishes port `8080` by default. Override it with `QUEST_PORT`:

```bash
QUEST_PORT=8088 docker compose up -d --build
```

For a host where the container should bind directly to HTTP port 80:

```bash
QUEST_PORT=80 docker compose up -d --build
```

## 3. Share the Docker image with a teammate

Build a named image:

```bash
docker build -t quest-intelligence-360:1.0 .
```

### Option A - share as an image archive

Export:

```bash
docker save quest-intelligence-360:1.0 | gzip > quest-intelligence-360_1.0.tar.gz
```

Your teammate can import and run it:

```bash
gunzip -c quest-intelligence-360_1.0.tar.gz | docker load
docker run -d \
  --name quest-intelligence-360 \
  --restart unless-stopped \
  -p 8080:80 \
  quest-intelligence-360:1.0
```

### Option B - share the repository

Your teammate can clone the repository and run:

```bash
docker compose up -d --build
```

### Option C - use your organization's container registry

Tag the image for the registry approved by your organization, push it, and let the hosting environment pull that image. Keep credentials outside the repository.

## 4. Put it on a custom URL

The container listens on port 80 internally. A custom domain or subdomain should normally point to the host, load balancer, ingress, or reverse proxy that fronts the container.

Recommended URL shape:

```text
https://quest360.example.com/
```

The frontend is designed to be served from the site root. Hosting under a nested path such as `https://example.com/quest360/` may require additional path rewriting and testing because runtime assets are loaded with relative URLs.

### Example host-level Nginx reverse proxy

Run the container on `127.0.0.1:8080`, then use a host-level Nginx or corporate ingress configuration similar to:

```nginx
server {
    listen 80;
    server_name quest360.example.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Terminate HTTPS at your organization's approved reverse proxy, ingress controller, load balancer, or certificate-management layer.

## 5. Production notes

- The current application is a static prototype; the existing login check is browser-side and is not production authentication.
- Do not treat the Docker container itself as an access-control layer.
- For internal or client-sensitive deployment, place the site behind approved SSO / Microsoft Entra ID, VPN, zero-trust access, or another organization-approved authentication gateway.
- Do not bake API keys, passwords, tokens, client-confidential project files, raw expert transcripts, respondent-level survey data, or other secrets into the Docker image.
- The frontend may rely on external browser resources such as web fonts. If the deployment environment blocks outbound browser access, mirror or self-host those dependencies before production use.

## 6. Files added for Docker hosting

- `Dockerfile` - builds the Nginx-based static frontend image.
- `nginx.conf` - serves the frontend, provides SPA-style fallback and `/healthz`.
- `docker-compose.yml` - one-command local/server startup.
- `.dockerignore` - keeps Git/build-only files out of the image.

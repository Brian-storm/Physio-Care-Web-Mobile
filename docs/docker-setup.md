# PhysioCare — Docker Setup Guide

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows / macOS / Linux)
- Docker Compose (included with Docker Desktop)

Verify installation:

```bash
docker --version
docker compose version
```

---

## Starting the Project

```bash
# From the project root (PhysioCare/)
docker compose up
```

This builds images (first time only) and starts both services:

| Service  | URL                     | Port Mapping         |
| -------- | ----------------------- | -------------------- |
| Frontend | http://localhost:3000   | `Host:3000 → Container:3000` |
| Backend  | http://localhost:8000   | `Host:8000 → Container:8000` |
| API docs | http://localhost:8000/docs | Swagger UI              |

### Detached mode (run in background)

```bash
docker compose up -d
```

### Rebuild images after dependency changes

```bash
docker compose up --build
```

---

## Stopping the Project

```bash
# Stop containers (keeps data volumes intact)
docker compose down
```

### Stop + remove volumes (reset SQLite database)

```bash
docker compose down -v
```

> ⚠️ `-v` deletes the `backend_data` volume, wiping the local SQLite database.

### Stop + remove everything (volumes + images)

```bash
docker compose down --rmi all -v
```

---

## Common Commands

| Action                     | Command                         |
| -------------------------- | ------------------------------- |
| View running containers   | `docker compose ps`             |
| View logs (all services)  | `docker compose logs -f`        |
| View logs (one service)   | `docker compose logs -f backend` |
| Open shell in container   | `docker compose exec backend bash` |
| Open shell (frontend)     | `docker compose exec frontend sh` |

---

## Useful Shortcuts

Add aliases to your shell profile for convenience:

```bash
# PowerShell (add to $PROFILE)
function dc-up   { docker compose up }
function dc-down { docker compose down }
function dc-logs { docker compose logs -f }
```

```bash
# Bash / Zsh (add to ~/.bashrc or ~/.zshrc)
alias dc-up='docker compose up'
alias dc-down='docker compose down'
alias dc-logs='docker compose logs -f'
```

---

## Troubleshooting

### Port already in use

If port `3000` or `8000` is already taken on your host, change the host-side port mapping
in `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"   # frontend
  - "8001:8000"   # backend
```

Then update `NEXT_PUBLIC_API_URL` in the frontend environment to use the backend's host port.

### Changes not reflected in hot-reload

The compose file mounts the source directories as volumes, so code changes are reflected
immediately. If hot-reload stops working, restart the containers:

```bash
docker compose restart
```

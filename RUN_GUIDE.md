# ToolRoomOS — Run & Execution Guide 🚀

> **Target Audience**: Human Developers & Autonomous AI Agents.  
> **Purpose**: Spin up and verify the full ToolRoomOS stack in under 30 seconds without full-codebase scanning or trial-and-error.

---
 
## ⚡ 1. Instant TL;DR (Quick Start)

Run these two commands from the project root (`ToolROOMoS/`):

```bash
# 1. Start Database, Redis, and Backend in Docker (detached)
docker compose up -d postgres redis backend

# 2. Start Frontend locally on host (with Next.js Turbopack)
npm run dev --prefix frontend
```

### Active Ports & URLs Reference Table

| Service | Technology | Port (Host) | Internal Port | URL / Health Check |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | Next.js 16 (Turbopack) | `3000` | `3000` | [http://localhost:3000](http://localhost:3000) |
| **Backend API** | NestJS 11 | `4000` | `4000` | [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health) |
| **PostgreSQL** | Postgres 15 Alpine | `5433` | `5432` | `postgresql://root:rootpassword@localhost:5433/toolroomos` |
| **Redis** | Redis 7 Alpine | `6380` | `6379` | `redis://localhost:6380` |

---

## 🔑 2. Default Login Credentials

Seeded in PostgreSQL table `users` by `prisma/seed.ts`:

* **Login URL**: [http://localhost:3000](http://localhost:3000)
* **Email**: `admin@toolroom.com`
* **Password**: `admin123`
* **Role**: `ADMIN` (System Admin)
* **API Login Endpoint**: `POST http://localhost:4000/api/v1/auth/login`

---

## 🧠 3. Critical Context for AI Agents (Read Before Running)

To prevent getting stuck or wasting context tokens on lengthy codebase scans:

1. **Non-Standard Host Ports**:
   * PostgreSQL host port is mapped to **`5433`** (NOT default 5432) to prevent collisions with host Postgres instances.
   * Redis host port is mapped to **`6380`** (NOT default 6379).
   * Backend inside Docker connects to `postgres:5432` and `redis:6379` via the `toolroomos_default` Docker network.

2. **Backend Execution Mode**:
   * **Recommended**: Run Backend in Docker (`docker compose up -d backend`). It uses Docker stage `target: builder` from `backend/Dockerfile` with Node 20.
   * **Avoid**: Do NOT run raw `nest build` or `tsc --noEmit` locally without `tsconfig.build.json`. In `backend/tsconfig.json`, `exclude` is omitted, causing local TypeScript to scan all 800+ packages in `node_modules` and stall.

3. **Frontend Execution Mode**:
   * Frontend runs on the host using Next.js 16 Turbopack: `npm run dev --prefix frontend`.
   * It proxies requests to Backend via `frontend/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1`.

---

## 🛠️ 4. Step-by-Step Setup & Verification

### Step 1: Start Infrastructure & Backend
```bash
docker compose up -d postgres redis backend
```
Wait ~5 seconds for Postgres and Redis health checks to turn healthy and Backend to start.

### Step 2: Verify Backend Health
```bash
curl -s http://localhost:4000/api/v1/health
```
**Expected Response**:
```json
{"success":true,"data":{"status":"ok","timestamp":"...","service":"ToolRoomOS Backend"},"message":"Operation completed successfully"}
```

### Step 3: Start Frontend
```bash
npm run dev --prefix frontend
```
**Expected Output**:
```
▲ Next.js 16.2.10 (Turbopack)
- Local: http://localhost:3000
✓ Ready in ~500ms
```

### Step 4: Verify Frontend
```bash
curl -I http://localhost:3000
```
**Expected Response**: `HTTP/1.1 200 OK`

---

## 🔄 5. Management Commands

### Check Status of Containers
```bash
docker compose ps
```

### View Backend Logs
```bash
docker logs -f toolroomos-backend
```

### Rebuild Backend Docker Image (after backend source changes)
```bash
docker compose build backend
docker compose up -d backend
```

### Run Database Migrations or Seed
```bash
# Inside running postgres container or via local prisma:
npx --prefix backend prisma migrate dev
npx --prefix backend ts-node backend/prisma/seed.ts
```

### Stop All Services
```bash
# Stop Docker services
docker compose down

# To stop Frontend: Send SIGINT (Ctrl+C) to the frontend process
```

---

## ❓ 6. Common Troubleshooting

| Issue | Cause | Quick Fix |
| :--- | :--- | :--- |
| `Couldn't connect to server` on port 4000 | Backend container is stopped or building | Check `docker compose ps` and `docker logs toolroomos-backend` |
| `port is already allocated: 5433` | Another container or service using 5433 | `lsof -i :5433` and stop conflicting process or `docker rm -f toolroomos-postgres` |
| Frontend fails to reach API | Backend not responding or CORS issue | Confirm `curl http://localhost:4000/api/v1/health` returns `status: ok` |
| `Prisma Client not generated` | Local client missing | Run `cd backend && npx prisma generate` |

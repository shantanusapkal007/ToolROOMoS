# ToolRoomOS — AWS Production Deployment Guide

This guide outlines the production deployment architectures and step-by-step procedures for deploying **ToolRoomOS** on Amazon Web Services (AWS).

---

## 1. Deployment Architecture Options

```
                              ┌──────────────────────────────────────┐
                              │           AWS Route 53 / DNS         │
                              └──────────────────┬───────────────────┘
                                                 │
                                                 ▼
                              ┌──────────────────────────────────────┐
                              │  Application Load Balancer (ALB)     │
                              │  HTTPS (ACM TLS/SSL Certificate)     │
                              └──────────┬────────────────┬──────────┘
                                         │                │
                        ┌────────────────┘                └────────────────┐
                        ▼                                                  ▼
           ┌─────────────────────────┐                        ┌─────────────────────────┐
           │   Frontend Container    │                        │    Backend Container    │
           │   (Next.js / Port 3000) │                        │   (NestJS / Port 4000)  │
           └─────────────────────────┘                        └────────────┬────────────┘
                                                                           │
                                      ┌────────────────────────────────────┼────────────────────────────────────┐
                                      ▼                                    ▼                                    ▼
                         ┌────────────────────────┐           ┌────────────────────────┐           ┌────────────────────────┐
                         │   AWS RDS PostgreSQL   │           │  AWS ElastiCache Redis │           │     AWS S3 / MinIO     │
                         │   (Multi-AZ, Encrypted)│           │   (In-Memory Caching)  │           │   (Object Storage)     │
                         └────────────────────────┘           └────────────────────────┘           └────────────────────────┘
```

---

## Option A: Fast EC2 Deployment (Docker Compose)
Best for single-server production deployment with automated maintenance.

### 1. Launch an EC2 Instance
- **Instance Type:** `t3.large` or `t3.xlarge` (min 2 vCPU, 8GB RAM recommended)
- **OS:** Ubuntu 22.04 LTS or Amazon Linux 2023
- **Storage:** 50GB–100GB gp3 EBS volume
- **Security Group Inbound Rules:**
  - `80` (HTTP) & `443` (HTTPS) from `0.0.0.0/0`
  - `22` (SSH) from your IP
  - `3000` (Frontend) & `4000` (Backend API) if not behind Nginx

### 2. Install Docker & Docker Compose
```bash
sudo apt update && sudo apt install -y docker.io docker-compose git
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

### 3. Clone Repository and Configure Environment
```bash
git clone https://github.com/your-org/ToolRoomOS.git
cd ToolRoomOS

# Create production environment file
cp backend/.env.example backend/.env
```

Edit `backend/.env` with secure secrets:
```env
NODE_ENV=production
PORT=4000
AUTO_MIGRATE=true
JWT_SECRET=your_super_strong_64_character_secret_key_here
DB_PASSWORD=your_secure_postgres_password
MINIO_PASSWORD=your_secure_minio_password
ALLOWED_ORIGINS=https://toolroom.yourcompany.com,http://YOUR_EC2_PUBLIC_IP:3000
```

### 4. Build and Run Services
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### 5. Verify Running Services
```bash
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f backend
```

---

## Option B: Enterprise Multi-Tier AWS (ECS Fargate + RDS + S3 + ElastiCache)
Best for high availability, zero-downtime rolling updates, and enterprise scaling.

### 1. Database (AWS RDS PostgreSQL)
1. Create an **RDS PostgreSQL 15+** instance.
2. Select **Multi-AZ** for high availability.
3. Enable **Storage Encryption** (AWS KMS).
4. Set the `DATABASE_URL` connection string:
   ```env
   DATABASE_URL=postgresql://dbadmin:YOUR_PASSWORD@your-rds-endpoint.rds.amazonaws.com:5432/toolroomos?schema=public&sslmode=require
   DB_SSL=true
   ```

### 2. Object Storage (Amazon S3)
1. Create an S3 Bucket (e.g., `toolroomos-enterprise-storage`).
2. Block all public access (files are accessed via presigned URLs).
3. Enable default AES-256 encryption.
4. Attach an IAM Role with `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`, and `s3:ListBucket` permissions to your ECS Task Execution Role.
5. In Backend environment:
   ```env
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=toolroomos-enterprise-storage
   # MINIO_ENDPOINT is omitted to activate native AWS S3 mode
   ```

### 3. Cache & Session Store (AWS ElastiCache Redis)
1. Create a Redis cluster in the same VPC.
2. Provide the endpoint in `REDIS_URL`:
   ```env
   REDIS_URL=rediss://your-cluster.cache.amazonaws.com:6379
   ```

### 4. Container Deployment (AWS ECS Fargate / App Runner)
1. Build and push Docker images to **Amazon ECR** (Elastic Container Registry):
   ```bash
   # Authenticate with ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

   # Build & Push Backend
   docker build -t toolroomos-backend ./backend
   docker tag toolroomos-backend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/toolroomos-backend:latest
   docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/toolroomos-backend:latest

   # Build & Push Frontend (pass your backend domain)
   docker build --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1 -t toolroomos-frontend ./frontend
   docker tag toolroomos-frontend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/toolroomos-frontend:latest
   docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/toolroomos-frontend:latest
   ```
2. Create ECS Task Definitions for Backend and Frontend.
3. Configure ALB Target Groups:
   - **Backend Health Check Path:** `/health` (Port 4000, Success Code: 200)
   - **Frontend Health Check Path:** `/` (Port 3000, Success Code: 200)

---

## 3. Database Initialization & Seeding on AWS
When the backend container starts with `AUTO_MIGRATE=true`, it automatically executes `prisma migrate deploy`.

To seed initial Admin users and Role-Based Access Control (RBAC) permissions on a fresh AWS database:
```bash
# Inside the backend container or from an authorized workstation with DATABASE_URL set:
npx ts-node prisma/seed-admin.ts
```

Default administrator credentials:
- **Email:** `admin@toolroom.com`
- **Initial Password:** `admin123` *(Must be changed immediately upon first login)*

---

## 4. Production Health Checks & Monitoring
- **Backend Health:** `GET https://api.yourdomain.com/health` (returns `{ status: 'ok', timestamp: '...' }`)
- **Backend Database Readiness:** `GET https://api.yourdomain.com/ready` (tests PostgreSQL live connection)
- **Frontend Health:** `GET https://app.yourdomain.com/` (HTTP 200 OK)

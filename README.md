# ⚡ SmartCloud AI Compiler

> A cloud-native, AI-powered code execution platform deployed on AWS with Kubernetes. Write, run, and get intelligent feedback on Python, Java, and C++ code — all from your browser.

![Status](https://img.shields.io/badge/status-live-brightgreen)
![AWS](https://img.shields.io/badge/cloud-AWS-FF9900?logo=amazonaws)
![Kubernetes](https://img.shields.io/badge/orchestration-Kubernetes-326CE5?logo=kubernetes)
![Spring Boot](https://img.shields.io/badge/backend-Spring%20Boot-6DB33F?logo=springboot)
![React](https://img.shields.io/badge/frontend-React-61DAFB?logo=react)
![Docker](https://img.shields.io/badge/containers-Docker-2496ED?logo=docker)

---

## 🌐 Live Application

| Environment | URL |
|-------------|-----|
| Production | http://13.206.82.29:30080 |
| Domain (pending DNS) | https://smartcloud.com |

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Implementation Phases](#implementation-phases)
- [Local Development Setup](#local-development-setup)
- [AWS Infrastructure](#aws-infrastructure)
- [Kubernetes Cluster](#kubernetes-cluster)
- [Security](#security)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)

---

## 🔍 Overview

SmartCloud AI Compiler is a full-stack cloud computing project that allows users to:

- Write and execute code in **Python, Java, and C++** directly in the browser
- Get **AI-powered explanations** of errors and code complexity analysis using **Groq Llama 3.3**
- View **submission history** with execution time, status, and re-open past code
- All executions run in **isolated Docker containers** with strict resource limits — safe from malicious code

The platform is deployed on **AWS** using a real **2-node Kubernetes cluster** (kubeadm), with Amazon RDS, S3, ECR, ALB, Route 53, and CloudWatch all integrated.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🖊️ Monaco Code Editor | VS Code-quality editor with syntax highlighting |
| ▶️ Code Execution | Run Python, Java, C++ in isolated Docker sandboxes |
| 🤖 AI Error Explain | Groq Llama 3.3 explains errors in plain English |
| 📊 AI Code Analyze | Big-O complexity analysis and optimization tips |
| 📋 Submission History | View, reopen, and delete past submissions |
| 🔐 JWT Authentication | Secure login and registration with token-based auth |
| ☁️ Cloud Native | Deployed on AWS with Kubernetes, ECR, RDS, S3, ALB |

---

## 🏗️ Architecture

```
Browser Client (Monaco Editor / React SPA)
         │
         ▼ DNS
Amazon Route 53 (smartcloud.com)
         │
         ▼
AWS Application Load Balancer (Port 80/443)
         │
    ┌────┴────┐
    ▼         ▼
EC2 Master   EC2 Worker      ← Kubernetes Cluster
(Control)    (Workloads)
                │
        ┌───────┴────────┐
        ▼                ▼
  Frontend Pod      Backend Pod
  (Nginx/React)   (Spring Boot)
                       │
              ┌────────┼────────┐
              ▼        ▼        ▼
           Amazon    Docker   Groq AI
            RDS      Runners  (Llama 3.3)
         (PostgreSQL) (Python/Java/C++)
              │                 │
              ▼                 ▼
          Amazon S3       CloudWatch
          (Outputs)       (Logs/Metrics)
```

---

## 🛠️ Tech Stack

### Frontend
| Tool | Purpose |
|------|---------|
| React.js | UI framework |
| Monaco Editor | VS Code-like code editor |
| Axios | HTTP API calls |
| React Router | Page navigation |
| CSS Variables | Dark terminal theme |

### Backend
| Tool | Purpose |
|------|---------|
| Spring Boot 3.4.5 | REST API framework |
| Spring Security | JWT authentication |
| Spring Data JPA | Database ORM |
| Hibernate | SQL query generation |
| jjwt | JWT token handling |
| Groq API (Llama 3.3) | AI error explain + code analyze |
| AWS SDK S3 | Log and output uploads |
| Lombok | Boilerplate reduction |
| Maven | Build and dependency management |

### Infrastructure
| Tool | Purpose |
|------|---------|
| Docker | Containerization |
| Kubernetes (kubeadm) | Container orchestration |
| Amazon EC2 | Compute nodes (master + worker) |
| Amazon ECR | Docker image registry |
| Amazon RDS | PostgreSQL managed database |
| Amazon S3 | Output and log storage |
| AWS ALB | Load balancing |
| Amazon Route 53 | DNS management |
| AWS ACM | SSL/TLS certificates |
| AWS CloudWatch | Logging and metrics |
| AWS IAM | Role-based access control |

---

## 📁 Project Structure

```
Project CC/
├── frontend/                          # React.js application
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js               # Pre-configured axios instance
│   │   │   └── services.js            # All API call functions
│   │   ├── context/
│   │   │   └── AuthContext.jsx        # Global auth state
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── CodeEditor.jsx         # Monaco editor wrapper
│   │   │   └── OutputPanel.jsx        # Output / AI tabs
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx           # Login + Register
│   │   │   ├── EditorPage.jsx         # Main workspace
│   │   │   └── HistoryPage.jsx        # Submission history
│   │   ├── styles/                    # Per-component CSS
│   │   └── App.jsx                    # Router + protected routes
│   └── package.json
│
├── backend/
│   └── backend/
│       ├── src/main/java/com/smartcloud/
│       │   ├── controller/            # REST endpoints
│       │   ├── service/               # Business logic
│       │   ├── model/                 # JPA entities
│       │   ├── repository/            # Data access layer
│       │   ├── security/              # JWT filter + util
│       │   ├── dto/                   # Request/response shapes
│       │   └── config/                # Security + exception config
│       ├── src/main/resources/
│       │   └── application.properties # ⚠️ not committed — use .env
│       └── pom.xml
│
├── docker/
│   ├── backend.Dockerfile             # Multi-stage JDK build
│   ├── frontend.Dockerfile            # Nginx + React build
│   ├── runner-python.Dockerfile       # Python execution sandbox
│   ├── runner-java.Dockerfile         # Java execution sandbox
│   └── runner-cpp.Dockerfile          # C++ execution sandbox
│
├── k8s/
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   └── runners-deployment.yaml
│
├── .github/
│   └── workflows/
│       └── ci.yml                     # GitHub Actions CI/CD
│
├── docker-compose.yml                 # Local development stack
├── .gitignore
└── README.md
```

---

## 🚀 Implementation Phases

### Phase 1 — Application Development
- React frontend with Monaco Editor, Axios, JWT auth flow
- Spring Boot backend with REST APIs, JPA, Spring Security, Groq AI

### Phase 2 — Docker
- Isolated runner containers for Python, Java, C++
- Multi-stage Dockerfiles for backend and frontend
- Local testing with Docker Compose

### Phase 3 — Amazon ECR
- Created 5 ECR repositories
- Built, tagged, and pushed all Docker images

### Phase 4 — Kubernetes
- 2 EC2 instances — master (control plane) + worker (workloads)
- kubeadm init, Calico CNI, worker node joined
- K8s secrets for DB, JWT, Groq API key, ECR pull secret
- Deployed frontend, backend, runner pods

### Phase 5 — AWS Services
- Amazon RDS PostgreSQL with VPC security groups
- Amazon S3 for output storage with lifecycle policies
- Route 53 + ALB for DNS and load balancing
- CloudWatch for logs and metrics

---

## 💻 Local Development Setup

### Prerequisites
- Java 17+
- Node.js 18+
- Docker Desktop
- Maven
- PostgreSQL (local)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/project-cc.git
cd "project-cc"
```

### 2. Set up environment variables
Create `backend/backend/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/smartcloud
spring.datasource.username=postgres
spring.datasource.password=your-local-password
jwt.secret=SmartCloudSecretKey2024SuperSecure123456
jwt.expiration=86400000
openai.api.key=your-groq-api-key
server.port=8082
spring.jpa.hibernate.ddl-auto=update
```

### 3. Build Docker runner images
```bash
docker build -f docker/runner-python.Dockerfile -t smartcloud-runner-python .
docker build -f docker/runner-java.Dockerfile   -t smartcloud-runner-java .
docker build -f docker/runner-cpp.Dockerfile    -t smartcloud-runner-cpp .
```

### 4. Run with Docker Compose
```bash
docker-compose up --build
```

### 5. Or run individually
```bash
# Backend
cd backend/backend
mvn spring-boot:run

# Frontend
cd frontend
npm install
npm start
```

App runs at:
- Frontend → http://localhost:3000
- Backend  → http://localhost:8082

---

## ☁️ AWS Infrastructure

### Resource Summary

| Resource | Name / ID | Specification |
|----------|-----------|---------------|
| VPC | vpc-0a4d0754ca5bbe056 | 172.31.0.0/16 |
| EC2 Master | 172.31.41.4 | t3.medium — control plane |
| EC2 Worker | 172.31.43.176 | t3.medium — workloads |
| Amazon ECR | 5 repositories | backend, frontend, runners |
| Amazon RDS | smartcloud-db | PostgreSQL db.t3.micro |
| Amazon S3 | smartcloud-outputs | Private, lifecycle policy |
| ALB | smartcloud-alb | Port 80/443 internet-facing |
| Route 53 | smartcloud.com | Hosted zone active |
| CloudWatch | /smartcloud/backend-logs | 7-day retention |

### Push images to ECR
```bash
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin \
  <account-id>.dkr.ecr.ap-south-1.amazonaws.com

docker build -f docker/backend.Dockerfile  -t smartcloud-backend .
docker tag  smartcloud-backend:latest \
  <account-id>.dkr.ecr.ap-south-1.amazonaws.com/smartcloud-backend:latest
docker push <account-id>.dkr.ecr.ap-south-1.amazonaws.com/smartcloud-backend:latest
```

---

## ☸️ Kubernetes Cluster

### Cluster Info
| Node | Role | IP | Version |
|------|------|----|---------|
| ip-172-31-41-4 | control-plane | 172.31.41.4 | v1.29.15 |
| ip-172-31-43-176 | worker | 172.31.43.176 | v1.29.15 |

### Deploy to cluster
```bash
# Apply all manifests
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/runners-deployment.yaml

# Check status
kubectl get pods -o wide
kubectl get services
```

### Pod Resource Limits

| Pod | Memory Request | Memory Limit | CPU Request | CPU Limit |
|-----|---------------|--------------|-------------|-----------|
| Frontend (Nginx) | 128Mi | 256Mi | 100m | 250m |
| Backend (Spring Boot) | 512Mi | 1024Mi | 250m | 500m |
| Runner (sandbox) | — | 256Mi | — | 500m |

---

## 🔐 Security

### Code Execution Sandboxing
Every code submission runs in an isolated Docker container with:
```
--network=none        No internet access
--memory=256m         Hard memory cap
--cpus=0.5            CPU limit
--ulimit nproc=64     No fork bombs
--ulimit nofile=64    File descriptor limit
--rm                  Auto-delete after execution
10s timeout           Kills infinite loops
```

### Authentication Flow
```
User login → JWT token (24h expiry) → stored in localStorage
Every API request → Authorization: Bearer <token>
JwtAuthFilter → validates token → sets SecurityContext
```

### IAM Least Privilege
EC2 nodes use `SmartCloud-Node-Role` with only:
- `s3:PutObject / GetObject / ListBucket` on `smartcloud-outputs` only
- `logs:CreateLogStream / PutLogEvents` on `/smartcloud/backend-logs` only
- `cloudwatch:PutMetricData` for custom metrics

---

## 🔧 Environment Variables

| Variable | Description | Where Used |
|----------|-------------|------------|
| `DB_URL` | PostgreSQL JDBC URL | Backend (K8s secret) |
| `DB_USERNAME` | Database username | Backend (K8s secret) |
| `DB_PASSWORD` | Database password | Backend (K8s secret) |
| `JWT_SECRET` | JWT signing key (32+ chars) | Backend (K8s secret) |
| `OPENAI_API_KEY` | Groq API key | Backend (K8s secret) |

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, returns JWT |
| POST | `/api/execute` | ✅ | Execute code in Docker |
| POST | `/api/ai/explain` | ✅ | AI error explanation |
| POST | `/api/ai/analyze` | ✅ | AI complexity analysis |
| GET | `/api/history` | ✅ | Get all submissions |
| GET | `/api/history/{id}` | ✅ | Get single submission |
| DELETE | `/api/history/{id}` | ✅ | Delete submission |
| GET | `/actuator/health` | ❌ | Health check (K8s probe) |

---

## 👤 Author

**Mahav / Ritu Solanki**
Cloud Computing Project — SmartCloud AI Compiler
AWS · Kubernetes · Spring Boot · React · Docker · Groq AI

---

> ⭐ If you found this project helpful, give it a star on GitHub!

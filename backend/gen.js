const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, LevelFormat, BorderStyle, WidthType,
  ShadingType, PageNumber, NumberFormat, Footer, Header
} = require('docx');
const fs = require('fs');

const ACCENT = "1F4E79";
const LIGHT_BLUE = "D6E4F0";
const MID_BLUE = "2E75B6";
const LIGHT_GRAY = "F2F2F2";
const DARK_GRAY = "404040";
const CODE_BG = "F4F4F4";
const CODE_COLOR = "C0392B";

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: MID_BLUE, space: 6 } },
    children: [new TextRun({ text, bold: true, size: 32, color: ACCENT, font: "Arial" })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, bold: true, size: 26, color: MID_BLUE, font: "Arial" })]
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, size: 22, color: DARK_GRAY, font: "Arial" })]
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text, size: 22, font: "Arial", ...opts })]
  });
}

function bold(text) {
  return new TextRun({ text, bold: true, size: 22, font: "Arial" });
}

function code(text) {
  return new TextRun({ text, font: "Courier New", size: 18, color: CODE_COLOR });
}

function mixedPara(runs, opts = {}) {
  return new Paragraph({ spacing: { before: 80, after: 80 }, ...opts, children: runs });
}

function bullet(runs, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { before: 60, after: 60 },
    children: Array.isArray(runs) ? runs : [new TextRun({ text: runs, size: 22, font: "Arial" })]
  });
}

function numbered(runs, ref = "numbers") {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { before: 60, after: 60 },
    children: Array.isArray(runs) ? runs : [new TextRun({ text: runs, size: 22, font: "Arial" })]
  });
}

function codeBlock(lines) {
  return lines.map(line =>
    new Paragraph({
      spacing: { before: 0, after: 0 },
      shading: { fill: CODE_BG, type: ShadingType.CLEAR },
      indent: { left: 360 },
      children: [new TextRun({ text: line, font: "Courier New", size: 18, color: "2C2C2C" })]
    })
  );
}

function spacer(n = 1) {
  return Array.from({ length: n }, () =>
    new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun("")]})
  );
}

function infoBox(labelText, bodyText) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "B0C4DE" };
  const borders = { top: border, bottom: border, left: border, right: border };
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({
      children: [new TableCell({
        borders,
        shading: { fill: LIGHT_BLUE, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 180, right: 180 },
        width: { size: 9360, type: WidthType.DXA },
        children: [new Paragraph({
          spacing: { before: 0, after: 0 },
          children: [
            new TextRun({ text: labelText + "  ", bold: true, size: 20, font: "Arial", color: ACCENT }),
            new TextRun({ text: bodyText, size: 20, font: "Arial", color: DARK_GRAY })
          ]
        })]
      })]
    })]
  });
}

function sectionTable(rows) {
  const hdrBorder = { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" };
  const borders = { top: hdrBorder, bottom: hdrBorder, left: hdrBorder, right: hdrBorder };
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2200, 3080, 4080],
    rows: [
      new TableRow({
        tableHeader: true,
        children: ["Layer", "Technology", "Purpose"].map(t =>
          new TableCell({
            borders,
            shading: { fill: ACCENT, type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 140, right: 140 },
            width: { size: t === "Layer" ? 2200 : t === "Technology" ? 3080 : 4080, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 20, color: "FFFFFF", font: "Arial" })] })]
          })
        )
      }),
      ...rows.map(([a, b, c], i) => new TableRow({
        children: [[a, 2200], [b, 3080], [c, 4080]].map(([txt, w]) =>
          new TableCell({
            borders,
            shading: { fill: i % 2 === 0 ? "FFFFFF" : LIGHT_GRAY, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 140, right: 140 },
            width: { size: w, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: txt, size: 20, font: "Arial" })] })]
          })
        )
      }))
    ]
  });
}

const children = [
  // Cover title block
  new Paragraph({
    spacing: { before: 0, after: 0 },
    shading: { fill: ACCENT, type: ShadingType.CLEAR },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: " ", size: 20 })]
  }),
  new Paragraph({
    spacing: { before: 0, after: 0 },
    shading: { fill: ACCENT, type: ShadingType.CLEAR },
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text: "SmartCloud AI Compiler Platform", bold: true, size: 52, font: "Arial", color: "FFFFFF", break: 1 }),
    ]
  }),
  new Paragraph({
    spacing: { before: 0, after: 0 },
    shading: { fill: ACCENT, type: ShadingType.CLEAR },
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text: "Complete A-to-Z Production Architecture Handbook", size: 28, font: "Arial", color: "BDD7EE", break: 1 }),
    ]
  }),
  new Paragraph({
    spacing: { before: 0, after: 240 },
    shading: { fill: ACCENT, type: ShadingType.CLEAR },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: " ", size: 20 })]
  }),

  ...spacer(1),

  // ── SECTION 1 ──────────────────────────────────────────────────────────────
  h1("1. End-to-End System Architecture"),
  para("The SmartCloud platform routes every user request through a layered stack — from the browser through an AWS Application Load Balancer, into a Kubernetes cluster, through the Spring Boot backend, and into a transient Docker container. The major components and their connections are described below."),
  ...spacer(1),

  h2("Request Flow Summary"),
  bullet([bold("Browser Client"), new TextRun({ text: " — Monaco Editor sends HTTP/WebSocket requests to the public ALB endpoint on port 80/443.", size: 22, font: "Arial" })]),
  bullet([bold("AWS ALB"), new TextRun({ text: " — Load balancer distributes encrypted traffic to Kubernetes EC2 nodes on NodePort 30080.", size: 22, font: "Arial" })]),
  bullet([bold("Frontend Pod (Nginx)"), new TextRun({ text: " — Serves static React assets and reverse-proxies /api/* to the backend ClusterIP service.", size: 22, font: "Arial" })]),
  bullet([bold("Backend Pod (Spring Boot)"), new TextRun({ text: " — Handles REST API logic, JWT auth, code execution, and AI integration.", size: 22, font: "Arial" })]),
  bullet([bold("Docker Engine (Host)"), new TextRun({ text: " — Backend mounts /var/run/docker.sock to spawn transient compiler containers.", size: 22, font: "Arial" })]),
  bullet([bold("Amazon RDS (PostgreSQL)"), new TextRun({ text: " — Persists user accounts, submissions, and S3 log keys.", size: 22, font: "Arial" })]),
  bullet([bold("Amazon S3"), new TextRun({ text: " — Cold-storage archive for full execution logs (JSON).", size: 22, font: "Arial" })]),
  bullet([bold("AWS CloudWatch"), new TextRun({ text: " — Centralized logging and system metrics (JVM memory, disk space).", size: 22, font: "Arial" })]),
  bullet([bold("Groq AI (Llama 3.3)"), new TextRun({ text: " — External HTTPS API for AI error explanation and code analysis.", size: 22, font: "Arial" })]),
  ...spacer(1),

  infoBox("Key Design Principle:", "The browser client ONLY communicates with port 3000 (Nginx). Nginx forwards /api/* internally — eliminating all CORS complexity."),
  ...spacer(1),

  // ── SECTION 2 ──────────────────────────────────────────────────────────────
  h1("2. A-to-Z Technology Stack"),
  para("The platform is built on five distinct layers, each using production-grade technology:"),
  ...spacer(1),

  sectionTable([
    ["Frontend", "React + Monaco Editor", "Browser-based code IDE with syntax highlighting and autocompletion"],
    ["Frontend", "Xterm.js + WebSockets", "Real-time terminal streaming of stdout/stderr from compiler containers"],
    ["Frontend", "Nginx (in-container)", "Static asset server and /api/* reverse proxy — eliminates CORS issues"],
    ["Backend", "Java 24 + Spring Boot 3.4", "REST API, dependency injection, execution orchestration"],
    ["Backend", "Spring Security + JWT", "Stateless authentication — tokens stored in browser localStorage"],
    ["Backend", "Async Executors", "Background threads push metrics and logs to AWS without blocking execution"],
    ["Execution", "Docker Socket Mount", "Backend controls host Docker engine to spawn isolated compiler containers"],
    ["Execution", "Transient Containers", "Alpine-based images spin up, run user code, and are destroyed immediately"],
    ["Data", "Amazon RDS PostgreSQL", "Persistent store for user accounts, submission records, and S3 keys"],
    ["Data", "Amazon S3", "Full execution log archive — prevents database bloat"],
    ["Monitoring", "AWS CloudWatch Logs", "Centralized structured log ingestion from Spring Boot"],
    ["Monitoring", "AWS CloudWatch Metrics", "JVM heap, free disk, and request latency tracking"],
    ["AI", "Groq / Llama 3.3", "Code error explanation and complexity analysis via HTTPS API key"],
  ]),
  ...spacer(1),

  // ── SECTION 3 ──────────────────────────────────────────────────────────────
  h1("3. Containerization Strategy"),
  para("Both the frontend and backend are containerized using multi-stage Docker builds to produce lean, production-ready images."),
  ...spacer(1),

  h2("Frontend Dockerfile"),
  para("Uses a two-stage build: Stage 1 compiles React assets with Node.js; Stage 2 copies the compiled output into a minimal Nginx image."),
  ...spacer(1),
  ...codeBlock([
    "# Stage 1: Build React Assets",
    "FROM node:20-alpine AS builder",
    "WORKDIR /app",
    "COPY package.json ./",
    "RUN npm install --silent",
    "COPY . .",
    "RUN npm run build",
    "",
    "# Stage 2: Serve Compiled Files with Nginx",
    "FROM nginx:alpine",
    "RUN rm -rf /usr/share/nginx/html/*",
    "COPY --from=builder /app/build /usr/share/nginx/html",
    "",
    "# Nginx reverse-proxies /api/ to the backend ClusterIP service",
    "# This eliminates CORS errors — browser only speaks to port 3000",
    'COPY nginx.conf /etc/nginx/conf.d/default.conf',
    "",
    "EXPOSE 3000",
    'CMD ["nginx", "-g", "daemon off;"]',
  ]),
  ...spacer(1),

  h2("Backend Dockerfile"),
  para("Installs Docker CLI inside the runtime container so Spring Boot can issue docker run commands against the host socket."),
  ...spacer(1),
  ...codeBlock([
    "# Stage 1: Compile Spring Boot JAR",
    "FROM eclipse-temurin:24-jdk-alpine AS builder",
    "WORKDIR /app",
    "RUN apk add --no-cache maven",
    "COPY pom.xml .",
    "RUN mvn dependency:go-offline -q",
    "COPY src ./src",
    "RUN mvn package -DskipTests -q",
    "",
    "# Stage 2: Minimal runtime image",
    "FROM eclipse-temurin:24-jre-alpine",
    "WORKDIR /app",
    "# Docker CLI needed so the app can call 'docker run' on the host socket",
    "RUN apk add --no-cache docker-cli",
    "COPY --from=builder /app/target/*.jar app.jar",
    "EXPOSE 8082",
    'ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-jar", "app.jar"]',
  ]),
  ...spacer(1),

  // ── SECTION 4 ──────────────────────────────────────────────────────────────
  h1("4. Kubernetes Orchestration"),
  para("The cluster runs on two EC2 instances (one Master, one Worker) using kubeadm. Resources are managed with declarative YAML manifests."),
  ...spacer(1),

  h2("A. Frontend Deployment & Service"),
  bullet("Deployment replicas: 1 (scalable to 3+ for high availability)."),
  bullet("Container port: 3000 (Nginx)."),
  bullet([bold("Service type: NodePort"), new TextRun({ text: " — maps container port 3000 to host port 30080 so the ALB can reach it.", size: 22, font: "Arial" })]),
  ...spacer(1),

  h2("B. Backend Deployment & Service"),
  bullet([bold("HostPath Volume Mount: "), new TextRun({ text: "Mounts /var/run/docker.sock from the EC2 host into the backend container. This gives Spring Boot access to the host Docker engine.", size: 22, font: "Arial" })]),
  bullet([bold("Service type: ClusterIP"), new TextRun({ text: " — only reachable internally within the cluster (Nginx reverse-proxies to it).", size: 22, font: "Arial" })]),
  bullet([bold("Liveness & Readiness Probes: "), new TextRun({ text: "Both probe /actuator/health. Kubernetes automatically replaces unhealthy pods.", size: 22, font: "Arial" })]),
  bullet([bold("Environment Variables: "), new TextRun({ text: "DB credentials, JWT secret, Groq API key, and S3 bucket name are injected via Kubernetes Secrets (never hardcoded).", size: 22, font: "Arial" })]),
  ...spacer(1),

  // ── SECTION 5 ──────────────────────────────────────────────────────────────
  h1("5. Step-by-Step Deployment Pipeline"),
  ...spacer(1),

  h2("Phase 1 — EC2 Setup & Kubernetes Cluster"),
  numbered("Provision two EC2 instances (Ubuntu 24.04 LTS): one Master, one Worker."),
  numbered("Open security group ports: 6443, 2379, 10250 (K8s) and 30000–32767 (NodePorts)."),
  numbered("Install containerd, kubeadm, kubelet, kubectl on both nodes."),
  numbered([bold("Master node: "), code("sudo kubeadm init --pod-network-cidr=10.244.0.0/16")]),
  numbered("Apply a CNI plugin (Flannel or Calico) for pod networking."),
  numbered("Run the kubeadm join command on the Worker node to link it to the cluster."),
  ...spacer(1),

  h2("Phase 2 — AWS Database & Storage"),
  numbered("Provision a PostgreSQL RDS instance inside your VPC."),
  numbered("Create an S3 bucket named smartcloud-outputs."),
  numbered("Attach an IAM Instance Profile to your EC2 nodes with permissions: s3:*, logs:*, cloudwatch:*. This uses IAM instance credentials — no access keys in code."),
  ...spacer(1),

  h2("Phase 3 — Build, Push & Deploy Containers"),
  numbered(["Authenticate Docker with ECR: ", ...[]]),
  ...codeBlock([
    "aws ecr get-login-password --region ap-south-1 | \\",
    "  docker login --username AWS --password-stdin \\",
    "  422509705066.dkr.ecr.ap-south-1.amazonaws.com",
  ]),
  ...spacer(1),
  numbered("Build and tag both images:"),
  ...codeBlock([
    "docker build -t 422509705066.dkr.ecr.ap-south-1.amazonaws.com/smartcloud-backend:latest ./backend/backend",
    "docker build -t 422509705066.dkr.ecr.ap-south-1.amazonaws.com/smartcloud-frontend:latest ./frontend/frontend",
  ]),
  ...spacer(1),
  numbered("Push to ECR:"),
  ...codeBlock([
    "docker push 422509705066.dkr.ecr.ap-south-1.amazonaws.com/smartcloud-backend:latest",
    "docker push 422509705066.dkr.ecr.ap-south-1.amazonaws.com/smartcloud-frontend:latest",
  ]),
  ...spacer(1),
  numbered("Apply Kubernetes secrets (DB URL, passwords, API keys)."),
  numbered("Deploy manifests:"),
  ...codeBlock([
    "kubectl apply -f k8s/backend-deployment.yaml",
    "kubectl apply -f k8s/frontend-deployment.yaml",
  ]),
  ...spacer(1),

  h2("Phase 4 — Load Balancing & DNS"),
  numbered("Create an EC2 Target Group on port 30080 containing both EC2 instances."),
  numbered("Provision an Application Load Balancer (ALB) mapping port 80 → Target Group."),
  numbered("Configure a Route 53 Hosted Zone for your domain."),
  numbered("Point your domain registrar's nameservers to Route 53."),
  numbered("Add an A Alias record in Route 53 pointing the domain to the ALB."),
  ...spacer(1),

  // ── SECTION 6 ──────────────────────────────────────────────────────────────
  h1("6. Request Execution Lifecycle"),
  para("When a developer writes Python code and clicks Run, the following sequence executes end-to-end:"),
  ...spacer(1),

  numbered([bold("Connection: "), new TextRun({ text: "Xterm.js opens a WebSocket channel to /api/ws/execute.", size: 22, font: "Arial" })]),
  numbered([bold("ALB Routing: "), new TextRun({ text: "The ALB accepts the request on port 80 and forwards to K8s NodePort 30080.", size: 22, font: "Arial" })]),
  numbered([bold("Nginx Intercept: "), new TextRun({ text: "The frontend pod's Nginx reverse-proxies /api/ws/ traffic to the backend ClusterIP service.", size: 22, font: "Arial" })]),
  numbered([bold("WebSocket Upgrade: "), new TextRun({ text: "Spring Boot upgrades the HTTP request to a persistent WebSocket connection.", size: 22, font: "Arial" })]),
  numbered([bold("Container Spawn: "), new TextRun({ text: "The backend uses the mounted Docker socket to start an isolated Alpine container with memory/CPU limits:", size: 22, font: "Arial" })]),
  ...codeBlock([
    "docker run --rm --memory=256m --cpus=0.5 \\",
    "  -v /tmp/workspace:/app \\",
    "  python:3.10-alpine python /app/script.py",
  ]),
  ...spacer(1),
  numbered([bold("Real-time Streaming: "), new TextRun({ text: "As the container writes to stdout/stderr, Spring Boot captures the streams and pushes them to the active WebSocket channel — updating the browser terminal instantly.", size: 22, font: "Arial" })]),
  numbered([bold("Cleanup & Archival: "), new TextRun({ text: "When the script finishes, the container is destroyed. Spring Boot packages the full run as JSON, uploads it to S3, and updates the DB record with the S3 key. JVM metrics are shipped to CloudWatch in a background thread.", size: 22, font: "Arial" })]),
  ...spacer(1),

  infoBox("Why Docker socket mounting?", "It avoids running a Docker daemon inside the container (Docker-in-Docker). Instead, the backend speaks directly to the host EC2's Docker engine — simpler, faster, and supported on standard EC2 instances."),
];

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "\u2022",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: "numbers",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22, color: DARK_GRAY } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: ACCENT },
        paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: MID_BLUE },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: "Arial", color: DARK_GRAY },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
      }
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "SmartCloud Architecture Handbook  |  Page ", size: 18, color: "888888", font: "Arial" }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "888888", font: "Arial" }),
          ]
        })]
      })
    },
    children
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/mnt/user-data/outputs/SmartCloud_Architecture_Handbook.docx', buf);
  console.log('done');
});
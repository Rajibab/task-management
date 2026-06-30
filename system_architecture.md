# Production System Architecture & Technical Specifications
## Digital Marketing Operating System (OmniMark OS)

This document specifies the enterprise-grade production engineering, cloud infrastructure, database schema design, API gateway blueprints, and white-label scaling strategies designed for **OmniMark OS**.

---

## 1. Cloud Infrastructure Architecture

OmniMark OS utilizes a highly available, multi-tenant cloud architecture. Requests are routed through a CDN layer to serverless edge nodes (for the frontend SPA) and an Elastic Load Balancer (for containerized backend microservices).

### Infrastructure Topology Diagram

```mermaid
graph TD
    User["🌐 User Browser (Admin/Client/Team)"] -->|HTTPS / WSS| CF["🛡️ Cloudflare CDN & WAF"]
    CF -->|Custom CNAME DNS Routing| Vercel["⚡ Vercel Edge Nodes (Next.js SPA)"]
    CF -->|API Traffic| ALB["⚖️ AWS Application Load Balancer"]
    
    subgraph Web Application Cluster
        Vercel -->|Render Requests| CDN["Assets Cache (CSS/JS)"]
    end

    subgraph Containerized Backend Services (AWS ECS Fargate)
        ALB --> ECS1["Node.js Express App Instance A"]
        ALB --> ECS2["Node.js Express App Instance B"]
        ECS1 & ECS2 -->|Sub/Pub Events| Redis["⚡ Redis Cache & Message Queue"]
        ECS1 & ECS2 -->|Auth Validation| Auth0["🔐 Auth0 IDP (Multi-Tenant Org)"]
    end

    subgraph Third-Party Integrations Gateway
        ECS1 & ECS2 -->|SEO Scrapes| SearchConsole["📊 Google Search Console / Ahrefs API"]
        ECS1 & ECS2 -->|AI Analysis| OpenAI["🧠 OpenAI GPT-4o API"]
        ECS1 & ECS2 -->|Billing Charges| Stripe["💳 Stripe Subscriptions API"]
        ECS1 & ECS2 -->|Mailer System| SendGrid["📧 SendGrid SMTP Gateway"]
    end

    subgraph Data Persistence Layer (AWS Aurora)
        ECS1 & ECS2 -->|Write Master| PG_Master["🗄️ PostgreSQL Master Database"]
        ECS1 & ECS2 -->|Read Replicas| PG_Replica["🗄️ PostgreSQL Read Replica Cluster"]
        PG_Master -->|Streaming Replication| PG_Replica
        ECS1 & ECS2 -->|Uploads Storage| S3["📁 AWS S3 Assets Bucket (White-labeled)"]
    end

    style User fill:#f8fafc,stroke:#64748b,stroke-width:2px
    style CF fill:#f97316,stroke:#ea580c,stroke-width:2px,color:#fff
    style Vercel fill:#000,stroke:#334155,stroke-width:2px,color:#fff
    style ALB fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff
    style Redis fill:#dc2626,stroke:#b91c1c,stroke-width:2px,color:#fff
    style PG_Master fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#fff
    style PG_Replica fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#fff
```

---

## 2. Multi-Tenant Database Schema (Prisma ORM Models)

To guarantee clean data isolation while supporting multi-agency scaling, the PostgreSQL database is built with a **Shared Database, Shared Schema** architecture utilizing **Row-Level Security (RLS)**. Every model links back to an `Agency` tenant.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

/// Agency Tenant (Top-level container for white-labeling)
model Agency {
  id            String         @id @default(uuid())
  name          String
  domain        String         @unique // Custom white-label domain CNAME
  logoUrl       String?
  brandColor    String         @default("indigo") // Primary brand highlight
  smtpHost      String?
  smtpUser      String?
  smtpPass      String? // Encrypted string
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  users         User[]
  clients       Client[]
  services      Service[]
  leads         Lead[]
}

/// User Roles Model (Admin, Team, Client access permissions)
enum Role {
  SUPER_ADMIN // Agency Owner
  TEAM_MEMBER // SEO/PPC Expert
  CLIENT_USER // Client Portal login
}

model User {
  id            String         @id @default(uuid())
  email         String         @unique
  name          String
  avatarUrl     String?
  role          Role           @default(TEAM_MEMBER)
  agencyId      String
  agency        Agency         @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  clientId      String? // Nullable link if role === CLIENT_USER
  client        Client?        @relation("ClientUser", fields: [clientId], references: [id])
  tasksAssigned Task[]         @relation("TaskAssignee")
  comments      Comment[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@index([agencyId])
}

/// Client Profile Model (Partner CRM profiles)
enum ClientStatus {
  ACTIVE
  PENDING
  PAUSED
  COMPLETED
}

model Client {
  id             String         @id @default(uuid())
  companyName    String
  contactPerson  String
  email          String         @unique
  phone          String?
  website        String
  industry       String
  status         ClientStatus   @default(ACTIVE)
  monthlyBilling Decimal        @db.Decimal(10, 2)
  projectStatus  String         @default("On Track")
  notes          String?        @db.Text
  documents      String[] // Paths to S3 folder assets
  agencyId       String
  agency         Agency         @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  users          User[]         @relation("ClientUser")
  invoices       Invoice[]
  tasks          Task[]
  seoReports     SeoReport[]
  serviceReqs    ServiceRequest[]
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  @@index([agencyId])
}

/// Core Services Catalog
model Service {
  id           String         @id @default(uuid())
  name         String
  category     String // SEO, PPC, Branding, Dev, etc.
  price        Decimal        @db.Decimal(10, 2)
  timeline     String // Monthly Retainer vs. Flat
  deliverables String         @db.Text
  agencyId     String
  agency       Agency         @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  createdAt    DateTime       @default(now())
}

/// Client-submitted Service Proposals Requests
enum RequestStatus {
  PENDING
  APPROVED
  REJECTED
}

model ServiceRequest {
  id            String         @id @default(uuid())
  clientId      String
  client        Client         @relation(fields: [clientId], references: [id], onDelete: Cascade)
  serviceName   String
  cost          Decimal        @db.Decimal(10, 2)
  requestedDate DateTime       @default(now())
  status        RequestStatus  @default(PENDING)
}

/// Invoices & Billing logs
enum InvoiceStatus {
  PAID
  DUE
  OVERDUE
}

model Invoice {
  id             String         @id @default(uuid())
  clientId       String
  client         Client         @relation(fields: [clientId], references: [id], onDelete: Cascade)
  amount         Decimal        @db.Decimal(10, 2) // Base Cost
  taxGst         Decimal        @db.Decimal(10, 2) // 18% standard tax
  total          Decimal        @db.Decimal(10, 2) // Compounded Cost
  issueDate      DateTime       @default(now())
  dueDate        DateTime
  status         InvoiceStatus  @default(DUE)
  recurring      Boolean        @default(true)
  serviceList    String[] // Array of service names
  negotiationLogs RenegotiationLog[]
  createdAt      DateTime       @default(now())
}

/// Historical Pricing Renegotiation Timeline logs
model RenegotiationLog {
  id            String         @id @default(uuid())
  invoiceId     String
  invoice       Invoice        @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  oldPrice      Decimal        @db.Decimal(10, 2)
  newPrice      Decimal        @db.Decimal(10, 2)
  date          DateTime       @default(now())
  approvedBy    String // E.g. "Rajib Sen (Admin)"
  note          String         @db.Text
}

/// Search SEO audits data models
model SeoReport {
  id             String         @id @default(uuid())
  clientId       String         @unique
  client         Client         @relation(fields: [clientId], references: [id], onDelete: Cascade)
  website        String
  da             Int
  pa             Int
  technicalScore Int
  trafficHistory Json // Timeseries traffic array
  organicKeywords Json // Keyword rank tracking array
  auditIssues    Json // Crawler issues list
  updatedAt      DateTime       @updatedAt
}

/// CRM Leads pipeline
enum LeadStage {
  LEAD
  CONTACTED
  PROPOSAL
  NEGOTIATING
  CLOSED
}

model Lead {
  id            String         @id @default(uuid())
  company       String
  contact       String
  email         String
  value         Decimal        @db.Decimal(10, 2)
  stage         LeadStage      @default(LEAD)
  industry      String
  agencyId      String
  agency        Agency         @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  createdAt     DateTime       @default(now())

  @@index([agencyId])
}

/// Workflows Task Board
enum TaskPriority {
  HIGH
  MEDIUM
  LOW
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  REVIEW
  COMPLETED
}

model Task {
  id            String         @id @default(uuid())
  title         String
  clientId      String
  client        Client         @relation(fields: [clientId], references: [id], onDelete: Cascade)
  assigneeId    String
  assignee      User           @relation("TaskAssignee", fields: [assigneeId], references: [id])
  status        TaskStatus     @default(TODO)
  deadline      DateTime
  priority      TaskPriority   @default(MEDIUM)
  comments      Comment[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model Comment {
  id            String         @id @default(uuid())
  taskId        String
  task          Task           @relation(fields: [taskId], references: [id], onDelete: Cascade)
  userId        String
  user          User           @relation(fields: [userId], references: [id])
  text          String         @db.Text
  createdAt     DateTime       @default(now())
}
```

---

## 3. RESTful API Blueprint

A secure API Router handles CRM database manipulation. Requests require a tenant header validation token (`X-Agency-ID`).

### Authentication & Tenant Scopes
- `POST /api/auth/login` - Authenticates user credentials via Auth0, returning role scope and agency payload.
- `GET /api/agency/branding` - Matches request hostname (e.g. `portal.aeromedia.com`) to S3 branding assets configurations.

### Client Profiles Management (CRM)
- `GET /api/clients` - Resolves all active client records linked to tenant scope. Supports pagination `?page=1&limit=25`, search `?search=Aero`, and filters `?status=Active`.
- `POST /api/clients` - Creates a new client profile. Triggers S3 assets folder scaffolding.
- `PUT /api/clients/:id` - Updates specific fields.
- `DELETE /api/clients/:id` - Archives a client contract (safe soft deletion).

### Invoices & Pricing Renegotiation
- `GET /api/invoices` - Compiles ledger summaries and outstanding balances.
- `POST /api/invoices/:id/renegotiate` - revises base invoice values, logs entry in `RenegotiationLog` tables, and propagates update to related client monthly retainers dynamically.

---

## 4. White-Label Domain Routing Mechanics

Providing absolute white-labeled CRM experiences is accomplished via Cloudflare CNAME and Next.js hostname rewrites.

### DNS Redirection Architecture
1. **Agent Setup**: The client creates a DNS registry in their domain registry pointing their sub-domain (e.g. `portal.aeromedia.com`) as a **CNAME record** pointing to our server: `gateway.omnimark.agency`.
2. **Gateway Mapping**: Cloudflare acts as the master SSL wildcard layer.
3. **App Hostname Middleware**: Our application gateway interceptor (Edge Middleware) extracts the hostname from incoming request headers:
   ```javascript
   // Next.js Middleware check
   export function middleware(req) {
     const hostname = req.headers.get("host"); // E.g. "portal.aeromedia.com"
     
     // Skip core routes
     if (hostname === "omnimark.agency" || hostname === "localhost:3000") {
       return NextResponse.next();
     }
     
     // Rewrite path internally to tenant mapping folder
     return NextResponse.rewrite(new URL(`/_tenants/${hostname}${req.nextUrl.pathname}`, req.url));
   }
   ```
4. **Static Assets Fetching**: The path maps to database configuration matching `Agency.domain === hostname` to load specific CSS highlights, logo URLs, and SMTP values before rendering components.

---

## 5. Enterprise Scalability & Security Blueprint

- **Redis Caching**: Cache expensive queries (e.g. cumulative SEO keywords volume charts or aggregate MRR forecasts metrics) in Redis with a 15-minute TTL. Evict keys instantly on record mutation triggers.
- **Aurora PostgreSQL Replication**: Direct all intensive analytical crawls and report compilations to Read Replicas, safeguarding PG Master write speed for transactional edits (like adding leads or billing).
- **Row-Level Security (RLS)**: Enforce RLS policies inside PostgreSQL directly at DB engine levels, guaranteeing that developers cannot accidentally leak records across different agency domains:
  ```sql
  ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "AgencyDataIsolation" ON "Client"
    USING ("agencyId" = current_setting('app.current_agency_id'));
  ```
- **Enterprise SSO & RBAC**: Auth0 multi-tenant organizations isolate client user records and enforce JSON Web Tokens (JWT) payload signature checking on every API Gateway boundary.

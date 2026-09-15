# TriageIQ — AI-Powered IT Ticket Triage Platform

![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-green?logo=springboot)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E?logo=supabase)
![Gemini](https://img.shields.io/badge/AI-Gemini_2.0_Flash-4285F4?logo=google)

TriageIQ is an enterprise internal IT helpdesk system that automatically classifies, prioritizes, and routes employee support tickets using Google Gemini AI (2.0 Flash) in under 3 seconds. By replacing manual queue sorting with real-time AI triage, dynamic load-balanced agent assignments, and automated SLA breach escalations, TriageIQ ensures mission-critical incidents (P0/P1) trigger instant alerts while standard support flows operate friction-free.

---

## Architecture Overview

```
+-----------------------------------------------------------------------------------+
|                                  INCOMING SOURCES                                 |
|                                                                                   |
|    [Employee Web Intake]           [Slack #it-help]             [Gmail Support]   |
|         (/submit)                 (Events Webhook)             (Pub/Sub Webhook)  |
+-------------------+-----------------------+----------------------------+----------+
                    |                       |                            |
                    +-----------------------v----------------------------+
                                            |
                                            v
                     +----------------------------------------------+
                     |          Spring Boot 3.x Backend             |
                     |                 (Java 21)                    |
                     +----------------------+-----------------------+
                                            |
                         +------------------+------------------+
                         |                                     |
                         v                                     v
         +-------------------------------+     +--------------------------------+
         |     Google Gemini 2.0 Flash   |     |      Supabase PostgreSQL       |
         |     - Priority (P0 - P3)      |     |     - tickets & ticket_events  |
         |     - Category classification |     |     - teams & agents           |
         |     - Confidence & Reasoning  |     |     - Flyway schema migrations |
         +-------------------------------+     +--------------------------------+
                         |                                     |
                         +------------------+------------------+
                                            |
                                            v
                     +----------------------------------------------+
                     |           Agent Queue Dashboard              |
                     |           (React 18 + TypeScript)            |
                     |   - Real-time SLA countdown timers           |
                     |   - Drawer details, triage reasoning         |
                     |   - Reassignment & resolution workflows      |
                     +----------------------------------------------+
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Java 21, Spring Boot 3.x, Spring Data JPA, Flyway, Maven |
| **Database** | PostgreSQL (Supabase hosted) with SSL |
| **AI Triage Engine** | Google Gemini 2.0 Flash (`gemini-2.0-flash`) |
| **Frontend** | React 18, TypeScript, Tailwind CSS, Vite, TanStack Query |
| **Deployment** | Railway (Backend JAR container), Vercel (Frontend SPA) |
| **Integrations** | Slack Web API (`chat.postMessage`), Gmail API + Cloud Pub/Sub |

---

## Engineering Highlights

- **Zero N+1 Query Architecture**: Paginated ticket queries use JPQL `LEFT JOIN FETCH` with explicit `countQuery` to load agent and team relationships in a single database round-trip, regardless of page size.

- **Two-Phase Triage Resilience**: Gemini API failures never crash ticket creation. A structured fallback (P2/other, confidence 0.0) ensures 100% ticket ingestion uptime even during AI service degradation.

- **Idempotent SLA Escalation**: The scheduled SLA monitor is safe to re-run — escalation events are only written once per breach, preventing duplicate Slack alerts and audit log inflation.

- **Cryptographic Webhook Security**: Slack event payloads are verified via HMAC-SHA256 signature with 300-second replay protection before any processing occurs, preventing ticket injection attacks.

- **Load-Balanced Agent Assignment**: New tickets are routed to the agent with the lowest current active ticket count within the matching specialty team, with atomic load counter maintenance on every state transition.

---

## Local Development Setup

### Prerequisites
- **Java 21**: OpenJDK 21 or higher
- **Node.js**: Node.js 20+ and npm
- **Maven**: Maven 3.9+ (or use included `./mvnw`)

### 1. Clone & Configure Environment
```bash
git clone https://github.com/ahalzakir/triageiq.git
cd Triage_web-app
cp .env.example .env
```
Fill in your actual Supabase credentials, Gemini API key, and optional Slack/Gmail webhook tokens in `.env`.

### 2. Run Backend
```bash
cd backend
./mvnw spring-boot:run
```
The backend starts on `http://localhost:8080`. Flyway will automatically execute `V1__schema.sql` and `V2__seed.sql` on startup.

### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
The React development server runs at `http://localhost:5173`.

---

## Webhook Setup (Local Development via ngrok)

Gmail Push Notifications via Google Cloud Pub/Sub and Slack Event Subscriptions require a publicly accessible HTTPS endpoint. Since external webhooks cannot reach `localhost:8080`:

1. Download and install **ngrok**: https://ngrok.com/download
2. Start an HTTP tunnel to your local backend:
   ```bash
   ngrok http 8080
   ```
3. Copy the generated HTTPS forwarding URL (e.g., `https://abc123.ngrok.io`).
4. In Google Cloud Console under Pub/Sub Subscriptions, set the Push Subscription Endpoint URL to:
   ```
   https://abc123.ngrok.io/api/webhooks/gmail
   ```
5. Update your `.env` file with:
   ```env
   GMAIL_PUBSUB_PUSH_ENDPOINT=https://abc123.ngrok.io/api/webhooks/gmail
   ```

> ⚠️ Also update your Slack App's Event Subscriptions Request URL at
> `api.slack.com/apps` to `https://abc123.ngrok.io/api/webhooks/slack`
> each time you restart ngrok, as the URL changes on every tunnel restart
> (free plan).

*In Railway (production)*: Set `GMAIL_PUBSUB_PUSH_ENDPOINT` to `https://<your-railway-app>.railway.app/api/webhooks/gmail` and point Slack Events to `https://<your-railway-app>.railway.app/api/webhooks/slack`.

---

## Live Demo

- **Production URL**: [Add Vercel URL after deployment]

---

## Key System Metrics & Operational Capabilities

- ⚡ **Sub-3 Second AI Triage**: Automated priority assignment, category classification, and confidence scoring upon ticket creation.
- 🚨 **Instant Slack Escalation**: Automatic alerts posted to designated team channels for P0/P1 tickets.
- ⏱️ **Active SLA Monitoring**: Background scheduler runs every 5 minutes (`@Scheduled`) to detect SLA breaches and auto-escalate severity.
- 📊 **Full Audit Trail**: Every ticket lifecycle event (`created`, `assigned`, `reassigned`, `escalated`, `resolved`) is permanently recorded.

# ft_transcendence

This is my portfolio version of a team project from the 42 curriculum. My main contribution was the backend: a Fastify-based REST API with JWT authentication, 2FA, SQLite persistence, and friends / tournaments / matches workflows.

## Project Overview

The application provides:
- Authentication and account management (`/api/signup`, `/api/login`)
- JWT-based sessions, with optional 2FA (TOTP) during login
- User profiles (including avatar handling) and “online” state
- Friends management (requests, accept/decline/remove; pending/accepted lists)
- Tournaments (create/join/leave/start) with tournament and match workflows
- Match lifecycle: persistence and match history/results APIs
- Real-time Pong gameplay integrated into the overall system

## Architecture at a Glance

- `webserv/` (nginx reverse proxy)
  - Routes REST API requests to the backend
  - Routes real-time traffic to the Pong service (socket.io/WebSocket)
  - Proxies Grafana for the monitoring UI
- `backend/` (Fastify REST API)
  - JWT verification + 2FA enforcement
  - SQLite-backed persistence layer
  - Domain endpoints: users, friends, tournaments, matches
- `frontend/`
  - Client-side routing and UI for auth, profile, friends, tournaments, and gameplay
- `pongGame/`
  - Real-time Pong server (socket.io + game loop)
  - Communicates with the backend for persistence (e.g., match results)
- `docker/` + `docker-compose.yml` (deployment and observability stack)
  - Prometheus + Grafana + exporters are included as part of the team deployment

## My Contribution (Backend-focused)

This is a team project; my primary contribution was the backend. I focused on building and organizing the backend API around authentication, user management, and game domain workflows.

- Auth / security: signup/login endpoints, JWT authentication, and 2FA flow (setup + verification)
- Profiles: profile access and backend-side avatar handling
- Social: friends management (request/accept/decline/remove, pending/accepted flows)
- Game domain: tournament and match APIs, including bracket/match lifecycle and result persistence
- Persistence + backend organization: SQLite integration and route/plugin structure with Fastify
- Validation + middleware: input validation utilities, shared backend patterns, and consistent error handling

## Backend Highlights (Technical)

- Fastify route/plugin structure
  - Domain-based route modules with shared patterns (JWT enforcement and consistent error responses)

- JWT authentication + 2FA enforcement
  - JWT verification integrated with 2FA gating logic so protected endpoints require the correct auth state

- Auth-related endpoints and flows
  - Implementation coverage for signup/login and 2FA setup/verification logic, including QR/OTP handling

- Tournament + match domain logic backed by SQLite
  - Backend endpoints and query patterns to support tournament lifecycle and match persistence/history

- Backend validation and organization
  - Centralized validation utilities and reusable backend organization patterns to keep request handling consistent

## Repository Structure (Compact Tree)

```text
.
├─ backend/
│  └─ src/                  (Fastify API, routes, plugins, SQLite integration)
├─ frontend/
│  └─ src/                  (Client UI)
├─ pongGame/
│  └─ src/                  (Real-time Pong service; included in the overall system)
├─ docker/
│  ├─ backend/                    (backend container build)
│  ├─ frontend/                   (frontend container build)
│  ├─ ponggame/                    (pongGame container build)
│  ├─ webserv/                     (nginx + reverse proxy container build)
│  ├─ prometheus/                 (Prometheus container/config)
│  ├─ grafana/                    (Grafana container/config/dashboards)
│  ├─ node_exporter/             (node exporter container/tools)
│  ├─ nginx_prometheus_exporter-frontend/   (nginx exporter for frontend)
│  └─ nginx_prometheus_exporter-webserv/    (nginx exporter for webserv)
├─ webserv/                   (nginx configuration)
├─ docker-compose.yml
└─ Makefile
```

## Deployment / Run Locally

1. Prepare environment variables:
   - Copy `.env.template` to `.env`
   - Set `JWT_SECRET`
   - Configure Grafana admin credentials (`GF_SECURITY_ADMIN_USER`, `GF_SECURITY_ADMIN_PASSWORD`) as required
   - Note: `GF_SECURITY_ADMIN_PASSWORD` must follow the project password policy (minimum 8 characters, with at least one uppercase, one lowercase, one digit, and one special character)

2. Start the full stack:
   - Run `make`
   - This uses `docker compose up --build`

3. Access:
   - Main app: `https://localhost:3443`
   - Grafana: `https://localhost:3444`

## Observability (Project-wide Context)

This deployment includes monitoring/observability as part of the team stack:
- Prometheus scrapes metrics from the backend and related services
- Grafana provides dashboards for the monitoring UI
- Exporters are included for infrastructure-level metrics (and nginx-related metrics via exporters)

Note: this is **project-wide context** and is included in the deployment, but it is not the primary focus of my contribution.

## Possible Improvements

- Tighten/clean any remaining debug or informational routes before a public release
- Add automated tests for backend endpoints (auth, 2FA, tournaments/matches)
- Improve API documentation (example requests/responses for key endpoints)
- Reduce console logging in runtime paths and standardize logging levels
- Add CI checks (linting, type checks, and integration test runs) for backend changes

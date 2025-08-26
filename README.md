# Running ft_transcendence

## Setup

1. Rename the `.env.template` file to `.env`:
   ```bash
   mv .env.template .env
   ```
2. Open .env in your text editor and:

Set a random printable ASCII string for JWT_SECRET and uncomment the line.

Set the Grafana admin username in GF_SECURITY_ADMIN_USER and uncomment the line.

Set the Grafana admin password in GF_SECURITY_ADMIN_PASSWORD and uncomment the line.

## Run

1. Build and start the services: `make`
2. Access the application:

- Main app: https://localhost:3443
- Grafana: https://localhost:3444
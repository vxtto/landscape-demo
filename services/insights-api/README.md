# Landscape Insights API

A private, read-only application API for the Agent & Model Infra Landscape.
It turns a fixed set of ClickHouse queries into a small JSON contract without
exposing ClickHouse credentials, connection details, or arbitrary SQL.

## Security model

- The service only serves repositories in the checked-in landscape taxonomy.
- Every data request requires a long bearer token.
- SQL is fixed in source and repository values use ClickHouse typed parameters.
- ClickHouse queries run with `readonly=1`, strict timeouts, and result limits.
- Cleartext ClickHouse transport is rejected unless it resolves entirely to
  private addresses and `CLICKHOUSE_ALLOW_PRIVATE_HTTP=true` is explicit.
- Errors returned to callers are sanitized.
- Authorization headers are redacted from logs.
- Responses are cached and requests are rate limited.
- CORS is intentionally not enabled. Browsers call the Vercel proxy instead.

Use a dedicated ClickHouse account that can only read the required tables. The
application controls above complement database permissions; they do not replace
them.

## Local commands

```bash
cd services/insights-api
npm install
npm run typecheck
npm test
npm run build
```

To run the service, provide the variables in `.env.example` through your shell
or secret manager:

```bash
node --env-file=.env dist/index.js
```

Do not commit the populated `.env` file.

## Docker

Build from the repository root so the landscape taxonomy can be bundled:

```bash
docker build \
  -f services/insights-api/Dockerfile \
  -t landscape-insights-api:local \
  .
```

Run it behind a trusted HTTPS ingress or reverse proxy:

```bash
docker run --rm \
  --env-file /secure/path/insights-api.env \
  --read-only \
  --tmpfs /tmp \
  --security-opt no-new-privileges \
  -p 127.0.0.1:8080:8080 \
  landscape-insights-api:local
```

The container port should not be published directly to the internet. Terminate
TLS at an ingress, load balancer, Caddy, Nginx, or an approved tunnel and expose
only that HTTPS endpoint.

For a small VM in the same trusted network as ClickHouse, the included
`compose.example.yaml` runs the API without a public container port and places
Caddy in front of it:

```bash
cd services/insights-api
cp compose.example.yaml compose.yaml

# Edit the HTTPS domain and the absolute env-file path first.
docker compose up -d --build
```

Caddy obtains and renews the public TLS certificate. Point the configured DNS
name at the server and restrict the host firewall to the required inbound
ports. If Vercel Static IPs are available, allowlist those egress addresses for
the API host.

## Endpoints

### `GET /healthz`

Unauthenticated liveness check. It returns no database details.

### `GET /v1/projects/:owner/:repo/insights`

Requires:

```text
Authorization: Bearer <INSIGHTS_API_TOKEN>
```

Only fixed public project metrics are returned. Unknown repositories return
`404`; authentication failures return `401`; backend failures return a
sanitized `503`.

## Vercel configuration

The frontend project needs only:

```text
INSIGHTS_API_URL=https://insights-api.example.com
INSIGHTS_API_TOKEN=<same long random token>
```

Never prefix either variable with `NEXT_PUBLIC_`. The existing Next.js Route
Handler acts as the same-origin proxy, so the browser never receives the token
or the backend URL.

Generate a token with:

```bash
openssl rand -base64 48
```

`INSIGHTS_API_PREVIOUS_TOKEN` can temporarily hold the old token during
rotation. Remove it after all callers use the new token.

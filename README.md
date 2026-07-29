# Agent & Model Infra Landscape

An interactive, OpenRank-weighted landscape for Agent Infra and Model Infra.
Projects keep their ecosystem placement while their detail cards load current
repository and contributor signals from a protected server-side data service.

## Local development

```bash
npm install
npm run dev
```

For local-only development, the Next.js route can query ClickHouse directly
with these private variables in `.env`:

```text
CLICKHOUSE_HOST
CLICKHOUSE_USER
CLICKHOUSE_PASSWORD
GITHUB_TOKEN
```

For local direct access, prefer a full `CLICKHOUSE_URL` that begins with HTTPS.
`CLICKHOUSE_PROTOCOL` and `CLICKHOUSE_PORT` are optional for local development;
ports default to `8123` for HTTP and `8443` for HTTPS.

Never prefix these variables with `NEXT_PUBLIC_`. All `.env*` files are ignored
by Git and the data access modules import `server-only`.

## Project insights architecture

`GET /api/projects/[owner]/[repo]/insights` returns:

- the latest monthly OpenRank
- GitHub stars and primary language
- the latest monthly unique participant count
- current-year OpenRank and participant trends
- a monthly contributor Arena ranked by normalized OpenRank
- public contributor profile fields and yearly OpenRank trends

In production, this same-origin Next.js route calls the independent service in
[`services/insights-api`](services/insights-api). The browser never connects to
that service or ClickHouse directly.

```text
Browser -> Vercel Next.js route -> HTTPS Insights API -> private ClickHouse
```

Both layers only accept repositories already present in the local landscape
taxonomy. The Insights API keeps SQL fixed in server code and passes repository
values as ClickHouse typed parameters. Browser responses never include database
hostnames, credentials, SQL, API tokens, GitHub tokens, email addresses, or
other private connection details.

The containerized service provides bearer authentication, authorization-header
redaction, private-network transport checks, rate limiting, request
coalescing, bounded caching, and sanitized errors. See its
[deployment and security guide](services/insights-api/README.md).

## Vercel

Production Vercel deployments need only:

```text
INSIGHTS_API_URL=https://insights-api.example.com
INSIGHTS_API_TOKEN=<at-least-32-random-characters>
```

These variables must remain server-only and must not use a `NEXT_PUBLIC_`
prefix. Do not put ClickHouse credentials in Vercel. The backend URL must use
HTTPS in production.

Environment changes only apply to a new Vercel deployment. After configuring
the variables, push to `main` or redeploy the current commit.

## Validation

```bash
npm run lint
npm run build

cd services/insights-api
npm run typecheck
npm test
npm run build
```

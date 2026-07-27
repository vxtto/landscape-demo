# Agent & Model Infra Landscape

An interactive, OpenRank-weighted landscape for Agent Infra and Model Infra.
Projects keep their ecosystem placement while their detail cards load current
repository and contributor signals from a protected server-side data service.

## Local development

```bash
npm install
npm run dev
```

The application expects these private environment variables in `.env`:

```text
CLICKHOUSE_HOST
CLICKHOUSE_USER
CLICKHOUSE_PASSWORD
GITHUB_TOKEN
```

For production, prefer a full `CLICKHOUSE_URL` that begins with `https://`.
`CLICKHOUSE_PROTOCOL` and `CLICKHOUSE_PORT` are optional for local development;
ports default to `8123` for HTTP and `8443` for HTTPS.

Never prefix these variables with `NEXT_PUBLIC_`. All `.env*` files are ignored
by Git and the data access modules import `server-only`.

## Project insights service

`GET /api/projects/[owner]/[repo]/insights` returns:

- the latest monthly OpenRank
- GitHub stars and primary language
- the latest monthly unique participant count
- current-year OpenRank and participant trends
- a monthly contributor Arena ranked by normalized OpenRank
- public contributor profile fields and yearly OpenRank trends

The route only accepts repositories already present in the local landscape
taxonomy. SQL statements are fixed in server code and repository values are
passed to ClickHouse as typed query parameters. Browser responses never include
database hostnames, credentials, SQL, GitHub tokens, email addresses, or other
private connection details.

The Next.js data cache revalidates project insights every seven days. The API
also emits a one-week shared-cache policy, with a one-day stale-while-revalidate
window.

## Vercel

Configure the four private environment variables above for the Production
environment in the long-lived Vercel project. They should remain server-only.
After configuration, a normal push to `main` deploys the static landscape and
the Node.js insights route together.

Production refuses to send credentials over plain HTTP. The ClickHouse endpoint
must be reachable from Vercel's serverless runtime over HTTPS. If the database
is restricted to a private network or only exposes port `8123`, place a private
read-only HTTPS gateway in front of it rather than exposing ClickHouse directly.

## Validation

```bash
npm run lint
npm run build
```

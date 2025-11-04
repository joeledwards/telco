# Telco

A service for storing, viewing, and exporting cellular call detail records (CDR).

## Architecture

- TypeScript for API and web assets
- Node.js to run the HTTP server
- Postgres for persistent storage (falling back to in-memory during local dev)

## Local Deployment Requirements

- docker (with compose capability)

## Dev Requirements

- Node.js 24
- npm 10

## Setup (all workflows)

```bash
npm install
```

This installs everything needed for tests, local dev, and Docker builds.

## Run Locally (in-memory store)

Use the built-in memory storage when you want to iterate quickly without
Postgres:

```bash
# compile TypeScript and emit dist/
npm run build

# start the compiled server (uses in-memory storage because DATABASE_URL is unset)
npm start
```

OR

```bash
# run a file watcher during development
npm run dev
```

Open a web browser tab to: `http://localhost:3000`


## Test

```bash
# single run
npm test

# watch mode
npm run test:watch

# coverage report
npm run test:coverage
```

Vitest writes temporary assets under `node_modules/.vite-temp`; make sure the
repo is writable before running the suite.

## Run with Docker (Postgres + API)

Compose builds the Node image, starts Postgres, seeds migrations, and stores data
in a named volume so you can stop/start without losing state:

```bash
# build images and start the stack
docker compose up --build
```

Once both services are healthy, open a web browser tab to `http://localhost:3000`

The Postgres connection string environment variable is supplied to the node container:
`DATABASE_URL=postgres://telco:telco@db:5432/telco`

### Applying migrations manually

Postgres executes every SQL file under `migrations/` the first time the volume is
created. To reapply a migration later:

```bash
docker compose exec db \
  psql -U telco -d telco -f /docker-entrypoint-initdb.d/001_create_tables.sql
```

To reset everything, remove the named volume (`docker volume rm telco_postgres-data`).

## Development Workflow

- `npm run build` / `npm run dev` – rebuild or watch server code while working.
- `npm start` – run the compiled server locally (in-memory store).
- `npm run typecheck` – verify types without emitting JS.
- `npm test` – keep unit tests green.
- `docker compose up --build` – exercise the full stack against Postgres.

## What is missing

This is a very simple PoC. There are many changes I would make to make the system production ready and improve its maintainability.

- Switch from static pages to a component system based on React or Next.js
- Use an ORM for entity management and persistence
- Manage database schema via a migration utility (could be built in to the ORM)
- Add users, authentication, and role based authorization
- Streaming upload and parsing to support files of any size
- CDR encoder/decoder as an N-API addon written in C or Rust
- Many validations and associated tests are missing for the CDR format
- Batch insert queries for faster persistence of records to the database
- Structured logging library
- Metrics collection library
- UI unit tests
- End-to-end tests

## Exercise Reference

Full problem statement:
https://www.notion.so/teamhologram/Full-Stack-Engineering-Exercise-24833577b6b680a38760ddc5729b5cff

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

Open `http://localhost:3000` in your browser.


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

Once both services are healthy, browse to:

- `http://localhost:3000` – upload + preview
- `http://localhost:3000/search.html` – search UI

The Node container receives `DATABASE_URL=postgres://telco:telco@db:5432/telco`.

If you want to connect from your host tooling, use
`postgres://telco:telco@localhost:5432/telco`.

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

## Roadmap

- Complete the basic / extended / hex encoders and decoders
- Create the API server 
- Provide a local Docker environment for end-to-end development (dev containers?)
- Build a page for file upload
- Build a page for record search and inspection

## Exercise Reference

Full problem statement:
https://www.notion.so/teamhologram/Full-Stack-Engineering-Exercise-24833577b6b680a38760ddc5729b5cff

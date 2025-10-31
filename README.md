# Telco

A service for storing, viewing, and exporting cellular call detail records (CDR).

## Architecture

* TypeScript for API and WebApp code
* Postgres for the database, though we might use SQLite to start
* Node.js to run the server
* Undecided on the front-end yet (perhaps Next.js?) 

## Requirements

* Node.js 24
* npm 10

## Setup

```bash
npm install
```

## Build

To compile TypeScript sources, pushing Javascript to the `dist` directory:

```bash
npm run build
```

To run a type-check:

```bash
npm run typecheck
```

## Test

To run unit tests:

```bash
npm test
```

To run the watch server:

```bash
npm run test:watch
```

To see test coverage:

```bash
npm run test:coverage
```

Vitest writes temporary assets under `node_modules/.vite-temp`; ensure the repository is
writable before running the suite.

## Run Locally

TODO: add docker-compose support

## Roadmap

- Complete the basic / extended / hex encoders and decoders
- Create the API server 
- Provide a local Docker environment for end-to-end development (dev containers?)
- Build a page for file upload
- Build a page for record search and inspection

## Requirements

https://www.notion.so/teamhologram/Full-Stack-Engineering-Exercise-24833577b6b680a38760ddc5729b5cff

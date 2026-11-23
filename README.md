# GuildPH

GuildPH is a full-stack gaming community discovery platform for Filipino gaming communities.

## Phase 1 status

The foundation includes a React/Vite/Tailwind frontend, versioned Netlify Functions API, Neon PostgreSQL migrations, the public homepage, and deployment configuration.

## Local setup

1. Install Node.js 20 or newer.
2. Copy `apps/web/.env.example` and `apps/api/.env.example`.
3. Run `npm install`.
4. Run `npm run dev:web`.
5. Run `npm run dev:api`.

## Database migrations

Apply migrations once, in filename order, using a PostgreSQL-compatible migration tool:

```text
psql "$DATABASE_URL" -f database/migrations/001_initial.sql
psql "$DATABASE_URL" -f database/seeds/001_core.sql
```

## External services

Firebase, Neon, Netlify, and optional hosted image storage require environment variables. No credentials are stored in this repository.

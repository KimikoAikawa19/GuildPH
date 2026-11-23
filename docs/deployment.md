# Netlify deployment

## Neon

Create a PostgreSQL database and run `database/migrations/001_initial.sql`, followed by `database/seeds/001_core.sql`, using a PostgreSQL migration client.

Set the Neon HTTP-compatible connection string as the `DATABASE_URL` Netlify environment variable.

## Firebase

Create a Firebase project, enable Email/Password and Google providers, add production domains, and set:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`

Set `FIREBASE_PROJECT_ID` and `OWNER_BOOTSTRAP_UID` as protected Netlify environment variables.

## Netlify

1. Push the repository to GitHub.
2. In Netlify, select **Add new project**, then **Import an existing project**.
3. Choose the GuildPH GitHub repository.
4. Netlify will use the root `netlify.toml`.
5. Add `DATABASE_URL`, `FIREBASE_PROJECT_ID`, `OWNER_BOOTSTRAP_UID`, and `APP_ORIGINS` in **Site configuration → Environment variables**.
6. Deploy the site.

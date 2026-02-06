# Prisma Troubleshooting — InkMind

This doc explains why Prisma can fail in this project and how to fix or work around it.

---

## 1. Why things fail

### Multi-schema (auth + public)

The project uses **multi-schema** in `prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
  schemas   = ["auth", "public"]
}
```

- **auth** — Supabase Auth tables (introspected for `profiles` ↔ `users` relation).
- **public** — Our tables: `profiles`, `studios`, `designs`.

**Documented issues:**

- **Prisma Studio** can throw errors like **"No default workspace found"** or client path resolution errors when multiple schemas are used. Studio’s embedded client expects a single “default” workspace; with `auth` + `public` that resolution can fail.
- **Supabase** recommends *not* managing `auth` / `storage` with Prisma migrations, because Supabase may change those schemas and cause **drift** (see [Supabase Prisma troubleshooting](https://supabase.com/docs/guides/database/prisma/prisma-troubleshooting)).
- Prisma has had bugs where **multi-schema** config is stripped or mishandled in some CLI flows (e.g. `prisma dev` overwriting the datasource block).

So: **Prisma generate and runtime can work**, but **Prisma Studio and some CLI commands are fragile** with this setup.

---

### Database connection / credentials

If **DATABASE_URL** or **DIRECT_URL** are wrong or missing:

- You get **"Authentication failed … the provided database credentials for postgres are not valid"** (or similar).
- **Prisma generate** may still succeed (it only needs the schema file).
- **Prisma Studio**, **migrate**, **db push**, and the **app at runtime** will fail when they connect.

Required in `.env` / `.env.local`:

- **DATABASE_URL** — Session pooler (port **5432**) for app and Studio.  
  Example: `postgres://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres`
- **DIRECT_URL** — Direct Postgres for migrations.  
  Example: `postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres`

**"FATAL: Tenant or user not found"** (e.g. when running `npx prisma db pull` or at runtime):

1. Open **Supabase Dashboard** → your project → **Project Settings** (gear) → **Database**.
2. Scroll to **Connection pooler** and find the **Session** or **Transaction** connection string (URI).
3. Copy that URI exactly — the host may be `aws-0-eu-west-1`, `aws-1-eu-west-1`, or another region. Do not guess; use the one shown.
4. Set **DATABASE_URL** and **DIRECT_URL** in `.env` to that URI (use Session, port 5432, for both if possible). For Transaction (port 6543) add `?pgbouncer=true` to DATABASE_URL.
5. Restart the dev server and/or run `npx prisma db pull` again.

Prisma uses **DIRECT_URL** for introspection (`db pull`) and migrations. If the pooler still fails, you can set **DIRECT_URL** to the **direct** connection (`postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres`) and run `db pull` only from a network where the direct host is reachable (e.g. after resolving IPv6 or from a different machine).

If you use **transaction mode** (port **6543**), add `?pgbouncer=true` to the URL so Prisma doesn’t use prepared statements (not supported in that mode).

---

### Windows: EPERM / query engine locked

On Windows you may see:

```text
EPERM: operation not permitted, rename '...\node_modules\.prisma\client\query_engine-windows.dll.node.tmp...' -> '...\query_engine-windows.dll.node'
```

**Cause:** The query engine DLL is locked by another process (e.g. Next.js dev server, IDE, antivirus).

**Fixes:**

- Stop the dev server and any process that might use Prisma (e.g. close and reopen the terminal).
- Run **`npx prisma generate`** again.
- If it still fails: delete `node_modules\.prisma` (or the whole `node_modules`), then `npm install` and `npx prisma generate`.
- Temporarily running the terminal (or VS Code) as Administrator can sometimes help when nothing else does.

---

## 2. What works vs what doesn’t

| Action                 | Typical status |
|------------------------|----------------|
| `npx prisma generate`  | ✅ Should work (only needs schema + env for optional validation). |
| App runtime (Prisma Client) | ✅ Works if DATABASE_URL is correct and profile/DB are reachable. |
| `npx prisma migrate dev` / `db push` | ⚠️ Can work; use DIRECT_URL. Risk of drift if Supabase changes auth. |
| **`npx prisma studio`** | ❌ Often fails with multi-schema (“No default workspace”, client path errors). |

---

## 3. Recommended workarounds

### Viewing / editing data (instead of Prisma Studio)

- Use **Supabase Dashboard → Table Editor** for `public.profiles`, `public.studios`, `public.designs`, etc.
- Use **SQL Editor** for custom queries and one-off updates.

### Generating the client

```bash
npx prisma generate
```

If you hit EPERM on Windows, stop the dev server and any other Node/Prisma processes, then run the same command again (or after clearing `node_modules\.prisma` as above).

### Migrations

- Prefer **Supabase migrations** (e.g. `supabase/migrations/*.sql`) for schema changes on Supabase, especially when touching or depending on `auth`.
- If you use **Prisma Migrate**, use **DIRECT_URL**, run from a clean state, and avoid migrating Supabase-managed schemas. See [Supabase Prisma troubleshooting](https://supabase.com/docs/guides/database/prisma/prisma-troubleshooting).

### Connection strings

- Get **Session** (5432) and **Direct** URIs from Supabase: **Project Settings → Database**.
- Ensure the same password and project ref are used in both URLs.

---

## 4. Summary

- **Prisma fails** in this project mainly due to: **(1) multi-schema + Prisma Studio / some CLI behavior**, **(2) wrong or missing DATABASE_URL/DIRECT_URL**, and **(3) on Windows, the query engine file being locked (EPERM)**.
- **App and `prisma generate`** can work reliably with correct env and after fixing locks.
- **Prisma Studio** is unreliable with the current multi-schema setup; use **Supabase Table Editor + SQL Editor** instead for viewing and editing data.

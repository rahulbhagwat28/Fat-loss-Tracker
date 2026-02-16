# Deploy Fat Loss Fitness Tracker to Vercel

The app is **ready for Vercel**. It uses **PostgreSQL** (via `DATABASE_URL`).

---

## Required: before login works on Vercel

1. **Get a Postgres URL:** [neon.tech](https://neon.tech) → Sign up → New project → copy **connection string**.
2. **Add it on Vercel:** [vercel.com](https://vercel.com) → Your project → **Settings** → **Environment Variables** → Add:
   - **Name:** `DATABASE_URL`
   - **Value:** your Neon connection string (paste the full `postgresql://...` URL).
3. **Redeploy:** Deployments → ⋮ on latest deployment → **Redeploy**.

Without `DATABASE_URL`, login and all database features will fail on Vercel.

---

## Where to get the connection string (username & password)

You **don’t look up username and password separately**. Neon gives you one **connection string** that already contains them:

- Go to [console.neon.tech](https://console.neon.tech) → open your project.
- On the **Dashboard** you’ll see **Connection string** (often “Pooled connection”).
- Click **Copy** – that full URL is your `DATABASE_URL`.  
  It looks like:  
  `postgresql://neondb_owner:SomePassword123@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`  
  The part after `://` and before `@` is `username:password`; you never need to type them separately.

**If you lost the password or never saved the URL:**  
In the project go to **Settings** (or **Roles**). Reset the database user’s password. Neon will show a **new connection string** – use that as `DATABASE_URL`.

---

## Do I need to migrate again?

**No.** Your Vercel build already runs:

```bash
prisma generate && prisma db push && next build
```

So on **every deploy**, `prisma db push` runs and applies your schema to the Neon database. You don’t run migrations or `db push` yourself for Vercel.

- **First deploy** with `DATABASE_URL` set: tables are created in Neon.
- **Later deploys**: schema changes are applied automatically.

Only if you want to apply the schema from your machine (e.g. before first deploy) run once:

```bash
npx prisma db push
```

(with `DATABASE_URL` in `.env` or set in the shell).

---

## Option A: Deploy from your machine (Vercel CLI)

### 1. Get a database URL (Neon)

1. Go to [neon.tech](https://neon.tech) and sign up.
2. Create a project and copy the **connection string** (e.g. `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`).

### 2. Local setup (optional, for running locally)

Create a `.env` in the project root:

```env
DATABASE_URL="postgresql://..."
```

Then run:

```bash
npm install
npx prisma db push
```

### 3. Deploy to Vercel

In the project folder:

```bash
npx vercel login
```

Log in in the browser, then:

```bash
npx vercel --prod
```

When prompted:

- **Set up and deploy?** Yes.
- **Which scope?** Your account.
- **Link to existing project?** No (first time) or Yes if you already have one.
- **Project name?** Accept default (e.g. `fat-loss-tracker`) or choose one.
- **Directory?** `./` (default).

**Important:** Before the build runs, add `DATABASE_URL`:

- Either when the CLI asks for env vars, add:
  - Name: `DATABASE_URL`
  - Value: your Neon connection string
- Or after the first deploy: go to [vercel.com](https://vercel.com) → your project → **Settings** → **Environment Variables** → add `DATABASE_URL` with your Neon URL → **Redeploy** (Deployments → ⋮ → Redeploy).

The build runs `prisma generate && prisma db push && next build`, so the first deploy will create tables in Neon.

Your app will be at `https://your-project.vercel.app`.

---

## Option B: Deploy via GitHub + Vercel dashboard

### 1. Get a database URL (Neon)

Same as Option A: [neon.tech](https://neon.tech) → create project → copy connection string.

### 2. Push code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### 3. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. **Add New…** → **Project** → import your repo.
3. **Environment Variables:** add `DATABASE_URL` = your Neon connection string (Production, Preview, Development).
4. Click **Deploy**.

Vercel will run `npm install`, then the build script (`prisma generate && prisma db push && next build`). Tables are created in Neon on the first deploy.

---

## After deploy

- App URL: `https://your-project.vercel.app`
- To redeploy: push to `main` (GitHub) or run `npx vercel --prod` again (CLI).
- Custom domain: Vercel → Project → **Settings** → **Domains**.

## Checklist

- [ ] Neon project created; connection string copied
- [ ] `DATABASE_URL` set in Vercel (dashboard or CLI)
- [ ] Deploy completed; app loads and you can sign up / log in

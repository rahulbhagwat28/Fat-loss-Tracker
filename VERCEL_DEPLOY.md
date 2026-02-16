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

## Required: image uploads (Vercel Blob)

The app uploads images (posts, avatar, progress pics) to **Vercel Blob**. Without this, uploads will fail with "Upload failed".

1. **Create a Blob store**  
   Vercel dashboard → your project → **Storage** tab → **Create Database** or **Connect Store** → choose **Blob** → Create. This creates a store and adds the env var automatically in many cases.

2. **Add the token on Vercel (if not auto-added)**  
   **Settings** → **Environment Variables** → Add:
   - **Name:** `BLOB_READ_WRITE_TOKEN`
   - **Value:** (from Storage → your Blob store → copy the token, or from the creation step).
   Apply to **Production**, **Preview**, and **Development**.

3. **Redeploy**  
   Deployments → Redeploy so the new env var is used.

You do **not** run `npm install` on Vercel yourself. When you have `@vercel/blob` in `package.json` and push your code, Vercel runs `npm install` during the build. Just add the env var and redeploy.

---

## Fix: "Can't reach database server" (P1001)

If the error shows a host like `...useast-1.aws.neon.tech`, the region name is wrong: it must be **us-east-1** (with a hyphen), not "useast-1".

1. Open [Neon Console](https://console.neon.tech) → your project.
2. Copy the **connection string** again (use **Pooled connection**).
3. Check the host in the URL: it should contain **us-east-1** or **us-west-1** etc. (with the hyphen).
4. In Vercel → Settings → Environment Variables → edit **DATABASE_URL** and paste the corrected string.
5. Redeploy.

---

## Fix: "Unable to open the database file" on Vercel

This error means the **deployed app is still using SQLite** (a file), which doesn’t work on Vercel. Do all of the following:

1. **Use PostgreSQL in the repo**  
   In `prisma/schema.prisma` the datasource must be:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
   (No `provider = "sqlite"` or `file:./dev.db`.)

2. **Push your code**  
   Commit and push so the branch Vercel deploys from has the PostgreSQL schema.  
   Example:
   ```bash
   git add prisma/schema.prisma
   git commit -m "Use PostgreSQL for Vercel"
   git push
   ```

3. **Set DATABASE_URL on Vercel**  
   Vercel → your project → **Settings** → **Environment Variables** → add:
   - **Name:** `DATABASE_URL`
   - **Value:** your Neon connection string (from [Neon](https://console.neon.tech), copy the full `postgresql://...` URL).  
   Apply to **Production**, **Preview**, and **Development**.

4. **Redeploy (no cache)**  
   Deployments → ⋮ on the latest deployment → **Redeploy**.  
   If it still fails, try **Redeploy** and enable **Clear build cache**, then deploy again.

After this, the app will use Neon (Postgres) on Vercel and the error will stop.

---

## Create a database in Neon (step by step)

1. **Open Neon**  
   Go to [neon.tech](https://neon.tech) in your browser.

2. **Sign up**  
   Click **Sign up** and create an account (e.g. with GitHub or email).

3. **Create a project**  
   After login you’ll see the dashboard. Click **New Project**.

4. **Set project details**  
   - **Name:** e.g. `fat-loss-tracker` (or any name).  
   - **Region:** pick one close to you (e.g. US East).  
   - Leave other options as default.  
   Click **Create project**.

5. **Copy the connection string**  
   When the project is ready you’ll see a **Connection string** section.  
   - Make sure **“Pooled connection”** (or “Connection string”) is selected.  
   - Click **Copy** next to the string.  
   It will look like:  
   `postgresql://neondb_owner:xxxxx@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require`  
   This is your **DATABASE_URL**.

6. **Use it in the app**  
   - **Local:** Put it in your project’s `.env` as  
     `DATABASE_URL="paste_here"`  
   - **Vercel:** Project → Settings → Environment Variables → add **Name** `DATABASE_URL`, **Value** paste the same string → Save, then redeploy.

That’s it. No need to create tables manually – your app’s build runs `prisma db push` and creates them.

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

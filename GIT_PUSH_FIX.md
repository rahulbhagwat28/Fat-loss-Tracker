# Fix: "400" and "unexpected disconnect" when pushing to GitHub

## What’s going on

- **400** = GitHub is rejecting the push (bad request).
- **Unexpected disconnect** = the connection drops during `git push`, often because the server closed it (e.g. after sending the 400) or the push is large/slow.

## 1. Stop pushing copied uploads (already done in this repo)

The Capacitor `ios/` and `android/` folders contain copies of `public/uploads/` (large images). Those paths are now in `.gitignore`, so they won’t be committed anymore.

If they were already committed, remove them from Git (keeps files on disk):

```bash
git rm -r --cached ios/App/App/public/uploads 2>/dev/null
git rm -r --cached android/app/src/main/assets/public/uploads 2>/dev/null
git add .gitignore
git commit -m "Stop tracking uploads inside native app folders"
```

## 2. Increase Git’s HTTP buffer

Large pushes can hit the default buffer and cause odd errors:

```bash
git config http.postBuffer 524288000
```

Then try pushing again.

## 3. Check remote URL and auth

**Remote:**

```bash
git remote -v
```

You should see something like:

- `origin  https://github.com/rahulbhagwat28/Fat-loss-Tracker.git`

**If you use HTTPS:**

- Make sure you’re logged in (GitHub may ask for username + **Personal Access Token**, not password).
- If you get 400/403, create a new token: GitHub → Settings → Developer settings → Personal access tokens → Generate new token (classic), enable **repo** scope, then use it as the password when pushing.

**If you prefer SSH:**

```bash
git remote set-url origin git@github.com:rahulbhagwat28/Fat-loss-Tracker.git
git push -u origin main
```

(Use your branch name instead of `main` if different.)

## 4. Push again

```bash
git add .
git status
git commit -m "Your message"
git push -u origin main
```

If it still returns **400**, check on GitHub:

- Repo exists: `https://github.com/rahulbhagwat28/Fat-loss-Tracker`
- You have write access.
- Branch name matches (e.g. `main` vs `master`).

If the error says something about **file size**, you may have a file over 100 MB; find it with:

```bash
find . -type f -size +100M -not -path "./node_modules/*" -not -path "./.git/*"
```

and add it to `.gitignore` or remove it from the last commit.

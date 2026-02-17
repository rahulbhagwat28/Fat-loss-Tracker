# Deploy Fat Loss Tracker to Google Play Store

This guide walks you through publishing the app to the Play Store using EAS (Expo Application Services).

---

## Prerequisites

1. **Expo account** – [expo.dev](https://expo.dev) – sign up (free)
2. **Google Play Developer account** – [play.google.com/console](https://play.google.com/console) – **$25 one-time fee**
3. **Vercel backend deployed** – Your API must be live (e.g. `https://your-app.vercel.app`)

---

## Step 1: Set your production API URL

The app must point to your deployed backend, not localhost.

**Option A – In `eas.json`:**

Edit `mobile/eas.json` and replace `YOUR_VERCEL_APP` with your Vercel project name:

```json
"production": {
  "env": {
    "EXPO_PUBLIC_API_URL": "https://your-actual-app.vercel.app"
  },
  ...
}
```

**Option B – When building:**

```bash
EXPO_PUBLIC_API_URL=https://your-app.vercel.app eas build --platform android --profile production
```

---

## Step 2: Build the Android app

From the project root:

```bash
cd mobile
npx eas login
npx eas build --platform android --profile production
```

- First time: EAS will ask to create a project and configure credentials.
- Choose **Generate new keystore** when asked (EAS manages signing for you).
- Build runs in the cloud (~10–15 min). You’ll get a link to the build status.

---

## Step 3: Create the app in Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. **Create app** → Enter app name, default language, app type (App), category (Health & Fitness).
3. Complete the **App content** checklist (you can do most later):
   - **Privacy policy** – URL required (e.g. `https://your-app.vercel.app/privacy` or a simple page)
   - **App access** – If login is required, describe how users get access
   - **Ads** – If you use ads, say so; otherwise “No ads”
   - **Content rating** – Fill out questionnaire
   - **Target audience** – Age groups
   - **News app** – No (unless it is)
   - **COVID-19** – No (unless relevant)
   - **Data safety** – Describe what data you collect

4. Create a **Production** release (or **Internal testing** first to test).

---

## Step 4: Submit to Play Store

1. After the build completes, download the **AAB** (Android App Bundle) from the EAS build page, or run:

   ```bash
   npx eas submit --platform android --profile production --latest
   ```

2. **First time:** EAS will ask for a **Google Service Account**:

   - Play Console → **Setup** → **API access** → **Create new service account**
   - Follow the link to Google Cloud Console
   - Create a service account → **Create key** (JSON)
   - Download the JSON file
   - In Play Console: **Grant access** to that service account for your app
   - Run `eas submit` again and upload the JSON when prompted

3. **Select track:** Choose **Production** (or Internal testing for testing).

4. Submit. Review can take 1–7 days.

---

## Quick reference

| Command | Purpose |
|---------|---------|
| `eas build --platform android --profile production` | Build AAB for Play Store |
| `eas submit --platform android --profile production --latest` | Submit latest build to Play Store |
| `eas build:list` | List builds |
| `eas credentials` | Manage signing keys |

---

## Checklist

- [ ] Vercel backend deployed and working
- [ ] `EXPO_PUBLIC_API_URL` set to your Vercel URL in `eas.json` or build command
- [ ] Google Play Developer account created ($25)
- [ ] App created in Play Console
- [ ] Privacy policy URL ready
- [ ] `eas build` completed successfully
- [ ] `eas submit` completed (or AAB uploaded manually)

---

## Troubleshooting

**Build fails:** Check `eas build` logs. Common issues: missing env vars, wrong Node version.

**Submit fails:** Ensure the service account has access in Play Console and the JSON key is correct.

**App crashes on launch:** Check that `EXPO_PUBLIC_API_URL` points to your live backend (no trailing slash).

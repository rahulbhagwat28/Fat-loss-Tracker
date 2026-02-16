# Fat Loss Tracker – Mobile App

## Install from browser (Android) – no app store

1. **Deploy** your app to Vercel and open the site in **Chrome** on your Android phone (e.g. `https://your-app.vercel.app`).
2. **Install option:**
   - Tap the **⋮** (three dots) in the top right → look for **"Install app"** or **"Add to Home screen"**.
   - Or look for an **install icon** (⊕ or downward arrow) in Chrome’s address bar and tap it.
3. Confirm → the app icon appears on your home screen and opens in full screen like an app.

If you don’t see **Install app** in the menu, make sure you’re on the **deployed** site (HTTPS), not localhost. Redeploy after adding the service worker, then try again in Chrome.

---

## Native app (Capacitor)

A **native iOS and Android app** is set up in this repo. The app is a shell that loads your live Vercel site in a WebView, so you get one codebase (the Next.js app) and real installable apps.

### What’s included

- **Capacitor** – `ios/` and `android/` native projects
- **Config** – `capacitor.config.ts` points the app at your Vercel URL
- **Scripts** – `npm run mobile:ios` and `npm run mobile:android` to open the projects

---

## 1. Set your app URL

The mobile app loads your deployed site. Set the URL in one of these ways:

**Option A – In the config (recommended)**  
Edit `capacitor.config.ts` and set `serverUrl` to your Vercel URL, e.g.:

```ts
const serverUrl = "https://your-app.vercel.app";
```

**Option B – With an env var**  
Create a `.env.local` (or set in your shell):

```bash
CAPACITOR_SERVER_URL=https://your-app.vercel.app
```

Then run the mobile commands. The config reads this when it’s loaded.

---

## 2. Run on a simulator or device

### iOS (Mac only, Xcode required)

```bash
npm run mobile:ios
```

This opens the project in Xcode. Then:

1. Pick a simulator (e.g. iPhone 15) or a connected device.
2. Press **Run** (▶) to build and run.

To run from the terminal instead:

```bash
npm run mobile:run:ios
```

### Android (Android Studio required)

```bash
npm run mobile:android
```

This opens the project in Android Studio. Then:

1. Pick an emulator or connected device.
2. Press **Run** (▶) to build and run.

To run from the terminal:

```bash
npm run mobile:run:android
```

---

## 3. After changing the web app or config

When you change:

- `capacitor.config.ts`, or  
- Anything in `public/` (e.g. icons),

sync the native projects:

```bash
npm run mobile:sync
```

Then run the app again from Xcode or Android Studio (or `mobile:run:ios` / `mobile:run:android`).

---

## 4. Changing the app URL later

1. Update `serverUrl` in `capacitor.config.ts` (or `CAPACITOR_SERVER_URL`).
2. Run `npm run mobile:sync`.
3. Rebuild and run the app.

---

## 5. Publish to Google Play Store (make it appear on Play Store)

To have your app **show up in the Play Store** so people can search and install it:

### Step 1: Google Play Developer account

1. Go to [Google Play Console](https://play.google.com/console).
2. Sign in with a Google account.
3. Pay the **one-time $25 registration fee** to become a developer.
4. Accept the developer agreement.

### Step 2: Build a signed release bundle (AAB)

Google Play requires an **Android App Bundle** (.aab), not just an APK.

1. Open the Android project:
   ```bash
   npm run mobile:android
   ```
2. In Android Studio: **Build → Generate Signed Bundle / APK**.
3. Choose **Android App Bundle** → Next.
4. **Create a new keystore** (first time only):
   - Key store path: e.g. `fatlosstracker-keystore.jks` (save somewhere safe).
   - Password: choose a strong password (save it).
   - Alias: e.g. `upload`, Key password: same or another (save it).
5. Next → select **release** → Create.
6. Wait for the build. The **.aab** file will be at something like  
   `android/app/release/app-release.aab`.

Keep the **keystore file and passwords** safe; you need them for every future update.

### Step 3: Create the app in Play Console

1. In [Play Console](https://play.google.com/console), click **Create app**.
2. Fill in: App name, Default language, App or game, Free or paid.
3. Accept declarations (e.g. export compliance, ads if you use them).

### Step 4: Upload the AAB

1. In your app’s Play Console page, go to **Release → Production** (or **Testing → Internal testing** to try first).
2. **Create new release**.
3. **Upload** the `.aab` file (e.g. `app-release.aab`).
4. Add **Release name** (e.g. "1.0 (1)") and **Release notes**.
5. Save (and optionally start rollout).

### Step 5: Complete the store listing

In **Grow → Store presence → Main store listing** (and any other required sections):

- **Short description** (up to 80 characters).
- **Full description** (what the app does).
- **App icon**: 512×512 PNG (you have `public/icon-512.png`).
- **Feature graphic**: 1024×500 PNG (create or use a simple banner).
- **Screenshots**: at least 2 phone screenshots (e.g. from emulator or device).

### Step 6: Complete required policies

- **Privacy policy**: You need a **public URL** to a privacy policy page. Host it on your Vercel site (e.g. `/privacy`) or another site, and paste the URL in Play Console.
- **App content**: Fill in **Content rating** (questionnaire), **Target audience**, **News app** (if needed), **Ads** (if your app shows ads), etc., as required by the form.

### Step 7: Submit for review

When all required sections have a green checkmark:

- Go to **Release → Production** (or your chosen track).
- Click **Start rollout to Production** (or **Send for review**).

Google will review the app (often 1–3 days). After approval, the app will **appear in the Play Store** and users can search and install it.

---

## 6. Publish to Apple App Store (iOS)

- **Apple Developer account** ($99/year): [developer.apple.com](https://developer.apple.com).
- In Xcode: set up signing with your Apple account, then **Product → Archive**.
- Upload the archive to **App Store Connect**, then in App Store Connect complete the listing, screenshots, privacy policy, and submit for review.

Use your own app icons and splash screens in the `ios/` and `android/` projects so the store listings match your brand.

---

## PWA (install from browser)

Users can also install the app from the browser without the stores:

- **Android (Chrome):** Menu → “Install app” / “Add to Home screen”.
- **iPhone (Safari):** Share → “Add to Home Screen”.

See the manifest and icons in `src/app/manifest.ts` and `public/icon-192.png`, `public/icon-512.png`.

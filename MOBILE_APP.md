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

## 5. Publishing to the App Store / Play Store

- **iOS:** In Xcode, set up signing (Apple Developer account), then **Product → Archive** and upload to App Store Connect.
- **Android:** In Android Studio, build a release bundle (e.g. **Build → Generate Signed Bundle / APK**) and upload to Google Play Console.

Use your own app icons and splash screens in the `ios/` and `android/` projects (replace the default assets) so the store listing matches your brand.

---

## PWA (install from browser)

Users can also install the app from the browser without the stores:

- **Android (Chrome):** Menu → “Install app” / “Add to Home screen”.
- **iPhone (Safari):** Share → “Add to Home Screen”.

See the manifest and icons in `src/app/manifest.ts` and `public/icon-192.png`, `public/icon-512.png`.

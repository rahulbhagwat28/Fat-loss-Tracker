# Fat Loss Tracker – Mobile App (React Native / Expo)

Same app as the web version, built with **Expo** so you can ship to the **Google Play Store** (and App Store if you want).

## Prerequisites

- Node.js 18+
- Your **web app deployed** (e.g. on Vercel) so the mobile app can call its API.

## Setup

1. **Install dependencies**

   ```bash
   cd mobile
   npm install
   ```

2. **Point the app at your backend**

   Create a `.env` file in the `mobile` folder:

   ```env
   EXPO_PUBLIC_API_URL=https://your-fat-loss-tracker.vercel.app
   ```

   Replace with your real Vercel (or other) URL. No trailing slash.

   Or set the same URL in `app.json` → `expo.extra.apiUrl`.

3. **Add app icons (required for Play Store)**

   - `assets/icon.png` – 1024×1024 app icon  
   - `assets/splash.png` – splash screen image  
   - `assets/adaptive-icon.png` – 1024×1024 Android adaptive icon  

   You can use [Expo’s asset generator](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/) or add your own PNGs.

## Run locally

```bash
npm start
```

Then press **a** for Android or **i** for iOS simulator. On a physical device, scan the QR code with the Expo Go app.

## Build for Google Play Store

1. **Install EAS CLI and log in**

   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **Configure the project**

   ```bash
   eas build:configure
   ```

   Choose **Android** (and optionally iOS). When asked for a build profile, you can keep the default or add a **production** profile.

3. **Build the Android app**

   ```bash
   eas build --platform android --profile production
   ```

   When the build finishes, EAS gives you a download link for the `.aab` (Android App Bundle). Use that in **Google Play Console** to upload your app.

4. **Play Store listing**

   - Create an app in [Google Play Console](https://play.google.com/console).
   - Fill in store listing, privacy policy, content rating, and target audience.
   - Upload the `.aab` from the EAS build.
   - Set pricing (free or paid) and submit for review.

## What’s in the app

- **Login / Register** – same account as the web app (same API).
- **Feed** – view and like posts.
- **Health** – add daily logs (weight, calories, macros, sleep, steps, etc.).
- **Friends** – see friends, accept/decline requests (find people / search can be done on web).
- **Chat** – list of conversations; “Open full chat in browser” for the full chat UI.
- **More** – History, Weight Graph, Progress Pics, Notifications, Profile, Log out (opens web for those screens or uses in-app where implemented).

The app uses **secure storage** for the session and sends it as a cookie to your existing API, so no backend changes are required.

## Optional: environment-specific API URL

For development vs production:

- **Development:** `.env` with `EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000` (e.g. `http://192.168.1.5:3000`) so the device can reach your laptop.
- **Production:** `EXPO_PUBLIC_API_URL=https://your-app.vercel.app` so the store build uses the live API.

Then run or build as above; the app will use the URL from `EXPO_PUBLIC_API_URL` (via `app.config.js` → `extra.apiUrl`).

# Fat Loss Tracker – Mobile App

Your app is set up as an **installable Progressive Web App (PWA)**. Users can add it to their home screen and open it like a native app.

---

## Option 1: Install as PWA (no app store)

Already configured. After you deploy:

### On Android (Chrome)
1. Open your app URL (e.g. `https://your-app.vercel.app`).
2. Tap the **⋮** menu → **“Add to Home screen”** or **“Install app”**.
3. Confirm. An icon appears on the home screen and opens in fullscreen.

### On iPhone / iPad (Safari)
1. Open your app URL in **Safari** (not Chrome).
2. Tap the **Share** button (square with arrow).
3. Tap **“Add to Home Screen”**.
4. Edit the name if you want → **Add**. The icon appears on the home screen.

### What’s included
- **Manifest** (`/manifest.webmanifest`) – name, icons, theme color, standalone display.
- **Icons** – `public/icon-192.png` and `public/icon-512.png` (replace with your own branding if you like).
- **Theme color** – green (`#10b981`) for status bar / splash.
- **Viewport** – mobile-friendly, safe areas, no zoom issues.

No extra build step: deploy as usual and use “Add to Home Screen” on each device.

---

## Option 2: Native app (App Store / Play Store) with Capacitor

To ship a **native** iOS/Android app (and optionally publish to the stores), you can wrap the existing web app with [Capacitor](https://capacitorjs.com/).

### High-level steps

1. **Build the web app**  
   Use your production URL or a static export:
   - **Option A:** Point Capacitor at your live URL (e.g. `https://your-app.vercel.app`) so the app loads the site in a WebView.
   - **Option B:** Static export and serve the built files from the app (more setup, works offline).

2. **Add Capacitor to the project**
   ```bash
   npm install @capacitor/core @capacitor/cli
   npx cap init "Fat Loss Fitness Tracker" com.yourcompany.fatlosstracker
   ```

3. **Add platforms**
   ```bash
   npm install @capacitor/ios @capacitor/android
   npx cap add ios
   npx cap add android
   ```

4. **Configure the start URL** (if using Option A)  
   In `capacitor.config.ts`, set the app to load your Vercel URL so the “app” is just your existing site in a native shell.

5. **Open in Xcode / Android Studio and build**
   ```bash
   npx cap open ios
   npx cap open android
   ```
   Then archive (iOS) or build release (Android) and submit to the stores.

### Notes
- **Login / cookies:** Your app already uses cookies; in a WebView they work like in the browser. Ensure your API and auth support same-origin or CORS from the Capacitor app if you ever switch to a different origin.
- **Push notifications:** For native push you’d add Capacitor Push Notifications and a backend (e.g. Firebase or OneSignal).
- **Icons and splash:** Replace default Capacitor icons/splash with your `icon-512.png` (and any splash screen) for a consistent look.

Using **Option 1 (PWA)** is enough for most users to “install” and use the app from the home screen. Use **Option 2 (Capacitor)** when you need a store listing, native APIs, or push notifications.

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# WasteFoodLink

This app runs as a Vite web app and is now prepared to be wrapped as a hybrid mobile app with Capacitor.

## Run locally

Prerequisites: Node.js

1. Install dependencies with `npm install`
2. Copy `.env.example` to `.env.local`
3. Set `VITE_API_BASE_URL` to your backend URL
4. Set `VITE_ANDROID_API_BASE_URL` to the same backend URL when installing on a real phone over Wi-Fi/LAN
5. If you test Android over USB with `adb reverse`, you can set `VITE_ANDROID_API_BASE_URL=http://127.0.0.1:5000`
6. Run the frontend with `npm run dev`

## Mobile wrapper setup

1. Install the new Capacitor dependencies with `npm install`
2. Build the web bundle with `npm run build`
3. Sync native projects with `npm run mobile:sync`
4. Open Android Studio with `npm run mobile:android`
5. Open Xcode with `npm run mobile:ios`

## Important for phone testing

If you use LAN testing on a real phone, do not use `127.0.0.1`. Use your machine's local network IP instead, for example `http://192.168.1.10:5000`.

If you use USB testing with `adb reverse tcp:5000 tcp:5000`, Android can safely use `http://127.0.0.1:5000`.

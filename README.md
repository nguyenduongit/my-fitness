# my-fitness

A production-ready Progressive Web App template built with **Next.js 15** (App Router), **TypeScript**, and **Tailwind CSS v4**. Features push notifications, offline support, and a stunning dark-mode welcome screen.

---

## ✨ Features

- ⚡ **Next.js 15** with App Router and TypeScript (strict mode)
- 📱 **Full-screen PWA** — `standalone` display mode, works like a native app
- 🔔 **Push Notifications** — VAPID-based with subscribe, test, and send workflow
- 🎨 **Tailwind CSS v4** — Modern utility-first styling with custom theme
- 🌙 **Dark mode** — Elegant dark theme by default
- 📦 **Custom Service Worker** — Caching, push events, and notification click handling
- 📲 **Mobile-first** — `viewport-fit=cover`, safe-area insets, 44px touch targets
- 🍎 **iOS optimized** — Splash screens for all iPhone/iPad models
- 👆 **Touch-friendly** — Active states replace hover, optimized touch scrolling
- 🚀 **Deploy-ready** — Works on Vercel, Netlify, and any Node.js host

---

## 📁 Project Structure

```
.
├── public/
│   ├── manifest.json            # PWA manifest
│   ├── sw.js                    # Custom service worker
│   ├── icons/
│   │   ├── icon-192x192.png
│   │   ├── icon-512x512.png
│   │   └── apple-touch-icon.png
│   └── splash/                  # iOS splash screens (all device sizes)
│       ├── apple-splash-750x1334.png
│       ├── apple-splash-828x1792.png
│       ├── apple-splash-1125x2436.png
│       ├── apple-splash-1170x2532.png
│       ├── apple-splash-1179x2556.png
│       ├── apple-splash-1242x2208.png
│       ├── apple-splash-1242x2688.png
│       ├── apple-splash-1290x2796.png
│       ├── apple-splash-1536x2048.png
│       └── apple-splash-2048x2732.png
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout with PWA + iOS meta tags
│   │   ├── page.tsx             # Welcome screen
│   │   ├── globals.css          # Global styles + mobile optimizations
│   │   └── api/
│   │       └── send-notification/
│   │           └── route.ts     # Push notification API endpoint
│   ├── components/
│   │   └── NotificationPermission.tsx  # Notification UI component
│   └── lib/
│       └── push.utils.ts        # Push notification utilities
├── .env.local.example           # Environment variables template
├── next.config.ts               # Next.js + PWA config
├── tsconfig.json                # TypeScript configuration
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone <your-repo-url> my-app
cd my-app
npm install
```

### 2. Generate VAPID Keys

VAPID keys are required for push notifications. Generate them with:

```bash
npx web-push generate-vapid-keys
```

This will output something like:

```
Public Key:  BNz...abc
Private Key: xYz...def
```

### 3. Configure Environment Variables

Copy the example file and fill in your keys:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BNz...abc
VAPID_PRIVATE_KEY=xYz...def
VAPID_SUBJECT=mailto:your-email@example.com
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** Push notifications may not work in dev mode on some browsers. Use `npm run build && npm start` for a full PWA experience.

---

## 📦 Building for Production

### Standard Build (Vercel / Node.js)

```bash
npm run build
npm start
```

### Static Export (Netlify / static hosts)

> **Note:** API routes (push notification endpoint) require a Node.js server. For static export, you'll need to host the API separately or use a serverless function.

For Vercel deployment, no extra config is needed — just push to your repo.

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub/GitLab
2. Import the project on [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT`
4. Deploy! ✅

### Netlify

1. Push your code to GitHub/GitLab
2. Import the project on [netlify.com](https://netlify.com)
3. Set build command: `npm run build`
4. Set publish directory: `.next`
5. Install the [Next.js plugin](https://github.com/netlify/netlify-plugin-nextjs) for full SSR support
6. Add environment variables in Netlify dashboard
7. Deploy! ✅

---

## 🔔 Push Notifications

### How It Works

1. **User clicks "Allow Notifications"** → Browser requests permission
2. **Permission granted** → Service worker subscribes to push via VAPID key
3. **Subscription sent to server** → API endpoint receives and stores it
4. **Server sends notification** → `web-push` library sends payload to browser
5. **Service worker receives push** → Displays native notification
6. **User clicks notification** → App opens or focuses

### Testing Locally

1. Build and start the production server:
   ```bash
   npm run build && npm start
   ```
2. Click **"Allow Notifications"** on the welcome screen
3. Click **"Test Notification"** to send a test push

### Sending from Backend (curl)

```bash
# First, get a subscription object from the browser console or your database
# Then send a notification:

curl -X POST http://localhost:3000/api/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "action": "send",
    "subscription": {
      "endpoint": "https://fcm.googleapis.com/fcm/send/...",
      "keys": {
        "p256dh": "...",
        "auth": "..."
      }
    },
    "payload": {
      "title": "Hello!",
      "body": "This is a test notification from the backend.",
      "icon": "/icons/icon-192x192.png",
      "url": "/"
    }
  }'
```

### Sending with Postman

1. **Method:** POST
2. **URL:** `http://localhost:3000/api/send-notification`
3. **Headers:** `Content-Type: application/json`
4. **Body (raw JSON):**
   ```json
   {
     "action": "send",
     "subscription": { "endpoint": "...", "keys": { "p256dh": "...", "auth": "..." } },
     "payload": { "title": "Test", "body": "Push notification test!" }
   }
   ```

### Scheduled Reminders

Vercel Hobby accounts only support daily cron jobs, so production reminders use an external free scheduler instead of `vercel.json` cron configuration.

See [Free Reminder Cron Setup](docs/free-reminder-cron.md).

---

## 🔍 Lighthouse Audit (Desktop & Mobile)

To verify your PWA score on **both desktop and mobile**:

### Desktop Audit

1. Deploy to Vercel or run `npm run build && npm start`
2. Open Chrome DevTools → **Lighthouse** tab
3. Select **Desktop** device, check **Progressive Web App** + **Performance** + **Accessibility**
4. Run audit — target **90+** across all categories

### Mobile Audit (Critical!)

1. Same as above, but select **Mobile** device in Lighthouse
2. Alternatively, use CLI for automated mobile testing:
   ```bash
   # Install Lighthouse CLI
   npm install -g lighthouse

   # Run mobile audit (default is mobile)
   lighthouse http://localhost:3000 --view

   # Run with specific mobile emulation
   lighthouse http://localhost:3000 --emulated-form-factor=mobile --view
   ```
3. For real-device testing, use Chrome's **Remote Debugging**:
   - Connect your Android phone via USB
   - Open `chrome://inspect` on desktop
   - Run Lighthouse on the real device

### Mobile-Specific Optimizations in This Template

| Feature | Implementation | Why |
|---------|---------------|-----|
| `viewport-fit=cover` | `layout.tsx` viewport config | Edge-to-edge rendering on notched iPhones |
| Safe area insets | `globals.css` via `env(safe-area-inset-*)` | Prevent content from being hidden behind notch/home indicator |
| 44×44px touch targets | `@media (pointer: coarse)` in CSS + `min-h-[44px]` on buttons | WCAG 2.5.5 / Apple HIG compliance |
| Active states > Hover | `@media (hover: none)` disables hover, adds `active:scale-[0.98]` | Prevents sticky hover on touch devices |
| iOS splash screens | `apple-touch-startup-image` links in `layout.tsx` | Native launch experience from home screen |
| Touch scrolling | `touch-action: pan-y` on body | Smooth scrolling, prevents accidental gestures |
| Standalone mode CSS | `@media (display-mode: standalone)` | App-like feel when launched from home screen |
| `min-h-dvh` | Dynamic viewport height | Correct height on mobile browsers with URL bar |

---

## 🎨 Customization / Rebranding

To rebrand this template for your own app:

1. **Find & replace** `TemplateApp` with your app name across all files
2. Replace icons in `public/icons/` with your own (192×192, 512×512, 180×180)
3. Replace splash screens in `public/splash/` with your own (see sizes in `layout.tsx`)
4. Update `manifest.json` with your app's name, colors, and description
5. Update `layout.tsx` metadata (title, description, theme color)
6. Modify the welcome page in `page.tsx`

Quick search & replace:
```bash
# macOS/Linux
grep -rl "TemplateApp" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.js" . | xargs sed -i '' 's/TemplateApp/MyApp/g'

# Or use your IDE's find & replace across files
```

---

## 🛠 Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 15+ | React framework with App Router |
| TypeScript | 5+ | Type-safe development |
| Tailwind CSS | 4 | Utility-first CSS |
| web-push | 3.6+ | Server-side push notifications |

---

## 📄 License

MIT — feel free to use this template for any project.

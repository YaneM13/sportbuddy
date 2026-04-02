<<<<<<< HEAD
# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
=======
# 🟢 SportBuddy — Website Setup Guide

## 📁 Project Structure
```
sportbuddy/
├── public/
│   └── index.html        ← Website (frontend)
├── src/
│   └── server.js         ← Node.js server (backend)
├── .env.example          ← Config template
├── .env                  ← Your config (NEVER on GitHub!)
├── .gitignore
└── package.json
```

---

## 🚀 STEP 1 — Install Node.js
Download from: https://nodejs.org (choose LTS version)

---

## 🔑 STEP 2 — Gmail App Password

> ⚠️ This is required — Gmail blocks normal passwords for apps!

1. Go to: https://myaccount.google.com/security
2. Enable **2-Step Verification** (if not already on)
3. Go to: https://myaccount.google.com/apppasswords
4. Select **Mail** → **Other** → type: `SportBuddy`
5. Click **Generate**
6. Copy the 16-character password — you'll need it in Step 4

---

## ⚙️ STEP 3 — Configure the project

```bash
# In the sportbuddy folder:
npm install
cp .env.example .env
```

Open `.env` and fill in:
```
EMAIL_USER=jane.mladenoski31@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx    ← paste your App Password here
EMAIL_TO=jane.mladenoski31@gmail.com
```

---

## ▶️ STEP 4 — Run locally (test)

```bash
npm run dev
```

Open: **http://localhost:3000**
Test the contact form — you should receive an email!

---

## 🌐 STEP 5 — Deploy to Railway (free)

1. Create account at: https://railway.app (login with GitHub)
2. Push your project to GitHub:
   ```bash
   git init
   git add .
   git commit -m "SportBuddy launch"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/sportbuddy.git
   git push -u origin main
   ```
3. On Railway: **New Project → Deploy from GitHub repo**
4. Select your repo
5. Go to **Variables** tab and add:
   - `EMAIL_USER` = jane.mladenoski31@gmail.com
   - `EMAIL_PASS` = your App Password
   - `EMAIL_TO` = jane.mladenoski31@gmail.com
6. Railway gives you a URL like: `https://sportbuddy-production.up.railway.app`

---

## 🌍 STEP 6 — Connect sportbuddy.net domain

1. On Railway: **Settings → Domains → Add Custom Domain**
2. Type: `sportbuddy.net`
3. Railway shows you a CNAME record like:
   ```
   CNAME  @  sportbuddy-production.up.railway.app
   ```
4. Go to Namecheap → **Domain List → Manage → Advanced DNS**
5. Add the CNAME record Railway gave you
6. Wait 10–30 minutes → your site is live at **sportbuddy.net** ✅

---

## 🔐 Admin Login

URL: `sportbuddy.net` → click **Admin** in the top right

- Username: `admin`
- Password: `sportbuddy2026`

> ⚠️ Change the password! Open `public/index.html`, find these lines and update:
> ```javascript
> const ADMIN_USER = 'admin';
> const ADMIN_PASS = 'sportbuddy2026';
> ```

---

## ❓ Common Issues

**"Mail connection failed"**
→ Check EMAIL_USER and EMAIL_PASS in .env
→ Make sure 2FA and App Password are set up on Gmail

**"Cannot find module"**
→ Run `npm install` again

**Site not loading after domain setup**
→ DNS changes take up to 30 min. Be patient!

---

## 📦 Tech Stack

| Package | Purpose |
|---------|---------|
| Express | Web server |
| Nodemailer | Send emails |
| dotenv | Environment config |
| express-rate-limit | Spam protection |
| nodemon | Auto-restart (dev) |
>>>>>>> 1dc8cea7a8bde35312a4741c622c5a6a84be6d48

# SafePulse — Smarter Care. Safer School Days.
### رعاية أذكى، وأيام دراسية أكثر أمانًا

A student-designed prototype by **Top Tech**: a bilingual (English / Arabic, RTL) school-health web app with
a **Nurse portal** and a **Parent portal**, an AI Meal Scanner (prototype estimates), wellness plans, glucose
charts and gentle pattern insights.

> SafePulse is a student-designed prototype for educational and innovation purposes. It does not replace
> professional medical advice or an individual medical care plan. All demo data is fictional.
> It never calculates insulin or medication, never diagnoses, and never claims clinical validation.

---

## 1. What you need
* A computer or server with **Node.js 20 or newer** (22 recommended) — https://nodejs.org
* That's it. The database is a single file (SQLite) — nothing else to install.

## 2. Add your two images (important)
Put your **team photo** and **school logo** in `client/public/assets/`:

| File | What |
|---|---|
| `team.jpg` (or `.png/.jpeg/.webp/.svg`) | Top Tech team image |
| `logo.png` (or `.jpg/.jpeg/.webp/.svg`) | School logo |

No code changes needed. Until you add them, tidy placeholders are shown. After adding, run `npm run build` again.

## 3. Install and configure
```bash
npm install
cp .env.example .env          # Windows: copy .env.example .env
npm run gen-secret            # prints a long random text → paste it as AUTH_SECRET in .env
```
Open `.env` and set at least `AUTH_SECRET` and `APP_URL`. Everything else has a safe default.

## 4. Run it
**Try it locally (with live reload):**
```bash
npm run dev        # open http://localhost:5173
```
**Production mode (what you deploy):**
```bash
npm run build      # builds the website into /dist
npm start          # open http://localhost:3000
```
The database is created automatically on first start. With `DEMO_MODE=true` it is filled with fictional demo data.

### Demo accounts (when DEMO_MODE=true)
| Role | Email | Password |
|---|---|---|
| Nurse | `nurse@safepulse.demo` | value of `DEMO_PASSWORD` (default `SafePulse-Demo-2026`) |
| Parent | `parent@safepulse.demo` | same |

Or just click the **Demo Nurse / Demo Parent** buttons on the login screen. Use **Reset demo data** (nurse
header) to restore the sample data at any time.

### Real use (no demo data)
Set `DEMO_MODE=false`, restart, then create a nurse:
```bash
npm run create-nurse -- "nurse@school.edu" "Nurse Full Name" "A-Strong-Password"
```
Nurses then register students; each parent automatically gets an account with a one-time temporary password
(shown to the nurse, emailed if email is configured) and must change it at first login.

## 5. Deploy to a server (simple, step by step)
Works on any Linux VPS (Ubuntu example). Static-only hosts (GitHub Pages, Netlify drop, etc.) **cannot** run
SafePulse because it has a server and a database — you need a Node host (VPS, Render, Railway, Fly.io, etc.).

```bash
# 1. Upload the project folder (without node_modules) to the server, then:
cd safepulse
npm install
cp .env.example .env && nano .env     # set AUTH_SECRET, APP_URL=https://your-domain.com, COOKIE_SECURE=true
npm run build

# 2. Keep it running forever with PM2
sudo npm install -g pm2
pm2 start server/index.js --name safepulse
pm2 save && pm2 startup               # run the command it prints

# 3. HTTPS + domain with nginx
sudo apt install nginx certbot python3-certbot-nginx
```
`/etc/nginx/sites-available/safepulse`:
```nginx
server {
  server_name your-domain.com;
  client_max_body_size 8m;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/safepulse /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d your-domain.com      # free HTTPS certificate
```
Point your domain's DNS **A record** at the server's IP first. Back up the `data/` folder regularly
(database + uploaded meal photos).

**Platforms like Render/Railway:** Build command `npm install && npm run build`, start command `npm start`,
add the environment variables from `.env.example`, and attach a persistent disk mounted at `data/`
(or set `DATABASE_PATH` / `STORAGE_DIR` to the disk path).

## 6. Optional: real AI and real email
* **AI food recognition** — set `AI_API_KEY` (Anthropic) in `.env`. The AI only *identifies foods*; the
  Good Match / Review / Needs Attention rating always comes from SafePulse's own transparent rules.
  Without a key, the app uses clearly-labelled demo estimates.
* **Emails** — set `EMAIL_API_KEY` (Resend) and `EMAIL_FROM`. Without it, the nurse sees a
  "Prototype Email Preview" and the app never claims an email was sent.
* Keys live only in `.env` (never in code, never sent to the browser).

## 7. Security summary
* Two roles only (NURSE, PARENT), enforced **on the server** for every request; a parent can never open nurse
  pages or another family's child (404), and medical details are returned to nurses only.
* Passwords hashed with bcrypt; sessions in an httpOnly cookie; login errors never reveal which part was wrong;
  rate limiting, CSRF same-origin check, secure headers (CSP), validated image uploads.
* Password reset links are single-use, expire, and are stored hashed. Without email configured the link is
  printed to the server console.

## 8. Useful commands
| Command | What it does |
|---|---|
| `npm run dev` | Development server with live reload |
| `npm run build` | Build the website for production |
| `npm start` | Start the production server |
| `npm run typecheck` | TypeScript check |
| `npm run check:i18n` | Verifies English/Arabic text is complete |
| `npm run db:reset` | Wipe and re-create the demo database |
| `npm run create-nurse -- email name [password]` | Create a real nurse |
| `npm run gen-secret` | Generate a value for `AUTH_SECRET` |

## 9. Project structure
```
safepulse/
├─ client/                 React + TypeScript + Tailwind website
│  ├─ public/assets/       ← put team.* and logo.* here
│  └─ src/  pages · features · components · i18n (en.json/ar.json) · services
├─ server/                 Express API
│  ├─ routes/ middleware/ db/ (schema.sql, seed.js)
│  └─ services/ai/         the 7 AI functions, rules, demo mode, optional provider
├─ scripts/check-i18n.mjs
├─ .env.example  .gitignore  package.json  README.md
```

Built by **Top Tech** · *Smarter Care. Safer School Days.*

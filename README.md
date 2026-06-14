# Last Minute — Dashboard

Web dashboard for the Last Minute platform. Talks to the same FastAPI
backend and MongoDB Atlas cluster the mobile app uses — one DB, one API,
two frontends (mobile + this).

**Live**: https://last-minute-app.github.io/dashboard/
**Mobile app** repo: separate.
**API**: currently `https://last-minute-app-904761941913.europe-west1.run.app` (Cloud Run).

## Roles

| Role | Lands on | Can do |
|---|---|---|
| `consumer` | `/` | Browse offers, claim, view bookmarks (v2) |
| `merchant` (aka **Partner**) | `/partner` | Create / edit offers, see incoming claims, redeem |
| `admin` | `/admin` | Platform stats, user ban/unban, force-delete offers |

Admins cannot self-register. They are created via the `ADMIN_EMAIL` /
`ADMIN_PASSWORD` env vars on the backend at startup.

## Stack

- Vite + React 18 + TypeScript + Tailwind
- React Router v6 (deep-link aware on GH Pages via `404.html` trick)
- Axios for API, Zustand standby for state, Recharts for charts (v2)
- Auto-deploys to GH Pages on every push to `main`

## Local development

```bash
yarn install
yarn dev    # http://localhost:3001/dashboard/
yarn build  # produces dist/, used by the GH Actions workflow
```

The `VITE_API_BASE_URL` env var (in `.env`) controls which backend the SPA
hits. Defaults to the Cloud Run API URL.

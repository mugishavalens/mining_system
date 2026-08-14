# Backend

Placeholder for future server-side work (API, database, real authentication).

Nothing here yet — the app currently runs entirely client-side: mock data lives in
[`lib/mdmis-data.ts`](../lib/mdmis-data.ts) and [`lib/rbac.ts`](../lib/rbac.ts), and
login state is stored in `localStorage` via [`lib/auth-context.tsx`](../lib/auth-context.tsx).

The Next.js app itself stays at the repo root (not under `frontend/`) so the existing
Vercel deployment keeps working without changing the project's Root Directory setting.

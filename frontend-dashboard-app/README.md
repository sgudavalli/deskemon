# Deskemon Control Center

Configuration dashboard for routines, app connections, privacy, and autonomy
boundaries. **Routines** are backend-owned: they're read/written through the
backend's `GET/POST /routines` and `PUT /routines/{id}` API (proxied via
`/api` — see `vite.config.ts` in dev, `nginx.conf` in the Docker build), so
changes take effect in the rules engine immediately. Connections, privacy,
and activity are still frontend-only prototypes — those changes persist in
the browser through local storage and imply no live service connection.

```bash
npm install
npm run dev
```

This app is intentionally separate from `frontend-companion-app/` and
`frontend-monitor-app/` so each product surface can evolve independently.

Local dashboard URL: `http://localhost:5175`. During local development its
companion links open `http://localhost:5176`; a production Docker build uses
the stack's companion URL at `http://localhost:5173`.

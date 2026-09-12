# Deskemon Control Center

Frontend-only configuration dashboard for routines, app connections, privacy,
and autonomy boundaries. All changes persist in the browser through local
storage. No live service connection is implied.

```bash
npm install
npm run dev
```

This app is intentionally separate from `frontend-companion-app/` and
`frontend-monitor-app/` so each product surface can evolve independently.

Local dashboard URL: `http://localhost:5175`. During local development its
companion links open `http://localhost:5176`; a production Docker build uses
the stack's companion URL at `http://localhost:5173`.

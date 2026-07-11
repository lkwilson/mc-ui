# mc-ui

The Minecraft control panel — a React + Tailwind SPA for administering the mc
servers running on brew7. Per server it shows the pod status, tails the live
server log, and gives an interactive RCON console.

It is the frontend half of a pair:

```
mc-ui (this repo, nginx static SPA)
  └─ proxies /api/  ──▶  app-red-service.home  (red, the backend)
                              └─ /api/mc/*  (red/src/mc.rs)
                                   ├─ GET  /api/mc/servers            list servers (k8s API)
                                   ├─ WS   /api/mc/servers/:name/logs live pod log (k8s log_stream)
                                   └─ WS   /api/mc/servers/:name/rcon interactive RCON console
```

- **Backend:** `red` (`~/w/red`), Rust/axum, deployed as `app-red` in ns `home`.
  It lists mc pods via its in-cluster ServiceAccount (`red`, RBAC in home-infra
  `clusters/brew7/apps/configs/red-mc-rbac.yaml`) and reaches each server's RCON
  over the in-cluster `mc-<name>-rcon` ClusterIP Service (added to the mc Helm
  chart, `clusters/brew7/charts/mc/templates/servers.yaml`; RCON password is the
  chart's hardcoded `minecraft`).
- **Deploy manifest:** `clusters/brew7/apps/configs/mc-ui.yaml` (Deployment +
  ClusterIP, **no IngressRoute**).

## Internal-only / security

This is an **unauthenticated server-admin surface** — anyone who can reach it
gets full RCON. It is therefore ClusterIP-only with no ingress; the LAN is
trusted. Reach it with a port-forward:

```
kubectl -n home port-forward svc/app-mc-ui-service 8080:80
# then open http://localhost:8080
```

If this is ever exposed publicly, add auth (and rotate the RCON password off the
hardcoded default) first.

## Frontend structure

- `src/App.tsx` — layout + server list state, polls `GET /api/mc/servers` every
  5s, auto-selects the first running server.
- `src/ServerList.tsx` — sidebar; status dot (green=running, amber=starting,
  grey=disabled).
- `src/LogPane.tsx` — opens the logs WebSocket, appends lines (capped at 2000),
  autoscrolls.
- `src/RconConsole.tsx` — opens the rcon WebSocket; input line sends a command,
  responses render in the scrollback.
- `src/api.ts` — `getServers()` + `wsUrl()` (same-origin ws/wss; nginx proxies
  `/api/`).

WebSockets are same-origin (`ws(s)://<host>/api/mc/servers/<name>/{logs,rcon}`),
so nginx (`nginx.conf`) carries the `Upgrade`/`Connection` headers on `/api/`.

## Dev

Node comes from the nix flake. red is internal-only, so point the Vite dev proxy
at a port-forwarded red:

```
kubectl -n home port-forward svc/app-red-service 8080:80   # in another terminal
nix develop            # or: nix develop 'path:.'  on an untracked tree
npm install
npm run dev            # proxies /api -> http://localhost:8080 (override RED_TARGET)
```

## Checks

```
npm ci && npm run build     # tsc -b + vite build (scripts/check.sh)
npm run ff                  # prettier --write (tailwind class sorting)
```

## CI / release

Standard home-infra frontend pipeline (see `home-infra/templates`, and the live
`hub-ui` as the reference): `.gitea/workflows` build on `brew7`, no sccache. A
merged PR **must carry a `patch`/`minor`/`major` label** or `release.yml` cuts no
tag and no image is built. Images publish to `harbor.endsy.me/library/mc-ui`;
the GitHub Renovate then bumps the tag in `mc-ui.yaml`.

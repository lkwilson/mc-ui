import type { History, ServerInfo } from "./types";

// GET the server list from red's /api/mc scope. Throws on non-200 so callers can
// surface the error.
export async function getServers(): Promise<ServerInfo[]> {
  const resp = await fetch("/api/mc/servers", { cache: "no-store" });
  if (!resp.ok) {
    throw new Error(`servers: ${resp.status} ${resp.statusText}`);
  }
  return (await resp.json()) as ServerInfo[];
}

// GET a server's previous-boot log history. Boots are newest-first. Throws on
// non-200, mirroring getServers so callers can surface the error.
export async function getHistory(server: string): Promise<History> {
  const resp = await fetch(
    `/api/mc/servers/${encodeURIComponent(server)}/history`,
    { cache: "no-store" },
  );
  if (!resp.ok) {
    throw new Error(`history: ${resp.status} ${resp.statusText}`);
  }
  return (await resp.json()) as History;
}

// Build a same-origin WebSocket URL (nginx proxies /api/ -> app-red-service),
// matching the page's ws/wss scheme.
export function wsUrl(path: string): string {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${location.host}${path}`;
}

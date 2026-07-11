// Mirrors red's ServerInfo (red/src/mc.rs). One row per mc server.
export type ServerInfo = {
  name: string;
  enabled: boolean;
  replicas: number;
  ready: number;
  pod: string | null;
  phase: string | null;
};

// A single previous boot of a server, from GET /api/mc/servers/:name/history.
// `lines` is that boot's tail (save-on-shutdown output is at the end).
export type Boot = {
  pod: string;
  id: string;
  startMs: number;
  endMs: number;
  lines: string[];
};

// History payload: boots are ordered newest first (index 0 = most recent).
export type History = {
  boots: Boot[];
};

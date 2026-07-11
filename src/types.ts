// Mirrors red's ServerInfo (red/src/mc.rs). One row per mc server.
export type ServerInfo = {
  name: string;
  enabled: boolean;
  replicas: number;
  ready: number;
  pod: string | null;
  phase: string | null;
};

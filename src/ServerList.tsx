import type { ServerInfo } from "./types";

function phaseTone(s: ServerInfo): string {
  if (!s.enabled) return "bg-slate-400";
  if (s.ready > 0) return "bg-emerald-500";
  return "bg-amber-500"; // enabled but not ready yet (Pending / starting)
}

function phaseLabel(s: ServerInfo): string {
  if (!s.enabled) return "disabled";
  if (s.ready > 0) return s.phase ?? "running";
  return s.phase ?? "starting";
}

export default function ServerList({
  servers,
  selected,
  onPick,
}: {
  servers: ServerInfo[];
  selected: string | null;
  onPick: (name: string) => void;
}) {
  return (
    <aside className="flex flex-col gap-2">
      <h2 className="px-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">
        Servers
      </h2>
      <ul className="flex flex-col gap-1.5">
        {servers.map((s) => {
          const active = s.name === selected;
          return (
            <li key={s.name}>
              <button
                onClick={() => onPick(s.name)}
                className={
                  "flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition " +
                  (active
                    ? "border-emerald-400/70 bg-emerald-50 shadow-sm dark:border-emerald-600/60 dark:bg-emerald-950/40"
                    : "border-slate-200/70 bg-white/60 hover:border-slate-300 hover:bg-white dark:border-slate-800/70 dark:bg-slate-900/40 dark:hover:border-slate-700 dark:hover:bg-slate-900")
                }
              >
                <span
                  className={
                    "h-2.5 w-2.5 shrink-0 rounded-full " + phaseTone(s)
                  }
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{s.name}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    {phaseLabel(s)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
        {servers.length === 0 && (
          <li className="px-1 text-sm text-slate-400">none</li>
        )}
      </ul>
    </aside>
  );
}

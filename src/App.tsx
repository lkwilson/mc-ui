import { useEffect, useRef, useState } from "react";
import { getServers } from "./api";
import type { ServerInfo } from "./types";
import ServerList from "./ServerList";
import LogPane from "./LogPane";
import RconConsole from "./RconConsole";

const POLL_MS = 5000;

export default function App() {
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  // Guard the auto-select so it only fires until the user picks something.
  const touched = useRef(false);

  useEffect(() => {
    let live = true;
    async function poll() {
      try {
        const list = await getServers();
        if (!live) return;
        setServers(list);
        setError(null);
        if (!touched.current && selected === null) {
          const first = list.find((s) => s.enabled) ?? list[0];
          if (first) setSelected(first.name);
        }
      } catch (err) {
        if (live) setError(String(err));
      }
    }
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, [selected]);

  function pick(name: string) {
    touched.current = true;
    setSelected(name);
  }

  const current = servers.find((s) => s.name === selected) ?? null;

  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col px-4 pb-10 sm:px-6">
      <header className="sticky top-0 z-10 -mx-4 mb-2 flex items-center justify-between border-b border-slate-200/60 bg-slate-50/80 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6 dark:border-slate-800/60 dark:bg-slate-950/80">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-lg font-black text-white shadow-sm">
            ⛏
          </div>
          <div className="leading-tight">
            <h1 className="bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
              Minecraft
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              server console
            </p>
          </div>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-300/60 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      <main className="grid flex-1 grid-cols-1 gap-6 pt-4 md:grid-cols-[16rem_1fr]">
        <ServerList servers={servers} selected={selected} onPick={pick} />

        {current ? (
          <section className="flex min-w-0 flex-col gap-6">
            <LogPane server={current.name} online={current.ready > 0} />
            <RconConsole server={current.name} online={current.ready > 0} />
          </section>
        ) : (
          <section className="flex min-h-40 items-center justify-center rounded-2xl border border-slate-200/70 bg-white/60 text-sm text-slate-500 dark:border-slate-800/70 dark:bg-slate-900/40 dark:text-slate-400">
            {servers.length === 0
              ? "No servers found."
              : "Select a server to begin."}
          </section>
        )}
      </main>
    </div>
  );
}

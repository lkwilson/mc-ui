import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { wsUrl } from "./api";

type Status = "connecting" | "open" | "closed";
type Entry = { kind: "cmd" | "resp"; text: string };

const dot: Record<Status, string> = {
  connecting: "bg-amber-500",
  open: "bg-emerald-500",
  closed: "bg-rose-500",
};

export default function RconConsole({
  server,
  online,
}: {
  server: string;
  online: boolean;
}) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setEntries([]);
    setInput("");
    setStatus("connecting");
    const ws = new WebSocket(wsUrl(`/api/mc/servers/${server}/rcon`));
    wsRef.current = ws;
    ws.onopen = () => setStatus("open");
    ws.onclose = () => setStatus("closed");
    ws.onerror = () => setStatus("closed");
    ws.onmessage = (ev) =>
      setEntries((prev) =>
        prev.concat({ kind: "resp", text: String(ev.data) }),
      );
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [server]);

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries]);

  function send(e: FormEvent) {
    e.preventDefault();
    const cmd = input.trim();
    const ws = wsRef.current;
    if (!cmd || !ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(cmd);
    setEntries((prev) => prev.concat({ kind: "cmd", text: cmd }));
    setInput("");
  }

  const ready = status === "open";

  return (
    <div className="flex min-h-64 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/50">
      <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-2.5 dark:border-slate-800/70">
        <div className="flex items-center gap-2">
          <span className={"h-2.5 w-2.5 rounded-full " + dot[status]} />
          <h3 className="text-sm font-semibold">RCON</h3>
          <span className="text-xs text-slate-400">{server}</span>
        </div>
        <span className="text-xs text-slate-400">{status}</span>
      </div>

      <div
        ref={boxRef}
        className="h-56 grow overflow-auto bg-slate-950/95 p-3 font-mono text-xs leading-relaxed"
      >
        {entries.length === 0 ? (
          <p className="text-slate-500">
            {online
              ? "type a command below (e.g. list, say hi, time set day)"
              : "server is not running — RCON unavailable"}
          </p>
        ) : (
          entries.map((e, i) =>
            e.kind === "cmd" ? (
              <div key={i} className="text-emerald-400">
                <span className="text-slate-500">&gt; </span>
                {e.text}
              </div>
            ) : (
              <div
                key={i}
                className="break-all whitespace-pre-wrap text-slate-200"
              >
                {e.text}
              </div>
            ),
          )
        )}
      </div>

      <form
        onSubmit={send}
        className="flex items-center gap-2 border-t border-slate-200/70 p-2.5 dark:border-slate-800/70"
      >
        <span className="pl-1 font-mono text-sm text-slate-400">&gt;</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!ready}
          spellCheck={false}
          autoComplete="off"
          placeholder={ready ? "command" : "connecting…"}
          className="min-w-0 flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-slate-400 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!ready || input.trim() === ""}
          className="rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}

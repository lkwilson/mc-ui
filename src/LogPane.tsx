import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { wsUrl } from "./api";

type Status = "connecting" | "open" | "closed";

// Cap the buffer so a long-lived tail doesn't grow the DOM unbounded.
const MAX_LINES = 2000;

const dot: Record<Status, string> = {
  connecting: "bg-amber-500",
  open: "bg-emerald-500",
  closed: "bg-rose-500",
};

export default function LogPane({
  server,
  online,
}: {
  server: string;
  online: boolean;
}) {
  const [lines, setLines] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("connecting");
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLines([]);
    setStatus("connecting");
    const ws = new WebSocket(wsUrl(`/api/mc/servers/${server}/logs`));
    ws.onopen = () => setStatus("open");
    ws.onclose = () => setStatus("closed");
    ws.onerror = () => setStatus("closed");
    ws.onmessage = (ev) => {
      const text = String(ev.data);
      setLines((prev) => {
        const next = prev.concat(text);
        return next.length > MAX_LINES ? next.slice(-MAX_LINES) : next;
      });
    };
    return () => ws.close();
  }, [server]);

  // Keep pinned to the bottom as lines arrive.
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  return (
    <div className="flex min-h-64 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/50">
      <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-2.5 dark:border-slate-800/70">
        <div className="flex items-center gap-2">
          <span className={"h-2.5 w-2.5 rounded-full " + dot[status]} />
          <h3 className="text-sm font-semibold">Log</h3>
          <span className="text-xs text-slate-400">{server}</span>
        </div>
        <span className="text-xs text-slate-400">{status}</span>
      </div>
      <div
        ref={boxRef}
        className="h-64 grow overflow-auto bg-slate-950/95 p-3 font-mono text-xs leading-relaxed text-slate-200"
      >
        {lines.length === 0 ? (
          <p className="text-slate-500">
            {online ? "waiting for output…" : "server is not running"}
          </p>
        ) : (
          lines.map((l, i) => (
            <div key={i} className="break-all whitespace-pre-wrap">
              {l}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

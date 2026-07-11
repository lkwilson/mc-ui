import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { getHistory, wsUrl } from "./api";
import type { Boot } from "./types";

type Status = "connecting" | "open" | "closed";
type HistoryStatus = "idle" | "loading" | "loaded" | "error";

// Cap the buffer so a long-lived tail doesn't grow the DOM unbounded.
const MAX_LINES = 2000;
const INITIAL_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30_000;

const dot: Record<Status, string> = {
  connecting: "bg-amber-500",
  open: "bg-emerald-500",
  closed: "bg-rose-500",
};

// Compact time range for a boot's header, e.g. "Jul 11, 2:03 PM – 4:30 PM".
function fmtRange(startMs: number, endMs: number): string {
  const start = new Date(startMs);
  const end = new Date(endMs);
  const day = start.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const t = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${day}, ${t(start)} – ${t(end)}`;
}

export default function LogPane({
  server,
  online,
}: {
  server: string;
  online: boolean;
}) {
  const [lines, setLines] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("connecting");
  // Previous-boot history. `selected === null` is the Live tail; otherwise it
  // indexes boots[] (0 = most recent boot).
  const [boots, setBoots] = useState<Boot[]>([]);
  const [historyStatus, setHistoryStatus] = useState<HistoryStatus>("idle");
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  // Guards against a stale history response overwriting a newer one.
  const reqId = useRef(0);

  // Keep the tail connected while the operator reviews an older boot. Some
  // proxies close quiet WebSockets, so a close means reconnecting rather than a
  // terminal log failure. Incoming log lines are not used as a health check:
  // Minecraft can legitimately be quiet for a long time.
  useEffect(() => {
    setLines([]);
    setStatus("connecting");
    let stopped = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
    let ws: WebSocket | undefined;

    function connect() {
      ws = new WebSocket(wsUrl(`/api/mc/servers/${server}/logs`));
      ws.onopen = () => {
        if (!stopped) {
          reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
          setStatus("open");
        }
      };
      ws.onclose = () => {
        if (stopped) return;
        setStatus("connecting");
        retry = setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(
          reconnectDelay * 2,
          MAX_RECONNECT_DELAY_MS,
        );
      };
      // Closing is handled by onclose, which starts the next connection.
      ws.onerror = () => {};
      ws.onmessage = (ev) => {
        if (stopped) return;
        const text = String(ev.data);
        setLines((prev) => {
          const next = prev.concat(text);
          return next.length > MAX_LINES ? next.slice(-MAX_LINES) : next;
        });
      };
    };

    connect();
    return () => {
      stopped = true;
      if (retry) clearTimeout(retry);
      ws?.close();
    };
  }, [server]);

  const loadHistory = useCallback(async () => {
    const id = ++reqId.current;
    setHistoryStatus("loading");
    try {
      const h = await getHistory(server);
      if (reqId.current !== id) return;
      setBoots(h.boots);
      setHistoryStatus("loaded");
      setHistoryError(null);
    } catch (err) {
      if (reqId.current !== id) return;
      setHistoryStatus("error");
      setHistoryError(String(err));
    }
  }, [server]);

  // Changing the server resets the view to Live and refetches history.
  useEffect(() => {
    setSelected(null);
    setBoots([]);
    setHistoryError(null);
    loadHistory();
  }, [server, loadHistory]);

  // If a refetch shrinks the list out from under the selection, clamp it.
  useEffect(() => {
    if (
      historyStatus === "loaded" &&
      selected !== null &&
      selected >= boots.length
    ) {
      setSelected(boots.length > 0 ? boots.length - 1 : null);
    }
  }, [boots, historyStatus, selected]);

  const activeBoot = selected === null ? null : (boots[selected] ?? null);
  const shown = activeBoot ? activeBoot.lines : lines;

  // Keep pinned to the bottom: as lines arrive on Live, and on switching to a
  // boot so its save-on-shutdown lines are visible first.
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown]);

  const canOlder =
    selected === null ? boots.length > 0 : selected < boots.length - 1;
  const canNewer = selected !== null;

  function goOlder() {
    if (selected === null) {
      // First step away from Live — freshen the list so it's current.
      loadHistory();
      if (boots.length > 0) setSelected(0);
    } else if (selected < boots.length - 1) {
      setSelected(selected + 1);
    }
  }

  function goNewer() {
    if (selected === null) return;
    setSelected(selected === 0 ? null : selected - 1);
  }

  const loading = historyStatus === "loading";
  const arrowBase =
    "rounded-lg border border-slate-300/70 px-2 py-0.5 text-sm font-semibold leading-none text-slate-600 transition hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent dark:border-slate-700/70 dark:text-slate-300 dark:hover:bg-slate-800";

  const olderTitle = activeBoot
    ? canOlder
      ? "Older boot"
      : "Oldest boot"
    : loading
      ? "Loading history…"
      : historyStatus === "error"
        ? "History unavailable"
        : boots.length === 0
          ? "No previous boots"
          : "Older boot";

  return (
    <div className="flex min-h-64 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/50">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 px-4 py-2.5 dark:border-slate-800/70">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={
              "h-2.5 w-2.5 shrink-0 rounded-full " +
              (activeBoot ? "bg-slate-400" : dot[status])
            }
          />
          <h3 className="text-sm font-semibold">Log</h3>
          <span className="truncate text-xs text-slate-400">{server}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right text-xs leading-tight">
            {activeBoot ? (
              <>
                <div className="text-slate-500 dark:text-slate-400">
                  {fmtRange(activeBoot.startMs, activeBoot.endMs)}
                </div>
                <div className="truncate text-slate-400">
                  {`boot ${boots.length - (selected ?? 0)} of ${boots.length}`}{" "}
                  · {activeBoot.pod}
                </div>
              </>
            ) : historyStatus === "error" ? (
              <span className="text-rose-500" title={historyError ?? undefined}>
                history unavailable
              </span>
            ) : (
              <span className="text-slate-400">{status}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goOlder}
              disabled={!canOlder}
              title={olderTitle}
              aria-label="Older boot"
              className={arrowBase + (loading ? " animate-pulse" : "")}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={goNewer}
              disabled={!canNewer}
              title="Newer (toward Live)"
              aria-label="Newer boot"
              className={arrowBase}
            >
              ›
            </button>
          </div>
        </div>
      </div>
      <div
        ref={boxRef}
        className="h-64 grow overflow-auto bg-slate-950/95 p-3 font-mono text-xs leading-relaxed text-slate-200"
      >
        {shown.length === 0 ? (
          <p className="text-slate-500">
            {activeBoot
              ? "no output captured for this boot"
              : online
                ? "waiting for output…"
                : "server is not running"}
          </p>
        ) : (
          shown.map((l, i) => (
            <div key={i} className="break-all whitespace-pre-wrap">
              {l}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

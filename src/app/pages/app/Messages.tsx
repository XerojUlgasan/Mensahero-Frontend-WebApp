import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, Search, Send, Plus, X, RotateCcw, History } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { useAuth } from "../../context/AuthContext";
import { useSmsHistory } from "../../hooks/useSmsHistory";
import {
  createCacheKey,
  fetchJson,
  hasDataChanged,
  readCachedJson,
  writeCachedJson,
} from "../../lib/api";

type FilterStatus = "ALL" | "DELIVERED" | "PENDING" | "FAILED";
const PAGE_SIZE = 10;

interface ApiKey {
  created_at: string;
  expires_at: string | null;
  id: string;
  key: string;
  last_used: string | null;
  name: string;
  owner_id: string;
  status: string;
}

interface ApiMessage {
  id: string;
  message: string;
  receiver: string;
  sender: string;
  api_id: string;
  created_at: string | null;
  sent_at: string | null;
  status: string | null;
}

interface Device {
  id: string;
  apiId: string;
  deviceName: string;
  fcm_token: string;
  isActive: boolean;
  last_used: string;
  created_at: string;
  updated_at: string;
  ownerId: string;
}

export function Messages() {
  const { session } = useAuth();

  // Panel 1
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);

  // Panel 2
  const [recipients, setRecipients] = useState<ApiMessage[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Panel 3
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const msgScrollRef = useRef<HTMLDivElement>(null);

  // Send form
  const [fromInput, setFromInput] = useState("");
  const [msgInput, setMsgInput] = useState("");
  const [sending, setSending] = useState(false);

  // Devices for selected key
  const [devices, setDevices] = useState<Device[]>([]);

  // Device SMS history (on-demand pull from the gateway device, merged into the thread)
  const [historyEnabled, setHistoryEnabled] = useState(false);
  const [historyDeviceId, setHistoryDeviceId] = useState<string>("");
  const activeDevices = useMemo(() => devices.filter((d) => d.isActive), [devices]);
  const {
    status: historyStatus,
    messages: historyMessages,
    error: historyError,
    hasMore: historyHasMore,
    loadingMore: historyLoadingMore,
    loadMore: loadMoreHistory,
    retry: retryHistory,
  } = useSmsHistory(
    historyEnabled ? selectedKey?.id : undefined,
    historyEnabled ? historyDeviceId || undefined : undefined,
    historyEnabled ? selectedRecipient : undefined,
  );

  // Create thread modal
  const [showCreateThread, setShowCreateThread] = useState(false);
  const [ctFrom, setCtFrom] = useState("");
  const [ctTo, setCtTo] = useState("");
  const [ctMessage, setCtMessage] = useState("");
  const [ctCreating, setCtCreating] = useState(false);

  // ── Panel 1: load API keys ────────────────────────────────────────────────
  const loadApiKeys = useCallback(
    async (force = false) => {
      if (!session) return;
      const cacheKey = createCacheKey("api-keys-retrieve", session);
      const cached = readCachedJson<ApiKey[]>(cacheKey);
      if (cached && !force) setApiKeys(cached);
      setKeysLoading(true);
      try {
        const next = await fetchJson<ApiKey[]>(session, "/api/keys/retrieve");
        writeCachedJson(cacheKey, next);
        if (hasDataChanged(cached, next)) setApiKeys(next);
      } catch (e) {
        if (!cached) console.error("Failed to load API keys:", e);
      } finally {
        setKeysLoading(false);
      }
    },
    [session],
  );

  useEffect(() => {
    void loadApiKeys();
  }, [loadApiKeys]);

  // ── Panel 2: load recipients when a key is selected ───────────────────────
  const loadRecipients = useCallback(
    async (key: ApiKey, force = false) => {
      if (!session) return;
      const cacheKey = createCacheKey("recipients", session, key.id);
      const cached = readCachedJson<ApiMessage[]>(cacheKey);
      if (cached && !force) setRecipients(cached);
      setRecipientsLoading(true);
      try {
        const next = await fetchJson<ApiMessage[]>(
          session,
          "/api/messages/retrieveRecipients",
          { apiId: key.id },
        );
        writeCachedJson(cacheKey, next);
        if (hasDataChanged(cached, next)) setRecipients(next);
      } catch (e) {
        if (!cached) console.error("Failed to load recipients:", e);
      } finally {
        setRecipientsLoading(false);
      }
    },
    [session],
  );

  const loadDevices = useCallback(
    async (key: ApiKey) => {
      if (!session) return;
      const cacheKey = createCacheKey(`devices-${key.id}`, session);
      const cached = readCachedJson<Device[]>(cacheKey);
      if (cached) setDevices(cached);
      try {
        const { getApiBaseUrl } = await import("../../lib/api");
        const res = await fetch(`${getApiBaseUrl()}/api/devices/list?apiId=${key.id}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) throw new Error(await res.text());
        const next = (await res.json()) as Device[];
        writeCachedJson(cacheKey, next);
        if (hasDataChanged(cached, next)) setDevices(next);
      } catch (e) {
        if (!cached) console.error("Failed to load devices:", e);
      }
    },
    [session],
  );

  const handleKeySelect = (key: ApiKey) => {
    setSelectedKey(key);
    setSelectedRecipient(null);
    setHistoryEnabled(false);
    setHistoryDeviceId("");
    setRecipients([]);
    setMessages([]);
    setDevices([]);
    setSearch("");
    setFilter("ALL");
    setPage(0);
    setHasMore(true);
    setFromInput("");
    void loadRecipients(key);
    void loadDevices(key);
  };

  // ── Panel 3: load messages for a recipient ────────────────────────────────
  const loadMessages = useCallback(
    async (opts: {
      key: ApiKey;
      recipient: string;
      status: FilterStatus;
      pageNum: number;
      prepend?: boolean;
    }) => {
      if (!session) return;
      const { key, recipient, status, pageNum, prepend } = opts;
      const cacheKey = createCacheKey(
        `msgs:${key.id}:${recipient}:${status}`,
        session,
        String(pageNum),
      );
      const cached = readCachedJson<ApiMessage[]>(cacheKey);

      if (pageNum === 0 && cached && !prepend) {
        setMessages([...cached].reverse());
        requestAnimationFrame(() => {
          if (msgScrollRef.current)
            msgScrollRef.current.scrollTop = msgScrollRef.current.scrollHeight;
        });
      }

      if (pageNum === 0) setMessagesLoading(true);
      else setLoadingMore(true);

      try {
        const next = await fetchJson<ApiMessage[]>(
          session,
          "/api/messages/retrieveMessagesByRecipient",
          { apiId: key.id, recipient, page: pageNum, pageSize: PAGE_SIZE, status },
        );
        writeCachedJson(cacheKey, next);
        setHasMore(next.length === PAGE_SIZE);

        const ordered = [...next].reverse();

        if (pageNum === 0) {
          if (hasDataChanged(cached, next)) {
            setMessages(ordered);
            requestAnimationFrame(() => {
              if (msgScrollRef.current)
                msgScrollRef.current.scrollTop = msgScrollRef.current.scrollHeight;
            });
          } else if (cached) {
            requestAnimationFrame(() => {
              if (msgScrollRef.current)
                msgScrollRef.current.scrollTop = msgScrollRef.current.scrollHeight;
            });
          }
        } else {
          // prepend older messages, preserve scroll
          const el = msgScrollRef.current;
          const prevHeight = el?.scrollHeight ?? 0;
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const fresh = ordered.filter((m) => !existingIds.has(m.id));
            return [...fresh, ...prev];
          });
          requestAnimationFrame(() => {
            if (el) el.scrollTop = el.scrollHeight - prevHeight;
          });
        }

        // If filtered result is less than page size, try to fill with ALL and filter client-side
        if (status !== "ALL" && next.length < PAGE_SIZE) {
          const allCacheKey = createCacheKey(
            `msgs:${key.id}:${recipient}:ALL`,
            session,
            String(pageNum),
          );
          const allCached = readCachedJson<ApiMessage[]>(allCacheKey);
          const allNext = await fetchJson<ApiMessage[]>(
            session,
            "/api/messages/retrieveMessagesByRecipient",
            { apiId: key.id, recipient, page: pageNum, pageSize: PAGE_SIZE, status: "ALL" },
          );
          writeCachedJson(allCacheKey, allNext);
          const filtered = allNext.filter(
            (m) => m.status?.toUpperCase() === status,
          );
          if (hasDataChanged(allCached, allNext) && filtered.length > next.length) {
            if (pageNum === 0) setMessages(filtered);
          }
        }
      } catch (e) {
        console.error("Failed to load messages:", e);
      } finally {
        if (pageNum === 0) setMessagesLoading(false);
        else setLoadingMore(false);
      }
    },
    [session],
  );

  const handleRecipientSelect = (recipient: string) => {
    if (!selectedKey) return;
    setSelectedRecipient(recipient);
    // History belongs to the previously selected thread; stop merging it.
    setHistoryEnabled(false);
    setMessages([]);
    setFilter("ALL");
    setPage(0);
    setHasMore(true);
    setFromInput("");
    setMsgInput("");
    void loadMessages({ key: selectedKey, recipient, status: "ALL", pageNum: 0 });
  };

  const handleFilterChange = (f: FilterStatus) => {
    if (!selectedKey || !selectedRecipient) return;
    setFilter(f);
    setPage(0);
    setHasMore(true);
    setMessages([]);
    void loadMessages({ key: selectedKey, recipient: selectedRecipient, status: f, pageNum: 0 });
  };

  // ── Scroll up to load older messages ─────────────────────────────────────
  const handleMsgScroll = () => {
    const el = msgScrollRef.current;
    if (!el || !selectedKey || !selectedRecipient) return;

    // Older messages from the database (DB thread pagination) — load near top.
    if (el.scrollTop < 60 && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      void loadMessages({
        key: selectedKey,
        recipient: selectedRecipient,
        status: filter,
        pageNum: nextPage,
        prepend: true,
      });
    }

    // On-device history: infinite scroll toward the top. Log scroll depth at
    // 50% and 100% (once per cycle) and fetch the next older page at 100%.
    if (!historyEnabled || !historyHasMore) return;

    const maxScroll = el.scrollHeight - el.clientHeight;
    // Progress toward the load point (the top): 0 at bottom, 1 at the very top.
    const progress = maxScroll <= 0 ? 1 : 1 - el.scrollTop / maxScroll;

    // Reset the per-cycle log guards once the user scrolls back down, so the
    // next scroll-up logs 50%/100% again and can fetch the following page.
    if (progress < 0.5) {
      histLogged50Ref.current = false;
      histLogged100Ref.current = false;
      return;
    }

    if (!histLogged50Ref.current) {
      histLogged50Ref.current = true;
      console.log(
        `[SMS history] scrolled 50% toward next page — ${selectedRecipient}`,
      );
    }

    if (progress >= 0.995 && !histLogged100Ref.current) {
      histLogged100Ref.current = true;
      console.log(
        `[SMS history] scrolled 100% — fetching next page — ${selectedRecipient}`,
      );
      if (!historyLoadingMore) {
        // Preserve scroll position: older messages sort to the top, growing the
        // list upward. Capture the height now; the offset is restored once the
        // new page is stitched into the timeline (see effect below).
        histPrevHeightRef.current = el.scrollHeight;
        loadMoreHistory();
      }
    }
  };

  // ── Create thread ─────────────────────────────────────────────────────────
  const handleCreateThread = async () => {
    if (!session || !selectedKey || !ctFrom.trim() || !ctTo.trim() || !ctMessage.trim()) return;
    setCtCreating(true);
    try {
      const { getApiBaseUrl } = await import("../../lib/api");
      const res = await fetch(`${getApiBaseUrl()}/api/messages/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          apiKey: selectedKey.key,
          from: ctFrom.trim(),
          to: ctTo.trim(),
          message: ctMessage.trim(),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const newMsg = (await res.json()) as ApiMessage;
      // refresh recipients and auto-select the new thread
      const cacheKey = createCacheKey("recipients", session, selectedKey.id);
      const cached = readCachedJson<ApiMessage[]>(cacheKey);
      const updatedRecipients = cached
        ? [newMsg, ...cached.filter((r) => r.receiver !== newMsg.receiver)]
        : [newMsg];
      writeCachedJson(cacheKey, updatedRecipients);
      setRecipients(updatedRecipients);
      setShowCreateThread(false);
      setCtFrom("");
      setCtTo("");
      setCtMessage("");
      handleRecipientSelect(newMsg.receiver);
    } catch (e) {
      console.error("Failed to create thread:", e);
    } finally {
      setCtCreating(false);
    }
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!session || !selectedKey || !selectedRecipient || !fromInput.trim() || !msgInput.trim()) return;
    setSending(true);
    try {
      const { getApiBaseUrl } = await import("../../lib/api");
      const res = await fetch(`${getApiBaseUrl()}/api/messages/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          apiKey: selectedKey.key,
          from: fromInput.trim(),
          to: selectedRecipient,
          message: msgInput.trim(),
        }),
      });
      if (res.ok) {
        const newMsg = (await res.json()) as ApiMessage;
        setMessages((prev) => [...prev, newMsg]);
        setMsgInput("");
        requestAnimationFrame(() => {
          if (msgScrollRef.current)
            msgScrollRef.current.scrollTop = msgScrollRef.current.scrollHeight;
        });
        setRecipients((prev) =>
          prev.map((r) =>
            r.receiver === selectedRecipient
              ? { ...r, message: newMsg.message, created_at: newMsg.created_at ?? r.created_at }
              : r,
          ),
        );
      }
    } catch (e) {
      console.error("Failed to send message:", e);
    } finally {
      setSending(false);
    }
  };

  // ── Retry message ──────────────────────────────────────────────────────────
  const handleRetry = async (messageId: string) => {
    if (!session) return;
    try {
      const { getApiBaseUrl } = await import("../../lib/api");
      const res = await fetch(`${getApiBaseUrl()}/api/messages/resend?messageId=${messageId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: "",
      });
      if (res.ok) {
        const updatedMsg = (await res.json()) as ApiMessage;
        setMessages((prev) => prev.map((m) => (m.id === messageId ? updatedMsg : m)));
      }
    } catch (e) {
      console.error("Failed to retry message:", e);
    }
  };

  // ── Device SMS history ──────────────────────────────────────────────────────
  const handleToggleHistory = () => {
    if (!selectedKey || !selectedRecipient) return;
    setHistoryEnabled((prev) => {
      const next = !prev;
      if (next) {
        // Default to the first active device for this key.
        setHistoryDeviceId((d) => d || activeDevices[0]?.id || "");
      }
      return next;
    });
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const visibleRecipients = useMemo(
    () => recipients.filter((r) => !search || r.receiver.toLowerCase().includes(search.toLowerCase())),
    [recipients, search],
  );

  // Preserve scroll offset when older device-history pages are prepended.
  const histPrevHeightRef = useRef<number | null>(null);
  useEffect(() => {
    const el = msgScrollRef.current;
    if (!el || histPrevHeightRef.current === null) return;
    const delta = el.scrollHeight - histPrevHeightRef.current;
    histPrevHeightRef.current = null;
    if (delta > 0) el.scrollTop += delta;
  }, [historyMessages]);

  // Per-cycle guards so each 50%/100% scroll-depth log fires once until a page
  // is fetched. Reset when the thread or history toggle changes.
  const histLogged50Ref = useRef(false);
  const histLogged100Ref = useRef(false);
  useEffect(() => {
    histLogged50Ref.current = false;
    histLogged100Ref.current = false;
  }, [selectedRecipient, historyEnabled]);

  // Merge DB messages with on-device history into a single date-ordered thread.
  const timeline = useMemo(() => {
    const dbTs = (m: ApiMessage) => {
      const raw = m.sent_at ?? m.created_at;
      const t = raw ? Date.parse(raw) : NaN;
      return Number.isNaN(t) ? 0 : t;
    };

    const dbItems = messages.map((m) => ({
      kind: "db" as const,
      id: `db-${m.id}`,
      ts: dbTs(m),
      db: m,
    }));

    // Only stitch device messages in once we actually have them (COMPLETED).
    const deviceItems =
      historyEnabled && historyStatus === "COMPLETED"
        ? historyMessages
            // Drop device copies that clearly mirror an outbound DB message
            // (same text within ~2 min) so the merged view doesn't double up.
            .filter((h) => {
              if (h.direction !== "SENT") return true;
              return !messages.some(
                (m) =>
                  m.message.trim() === h.body.trim() &&
                  Math.abs(dbTs(m) - h.timestamp) < 120_000,
              );
            })
            .map((h, i) => ({
              kind: "device" as const,
              id: `dev-${h.timestamp}-${i}`,
              ts: h.timestamp,
              device: h,
            }))
        : [];

    return [...dbItems, ...deviceItems].sort((a, b) => a.ts - b.ts);
  }, [messages, historyEnabled, historyStatus, historyMessages]);

  const statusDot = (status: string | null) =>
    status === "delivered"
      ? "var(--mh-green)"
      : status === "pending"
        ? "var(--mh-amber)"
        : status === "failed"
          ? "var(--mh-red)"
          : "var(--mh-muted)";

  // ── Styles ────────────────────────────────────────────────────────────────
  const panelStyle: React.CSSProperties = {
    background: "var(--mh-surface)",
    borderRight: "1px solid var(--mh-border)",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    overflowY: "auto",
  };

  const panelHeaderStyle: React.CSSProperties = {
    color: "var(--mh-muted)",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    padding: "10px 16px",
    borderBottom: "1px solid var(--mh-border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0,
  };

  const refreshBtnStyle: React.CSSProperties = {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: 2,
    color: "var(--mh-muted)",
    display: "flex",
    alignItems: "center",
  };

  const emptyStyle: React.CSSProperties = {
    color: "var(--mh-muted)",
    fontSize: 13,
    padding: "32px 16px",
    textAlign: "center",
  };

  const historyBannerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "var(--mh-surface)",
    border: "1px solid var(--mh-border)",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 12,
    color: "var(--mh-muted)",
    flexShrink: 0,
  };

  const historyRetryBtnStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    background: "transparent",
    border: "1px solid currentColor",
    borderRadius: 4,
    padding: "3px 8px",
    fontSize: 11,
    fontWeight: 500,
    cursor: "pointer",
    color: "inherit",
    fontFamily: "var(--mh-font-body)",
    flexShrink: 0,
  };

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", overflow: "hidden", background: "var(--mh-bg)" }}>

      {/* Create thread modal */}
      {showCreateThread && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "var(--mh-surface)", border: "1px solid var(--mh-border)", borderRadius: 12, padding: 28, width: 420, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <p style={{ color: "var(--mh-text)", fontWeight: 600, fontSize: 15 }}>New Thread</p>
              <button onClick={() => { setShowCreateThread(false); setCtFrom(""); setCtTo(""); setCtMessage(""); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--mh-muted)", display: "flex", alignItems: "center" }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", color: "var(--mh-muted)", fontSize: 12, marginBottom: 6 }}>From</label>
                <select
                  value={ctFrom}
                  onChange={(e) => setCtFrom(e.target.value)}
                  style={{ width: "100%", background: "var(--mh-bg)", border: "1px solid var(--mh-border)", borderRadius: 6, padding: "9px 12px", fontSize: 14, color: ctFrom ? "var(--mh-text)" : "var(--mh-muted)", fontFamily: "var(--mh-font-body)", outline: "none", boxSizing: "border-box" }}
                >
                  <option value="">Select device (sender)…</option>
                  {devices.filter((d) => d.isActive).map((d) => (
                    <option key={d.id} value={d.deviceName}>{d.deviceName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", color: "var(--mh-muted)", fontSize: 12, marginBottom: 6 }}>To</label>
                <input
                  type="text"
                  value={ctTo}
                  onChange={(e) => setCtTo(e.target.value)}
                  placeholder="Recipient name"
                  style={{ width: "100%", background: "var(--mh-bg)", border: "1px solid var(--mh-border)", borderRadius: 6, padding: "9px 12px", fontSize: 14, color: "var(--mh-text)", fontFamily: "var(--mh-font-body)", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", color: "var(--mh-muted)", fontSize: 12, marginBottom: 6 }}>Message</label>
                <textarea
                  value={ctMessage}
                  onChange={(e) => setCtMessage(e.target.value)}
                  placeholder="Type your first message…"
                  rows={3}
                  style={{ width: "100%", background: "var(--mh-bg)", border: "1px solid var(--mh-border)", borderRadius: 6, padding: "9px 12px", fontSize: 14, color: "var(--mh-text)", fontFamily: "var(--mh-font-body)", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
              <button
                onClick={() => { setShowCreateThread(false); setCtFrom(""); setCtTo(""); setCtMessage(""); }}
                style={{ background: "transparent", border: "1px solid var(--mh-border)", borderRadius: 6, padding: "8px 16px", fontSize: 13, cursor: "pointer", color: "var(--mh-muted)", fontFamily: "var(--mh-font-body)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => void handleCreateThread()}
                disabled={ctCreating || !ctFrom.trim() || !ctTo.trim() || !ctMessage.trim()}
                style={{ background: "var(--mh-accent)", color: "var(--mh-accent-fg)", border: "none", borderRadius: 6, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: ctCreating ? "not-allowed" : "pointer", opacity: ctCreating ? 0.6 : 1, fontFamily: "var(--mh-font-body)" }}
              >
                {ctCreating ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel 1: API Keys */}
      <div style={{ ...panelStyle, width: 200 }}>
        <div style={panelHeaderStyle}>
          <span>API Keys</span>
          <button style={refreshBtnStyle} onClick={() => void loadApiKeys(true)} title="Refresh keys">
            <RefreshCw size={12} style={{ animation: keysLoading ? "spin 1s linear infinite" : undefined }} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {apiKeys.filter((k) => k.status.toUpperCase() === "ACTIVE").length === 0 && !keysLoading && (
            <p style={emptyStyle}>No active API keys</p>
          )}
          {apiKeys.filter((k) => k.status.toUpperCase() === "ACTIVE").map((key) => {
            const isSelected = selectedKey?.id === key.id;
            return (
              <button
                key={key.id}
                onClick={() => handleKeySelect(key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  padding: "10px 16px",
                  background: isSelected ? "var(--mh-bg)" : "transparent",
                  border: "none",
                  borderBottom: "1px solid var(--mh-border)",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{
                  fontFamily: "var(--mh-font-mono)",
                  fontSize: 12,
                  color: isSelected ? "var(--mh-text)" : "var(--mh-muted)",
                  fontWeight: isSelected ? 600 : 400,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {key.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel 2: Recipients/Threads */}
      <div style={{ ...panelStyle, width: 260 }}>
        <div style={panelHeaderStyle}>
          <span>{selectedKey ? selectedKey.name : "Threads"}</span>
          {selectedKey && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button style={refreshBtnStyle} onClick={() => void loadRecipients(selectedKey, true)} title="Refresh threads">
                <RefreshCw size={12} style={{ animation: recipientsLoading ? "spin 1s linear infinite" : undefined }} />
              </button>
              <button style={refreshBtnStyle} onClick={() => setShowCreateThread(true)} title="New thread">
                <Plus size={13} />
              </button>
            </div>
          )}
        </div>

        {!selectedKey ? (
          <p style={emptyStyle}>Select an API key to view threads</p>
        ) : (
          <>
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--mh-border)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--mh-bg)", border: "1px solid var(--mh-border)", borderRadius: 6, padding: "7px 10px" }}>
                <Search size={13} color="var(--mh-muted)" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ background: "transparent", border: "none", outline: "none", fontSize: 13, color: "var(--mh-text)", fontFamily: "var(--mh-font-body)", width: "100%" }}
                />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {recipientsLoading && recipients.length === 0 && (
                <p style={emptyStyle}>Loading…</p>
              )}
              {!recipientsLoading && visibleRecipients.length === 0 && (
                <p style={emptyStyle}>No threads found</p>
              )}
              {visibleRecipients.map((r) => {
                const isSelected = selectedRecipient === r.receiver;
                return (
                  <button
                    key={r.id}
                    onClick={() => handleRecipientSelect(r.receiver)}
                    style={{
                      display: "flex", flexDirection: "column", gap: 4,
                      width: "100%", padding: "12px 16px",
                      background: isSelected ? "var(--mh-bg)" : "transparent",
                      border: "none", borderBottom: "1px solid var(--mh-border)",
                      cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: "var(--mh-font-mono)", fontSize: 12, fontWeight: 600, color: "var(--mh-text)" }}>
                        {r.receiver}
                      </span>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: statusDot(r.status), flexShrink: 0 }} />
                    </div>
                    <p style={{ color: "var(--mh-muted)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
                      {r.message}
                    </p>
                    <p style={{ color: "var(--mh-muted)", fontSize: 11 }}>
                      {r.created_at ? new Date(r.created_at).toLocaleString() : ""}
                    </p>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Panel 3: Messages */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--mh-bg)" }}>
        {!selectedRecipient ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ color: "var(--mh-muted)", fontSize: 13 }}>
              {selectedKey ? "Select a thread to view messages" : "Select an API key to get started"}
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--mh-border)", background: "var(--mh-surface)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div>
                <p style={{ fontFamily: "var(--mh-font-mono)", fontSize: 14, fontWeight: 600, color: "var(--mh-text)" }}>
                  {selectedRecipient}
                </p>
                <p style={{ color: "var(--mh-muted)", fontSize: 12, marginTop: 1 }}>
                  {timeline.length} message{timeline.length !== 1 ? "s" : ""}
                  {historyEnabled && historyStatus === "COMPLETED" && " · device history merged"}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {historyEnabled && activeDevices.length > 1 && (
                  <select
                    value={historyDeviceId}
                    onChange={(e) => setHistoryDeviceId(e.target.value)}
                    title="Device to pull history from"
                    style={{ background: "var(--mh-bg)", border: "1px solid var(--mh-border)", borderRadius: 6, padding: "5px 8px", fontSize: 12, color: "var(--mh-text)", fontFamily: "var(--mh-font-body)", outline: "none", maxWidth: 160 }}
                  >
                    {activeDevices.map((d) => (
                      <option key={d.id} value={d.id}>{d.deviceName}</option>
                    ))}
                  </select>
                )}
                <button
                  onClick={handleToggleHistory}
                  disabled={activeDevices.length === 0}
                  title={activeDevices.length === 0 ? "No active devices to pull history from" : historyEnabled ? "Hide device history" : "Merge device history into this thread"}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    background: historyEnabled ? "var(--mh-accent)" : "transparent",
                    color: historyEnabled ? "var(--mh-accent-fg)" : "var(--mh-muted)",
                    border: `1px solid ${historyEnabled ? "var(--mh-accent)" : "var(--mh-border)"}`,
                    borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 500,
                    cursor: activeDevices.length === 0 ? "not-allowed" : "pointer",
                    opacity: activeDevices.length === 0 ? 0.5 : 1,
                    fontFamily: "var(--mh-font-body)",
                  }}
                >
                  <History size={13} />
                  Device history
                </button>
                <button
                  style={refreshBtnStyle}
                  onClick={() => selectedKey && void loadMessages({ key: selectedKey, recipient: selectedRecipient, status: filter, pageNum: 0 })}
                  title="Refresh messages"
                >
                  <RefreshCw size={13} style={{ animation: messagesLoading ? "spin 1s linear infinite" : undefined }} />
                </button>
              </div>
            </div>

            {/* Filter tabs */}
            <div style={{ padding: "10px 24px", borderBottom: "1px solid var(--mh-border)", background: "var(--mh-surface)", display: "flex", gap: 4, flexShrink: 0 }}>
              {(["ALL", "DELIVERED", "PENDING", "FAILED"] as FilterStatus[]).map((f) => (
                <button
                  key={f}
                  onClick={() => handleFilterChange(f)}
                  style={{
                    background: filter === f ? "var(--mh-accent)" : "transparent",
                    color: filter === f ? "var(--mh-accent-fg)" : "var(--mh-muted)",
                    border: `1px solid ${filter === f ? "var(--mh-accent)" : "var(--mh-border)"}`,
                    borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 500,
                    cursor: "pointer", fontFamily: "var(--mh-font-body)", textTransform: "capitalize",
                  }}
                >
                  {f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Message list */}
            <div
              ref={msgScrollRef}
              onScroll={handleMsgScroll}
              style={{ flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 12 }}
            >
              {loadingMore && (
                <p style={{ color: "var(--mh-muted)", fontSize: 12, textAlign: "center" }}>Loading older…</p>
              )}

              {/* Device history status banner (merged results appear inline below) */}
              {historyEnabled && historyStatus === "LOADING" && (
                <div style={historyBannerStyle}>
                  <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} />
                  <span>Fetching messages from device…</span>
                </div>
              )}
              {historyEnabled && historyStatus === "FAILED" && (
                <div style={{ ...historyBannerStyle, borderColor: "var(--mh-red)", color: "var(--mh-red)" }}>
                  <span style={{ flex: 1 }}>
                    {historyError ?? "Couldn't load history. Please try again."}
                  </span>
                  <button style={historyRetryBtnStyle} onClick={retryHistory}>
                    <RotateCcw size={11} /> Try again
                  </button>
                </div>
              )}

              {/* Older device history: infinite scroll (scroll to top) + an
                  explicit control so it's always discoverable and testable. */}
              {historyEnabled && (historyHasMore || historyLoadingMore) && (
                <button
                  onClick={() => loadMoreHistory()}
                  disabled={historyLoadingMore}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    alignSelf: "center", margin: "0 auto",
                    background: "transparent", border: "1px solid var(--mh-border)", borderRadius: 6,
                    padding: "5px 12px", fontSize: 12, color: "var(--mh-muted)",
                    cursor: historyLoadingMore ? "default" : "pointer",
                    fontFamily: "var(--mh-font-body)",
                  }}
                >
                  <RefreshCw
                    size={11}
                    style={{ animation: historyLoadingMore ? "spin 1s linear infinite" : undefined }}
                  />
                  <span>{historyLoadingMore ? "Loading older messages…" : "Load older messages"}</span>
                </button>
              )}

              {messagesLoading && timeline.length === 0 && (
                <p style={{ color: "var(--mh-muted)", fontSize: 13, textAlign: "center", paddingTop: 32 }}>Loading…</p>
              )}
              {!messagesLoading && timeline.length === 0 && historyStatus !== "LOADING" && (
                <p style={{ color: "var(--mh-muted)", fontSize: 13, textAlign: "center", paddingTop: 32 }}>No messages</p>
              )}

              {timeline.map((item) => {
                if (item.kind === "device") {
                  const d = item.device;
                  const isSent = d.direction === "SENT";
                  return (
                    <div
                      key={item.id}
                      style={{ display: "flex", flexDirection: "column", alignItems: isSent ? "flex-end" : "flex-start" }}
                    >
                      <div
                        style={{
                          maxWidth: "72%",
                          background: isSent ? "var(--mh-accent)" : "var(--mh-surface)",
                          color: isSent ? "var(--mh-accent-fg)" : "var(--mh-text)",
                          border: isSent ? "none" : "1px solid var(--mh-border)",
                          borderRadius: 12,
                          borderBottomRightRadius: isSent ? 4 : 12,
                          borderBottomLeftRadius: isSent ? 12 : 4,
                          padding: "9px 13px", fontSize: 14, lineHeight: 1.45, wordBreak: "break-word",
                        }}
                      >
                        {d.body}
                      </div>
                      <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--mh-muted)", fontSize: 11, marginTop: 3, padding: "0 4px" }}>
                        <History size={10} /> on device · {new Date(d.timestamp).toLocaleString()}
                      </span>
                    </div>
                  );
                }

                // DB message — outbound record, right-aligned.
                const msg = item.db;
                const failed = msg.status?.toLowerCase() === "failed";
                return (
                  <div key={item.id} style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <div
                      style={{
                        maxWidth: "72%", background: "var(--mh-accent)", color: "var(--mh-accent-fg)",
                        borderRadius: 12, borderBottomRightRadius: 4,
                        padding: "9px 13px", fontSize: 14, lineHeight: 1.45, wordBreak: "break-word",
                      }}
                    >
                      {msg.message}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3, padding: "0 4px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <Badge status={(msg.status?.toLowerCase() ?? "pending") as "delivered" | "pending" | "failed"} />
                      <span style={{ fontFamily: "var(--mh-font-mono)", fontSize: 10, color: "var(--mh-muted)" }}>
                        from: {msg.sender}
                      </span>
                      {failed && (
                        <button
                          onClick={() => void handleRetry(msg.id)}
                          style={{ background: "transparent", border: "1px solid var(--mh-border)", borderRadius: 4, padding: "1px 6px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--mh-muted)", fontFamily: "var(--mh-font-body)" }}
                          title="Retry message"
                        >
                          <RotateCcw size={10} />
                          Retry
                        </button>
                      )}
                      <span style={{ color: "var(--mh-muted)", fontSize: 11 }}>
                        {msg.created_at ? new Date(msg.created_at).toLocaleString() : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Send form */}
            <div style={{ padding: "12px 24px", borderTop: "1px solid var(--mh-border)", background: "var(--mh-surface)", flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              <select
                value={fromInput}
                onChange={(e) => setFromInput(e.target.value)}
                style={{ background: "var(--mh-bg)", border: "1px solid var(--mh-border)", borderRadius: 6, padding: "8px 12px", fontSize: 13, color: fromInput ? "var(--mh-text)" : "var(--mh-muted)", fontFamily: "var(--mh-font-body)", outline: "none", width: "100%", boxSizing: "border-box" }}
              >
                <option value="">Select device (sender)…</option>
                {devices.filter((d) => d.isActive).map((d) => (
                  <option key={d.id} value={d.deviceName}>{d.deviceName}</option>
                ))}
              </select>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  placeholder="Type a message…"
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend(); } }}
                  style={{ flex: 1, background: "var(--mh-bg)", border: "1px solid var(--mh-border)", borderRadius: 6, padding: "8px 12px", fontSize: 13, color: "var(--mh-text)", fontFamily: "var(--mh-font-body)", outline: "none" }}
                />
                <button
                  onClick={() => void handleSend()}
                  disabled={sending || !fromInput.trim() || !msgInput.trim()}
                  style={{ background: "var(--mh-accent)", color: "var(--mh-accent-fg)", border: "none", borderRadius: 6, padding: "8px 14px", cursor: sending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, opacity: sending ? 0.6 : 1 }}
                >
                  <Send size={13} />
                  Send
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, Search, Send, Plus, X, RotateCcw } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { useAuth } from "../../context/AuthContext";
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

  const handleKeySelect = (key: ApiKey) => {
    setSelectedKey(key);
    setSelectedRecipient(null);
    setRecipients([]);
    setMessages([]);
    setSearch("");
    setFilter("ALL");
    setPage(0);
    setHasMore(true);
    void loadRecipients(key);
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
    if (!el || loadingMore || !hasMore || !selectedKey || !selectedRecipient) return;
    if (el.scrollTop < 60) {
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

  // ── Derived ───────────────────────────────────────────────────────────────
  const visibleRecipients = useMemo(
    () => recipients.filter((r) => !search || r.receiver.toLowerCase().includes(search.toLowerCase())),
    [recipients, search],
  );

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
              {([
                { label: "From", value: ctFrom, setter: setCtFrom, placeholder: "Sender name" },
                { label: "To", value: ctTo, setter: setCtTo, placeholder: "Recipient name" },
              ] as { label: string; value: string; setter: (v: string) => void; placeholder: string }[]).map(({ label, value, setter, placeholder }) => (
                <div key={label}>
                  <label style={{ display: "block", color: "var(--mh-muted)", fontSize: 12, marginBottom: 6 }}>{label}</label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    placeholder={placeholder}
                    style={{ width: "100%", background: "var(--mh-bg)", border: "1px solid var(--mh-border)", borderRadius: 6, padding: "9px 12px", fontSize: 14, color: "var(--mh-text)", fontFamily: "var(--mh-font-body)", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              ))}
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
                  {messages.length} message{messages.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                style={refreshBtnStyle}
                onClick={() => selectedKey && void loadMessages({ key: selectedKey, recipient: selectedRecipient, status: filter, pageNum: 0 })}
                title="Refresh messages"
              >
                <RefreshCw size={13} style={{ animation: messagesLoading ? "spin 1s linear infinite" : undefined }} />
              </button>
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
              {messagesLoading && messages.length === 0 && (
                <p style={{ color: "var(--mh-muted)", fontSize: 13, textAlign: "center", paddingTop: 32 }}>Loading…</p>
              )}
              {!messagesLoading && messages.length === 0 && (
                <p style={{ color: "var(--mh-muted)", fontSize: 13, textAlign: "center", paddingTop: 32 }}>No messages</p>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{ background: "var(--mh-surface)", border: "1px solid var(--mh-border)", borderRadius: 10, padding: "14px 18px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
                >
                  <p style={{ color: "var(--mh-text)", fontSize: 14, lineHeight: 1.5, marginBottom: 10 }}>
                    {msg.message}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <Badge status={(msg.status?.toLowerCase() ?? "pending") as "delivered" | "pending" | "failed"} />
                    <span style={{ fontFamily: "var(--mh-font-mono)", fontSize: 11, color: "var(--mh-muted)", background: "var(--mh-bg)", border: "1px solid var(--mh-border)", padding: "2px 7px", borderRadius: 4 }}>
                      from: {msg.sender}
                    </span>
                    {msg.status?.toLowerCase() === "failed" && (
                      <button
                        onClick={() => void handleRetry(msg.id)}
                        style={{ background: "transparent", border: "1px solid var(--mh-border)", borderRadius: 4, padding: "2px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--mh-muted)", fontFamily: "var(--mh-font-body)" }}
                        title="Retry message"
                      >
                        <RotateCcw size={11} />
                        Retry
                      </button>
                    )}
                    <span style={{ color: "var(--mh-muted)", fontSize: 12, marginLeft: "auto" }}>
                      {msg.created_at ? new Date(msg.created_at).toLocaleString() : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Send form */}
            <div style={{ padding: "12px 24px", borderTop: "1px solid var(--mh-border)", background: "var(--mh-surface)", flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              <input
                type="text"
                placeholder="From (sender name)"
                value={fromInput}
                onChange={(e) => setFromInput(e.target.value)}
                style={{ background: "var(--mh-bg)", border: "1px solid var(--mh-border)", borderRadius: 6, padding: "8px 12px", fontSize: 13, color: "var(--mh-text)", fontFamily: "var(--mh-font-body)", outline: "none", width: "100%", boxSizing: "border-box" }}
              />
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

import React, { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { threads, apiKeys } from "../../data/demo";
import type { MessageStatus } from "../../data/demo";
import { useAuth } from "../../context/AuthContext";
import {
  createCacheKey,
  fetchJson,
  hasDataChanged,
  readCachedJson,
  writeCachedJson,
} from "../../lib/api";

type Filter = "all" | MessageStatus;

const filterLabels: Filter[] = ["all", "delivered", "pending", "failed"];

interface RetrievedApiKey {
  created_at: string;
  expires_at: string | null;
  id: string;
  key: string;
  last_used: string | null;
  name: string;
  owner_id: string;
  status: string;
}

export function Messages() {
  const { session } = useAuth();
  const [selectedKeyId, setSelectedKeyId] = useState<string>("all");
  const [selectedThreadId, setSelectedThreadId] = useState<string>(
    threads[0].id,
  );
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [remoteApiKeys, setRemoteApiKeys] = useState<RetrievedApiKey[] | null>(
    null,
  );

  useEffect(() => {
    if (!session) return;

    const cacheKey = createCacheKey("api-keys-retrieve", session);
    const cached = readCachedJson<RetrievedApiKey[]>(cacheKey);

    if (cached) {
      setRemoteApiKeys(cached);
    }

    let cancelled = false;

    const loadKeys = async () => {
      try {
        const next = await fetchJson<RetrievedApiKey[]>(
          session,
          "/api/keys/retrieve",
        );
        if (cancelled) return;

        writeCachedJson(cacheKey, next);
        if (hasDataChanged(cached, next)) {
          setRemoteApiKeys(next);
        }
      } catch (error) {
        if (!cached) {
          console.error("Failed to load API keys for Messages:", error);
        }
      }
    };

    void loadKeys();

    return () => {
      cancelled = true;
    };
  }, [session?.access_token, session?.user?.id]);

  const displayApiKeys = useMemo(() => {
    if (!remoteApiKeys?.length) return apiKeys;

    const liveByName = new Map(remoteApiKeys.map((key) => [key.name, key]));
    let matched = false;

    const next = apiKeys.map((demoKey) => {
      const liveKey = liveByName.get(demoKey.name);
      if (!liveKey) return demoKey;
      matched = true;
      return {
        ...demoKey,
        name: liveKey.name,
      };
    });

    return matched ? next : apiKeys;
  }, [remoteApiKeys]);

  const visibleThreads = useMemo(() => {
    return threads
      .filter((t) => selectedKeyId === "all" || t.keyId === selectedKeyId)
      .filter((t) => !search || t.phone.includes(search));
  }, [selectedKeyId, search]);

  const selectedThread = useMemo(
    () => threads.find((t) => t.id === selectedThreadId) ?? threads[0],
    [selectedThreadId],
  );

  const filteredMessages = useMemo(() => {
    if (filter === "all") return selectedThread.messages;
    return selectedThread.messages.filter((m) => m.status === filter);
  }, [selectedThread, filter]);

  const unreadCounts: Record<string, number> = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    threads.forEach((t) => {
      const failed = t.messages.filter((m) => m.status === "failed").length;
      if (!counts[t.keyId]) counts[t.keyId] = 0;
      counts[t.keyId] += failed;
      counts.all += failed;
    });
    return counts;
  }, []);

  const handleKeySelect = (keyId: string) => {
    setSelectedKeyId(keyId);
    const first = threads.find((t) => keyId === "all" || t.keyId === keyId);
    if (first) setSelectedThreadId(first.id);
  };

  const panelStyle: React.CSSProperties = {
    background: "var(--mh-surface)",
    borderRight: "1px solid var(--mh-border)",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    overflowY: "auto",
  };

  const sectionTitleStyle: React.CSSProperties = {
    color: "var(--mh-muted)",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    padding: "14px 16px 8px",
    borderBottom: "1px solid var(--mh-border)",
  };

  return (
    <div
      style={{
        height: "calc(100vh - 56px)",
        display: "flex",
        overflow: "hidden",
        background: "var(--mh-bg)",
      }}
    >
      {/* Panel 1: API Key list */}
      <div style={{ ...panelStyle, width: 200 }}>
        <p style={sectionTitleStyle}>API Keys</p>
        <div style={{ flex: 1 }}>
          {[
            { id: "all", name: "All Keys" },
            ...displayApiKeys.filter((k) => k.status === "active"),
          ].map((key) => {
            const isSelected = selectedKeyId === key.id;
            const count = unreadCounts[key.id] ?? 0;
            return (
              <button
                key={key.id}
                onClick={() => handleKeySelect(key.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "10px 16px",
                  background: isSelected ? "var(--mh-bg)" : "transparent",
                  border: "none",
                  borderBottom: "1px solid var(--mh-border)",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--mh-font-mono)",
                    fontSize: 12,
                    color: isSelected ? "var(--mh-text)" : "var(--mh-muted)",
                    fontWeight: isSelected ? 600 : 400,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {key.name}
                </span>
                {count > 0 && (
                  <span
                    style={{
                      background: "var(--mh-red)",
                      color: "#fff",
                      borderRadius: 10,
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "1px 6px",
                      flexShrink: 0,
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel 2: Thread list */}
      <div style={{ ...panelStyle, width: 260 }}>
        <p style={sectionTitleStyle}>
          {selectedKeyId === "all"
            ? "All Threads"
            : (displayApiKeys.find((k) => k.id === selectedKeyId)?.name ??
              "Threads")}
        </p>
        <div
          style={{
            padding: "10px 12px",
            borderBottom: "1px solid var(--mh-border)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--mh-bg)",
              border: "1px solid var(--mh-border)",
              borderRadius: 6,
              padding: "7px 10px",
            }}
          >
            <Search size={13} color="var(--mh-muted)" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 13,
                color: "var(--mh-text)",
                fontFamily: "var(--mh-font-body)",
                width: "100%",
              }}
            />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {visibleThreads.length === 0 && (
            <p
              style={{
                color: "var(--mh-muted)",
                fontSize: 13,
                padding: "20px 16px",
              }}
            >
              No threads found
            </p>
          )}
          {visibleThreads.map((thread) => {
            const last = thread.messages[thread.messages.length - 1];
            const isSelected = thread.id === selectedThreadId;
            const dotColor =
              last.status === "delivered"
                ? "var(--mh-green)"
                : last.status === "pending"
                  ? "var(--mh-amber)"
                  : "var(--mh-red)";

            return (
              <button
                key={thread.id}
                onClick={() => setSelectedThreadId(thread.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  width: "100%",
                  padding: "12px 16px",
                  background: isSelected ? "var(--mh-bg)" : "transparent",
                  border: "none",
                  borderBottom: "1px solid var(--mh-border)",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--mh-font-mono)",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--mh-text)",
                    }}
                  >
                    {thread.phone}
                  </span>
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: dotColor,
                      flexShrink: 0,
                    }}
                  />
                </div>
                <p
                  style={{
                    color: "var(--mh-muted)",
                    fontSize: 12,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "100%",
                  }}
                >
                  {last.body}
                </p>
                <p style={{ color: "var(--mh-muted)", fontSize: 11 }}>
                  {last.sentAt}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel 3: Message detail */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "var(--mh-bg)",
        }}
      >
        <div
          style={{
            padding: "14px 24px",
            borderBottom: "1px solid var(--mh-border)",
            background: "var(--mh-surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "var(--mh-font-mono)",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--mh-text)",
              }}
            >
              {selectedThread.phone}
            </p>
            <p style={{ color: "var(--mh-muted)", fontSize: 12, marginTop: 1 }}>
              {selectedThread.messages.length} message
              {selectedThread.messages.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div
          style={{
            padding: "10px 24px",
            borderBottom: "1px solid var(--mh-border)",
            background: "var(--mh-surface)",
            display: "flex",
            gap: 4,
            flexShrink: 0,
          }}
        >
          {filterLabels.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? "var(--mh-accent)" : "transparent",
                color: filter === f ? "var(--mh-accent-fg)" : "var(--mh-muted)",
                border: `1px solid ${filter === f ? "var(--mh-accent)" : "var(--mh-border)"}`,
                borderRadius: 6,
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "var(--mh-font-body)",
                textTransform: "capitalize",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {filteredMessages.length === 0 && (
            <p
              style={{
                color: "var(--mh-muted)",
                fontSize: 13,
                textAlign: "center",
                paddingTop: 32,
              }}
            >
              No messages match this filter
            </p>
          )}
          {filteredMessages.map((msg) => (
            <div
              key={msg.id}
              style={{
                background: "var(--mh-surface)",
                border: "1px solid var(--mh-border)",
                borderRadius: 10,
                padding: "14px 18px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              }}
            >
              <p
                style={{
                  color: "var(--mh-text)",
                  fontSize: 14,
                  lineHeight: 1.5,
                  marginBottom: 10,
                }}
              >
                {msg.body}
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <Badge status={msg.status} />
                <span
                  style={{
                    fontFamily: "var(--mh-font-mono)",
                    fontSize: 11,
                    color: "var(--mh-muted)",
                    background: "var(--mh-bg)",
                    border: "1px solid var(--mh-border)",
                    padding: "2px 7px",
                    borderRadius: 4,
                  }}
                >
                  {msg.keyName}
                </span>
                <span
                  style={{
                    color: "var(--mh-muted)",
                    fontSize: 12,
                    marginLeft: "auto",
                  }}
                >
                  {msg.sentAt}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

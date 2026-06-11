import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { MessageSquare, TrendingUp, AlertCircle, Wifi } from "lucide-react";
import { StatCard } from "../../components/ui/StatCard";
import { Badge } from "../../components/ui/Badge";
import { useAuth } from "../../context/AuthContext";
import {
  createCacheKey,
  fetchJson,
  formatDateLabel,
  hasDataChanged,
  readCachedJson,
  shortId,
  writeCachedJson,
} from "../../lib/api";

type DashboardDateFilter = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

interface DashboardCounters {
  totalMessages: number;
  failedMessages: number;
  successRate: number;
}

interface DashboardGraphPoint {
  date: string;
  count: number;
}

interface DashboardKeyCount {
  apiId: string;
  name: string | null;
  messageCount: number;
}

interface DashboardRecentMessage {
  message: string;
  receiver: string;
  sender: string;
  api_id: string;
  created_at: string;
  id: string;
  sent_at: string | null;
  status: "pending" | "failed" | "delivered";
}

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

const DATE_FILTERS: DashboardDateFilter[] = [
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "YEARLY",
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: "var(--mh-surface)",
        border: "1px solid var(--mh-border)",
        borderRadius: 8,
        padding: "10px 14px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <p style={{ color: "var(--mh-muted)", fontSize: 11, marginBottom: 6 }}>
        {label}
      </p>
      {payload.map((item: any) => (
        <p
          key={item.dataKey}
          style={{ color: item.color, fontSize: 12, fontWeight: 500 }}
        >
          {item.name}: {Number(item.value ?? 0).toLocaleString()}
        </p>
      ))}
    </div>
  );
}

function formatGraphDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function normalizeApiKeyStatus(status: string) {
  return status.toUpperCase() === "ACTIVE" ? "active" : "revoked";
}

export function Dashboard() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [selectedDateFilter, setSelectedDateFilter] =
    useState<DashboardDateFilter>("WEEKLY");
  const [counters, setCounters] = useState<DashboardCounters | null>(null);
  const [graphData, setGraphData] = useState<DashboardGraphPoint[] | null>(
    null,
  );
  const [keyCounts, setKeyCounts] = useState<DashboardKeyCount[] | null>(null);
  const [recentMessages, setRecentMessages] = useState<
    DashboardRecentMessage[] | null
  >(null);
  const [apiKeys, setApiKeys] = useState<RetrievedApiKey[] | null>(null);

  useEffect(() => {
    if (!session) return;

    const cacheKey = createCacheKey("dashboard-counters", session);
    const cached = readCachedJson<DashboardCounters>(cacheKey);

    if (cached) {
      setCounters(cached);
    }

    let cancelled = false;

    const loadCounters = async () => {
      try {
        const next = await fetchJson<DashboardCounters>(
          session,
          "/api/dashboard/counters",
        );
        if (cancelled) return;

        writeCachedJson(cacheKey, next);
        if (hasDataChanged(cached, next)) {
          setCounters(next);
        }
      } catch (error) {
        if (!cached) {
          console.error("Failed to load dashboard counters:", error);
        }
      }
    };

    void loadCounters();

    return () => {
      cancelled = true;
    };
  }, [session?.access_token, session?.user?.id]);

  useEffect(() => {
    if (!session) return;

    const cacheKey = createCacheKey(
      "dashboard-graph",
      session,
      selectedDateFilter,
    );
    const cached = readCachedJson<DashboardGraphPoint[]>(cacheKey);

    if (cached) {
      setGraphData(cached);
    }

    let cancelled = false;

    const loadGraph = async () => {
      try {
        const next = await fetchJson<DashboardGraphPoint[]>(
          session,
          "/api/dashboard/graph",
          {
            dateFilter: selectedDateFilter,
          },
        );
        if (cancelled) return;

        writeCachedJson(cacheKey, next);
        if (hasDataChanged(cached, next)) {
          setGraphData(next);
        }
      } catch (error) {
        if (!cached) {
          console.error("Failed to load dashboard graph:", error);
        }
      }
    };

    void loadGraph();

    return () => {
      cancelled = true;
    };
  }, [session?.access_token, session?.user?.id, selectedDateFilter]);

  useEffect(() => {
    if (!session) return;

    const cacheKey = createCacheKey("dashboard-by-keys", session);
    const cached = readCachedJson<DashboardKeyCount[]>(cacheKey);

    if (cached) {
      setKeyCounts(cached);
    }

    let cancelled = false;

    const loadKeyCounts = async () => {
      try {
        const next = await fetchJson<DashboardKeyCount[]>(
          session,
          "/api/dashboard/byKeys",
        );
        if (cancelled) return;

        writeCachedJson(cacheKey, next);
        if (hasDataChanged(cached, next)) {
          setKeyCounts(next);
        }
      } catch (error) {
        if (!cached) {
          console.error("Failed to load dashboard by-key counts:", error);
        }
      }
    };

    void loadKeyCounts();

    return () => {
      cancelled = true;
    };
  }, [session?.access_token, session?.user?.id]);

  useEffect(() => {
    if (!session) return;

    const cacheKey = createCacheKey("dashboard-recent", session);
    const cached = readCachedJson<DashboardRecentMessage[]>(cacheKey);

    if (cached) {
      setRecentMessages(cached);
    }

    let cancelled = false;

    const loadRecentMessages = async () => {
      try {
        const next = await fetchJson<DashboardRecentMessage[]>(
          session,
          "/api/dashboard/recent",
        );
        if (cancelled) return;

        writeCachedJson(cacheKey, next);
        if (hasDataChanged(cached, next)) {
          setRecentMessages(next);
        }
      } catch (error) {
        if (!cached) {
          console.error("Failed to load dashboard recent messages:", error);
        }
      }
    };

    void loadRecentMessages();

    return () => {
      cancelled = true;
    };
  }, [session?.access_token, session?.user?.id]);

  useEffect(() => {
    if (!session) return;

    const cacheKey = createCacheKey("api-keys-retrieve", session);
    const cached = readCachedJson<RetrievedApiKey[]>(cacheKey);

    if (cached) {
      setApiKeys(cached);
    }

    let cancelled = false;

    const loadApiKeys = async () => {
      try {
        const next = await fetchJson<RetrievedApiKey[]>(
          session,
          "/api/keys/retrieve",
        );
        if (cancelled) return;

        writeCachedJson(cacheKey, next);
        if (hasDataChanged(cached, next)) {
          setApiKeys(next);
        }
      } catch (error) {
        if (!cached) {
          console.error("Failed to load API keys:", error);
        }
      }
    };

    void loadApiKeys();

    return () => {
      cancelled = true;
    };
  }, [session?.access_token, session?.user?.id]);

  const apiKeyNameById = useMemo(() => {
    return (apiKeys ?? []).reduce<Record<string, string>>(
      (accumulator, key) => {
        accumulator[key.id] = key.name;
        return accumulator;
      },
      {},
    );
  }, [apiKeys]);

  const graphPoints = useMemo(
    () =>
      (graphData ?? []).map((point) => ({
        date: formatGraphDate(point.date),
        count: point.count,
      })),
    [graphData],
  );

  const keyCountRows = useMemo(() => keyCounts ?? [], [keyCounts]);
  const recentRows = useMemo(
    () => (recentMessages ?? []).slice(0, 5),
    [recentMessages],
  );
  const activeApiKeyCount = useMemo(() => {
    return (apiKeys ?? []).filter(
      (key) => normalizeApiKeyStatus(key.status) === "active",
    ).length;
  }, [apiKeys]);
  const maxKeyCount = Math.max(
    1,
    ...keyCountRows.map((entry) => entry.messageCount),
  );

  return (
    <div style={{ padding: 32 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard
          title="Total Messages Sent"
          value={counters ? counters.totalMessages.toLocaleString() : "—"}
          subtitle="all time"
          icon={<MessageSquare size={20} />}
        />
        <StatCard
          title="Delivery Success Rate"
          value={counters ? `${counters.successRate.toFixed(1)}%` : "—"}
          subtitle="current window"
          icon={<TrendingUp size={20} />}
        />
        <StatCard
          title="Failed / Pending"
          value={counters ? counters.failedMessages.toLocaleString() : "—"}
          subtitle="pending not returned"
          icon={<AlertCircle size={20} />}
        />
        <StatCard
          title="Active API Keys"
          value={apiKeys ? activeApiKeyCount.toLocaleString() : "—"}
          subtitle="from retrieve endpoint"
          icon={<Wifi size={20} />}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            background: "var(--mh-surface)",
            border: "1px solid var(--mh-border)",
            borderRadius: 10,
            padding: "24px 24px 16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <p
              style={{ color: "var(--mh-text)", fontSize: 14, fontWeight: 600 }}
            >
              Messages Over Time
            </p>

            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              {DATE_FILTERS.map((filter) => {
                const isActive = selectedDateFilter === filter;

                return (
                  <button
                    key={filter}
                    onClick={() => setSelectedDateFilter(filter)}
                    style={{
                      background: isActive
                        ? "var(--mh-accent)"
                        : "var(--mh-bg)",
                      color: isActive
                        ? "var(--mh-accent-fg)"
                        : "var(--mh-muted)",
                      border: `1px solid ${isActive ? "var(--mh-accent)" : "var(--mh-border)"}`,
                      borderRadius: 999,
                      padding: "5px 10px",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      cursor: "pointer",
                      fontFamily: "var(--mh-font-body)",
                    }}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>

          {graphPoints.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={graphPoints}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  horizontal
                  vertical={false}
                  stroke="var(--mh-border)"
                  strokeDasharray="0"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "var(--mh-muted)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--mh-muted)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Messages"
                  stroke="var(--mh-text)"
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                height: 220,
                display: "grid",
                placeItems: "center",
                color: "var(--mh-muted)",
                fontSize: 13,
              }}
            >
              Loading chart data...
            </div>
          )}

          <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 16,
                  height: 2,
                  background: "var(--mh-text)",
                  borderRadius: 2,
                }}
              />
              <span style={{ color: "var(--mh-muted)", fontSize: 12 }}>
                Messages
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            background: "var(--mh-surface)",
            border: "1px solid var(--mh-border)",
            borderRadius: 10,
            padding: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <p
            style={{
              color: "var(--mh-text)",
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 20,
            }}
          >
            Messages by Key
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {keyCountRows.length > 0 ? (
              keyCountRows.map((row) => {
                const resolvedName =
                  apiKeyNameById[row.apiId] ??
                  row.name ??
                  shortId(row.apiId, 10);

                return (
                  <div key={row.apiId}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--mh-font-mono)",
                          fontSize: 12,
                          color: "var(--mh-text)",
                        }}
                      >
                        {resolvedName}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--mh-muted)" }}>
                        {row.messageCount.toLocaleString()}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 4,
                        background: "var(--mh-border)",
                        borderRadius: 2,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          background: "var(--mh-accent)",
                          borderRadius: 2,
                          width: `${(row.messageCount / maxKeyCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ color: "var(--mh-muted)", fontSize: 13 }}>
                Loading key counts...
              </p>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          background: "var(--mh-surface)",
          border: "1px solid var(--mh-border)",
          borderRadius: 10,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 24px",
            borderBottom: "1px solid var(--mh-border)",
          }}
        >
          <p style={{ color: "var(--mh-text)", fontSize: 14, fontWeight: 600 }}>
            Recent Messages
          </p>
          <button
            onClick={() => navigate("/messages")}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--mh-muted)",
              fontSize: 13,
              fontFamily: "var(--mh-font-body)",
            }}
          >
            View all →
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--mh-border)" }}>
                {["To", "API Key", "Status", "Sent At"].map((header) => (
                  <th
                    key={header}
                    style={{
                      padding: "10px 24px",
                      textAlign: "left",
                      color: "var(--mh-muted)",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentRows.length > 0 ? (
                recentRows.map((message, index) => {
                  const resolvedName =
                    apiKeyNameById[message.api_id] ??
                    shortId(message.api_id, 5);

                  return (
                    <tr
                      key={message.id}
                      style={{
                        borderBottom:
                          index < recentRows.length - 1
                            ? "1px solid var(--mh-border)"
                            : "none",
                      }}
                    >
                      <td
                        style={{
                          padding: "14px 24px",
                          fontFamily: "var(--mh-font-mono)",
                          fontSize: 13,
                          color: "var(--mh-text)",
                        }}
                      >
                        {message.receiver}
                      </td>
                      <td style={{ padding: "14px 24px" }}>
                        <span
                          style={{
                            fontFamily: "var(--mh-font-mono)",
                            fontSize: 12,
                            color: "var(--mh-muted)",
                            background: "var(--mh-bg)",
                            border: "1px solid var(--mh-border)",
                            padding: "2px 7px",
                            borderRadius: 4,
                          }}
                        >
                          {resolvedName}
                        </span>
                      </td>
                      <td style={{ padding: "14px 24px" }}>
                        <Badge status={message.status} />
                      </td>
                      <td
                        style={{
                          padding: "14px 24px",
                          fontSize: 13,
                          color: "var(--mh-muted)",
                        }}
                      >
                        {formatDateLabel(message.sent_at ?? message.created_at)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: "20px 24px",
                      color: "var(--mh-muted)",
                      fontSize: 13,
                    }}
                  >
                    Loading recent messages...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

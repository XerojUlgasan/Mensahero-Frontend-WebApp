import React from 'react'
import { useNavigate } from 'react-router'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { MessageSquare, TrendingUp, AlertCircle, Wifi } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { Badge } from '../../components/ui/Badge'
import {
  stats,
  chartData,
  keyMessageCounts,
  recentMessages,
} from '../../data/demo'

const maxKeyCount = Math.max(...keyMessageCounts.map(k => k.count))

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: 'var(--mh-surface)',
        border: '1px solid var(--mh-border)',
        borderRadius: 8,
        padding: '10px 14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
    >
      <p style={{ color: 'var(--mh-muted)', fontSize: 11, marginBottom: 6 }}>{label}</p>
      {payload.map((p: any) => (
        <p
          key={p.dataKey}
          style={{ color: p.color, fontSize: 12, fontWeight: 500 }}
        >
          {p.name}: {p.value.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

export function Dashboard() {
  const navigate = useNavigate()

  return (
    <div style={{ padding: 32 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard
          title="Total Messages Sent"
          value={stats.totalSent.toLocaleString()}
          subtitle="all time"
          icon={<MessageSquare size={20} />}
        />
        <StatCard
          title="Delivery Success Rate"
          value={`${stats.deliveryRate}%`}
          subtitle="last 30 days"
          icon={<TrendingUp size={20} />}
        />
        <StatCard
          title="Failed / Pending"
          value={stats.failedPending.toLocaleString()}
          subtitle="needs attention"
          icon={<AlertCircle size={20} />}
        />
        <StatCard
          title="Active Agents"
          value={`${stats.activeAgents} / ${stats.totalAgents}`}
          subtitle="devices online"
          icon={<Wifi size={20} />}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            background: 'var(--mh-surface)',
            border: '1px solid var(--mh-border)',
            borderRadius: 10,
            padding: '24px 24px 16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <p
            style={{
              color: 'var(--mh-text)',
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 20,
            }}
          >
            Messages Over Time
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid
                horizontal
                vertical={false}
                stroke="var(--mh-border)"
                strokeDasharray="0"
              />
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--mh-muted)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fill: 'var(--mh-muted)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="sent"
                name="Sent"
                stroke="var(--mh-text)"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="delivered"
                name="Delivered"
                stroke="var(--mh-green)"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 4 }}
                opacity={0.7}
              />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
            {[
              { label: 'Sent', color: 'var(--mh-text)' },
              { label: 'Delivered', color: 'var(--mh-green)' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{ width: 16, height: 2, background: l.color, borderRadius: 2 }}
                />
                <span style={{ color: 'var(--mh-muted)', fontSize: 12 }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            background: 'var(--mh-surface)',
            border: '1px solid var(--mh-border)',
            borderRadius: 10,
            padding: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <p
            style={{
              color: 'var(--mh-text)',
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 20,
            }}
          >
            Messages by Key
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {keyMessageCounts.map(k => (
              <div key={k.keyId}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--mh-font-mono)',
                      fontSize: 12,
                      color: 'var(--mh-text)',
                    }}
                  >
                    {k.name}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--mh-muted)' }}>
                    {k.count.toLocaleString()}
                  </span>
                </div>
                <div
                  style={{
                    height: 4,
                    background: 'var(--mh-border)',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      background: 'var(--mh-accent)',
                      borderRadius: 2,
                      width: `${(k.count / maxKeyCount) * 100}%`,
                      opacity: k.keyId === 'key_old' ? 0.35 : 1,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          background: 'var(--mh-surface)',
          border: '1px solid var(--mh-border)',
          borderRadius: 10,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid var(--mh-border)',
          }}
        >
          <p style={{ color: 'var(--mh-text)', fontSize: 14, fontWeight: 600 }}>
            Recent Messages
          </p>
          <button
            onClick={() => navigate('/messages')}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--mh-muted)',
              fontSize: 13,
              fontFamily: 'var(--mh-font-body)',
            }}
          >
            View all →
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--mh-border)' }}>
                {['To', 'API Key', 'Status', 'Sent At'].map(h => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 24px',
                      textAlign: 'left',
                      color: 'var(--mh-muted)',
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentMessages.map((msg, i) => (
                <tr
                  key={msg.id}
                  style={{
                    borderBottom:
                      i < recentMessages.length - 1 ? '1px solid var(--mh-border)' : 'none',
                  }}
                >
                  <td
                    style={{
                      padding: '14px 24px',
                      fontFamily: 'var(--mh-font-mono)',
                      fontSize: 13,
                      color: 'var(--mh-text)',
                    }}
                  >
                    {msg.to}
                  </td>
                  <td style={{ padding: '14px 24px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--mh-font-mono)',
                        fontSize: 12,
                        color: 'var(--mh-muted)',
                        background: 'var(--mh-bg)',
                        border: '1px solid var(--mh-border)',
                        padding: '2px 7px',
                        borderRadius: 4,
                      }}
                    >
                      {msg.keyName}
                    </span>
                  </td>
                  <td style={{ padding: '14px 24px' }}>
                    <Badge status={msg.status} />
                  </td>
                  <td
                    style={{
                      padding: '14px 24px',
                      fontSize: 13,
                      color: 'var(--mh-muted)',
                    }}
                  >
                    {msg.sentAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

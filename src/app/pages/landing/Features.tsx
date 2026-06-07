import React from 'react'
import { Layers, Shield, CheckCircle2, Wifi, Bell, Server } from 'lucide-react'

const features = [
  {
    icon: <Layers size={22} />,
    title: 'Multi-SIM Support',
    desc: 'Route messages across multiple SIM cards on a single device. Load-balance traffic or assign SIMs per project to stay within carrier quotas.',
  },
  {
    icon: <Shield size={22} />,
    title: 'API Key Isolation',
    desc: 'Each API key operates in its own lane. Separate traffic, quotas, and delivery reports per project or client for clean accountability.',
  },
  {
    icon: <CheckCircle2 size={22} />,
    title: 'Delivery Receipts',
    desc: 'Real-time sent and delivered status via Android broadcast receivers. Know exactly when a message lands in the recipient\'s inbox.',
  },
  {
    icon: <Wifi size={22} />,
    title: 'WebSocket Agents',
    desc: 'Android phones maintain persistent live connections to the backend. Low-latency dispatch with no polling overhead on the device side.',
  },
  {
    icon: <Bell size={22} />,
    title: 'FCM Fallback',
    desc: 'Firebase Cloud Messaging wakes idle agents when a message needs sending. Zero battery drain during quiet periods, instant wake on demand.',
  },
  {
    icon: <Server size={22} />,
    title: 'Self-Hostable',
    desc: 'Deploy on your own infrastructure — bare metal, VPS, or Kubernetes. Own your data end-to-end with no vendor lock-in and no SLA surprises.',
  },
]

export function Features() {
  return (
    <div style={{ background: 'var(--mh-bg)', padding: '80px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 56, textAlign: 'center' }}>
          <h1
            style={{
              color: 'var(--mh-text)',
              fontWeight: 700,
              fontSize: 36,
              fontFamily: 'var(--mh-font-display)',
              letterSpacing: '-0.02em',
              marginBottom: 12,
            }}
          >
            Everything you need
          </h1>
          <p style={{ color: 'var(--mh-muted)', fontSize: 16 }}>
            A complete SMS gateway built on hardware you already own.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24,
          }}
        >
          {features.map(f => (
            <div
              key={f.title}
              style={{
                background: 'var(--mh-surface)',
                border: '1px solid var(--mh-border)',
                borderRadius: 10,
                padding: 28,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: 'var(--mh-bg)',
                  border: '1px solid var(--mh-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--mh-text)',
                  marginBottom: 16,
                }}
              >
                {f.icon}
              </div>
              <h3
                style={{
                  color: 'var(--mh-text)',
                  fontWeight: 600,
                  fontSize: 15,
                  fontFamily: 'var(--mh-font-display)',
                  marginBottom: 10,
                }}
              >
                {f.title}
              </h3>
              <p style={{ color: 'var(--mh-muted)', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

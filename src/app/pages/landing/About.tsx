import React from 'react'

const timeline = [
  {
    period: 'Q3 2023',
    title: 'The Idea',
    desc: 'Frustration with expensive carrier APIs and monthly contracts sparked the idea for an Android-based SMS gateway.',
  },
  {
    period: 'Q4 2023',
    title: 'First Prototype',
    desc: 'A working Android agent app that could receive HTTP requests and send real SMS messages via the device SIM.',
  },
  {
    period: 'Q2 2024',
    title: 'Beta Launch',
    desc: 'Public beta opened to 50 early adopters. First feedback loop on multi-SIM routing and delivery receipts.',
  },
  {
    period: 'Q4 2024',
    title: 'Stable v1.0',
    desc: 'Version 1.0 released. Persistent WebSocket agents, FCM fallback, and API key isolation shipped.',
  },
  {
    period: '2025 →',
    title: 'Growing',
    desc: 'Multi-device fleet management, dashboard analytics, and an open-source community forming around the project.',
  },
]

export function About() {
  return (
    <div style={{ background: 'var(--mh-bg)', padding: '80px 24px' }}>
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 64,
        }}
      >
        <div>
          <h1
            style={{
              color: 'var(--mh-text)',
              fontWeight: 700,
              fontSize: 36,
              fontFamily: 'var(--mh-font-display)',
              letterSpacing: '-0.02em',
              marginBottom: 24,
            }}
          >
            About MensaHERO
          </h1>
          <p
            style={{
              color: 'var(--mh-muted)',
              fontSize: 16,
              lineHeight: 1.7,
              marginBottom: 20,
            }}
          >
            MensaHERO exists because developers deserve access to real, reliable
            SMS infrastructure without being locked into expensive carrier APIs or
            virtual number pools. By using Android phones you already own, you
            route messages through real SIM cards — giving you full control over
            your sender identity and costs.
          </p>
          <p style={{ color: 'var(--mh-muted)', fontSize: 16, lineHeight: 1.7 }}>
            We believe critical infrastructure should be open, auditable, and
            self-hostable. MensaHERO is MIT-licensed. You can run it on your own
            servers, inspect every line of code, and never worry about a vendor
            changing pricing or shutting down.
          </p>
        </div>

        <div>
          <h2
            style={{
              color: 'var(--mh-text)',
              fontWeight: 600,
              fontSize: 18,
              fontFamily: 'var(--mh-font-display)',
              marginBottom: 32,
            }}
          >
            Project timeline
          </h2>

          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: 7,
                top: 8,
                bottom: 8,
                width: 1,
                background: 'var(--mh-border)',
              }}
            />

            {timeline.map((item, i) => (
              <div
                key={i}
                style={{ display: 'flex', gap: 20, marginBottom: i < timeline.length - 1 ? 28 : 0 }}
              >
                <div style={{ flexShrink: 0, paddingTop: 4 }}>
                  <div
                    style={{
                      width: 15,
                      height: 15,
                      borderRadius: '50%',
                      background: 'var(--mh-surface)',
                      border: '2px solid var(--mh-accent)',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  />
                </div>
                <div style={{ paddingBottom: 4 }}>
                  <p
                    style={{
                      color: 'var(--mh-muted)',
                      fontSize: 11,
                      fontFamily: 'var(--mh-font-mono)',
                      marginBottom: 4,
                      letterSpacing: '0.05em',
                    }}
                  >
                    {item.period}
                  </p>
                  <p
                    style={{
                      color: 'var(--mh-text)',
                      fontWeight: 600,
                      fontSize: 14,
                      marginBottom: 6,
                    }}
                  >
                    {item.title}
                  </p>
                  <p style={{ color: 'var(--mh-muted)', fontSize: 13, lineHeight: 1.5 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

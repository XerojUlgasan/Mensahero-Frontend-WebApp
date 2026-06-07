import React from 'react'
import { Link } from 'react-router'

export function LandingFooter() {
  return (
    <footer
      style={{
        background: 'var(--mh-surface)',
        borderTop: '1px solid var(--mh-border)',
        padding: '32px 24px',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--mh-font-mono)',
            fontWeight: 700,
            color: 'var(--mh-text)',
            fontSize: 15,
          }}
        >
          MensaHERO
        </span>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { to: '/about', label: 'About' },
            { to: '/features', label: 'Features' },
            { to: '/docs', label: 'Docs' },
            { to: '/contact', label: 'Contact' },
          ].map(link => (
            <Link
              key={link.to}
              to={link.to}
              style={{ color: 'var(--mh-muted)', textDecoration: 'none', fontSize: 13 }}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://github.com"
            style={{ color: 'var(--mh-muted)', textDecoration: 'none', fontSize: 13 }}
          >
            GitHub ↗
          </a>
        </div>
        <p style={{ color: 'var(--mh-muted)', fontSize: 12 }}>
          © 2026 MensaHERO. Open source.
        </p>
      </div>
    </footer>
  )
}

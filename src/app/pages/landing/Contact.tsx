import React, { useState } from 'react'

export function Contact() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--mh-bg)',
    border: '1px solid var(--mh-border)',
    borderRadius: 6,
    padding: '10px 12px',
    fontSize: 14,
    color: 'var(--mh-text)',
    fontFamily: 'var(--mh-font-body)',
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: 'var(--mh-text)',
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 6,
  }

  return (
    <div style={{ background: 'var(--mh-bg)', padding: '80px 24px' }}>
      <div
        style={{
          maxWidth: 1000,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
              marginBottom: 16,
            }}
          >
            Get in touch
          </h1>
          <p
            style={{
              color: 'var(--mh-muted)',
              fontSize: 16,
              lineHeight: 1.7,
              marginBottom: 32,
            }}
          >
            Have a question, a bug report, or want to contribute? Reach out — we'd love to hear from
            you.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <a
              href="https://github.com"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: 'var(--mh-text)',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: 'var(--mh-surface)',
                  border: '1px solid var(--mh-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                }}
              >
                ⭐
              </span>
              Star on GitHub ↗
            </a>
            <p style={{ color: 'var(--mh-muted)', fontSize: 13, lineHeight: 1.6 }}>
              MensaHERO is fully open source. Check the issues tracker for known bugs, or open a PR
              if you have a fix in mind.
            </p>
          </div>
        </div>

        <div>
          {sent ? (
            <div
              style={{
                background: 'var(--mh-surface)',
                border: '1px solid var(--mh-border)',
                borderRadius: 10,
                padding: 32,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
              <h3
                style={{
                  color: 'var(--mh-text)',
                  fontWeight: 600,
                  fontSize: 16,
                  marginBottom: 8,
                }}
              >
                Message sent
              </h3>
              <p style={{ color: 'var(--mh-muted)', fontSize: 14 }}>
                Thanks for reaching out. We'll get back to you soon.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{
                background: 'var(--mh-surface)',
                border: '1px solid var(--mh-border)',
                borderRadius: 10,
                padding: 28,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              <div>
                <label style={labelStyle}>Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Alex Rivera"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="alex@example.com"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Message</label>
                <textarea
                  required
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="I'd like to ask about..."
                  rows={5}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
              <button
                type="submit"
                style={{
                  background: 'var(--mh-accent)',
                  color: 'var(--mh-accent-fg)',
                  border: 'none',
                  borderRadius: 6,
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--mh-font-body)',
                  alignSelf: 'flex-start',
                }}
              >
                Send message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

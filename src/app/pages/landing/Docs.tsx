import React, { useState } from 'react'
import { CodeBlock } from '../../components/ui/CodeBlock'

const sections = [
  { id: 'authentication', label: 'Authentication' },
  { id: 'send-message', label: 'Send Message' },
  { id: 'list-messages', label: 'List Messages' },
  { id: 'webhooks', label: 'Webhooks' },
  { id: 'error-codes', label: 'Error Codes' },
]

function DocRow({ description, code }: { description: React.ReactNode; code: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 32,
        marginBottom: 48,
      }}
    >
      <div>{description}</div>
      <div>{code}</div>
    </div>
  )
}

export function Docs() {
  const [activeSection, setActiveSection] = useState('authentication')

  return (
    <div style={{ background: 'var(--mh-bg)' }}>
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '48px 24px',
          display: 'flex',
          gap: 48,
          alignItems: 'flex-start',
        }}
      >
        <aside
          style={{
            width: 180,
            minWidth: 180,
            position: 'sticky',
            top: 80,
            flexShrink: 0,
          }}
          className="hidden md:block"
        >
          <p
            style={{
              color: 'var(--mh-muted)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              marginBottom: 12,
              textTransform: 'uppercase',
            }}
          >
            Reference
          </p>
          {sections.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={() => setActiveSection(s.id)}
              style={{
                display: 'block',
                padding: '6px 0',
                color: activeSection === s.id ? 'var(--mh-text)' : 'var(--mh-muted)',
                fontWeight: activeSection === s.id ? 500 : 400,
                fontSize: 14,
                textDecoration: 'none',
                borderLeft: `2px solid ${activeSection === s.id ? 'var(--mh-accent)' : 'transparent'}`,
                paddingLeft: 12,
                marginLeft: -12,
              }}
            >
              {s.label}
            </a>
          ))}
        </aside>

        <main style={{ flex: 1, minWidth: 0 }}>
          <section id="authentication" style={{ marginBottom: 64 }}>
            <h2
              style={{
                color: 'var(--mh-text)',
                fontWeight: 700,
                fontSize: 24,
                fontFamily: 'var(--mh-font-display)',
                letterSpacing: '-0.01em',
                marginBottom: 8,
              }}
            >
              Authentication
            </h2>
            <p style={{ color: 'var(--mh-muted)', fontSize: 14, marginBottom: 24 }}>
              MensaHERO uses API keys for authentication. Pass your key in the{' '}
              <code
                style={{
                  fontFamily: 'var(--mh-font-mono)',
                  background: 'var(--mh-border)',
                  padding: '1px 5px',
                  borderRadius: 4,
                  fontSize: 13,
                }}
              >
                Authorization
              </code>{' '}
              header.
            </p>
            <DocRow
              description={
                <div>
                  <p
                    style={{ color: 'var(--mh-text)', fontSize: 14, fontWeight: 500, marginBottom: 8 }}
                  >
                    Bearer token
                  </p>
                  <p style={{ color: 'var(--mh-muted)', fontSize: 14, lineHeight: 1.6 }}>
                    All requests must include your API key prefixed with{' '}
                    <code
                      style={{
                        fontFamily: 'var(--mh-font-mono)',
                        background: 'var(--mh-border)',
                        padding: '1px 5px',
                        borderRadius: 4,
                        fontSize: 12,
                      }}
                    >
                      Bearer
                    </code>
                    . Keys are scoped per project and can be revoked at any time from the dashboard.
                  </p>
                </div>
              }
              code={
                <CodeBlock language="http">
                  <span style={{ color: '#79C0FF' }}>Authorization</span>
                  <span style={{ color: '#E6EDF3' }}>: Bearer </span>
                  <span style={{ color: '#A5D6FF' }}>sk-live-YOUR_API_KEY</span>
                </CodeBlock>
              }
            />
          </section>

          <section id="send-message" style={{ marginBottom: 64 }}>
            <h2
              style={{
                color: 'var(--mh-text)',
                fontWeight: 700,
                fontSize: 24,
                fontFamily: 'var(--mh-font-display)',
                letterSpacing: '-0.01em',
                marginBottom: 8,
              }}
            >
              Send Message
            </h2>
            <p style={{ color: 'var(--mh-muted)', fontSize: 14, marginBottom: 24 }}>
              Queue an SMS for delivery through your Android agent.
            </p>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--mh-surface)',
                border: '1px solid var(--mh-border)',
                borderRadius: 6,
                padding: '6px 12px',
                marginBottom: 24,
              }}
            >
              <span
                style={{
                  background: '#DCFCE7',
                  color: '#15803D',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontFamily: 'var(--mh-font-mono)',
                }}
              >
                POST
              </span>
              <code
                style={{
                  fontFamily: 'var(--mh-font-mono)',
                  fontSize: 13,
                  color: 'var(--mh-text)',
                }}
              >
                /v1/messages
              </code>
            </div>

            <DocRow
              description={
                <div>
                  <p
                    style={{ color: 'var(--mh-text)', fontSize: 14, fontWeight: 500, marginBottom: 12 }}
                  >
                    Request body
                  </p>
                  {[
                    { field: 'to', type: 'string', req: true, desc: 'Recipient phone number in E.164 format' },
                    { field: 'body', type: 'string', req: true, desc: 'SMS message content (max 160 chars per segment)' },
                    { field: 'key_id', type: 'string', req: false, desc: 'API key ID to use for sending. Defaults to your primary key.' },
                  ].map(p => (
                    <div
                      key={p.field}
                      style={{
                        display: 'flex',
                        gap: 8,
                        paddingBottom: 10,
                        marginBottom: 10,
                        borderBottom: '1px solid var(--mh-border)',
                      }}
                    >
                      <div style={{ minWidth: 80 }}>
                        <code
                          style={{
                            fontFamily: 'var(--mh-font-mono)',
                            fontSize: 12,
                            color: 'var(--mh-text)',
                          }}
                        >
                          {p.field}
                        </code>
                      </div>
                      <div>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
                          <span
                            style={{
                              fontSize: 11,
                              color: 'var(--mh-muted)',
                              fontFamily: 'var(--mh-font-mono)',
                            }}
                          >
                            {p.type}
                          </span>
                          {p.req && (
                            <span style={{ fontSize: 11, color: '#DC2626', fontWeight: 600 }}>required</span>
                          )}
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--mh-muted)' }}>{p.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              }
              code={
                <CodeBlock language="json">
                  <span style={{ color: '#8B949E' }}>{'// Request\n'}</span>
                  <span style={{ color: '#E6EDF3' }}>{'{\n  '}</span>
                  <span style={{ color: '#7EE787' }}>"to"</span>
                  <span style={{ color: '#E6EDF3' }}>{': '}</span>
                  <span style={{ color: '#A5D6FF' }}>"+639171234567"</span>
                  <span style={{ color: '#E6EDF3' }}>{',\n  '}</span>
                  <span style={{ color: '#7EE787' }}>"body"</span>
                  <span style={{ color: '#E6EDF3' }}>{': '}</span>
                  <span style={{ color: '#A5D6FF' }}>"Your OTP is 847291"</span>
                  <span style={{ color: '#E6EDF3' }}>{',\n  '}</span>
                  <span style={{ color: '#7EE787' }}>"key_id"</span>
                  <span style={{ color: '#E6EDF3' }}>{': '}</span>
                  <span style={{ color: '#A5D6FF' }}>"key_production"</span>
                  <span style={{ color: '#E6EDF3' }}>{'}\n\n'}</span>
                  <span style={{ color: '#8B949E' }}>{'// Response 201\n'}</span>
                  <span style={{ color: '#E6EDF3' }}>{'{\n  '}</span>
                  <span style={{ color: '#7EE787' }}>"id"</span>
                  <span style={{ color: '#E6EDF3' }}>{': '}</span>
                  <span style={{ color: '#A5D6FF' }}>"msg_01JX4K2M8RPTQZBN"</span>
                  <span style={{ color: '#E6EDF3' }}>{',\n  '}</span>
                  <span style={{ color: '#7EE787' }}>"status"</span>
                  <span style={{ color: '#E6EDF3' }}>{': '}</span>
                  <span style={{ color: '#A5D6FF' }}>"queued"</span>
                  <span style={{ color: '#E6EDF3' }}>{',\n  '}</span>
                  <span style={{ color: '#7EE787' }}>"to"</span>
                  <span style={{ color: '#E6EDF3' }}>{': '}</span>
                  <span style={{ color: '#A5D6FF' }}>"+639171234567"</span>
                  <span style={{ color: '#E6EDF3' }}>{'}'}</span>
                </CodeBlock>
              }
            />
          </section>

          <section id="list-messages" style={{ marginBottom: 64 }}>
            <h2
              style={{
                color: 'var(--mh-text)',
                fontWeight: 700,
                fontSize: 24,
                fontFamily: 'var(--mh-font-display)',
                letterSpacing: '-0.01em',
                marginBottom: 8,
              }}
            >
              List Messages
            </h2>
            <p style={{ color: 'var(--mh-muted)', fontSize: 14, marginBottom: 24 }}>
              Retrieve a paginated list of sent messages, optionally filtered by status or recipient.
            </p>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--mh-surface)',
                border: '1px solid var(--mh-border)',
                borderRadius: 6,
                padding: '6px 12px',
                marginBottom: 24,
              }}
            >
              <span
                style={{
                  background: '#DBEAFE',
                  color: '#1D4ED8',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontFamily: 'var(--mh-font-mono)',
                }}
              >
                GET
              </span>
              <code
                style={{
                  fontFamily: 'var(--mh-font-mono)',
                  fontSize: 13,
                  color: 'var(--mh-text)',
                }}
              >
                /v1/messages
              </code>
            </div>

            <DocRow
              description={
                <div>
                  <p style={{ color: 'var(--mh-muted)', fontSize: 14, lineHeight: 1.6 }}>
                    Returns up to 50 messages per page. Use{' '}
                    <code
                      style={{
                        fontFamily: 'var(--mh-font-mono)',
                        background: 'var(--mh-border)',
                        padding: '1px 5px',
                        borderRadius: 4,
                        fontSize: 12,
                      }}
                    >
                      cursor
                    </code>{' '}
                    for pagination. Filter by{' '}
                    <code
                      style={{
                        fontFamily: 'var(--mh-font-mono)',
                        background: 'var(--mh-border)',
                        padding: '1px 5px',
                        borderRadius: 4,
                        fontSize: 12,
                      }}
                    >
                      status
                    </code>{' '}
                    or{' '}
                    <code
                      style={{
                        fontFamily: 'var(--mh-font-mono)',
                        background: 'var(--mh-border)',
                        padding: '1px 5px',
                        borderRadius: 4,
                        fontSize: 12,
                      }}
                    >
                      to
                    </code>
                    .
                  </p>
                </div>
              }
              code={
                <CodeBlock language="bash">
                  <span style={{ color: '#79C0FF' }}>curl</span>
                  <span style={{ color: '#E6EDF3' }}>
                    {
                      ' "https://api.mensahero.io/v1/messages\n     ?status=delivered&limit=20" \\\n  '
                    }
                  </span>
                  <span style={{ color: '#E6EDF3' }}>{'-H '}</span>
                  <span style={{ color: '#A5D6FF' }}>"Authorization: Bearer sk-live-••••••••"</span>
                </CodeBlock>
              }
            />
          </section>

          <section id="webhooks" style={{ marginBottom: 64 }}>
            <h2
              style={{
                color: 'var(--mh-text)',
                fontWeight: 700,
                fontSize: 24,
                fontFamily: 'var(--mh-font-display)',
                letterSpacing: '-0.01em',
                marginBottom: 8,
              }}
            >
              Webhooks
            </h2>
            <p style={{ color: 'var(--mh-muted)', fontSize: 14, marginBottom: 24 }}>
              MensaHERO sends a POST request to your configured URL whenever a message status changes.
            </p>

            <DocRow
              description={
                <div>
                  <p style={{ color: 'var(--mh-muted)', fontSize: 14, lineHeight: 1.6 }}>
                    Subscribe to status updates by configuring a webhook URL in your API key settings.
                    Each event contains a full message object with the updated status field.
                  </p>
                </div>
              }
              code={
                <CodeBlock language="json">
                  <span style={{ color: '#8B949E' }}>{'// POST https://your-app.com/webhook\n'}</span>
                  <span style={{ color: '#E6EDF3' }}>{'{\n  '}</span>
                  <span style={{ color: '#7EE787' }}>"event"</span>
                  <span style={{ color: '#E6EDF3' }}>{': '}</span>
                  <span style={{ color: '#A5D6FF' }}>"message.delivered"</span>
                  <span style={{ color: '#E6EDF3' }}>{',\n  '}</span>
                  <span style={{ color: '#7EE787' }}>"message"</span>
                  <span style={{ color: '#E6EDF3' }}>
                    {': {\n    '}
                  </span>
                  <span style={{ color: '#7EE787' }}>"id"</span>
                  <span style={{ color: '#E6EDF3' }}>{': '}</span>
                  <span style={{ color: '#A5D6FF' }}>"msg_01JX4K2M8RPTQZBN"</span>
                  <span style={{ color: '#E6EDF3' }}>{',\n    '}</span>
                  <span style={{ color: '#7EE787' }}>"status"</span>
                  <span style={{ color: '#E6EDF3' }}>{': '}</span>
                  <span style={{ color: '#A5D6FF' }}>"delivered"</span>
                  <span style={{ color: '#E6EDF3' }}>{'  \n  }\n}'}</span>
                </CodeBlock>
              }
            />
          </section>

          <section id="error-codes">
            <h2
              style={{
                color: 'var(--mh-text)',
                fontWeight: 700,
                fontSize: 24,
                fontFamily: 'var(--mh-font-display)',
                letterSpacing: '-0.01em',
                marginBottom: 8,
              }}
            >
              Error Codes
            </h2>
            <p style={{ color: 'var(--mh-muted)', fontSize: 14, marginBottom: 24 }}>
              MensaHERO uses standard HTTP status codes. Errors include a machine-readable code and a human message.
            </p>

            <div
              style={{
                background: 'var(--mh-surface)',
                border: '1px solid var(--mh-border)',
                borderRadius: 10,
                overflow: 'hidden',
              }}
            >
              {[
                { code: '400', name: 'bad_request', desc: 'Missing or invalid request parameters.' },
                { code: '401', name: 'unauthorized', desc: 'API key is missing or invalid.' },
                { code: '403', name: 'forbidden', desc: 'API key is revoked or lacks permission.' },
                { code: '404', name: 'not_found', desc: 'The requested resource does not exist.' },
                { code: '429', name: 'rate_limited', desc: 'Too many requests. Retry after the returned backoff.' },
                { code: '503', name: 'no_agent', desc: 'No Android agent is online for this key.' },
              ].map((e, i) => (
                <div
                  key={e.code}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '14px 20px',
                    borderBottom: i < 5 ? '1px solid var(--mh-border)' : 'none',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--mh-font-mono)',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--mh-red)',
                      minWidth: 40,
                    }}
                  >
                    {e.code}
                  </span>
                  <code
                    style={{
                      fontFamily: 'var(--mh-font-mono)',
                      fontSize: 12,
                      color: 'var(--mh-muted)',
                      minWidth: 120,
                    }}
                  >
                    {e.name}
                  </code>
                  <p style={{ fontSize: 13, color: 'var(--mh-muted)' }}>{e.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

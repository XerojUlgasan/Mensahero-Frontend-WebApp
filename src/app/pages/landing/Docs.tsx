import React, { useState } from 'react'
import { CodeBlock } from '../../components/ui/CodeBlock'

const sections = [
  { id: 'create-message', label: 'Create Message' },
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
  const [activeSection, setActiveSection] = useState('create-message')

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
          <section id="create-message" style={{ marginBottom: 64 }}>
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
              Create Message
            </h2>
            <p style={{ color: 'var(--mh-muted)', fontSize: 14, marginBottom: 24 }}>
              Send an SMS message through your Server API and let our SMS gateway app handle the rest!
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
                /api/messages/create
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
                    { field: 'apiKey', type: 'string', req: true, desc: 'Your MensaHERO API key' },
                    { field: 'to', type: 'string', req: true, desc: 'Recipient phone number in E.164 format (e.g., +639123123123)' },
                    { field: 'message', type: 'string', req: true, desc: 'SMS message content to send' },
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
                <CodeBlock language="bash">
                  <span style={{ color: '#79C0FF' }}>curl</span>
                  <span style={{ color: '#E6EDF3' }}>{" --location '"}</span>
                  <span style={{ color: '#A5D6FF' }}>https://mensahero.onrender.com/api/messages/create</span>
                  <span style={{ color: '#E6EDF3' }}>{"' \\\n"}</span>
                  <span style={{ color: '#79C0FF' }}>--header</span>
                  <span style={{ color: '#E6EDF3' }}>{" '"}</span>
                  <span style={{ color: '#A5D6FF' }}>Content-Type: application/json</span>
                  <span style={{ color: '#E6EDF3' }}>{"' \\\n"}</span>
                  <span style={{ color: '#79C0FF' }}>--data</span>
                  <span style={{ color: '#E6EDF3' }}>{" '{\n  "}</span>
                  <span style={{ color: '#7EE787' }}>"apiKey"</span>
                  <span style={{ color: '#E6EDF3' }}>{": "}</span>
                  <span style={{ color: '#A5D6FF' }}>"YOUR_API_KEY"</span>
                  <span style={{ color: '#E6EDF3' }}>{",\n  "}</span>
                  <span style={{ color: '#7EE787' }}>"to"</span>
                  <span style={{ color: '#E6EDF3' }}>{": "}</span>
                  <span style={{ color: '#A5D6FF' }}>"+639123123123"</span>
                  <span style={{ color: '#E6EDF3' }}>{",\n  "}</span>
                  <span style={{ color: '#7EE787' }}>"message"</span>
                  <span style={{ color: '#E6EDF3' }}>{": "}</span>
                  <span style={{ color: '#A5D6FF' }}>"YOUR_MESSAGE"</span>
                  <span style={{ color: '#E6EDF3' }}>{"\n}'"}</span>
                </CodeBlock>
              }
            />

            <DocRow
              description={
                <div>
                  <p
                    style={{ color: 'var(--mh-text)', fontSize: 14, fontWeight: 500, marginBottom: 12 }}
                  >
                    Response
                  </p>
                  <p style={{ color: 'var(--mh-muted)', fontSize: 14, lineHeight: 1.6 }}>
                    Returns the created message object with a unique ID and initial status.
                  </p>
                </div>
              }
              code={
                <CodeBlock language="json">
                  <span style={{ color: '#E6EDF3' }}>{'{\n    '}</span>
                  <span style={{ color: '#7EE787' }}>"message"</span>
                  <span style={{ color: '#E6EDF3' }}>{': '}</span>
                  <span style={{ color: '#A5D6FF' }}>"YOUR_MESSAGE"</span>
                  <span style={{ color: '#E6EDF3' }}>{',\n    '}</span>
                  <span style={{ color: '#7EE787' }}>"receiver"</span>
                  <span style={{ color: '#E6EDF3' }}>{': '}</span>
                  <span style={{ color: '#A5D6FF' }}>"+639123123123"</span>
                  <span style={{ color: '#E6EDF3' }}>{',\n    '}</span>
                  <span style={{ color: '#7EE787' }}>"sender"</span>
                  <span style={{ color: '#E6EDF3' }}>{': '}</span>
                  <span style={{ color: '#FF7B72' }}>null</span>
                  <span style={{ color: '#E6EDF3' }}>{',\n    '}</span>
                  <span style={{ color: '#7EE787' }}>"api_id"</span>
                  <span style={{ color: '#E6EDF3' }}>{': '}</span>
                  <span style={{ color: '#A5D6FF' }}>"ec674b6b-22e9-4aa1-be1b-c709e835375d"</span>
                  <span style={{ color: '#E6EDF3' }}>{',\n    '}</span>
                  <span style={{ color: '#7EE787' }}>"created_at"</span>
                  <span style={{ color: '#E6EDF3' }}>{': '}</span>
                  <span style={{ color: '#FF7B72' }}>null</span>
                  <span style={{ color: '#E6EDF3' }}>{',\n    '}</span>
                  <span style={{ color: '#7EE787' }}>"id"</span>
                  <span style={{ color: '#E6EDF3' }}>{': '}</span>
                  <span style={{ color: '#A5D6FF' }}>"7d4a35d9-4048-4eb8-be24-28a248b9e7eb"</span>
                  <span style={{ color: '#E6EDF3' }}>{',\n    '}</span>
                  <span style={{ color: '#7EE787' }}>"sent_at"</span>
                  <span style={{ color: '#E6EDF3' }}>{': '}</span>
                  <span style={{ color: '#FF7B72' }}>null</span>
                  <span style={{ color: '#E6EDF3' }}>{',\n    '}</span>
                  <span style={{ color: '#7EE787' }}>"status"</span>
                  <span style={{ color: '#E6EDF3' }}>{': '}</span>
                  <span style={{ color: '#A5D6FF' }}>"pending"</span>
                  <span style={{ color: '#E6EDF3' }}>{'\n}'}</span>
                </CodeBlock>
              }
            />
          </section>
        </main>
      </div>
    </div>
  )
}

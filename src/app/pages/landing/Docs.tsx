import React, { useState } from 'react'
import { CodeBlock } from '../../components/ui/CodeBlock'
import { docsConfig, languages, type LanguageId } from '../../data/docs-config'

const sections = docsConfig.map(s => ({ id: s.id, label: s.label }))

function LanguageTabs({
  selectedLanguage,
  onLanguageChange,
}: {
  selectedLanguage: LanguageId
  onLanguageChange: (lang: LanguageId) => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        background: 'var(--mh-surface)',
        border: '1px solid var(--mh-border)',
        borderRadius: 6,
        padding: 4,
        marginBottom: 16,
      }}
    >
      {languages.map(lang => (
        <button
          key={lang.id}
          onClick={() => onLanguageChange(lang.id)}
          style={{
            padding: '6px 12px',
            fontSize: 13,
            fontWeight: 500,
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            background: selectedLanguage === lang.id ? 'var(--mh-accent)' : 'transparent',
            color: selectedLanguage === lang.id ? '#fff' : 'var(--mh-muted)',
            transition: 'all 0.15s ease',
          }}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}

function DocRow({ description, code, languageTabs }: { description: React.ReactNode; code: React.ReactNode; languageTabs?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 48 }}>
      {languageTabs}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 32,
        }}
      >
        <div>{description}</div>
        <div>{code}</div>
      </div>
    </div>
  )
}

export function Docs() {
  const [activeSection, setActiveSection] = useState('create-message')
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageId>('curl')

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
          {docsConfig.map(section => (
            <section key={section.id} id={section.id} style={{ marginBottom: 64 }}>
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
                {section.label}
              </h2>
              <p style={{ color: 'var(--mh-muted)', fontSize: 14, marginBottom: 24 }}>
                {section.description}
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
                  {section.method}
                </span>
                <code
                  style={{
                    fontFamily: 'var(--mh-font-mono)',
                    fontSize: 13,
                    color: 'var(--mh-text)',
                  }}
                >
                  {section.endpoint}
                </code>
              </div>

              {section.examples.map(example => {
                const exampleData = example.examples[selectedLanguage]
                return (
                  <DocRow
                    key={example.label}
                    languageTabs={
                      <LanguageTabs
                        selectedLanguage={selectedLanguage}
                        onLanguageChange={setSelectedLanguage}
                      />
                    }
                    description={
                      <div>
                        <p
                          style={{ color: 'var(--mh-text)', fontSize: 14, fontWeight: 500, marginBottom: 12 }}
                        >
                          {example.label}
                        </p>
                        {example.fields && (
                          example.fields.map(field => (
                            <div
                              key={field.field}
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
                                  {field.field}
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
                                    {field.type}
                                  </span>
                                  {field.required && (
                                    <span style={{ fontSize: 11, color: '#DC2626', fontWeight: 600 }}>required</span>
                                  )}
                                </div>
                                <p style={{ fontSize: 13, color: 'var(--mh-muted)' }}>{field.description}</p>
                              </div>
                            </div>
                          ))
                        )}
                        {!example.fields && exampleData.description && (
                          <p style={{ color: 'var(--mh-muted)', fontSize: 14, lineHeight: 1.6 }}>
                            {exampleData.description}
                          </p>
                        )}
                      </div>
                    }
                    code={<CodeBlock language={exampleData.language}>{exampleData.code}</CodeBlock>}
                  />
                )
              })}
            </section>
          ))}
        </main>
      </div>
    </div>
  )
}

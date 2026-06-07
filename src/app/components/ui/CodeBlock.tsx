import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CodeBlockProps {
  children: React.ReactNode
  code?: string
  language?: string
}

export function CodeBlock({ children, code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const text = code ?? (typeof children === 'string' ? children : '')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div
      style={{
        position: 'relative',
        background: '#0D1117',
        border: '1px solid #30363D',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: '#161B22',
          borderBottom: '1px solid #30363D',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
          {language && (
            <span style={{ marginLeft: 8, color: '#8B949E', fontSize: 11, fontFamily: 'var(--mh-font-mono)' }}>
              {language}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: copied ? '#28C840' : '#8B949E',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 12,
            fontFamily: 'var(--mh-font-body)',
            padding: '2px 6px',
            borderRadius: 4,
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre
        style={{
          padding: '20px 24px',
          overflow: 'auto',
          fontFamily: 'var(--mh-font-mono)',
          fontSize: 13,
          lineHeight: 1.7,
          color: '#E6EDF3',
          margin: 0,
        }}
      >
        {children}
      </pre>
    </div>
  )
}

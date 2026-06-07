import React from 'react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
}

export function StatCard({ title, value, subtitle, icon }: StatCardProps) {
  return (
    <div
      style={{
        background: 'var(--mh-surface)',
        border: '1px solid var(--mh-border)',
        borderRadius: 10,
        padding: 24,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: 'var(--mh-muted)', fontSize: 13, marginBottom: 8 }}>{title}</p>
          <p
            style={{
              color: 'var(--mh-text)',
              fontSize: 28,
              fontWeight: 600,
              fontFamily: 'var(--mh-font-display)',
              lineHeight: 1,
            }}
          >
            {value}
          </p>
          {subtitle && (
            <p style={{ color: 'var(--mh-muted)', fontSize: 12, marginTop: 6 }}>{subtitle}</p>
          )}
        </div>
        {icon && (
          <div style={{ color: 'var(--mh-muted)', opacity: 0.5, marginTop: 2 }}>{icon}</div>
        )}
      </div>
    </div>
  )
}

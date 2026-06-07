import React from 'react'
import type { MessageStatus, KeyStatus } from '../../data/demo'

type BadgeStatus = MessageStatus | KeyStatus

const config: Record<BadgeStatus, { label: string; bg: string; color: string; dot: string }> = {
  delivered: { label: 'Delivered', bg: '#DCFCE7', color: '#15803D', dot: '#16A34A' },
  pending: { label: 'Pending', bg: '#FEF9C3', color: '#A16207', dot: '#D97706' },
  failed: { label: 'Failed', bg: '#FEE2E2', color: '#B91C1C', dot: '#DC2626' },
  active: { label: 'Active', bg: '#DCFCE7', color: '#15803D', dot: '#16A34A' },
  revoked: { label: 'Revoked', bg: '#FEE2E2', color: '#B91C1C', dot: '#DC2626' },
}

export function Badge({ status }: { status: BadgeStatus }) {
  const c = config[status]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: c.bg,
        color: c.color,
        borderRadius: 6,
        padding: '2px 8px',
        fontSize: 12,
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: c.dot,
          flexShrink: 0,
        }}
      />
      {c.label}
    </span>
  )
}

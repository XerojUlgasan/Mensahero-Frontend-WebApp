import React from 'react'
import { NavLink, Link } from 'react-router'
import { LayoutDashboard, MessageSquare, Key, User, Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { demoUser } from '../../data/demo'

const navItems = [
  { to: '/dashboard', label: 'Overview', Icon: LayoutDashboard },
  { to: '/messages', label: 'Messages', Icon: MessageSquare },
  { to: '/api-keys', label: 'API Keys', Icon: Key },
  { to: '/account', label: 'Account', Icon: User },
]

export function Sidebar() {
  const { theme, toggle } = useTheme()

  return (
    <div
      style={{
        width: 240,
        minWidth: 240,
        height: '100vh',
        background: 'var(--mh-surface)',
        borderRight: '1px solid var(--mh-border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
      }}
    >
      <div
        style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--mh-border)',
        }}
      >
        <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              color: 'var(--mh-text)',
              fontFamily: 'var(--mh-font-mono)',
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            MensaHERO
          </span>
          <span
            style={{
              background: 'var(--mh-border)',
              color: 'var(--mh-muted)',
              fontSize: 10,
              fontWeight: 600,
              padding: '1px 6px',
              borderRadius: 4,
              letterSpacing: '0.05em',
            }}
          >
            BETA
          </span>
        </Link>
      </div>

      <nav style={{ flex: 1, padding: '12px 10px' }}>
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 6,
              marginBottom: 2,
              textDecoration: 'none',
              color: isActive ? 'var(--mh-text)' : 'var(--mh-muted)',
              fontWeight: isActive ? 600 : 400,
              background: isActive ? 'var(--mh-bg)' : 'transparent',
              fontSize: 14,
            })}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '10px 10px', borderTop: '1px solid var(--mh-border)' }}>
        <button
          onClick={toggle}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--mh-muted)',
            fontSize: 13,
            padding: '7px 12px',
            borderRadius: 6,
            width: '100%',
            fontFamily: 'var(--mh-font-body)',
          }}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 12px',
            marginTop: 2,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--mh-accent)',
              color: 'var(--mh-accent-fg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              flexShrink: 0,
              letterSpacing: '0.05em',
            }}
          >
            {demoUser.initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                color: 'var(--mh-text)',
                fontSize: 13,
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {demoUser.name}
            </p>
            <p style={{ color: 'var(--mh-muted)', fontSize: 11 }}>{demoUser.role}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

import React from 'react'
import { Outlet } from 'react-router'
import { LandingNav } from './LandingNav'
import { LandingFooter } from './LandingFooter'

export function LandingLayout() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--mh-bg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <LandingNav />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <LandingFooter />
    </div>
  )
}

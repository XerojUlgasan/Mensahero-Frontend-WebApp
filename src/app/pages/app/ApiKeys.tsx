import React, { useState } from 'react'
import { Eye, EyeOff, Copy, Check, Trash2, Plus, X } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { apiKeys as initialKeys } from '../../data/demo'
import type { ApiKey } from '../../data/demo'

let nextId = 10

function generateKey(name: string): ApiKey {
  const rand = Math.random().toString(36).substring(2, 10)
  const suffix = Math.random().toString(36).substring(2, 6)
  return {
    id: `key_${nextId++}`,
    name,
    maskedValue: `sk-live-••••••••••••${suffix}`,
    fullValue: `sk-live-${rand}${suffix}`,
    created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    lastUsed: 'never',
    status: 'active',
  }
}

export function ApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [justCreated, setJustCreated] = useState<ApiKey | null>(null)
  const [revealedIds, setRevealedIds] = useState(new Set<string>())
  const [copiedIds, setCopiedIds] = useState(new Set<string>())
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleCreate = () => {
    if (!newName.trim()) return
    const key = generateKey(newName.trim())
    setKeys(prev => [key, ...prev])
    setJustCreated(key)
    setNewName('')
    setShowCreate(false)
  }

  const toggleReveal = (id: string) => {
    setRevealedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleCopy = (id: string, value: string) => {
    navigator.clipboard.writeText(value)
    setCopiedIds(prev => new Set(prev).add(id))
    setTimeout(() => setCopiedIds(prev => { const n = new Set(prev); n.delete(id); return n }), 1500)
  }

  const handleDelete = (id: string) => {
    setKeys(prev => prev.filter(k => k.id !== id))
    setDeletingId(null)
    if (justCreated?.id === id) setJustCreated(null)
  }

  const btnBase: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '5px 8px',
    borderRadius: 5,
    display: 'flex',
    alignItems: 'center',
    color: 'var(--mh-muted)',
    fontFamily: 'var(--mh-font-body)',
  }

  return (
    <div style={{ padding: 32 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div>
          <h2
            style={{
              color: 'var(--mh-text)',
              fontWeight: 700,
              fontSize: 20,
              fontFamily: 'var(--mh-font-display)',
            }}
          >
            API Keys
          </h2>
          <p style={{ color: 'var(--mh-muted)', fontSize: 13, marginTop: 4 }}>
            Manage your access credentials
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setJustCreated(null) }}
          style={{
            background: 'var(--mh-accent)',
            color: 'var(--mh-accent-fg)',
            border: 'none',
            borderRadius: 6,
            padding: '9px 16px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'var(--mh-font-body)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Plus size={15} /> Create New Key
        </button>
      </div>

      {showCreate && (
        <div
          style={{
            background: 'var(--mh-surface)',
            border: '1px solid var(--mh-border)',
            borderRadius: 10,
            padding: 24,
            marginBottom: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <p style={{ color: 'var(--mh-text)', fontWeight: 600, fontSize: 14 }}>New API Key</p>
            <button onClick={() => setShowCreate(false)} style={{ ...btnBase }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', color: 'var(--mh-muted)', fontSize: 12, marginBottom: 6 }}>
                Key name
              </label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="e.g. Mobile App v2"
                autoFocus
                style={{
                  width: '100%',
                  background: 'var(--mh-bg)',
                  border: '1px solid var(--mh-border)',
                  borderRadius: 6,
                  padding: '9px 12px',
                  fontSize: 14,
                  color: 'var(--mh-text)',
                  fontFamily: 'var(--mh-font-body)',
                  outline: 'none',
                }}
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              style={{
                background: newName.trim() ? 'var(--mh-accent)' : 'var(--mh-border)',
                color: newName.trim() ? 'var(--mh-accent-fg)' : 'var(--mh-muted)',
                border: 'none',
                borderRadius: 6,
                padding: '9px 18px',
                fontSize: 14,
                fontWeight: 500,
                cursor: newName.trim() ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--mh-font-body)',
              }}
            >
              Create
            </button>
          </div>
        </div>
      )}

      {justCreated && (
        <div
          style={{
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: 10,
            padding: '16px 20px',
            marginBottom: 20,
          }}
        >
          <p style={{ color: '#15803D', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
            Key created — copy it now. It won't be shown again.
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: '#DCFCE7',
              border: '1px solid #BBF7D0',
              borderRadius: 6,
              padding: '8px 14px',
            }}
          >
            <code
              style={{
                fontFamily: 'var(--mh-font-mono)',
                fontSize: 13,
                color: '#15803D',
                flex: 1,
              }}
            >
              {justCreated.fullValue}
            </code>
            <button
              onClick={() => handleCopy('created', justCreated.fullValue)}
              style={{ ...btnBase, color: copiedIds.has('created') ? '#15803D' : '#6B7280' }}
            >
              {copiedIds.has('created') ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
        </div>
      )}

      {keys.length === 0 ? (
        <div
          style={{
            background: 'var(--mh-surface)',
            border: '1px solid var(--mh-border)',
            borderRadius: 10,
            padding: '48px 24px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔑</div>
          <p style={{ color: 'var(--mh-text)', fontWeight: 600, fontSize: 15, marginBottom: 8 }}>
            No API keys yet
          </p>
          <p style={{ color: 'var(--mh-muted)', fontSize: 14, marginBottom: 20 }}>
            Create your first API key to start sending messages
          </p>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              background: 'var(--mh-accent)',
              color: 'var(--mh-accent-fg)',
              border: 'none',
              borderRadius: 6,
              padding: '9px 18px',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'var(--mh-font-body)',
            }}
          >
            Create a key
          </button>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--mh-surface)',
            border: '1px solid var(--mh-border)',
            borderRadius: 10,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          {keys.map((key, i) => (
            <div
              key={key.id}
              style={{
                padding: '20px 24px',
                borderBottom: i < keys.length - 1 ? '1px solid var(--mh-border)' : 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ color: 'var(--mh-text)', fontWeight: 600, fontSize: 14 }}>
                      {key.name}
                    </span>
                    <Badge status={key.status} />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'var(--mh-bg)',
                      border: '1px solid var(--mh-border)',
                      borderRadius: 6,
                      padding: '7px 12px',
                      marginBottom: 10,
                      maxWidth: 420,
                    }}
                  >
                    <code
                      style={{
                        fontFamily: 'var(--mh-font-mono)',
                        fontSize: 12,
                        color: 'var(--mh-text)',
                        flex: 1,
                      }}
                    >
                      {revealedIds.has(key.id) ? key.fullValue : key.maskedValue}
                    </code>
                    <button
                      onClick={() => toggleReveal(key.id)}
                      style={{ ...btnBase, padding: '2px 4px' }}
                      title={revealedIds.has(key.id) ? 'Hide' : 'Reveal'}
                    >
                      {revealedIds.has(key.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      onClick={() =>
                        handleCopy(
                          key.id,
                          revealedIds.has(key.id) ? key.fullValue : key.maskedValue,
                        )
                      }
                      style={{ ...btnBase, padding: '2px 4px', color: copiedIds.has(key.id) ? 'var(--mh-green)' : 'var(--mh-muted)' }}
                      title="Copy"
                    >
                      {copiedIds.has(key.id) ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 20 }}>
                    <span style={{ color: 'var(--mh-muted)', fontSize: 12 }}>
                      Created {key.created}
                    </span>
                    <span style={{ color: 'var(--mh-muted)', fontSize: 12 }}>
                      Last used {key.lastUsed}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {deletingId === key.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'var(--mh-muted)', fontSize: 12 }}>Are you sure?</span>
                      <button
                        onClick={() => handleDelete(key.id)}
                        style={{
                          background: 'var(--mh-red)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 5,
                          padding: '4px 10px',
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer',
                          fontFamily: 'var(--mh-font-body)',
                        }}
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--mh-border)',
                          borderRadius: 5,
                          padding: '4px 10px',
                          fontSize: 12,
                          cursor: 'pointer',
                          color: 'var(--mh-muted)',
                          fontFamily: 'var(--mh-font-body)',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingId(key.id)}
                      style={{ ...btnBase }}
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

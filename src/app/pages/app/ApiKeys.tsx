import React, { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Copy, Check, Trash2, Plus, X, Pencil, Smartphone } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { useAuth } from "../../context/AuthContext";
import {
  createCacheKey,
  fetchJson,
  formatDateLabel,
  getApiBaseUrl,
  hasDataChanged,
  maskSecret,
  readCachedJson,
  writeCachedJson,
} from "../../lib/api";

interface RetrievedApiKey {
  created_at: string | null;
  expires_at: string | null;
  id: string;
  last_used: string | null;
  name: string;
  owner_id: string;
  status: string;
}

interface Device {
  id: string;
  apiId: string;
  deviceName: string;
  fcm_token: string;
  isActive: boolean;
  last_used: string;
  created_at: string;
  updated_at: string;
  ownerId: string;
}

const modalOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
};

const modalBox: React.CSSProperties = {
  background: "var(--mh-surface)",
  border: "1px solid var(--mh-border)",
  borderRadius: 12,
  padding: 28,
  width: 420,
  boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
};

export function ApiKeys() {
  const { session } = useAuth();
  const [keys, setKeys] = useState<RetrievedApiKey[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [justCreated, setJustCreated] = useState<RetrievedApiKey | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, string>>({});
  const [copiedIds, setCopiedIds] = useState(new Set<string>());

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<RetrievedApiKey | null>(null);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState<RetrievedApiKey | null>(null);
  const [editName, setEditName] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  // Devices modal
  const [devicesTarget, setDevicesTarget] = useState<RetrievedApiKey | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);

  // Device edit modal
  const [editDeviceTarget, setEditDeviceTarget] = useState<Device | null>(null);
  const [editDeviceName, setEditDeviceName] = useState("");
  const [editDeviceActive, setEditDeviceActive] = useState(true);
  const [updatingDevice, setUpdatingDevice] = useState(false);

  // Device delete
  const [deleteDeviceTarget, setDeleteDeviceTarget] = useState<Device | null>(null);
  const [deletingDevice, setDeletingDevice] = useState(false);

  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!session) return;

    const cacheKey = createCacheKey("api-keys-retrieve", session);
    const cached = readCachedJson<RetrievedApiKey[]>(cacheKey);

    if (cached && !hydratedRef.current) {
      setKeys(cached);
      hydratedRef.current = true;
    }

    let cancelled = false;

    const loadKeys = async () => {
      try {
        const next = await fetchJson<RetrievedApiKey[]>(session, "/api/keys/retrieve");
        if (cancelled) return;
        writeCachedJson(cacheKey, next);
        if (hasDataChanged(cached, next) || !hydratedRef.current) {
          setKeys(next);
          hydratedRef.current = true;
        }
      } catch (error) {
        if (!cached) console.error("Failed to load API keys:", error);
      }
    };

    void loadKeys();
    return () => { cancelled = true; };
  }, [session?.access_token, session?.user?.id]);

  function updateCache(next: RetrievedApiKey[]) {
    if (!session) return;
    writeCachedJson(createCacheKey("api-keys-retrieve", session), next);
  }

  const handleCreate = async () => {
    if (!session || !newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/keys/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      const created = (await res.json()) as RetrievedApiKey & { key: string };
      const next = [created, ...keys];
      setKeys(next);
      updateCache(next);
      setJustCreated(created);
      setRevealedKeys((prev) => ({ ...prev, [created.id]: created.key }));
      setNewName("");
      setShowCreate(false);
    } catch (e) {
      console.error("Failed to create key:", e);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!session || !editTarget) return;
    setUpdating(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/keys/update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          keyId: editTarget.id,
          name: editName.trim(),
          status: editStatus,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = (await res.json()) as RetrievedApiKey;
      const next = keys.map((k) => (k.id === updated.id ? updated : k));
      setKeys(next);
      updateCache(next);
      setEditTarget(null);
    } catch (e) {
      console.error("Failed to update key:", e);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!session || !deleteTarget || deleteInput !== deleteTarget.id) return;
    setDeleting(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/keys/delete/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const next = keys.filter((k) => k.id !== deleteTarget.id);
      setKeys(next);
      updateCache(next);
      if (justCreated?.id === deleteTarget.id) setJustCreated(null);
      setDeleteTarget(null);
      setDeleteInput("");
    } catch (e) {
      console.error("Failed to delete key:", e);
    } finally {
      setDeleting(false);
    }
  };

  const toggleReveal = async (id: string) => {
    if (revealedKeys[id]) {
      setRevealedKeys((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }

    if (!session) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/keys/retrieve/${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { key: string };
      setRevealedKeys((prev) => ({ ...prev, [id]: data.key }));
    } catch (error) {
      console.error("Failed to reveal key:", error);
    }
  };

  const handleCopy = (id: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedIds((prev) => new Set(prev).add(id));
    setTimeout(() =>
      setCopiedIds((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      }), 1500,
    );
  };

  const loadDevices = async (apiKeyId: string) => {
    if (!session) return;
    setLoadingDevices(true);
    try {
      const cacheKey = createCacheKey(`devices-${apiKeyId}`, session);
      const cached = readCachedJson<Device[]>(cacheKey);
      if (cached) setDevices(cached);

      const res = await fetch(`${getApiBaseUrl()}/api/devices/list?apiId=${apiKeyId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as Device[];
      setDevices(data);
      writeCachedJson(cacheKey, data);
    } catch (error) {
      console.error("Failed to load devices:", error);
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleUpdateDevice = async () => {
    if (!session || !editDeviceTarget) return;
    setUpdatingDevice(true);
    try {
      const body: { device_name?: string; isActive?: boolean } = {};
      if (editDeviceName.trim() !== editDeviceTarget.deviceName) {
        body.device_name = editDeviceName.trim();
      }
      if (editDeviceActive !== editDeviceTarget.isActive) {
        body.isActive = editDeviceActive;
      }
      if (Object.keys(body).length === 0) {
        setEditDeviceTarget(null);
        return;
      }

      const res = await fetch(
        `${getApiBaseUrl()}/api/devices/update/${editDeviceTarget.apiId}/${editDeviceTarget.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) throw new Error(await res.text());

      const updated = { ...editDeviceTarget, deviceName: editDeviceName.trim(), isActive: editDeviceActive };
      setDevices((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setEditDeviceTarget(null);
    } catch (error) {
      console.error("Failed to update device:", error);
    } finally {
      setUpdatingDevice(false);
    }
  };

  const handleDeleteDevice = async () => {
    if (!session || !deleteDeviceTarget) return;
    setDeletingDevice(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/devices/delete/${deleteDeviceTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      setDevices((prev) => prev.filter((d) => d.id !== deleteDeviceTarget.id));
      setDeleteDeviceTarget(null);
    } catch (error) {
      console.error("Failed to delete device:", error);
    } finally {
      setDeletingDevice(false);
    }
  };

  const btnBase: React.CSSProperties = {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "5px 8px",
    borderRadius: 5,
    display: "flex",
    alignItems: "center",
    color: "var(--mh-muted)",
    fontFamily: "var(--mh-font-body)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--mh-bg)",
    border: "1px solid var(--mh-border)",
    borderRadius: 6,
    padding: "9px 12px",
    fontSize: 14,
    color: "var(--mh-text)",
    fontFamily: "var(--mh-font-body)",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ padding: 32 }}>

      {/* Edit modal */}
      {editTarget && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <p style={{ color: "var(--mh-text)", fontWeight: 600, fontSize: 15 }}>Edit API Key</p>
              <button onClick={() => setEditTarget(null)} style={btnBase}><X size={16} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", color: "var(--mh-muted)", fontSize: 12, marginBottom: 6 }}>Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", color: "var(--mh-muted)", fontSize: 12, marginBottom: 6 }}>Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  style={{ ...inputStyle }}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="DISABLED">DISABLED</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
              <button
                onClick={() => setEditTarget(null)}
                style={{ ...btnBase, border: "1px solid var(--mh-border)", padding: "8px 16px", fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                onClick={() => void handleUpdate()}
                disabled={updating || !editName.trim()}
                style={{
                  background: "var(--mh-accent)", color: "var(--mh-accent-fg)",
                  border: "none", borderRadius: 6, padding: "8px 18px",
                  fontSize: 13, fontWeight: 600, cursor: updating ? "not-allowed" : "pointer",
                  opacity: updating ? 0.6 : 1, fontFamily: "var(--mh-font-body)",
                }}
              >
                {updating ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <p style={{ color: "var(--mh-text)", fontWeight: 600, fontSize: 15 }}>Delete API Key</p>
              <button onClick={() => { setDeleteTarget(null); setDeleteInput(""); }} style={btnBase}><X size={16} /></button>
            </div>
            <p style={{ color: "var(--mh-muted)", fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
              Are you sure you want to delete <strong style={{ color: "var(--mh-text)" }}>{deleteTarget.name}</strong>?
              This action cannot be undone. To confirm, type the API key ID below:
            </p>
            <p style={{ fontFamily: "var(--mh-font-mono)", fontSize: 12, color: "var(--mh-muted)", background: "var(--mh-bg)", border: "1px solid var(--mh-border)", borderRadius: 6, padding: "8px 12px", marginBottom: 12, wordBreak: "break-all" }}>
              {deleteTarget.id}
            </p>
            <input
              type="text"
              placeholder="Paste the key ID here"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              style={inputStyle}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button
                onClick={() => { setDeleteTarget(null); setDeleteInput(""); }}
                style={{ ...btnBase, border: "1px solid var(--mh-border)", padding: "8px 16px", fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                onClick={() => void handleDelete()}
                disabled={deleting || deleteInput !== deleteTarget.id}
                style={{
                  background: "var(--mh-red)", color: "#fff",
                  border: "none", borderRadius: 6, padding: "8px 18px",
                  fontSize: 13, fontWeight: 600,
                  cursor: deleting || deleteInput !== deleteTarget.id ? "not-allowed" : "pointer",
                  opacity: deleting || deleteInput !== deleteTarget.id ? 0.5 : 1,
                  fontFamily: "var(--mh-font-body)",
                }}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Devices modal */}
      {devicesTarget && (
        <div style={modalOverlay}>
          <div style={{ ...modalBox, width: 600, maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <p style={{ color: "var(--mh-text)", fontWeight: 600, fontSize: 15 }}>Devices for {devicesTarget.name}</p>
              <button onClick={() => { setDevicesTarget(null); setDevices([]); }} style={btnBase}><X size={16} /></button>
            </div>
            <div style={{ flex: 1, overflow: "auto" }}>
              {loadingDevices ? (
                <p style={{ color: "var(--mh-muted)", fontSize: 13, textAlign: "center", padding: 40 }}>Loading devices...</p>
              ) : devices.length === 0 ? (
                <p style={{ color: "var(--mh-muted)", fontSize: 13, textAlign: "center", padding: 40 }}>No devices found</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      style={{
                        background: "var(--mh-bg)",
                        border: "1px solid var(--mh-border)",
                        borderRadius: 8,
                        padding: 16,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ color: "var(--mh-text)", fontWeight: 600, fontSize: 14 }}>{device.deviceName}</span>
                          <Badge status={device.isActive ? "active" : "inactive"} />
                        </div>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            onClick={() => { setEditDeviceTarget(device); setEditDeviceName(device.deviceName); setEditDeviceActive(device.isActive); }}
                            style={btnBase}
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteDeviceTarget(device)}
                            style={btnBase}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 20, fontSize: 12, color: "var(--mh-muted)" }}>
                        <span>Last used: {formatDateLabel(device.last_used)}</span>
                        <span>Updated: {formatDateLabel(device.updated_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Device edit modal */}
      {editDeviceTarget && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <p style={{ color: "var(--mh-text)", fontWeight: 600, fontSize: 15 }}>Edit Device</p>
              <button onClick={() => setEditDeviceTarget(null)} style={btnBase}><X size={16} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", color: "var(--mh-muted)", fontSize: 12, marginBottom: 6 }}>Device Name</label>
                <input
                  type="text"
                  value={editDeviceName}
                  onChange={(e) => setEditDeviceName(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", color: "var(--mh-muted)", fontSize: 12, marginBottom: 6 }}>Status</label>
                <select
                  value={editDeviceActive ? "true" : "false"}
                  onChange={(e) => setEditDeviceActive(e.target.value === "true")}
                  style={{ ...inputStyle }}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
              <button
                onClick={() => setEditDeviceTarget(null)}
                style={{ ...btnBase, border: "1px solid var(--mh-border)", padding: "8px 16px", fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                onClick={() => void handleUpdateDevice()}
                disabled={updatingDevice || !editDeviceName.trim()}
                style={{
                  background: "var(--mh-accent)", color: "var(--mh-accent-fg)",
                  border: "none", borderRadius: 6, padding: "8px 18px",
                  fontSize: 13, fontWeight: 600, cursor: updatingDevice ? "not-allowed" : "pointer",
                  opacity: updatingDevice ? 0.6 : 1, fontFamily: "var(--mh-font-body)",
                }}
              >
                {updatingDevice ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Device delete modal */}
      {deleteDeviceTarget && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <p style={{ color: "var(--mh-text)", fontWeight: 600, fontSize: 15 }}>Delete Device</p>
              <button onClick={() => setDeleteDeviceTarget(null)} style={btnBase}><X size={16} /></button>
            </div>
            <p style={{ color: "var(--mh-muted)", fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
              Are you sure you want to delete <strong style={{ color: "var(--mh-text)" }}>{deleteDeviceTarget.deviceName}</strong>?
              This action cannot be undone.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button
                onClick={() => setDeleteDeviceTarget(null)}
                style={{ ...btnBase, border: "1px solid var(--mh-border)", padding: "8px 16px", fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                onClick={() => void handleDeleteDevice()}
                disabled={deletingDevice}
                style={{
                  background: "var(--mh-red)", color: "#fff",
                  border: "none", borderRadius: 6, padding: "8px 18px",
                  fontSize: 13, fontWeight: 600,
                  cursor: deletingDevice ? "not-allowed" : "pointer",
                  opacity: deletingDevice ? 0.5 : 1,
                  fontFamily: "var(--mh-font-body)",
                }}
              >
                {deletingDevice ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ color: "var(--mh-text)", fontWeight: 700, fontSize: 20, fontFamily: "var(--mh-font-display)" }}>
            API Keys
          </h2>
          <p style={{ color: "var(--mh-muted)", fontSize: 13, marginTop: 4 }}>Manage your access credentials</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setJustCreated(null); }}
          style={{
            background: "var(--mh-accent)", color: "var(--mh-accent-fg)",
            border: "none", borderRadius: 6, padding: "9px 16px",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            fontFamily: "var(--mh-font-body)", display: "flex", alignItems: "center", gap: 6,
          }}
        >
          <Plus size={15} /> Create New Key
        </button>
      </div>

      {showCreate && (
        <div style={{ background: "var(--mh-surface)", border: "1px solid var(--mh-border)", borderRadius: 10, padding: 24, marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <p style={{ color: "var(--mh-text)", fontWeight: 600, fontSize: 14 }}>New API Key</p>
            <button onClick={() => setShowCreate(false)} style={btnBase}><X size={16} /></button>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", color: "var(--mh-muted)", fontSize: 12, marginBottom: 6 }}>Key name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleCreate()}
                placeholder="e.g. Mobile App v2"
                autoFocus
                style={inputStyle}
              />
            </div>
            <button
              onClick={() => void handleCreate()}
              disabled={creating || !newName.trim()}
              style={{
                background: newName.trim() ? "var(--mh-accent)" : "var(--mh-border)",
                color: newName.trim() ? "var(--mh-accent-fg)" : "var(--mh-muted)",
                border: "none", borderRadius: 6, padding: "9px 18px",
                fontSize: 14, fontWeight: 500,
                cursor: creating || !newName.trim() ? "not-allowed" : "pointer",
                fontFamily: "var(--mh-font-body)",
              }}
            >
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
        </div>
      )}

      {justCreated && (
        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "16px 20px", marginBottom: 20 }}>
          <p style={{ color: "#15803D", fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
            Key created — copy it now. It won't be shown again.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#DCFCE7", border: "1px solid #BBF7D0", borderRadius: 6, padding: "8px 14px" }}>
            <code style={{ fontFamily: "var(--mh-font-mono)", fontSize: 13, color: "#15803D", flex: 1 }}>
              {revealedKeys[justCreated.id] || "Loading..."}
            </code>
            <button
              onClick={() => handleCopy("created", revealedKeys[justCreated.id] || "")}
              style={{ ...btnBase, color: copiedIds.has("created") ? "#15803D" : "#6B7280" }}
            >
              {copiedIds.has("created") ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
        </div>
      )}

      {keys.length === 0 ? (
        <div style={{ background: "var(--mh-surface)", border: "1px solid var(--mh-border)", borderRadius: 10, padding: "48px 24px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔑</div>
          <p style={{ color: "var(--mh-text)", fontWeight: 600, fontSize: 15, marginBottom: 8 }}>No API keys yet</p>
          <p style={{ color: "var(--mh-muted)", fontSize: 14, marginBottom: 20 }}>Create your first API key to start sending messages</p>
          <button
            onClick={() => setShowCreate(true)}
            style={{ background: "var(--mh-accent)", color: "var(--mh-accent-fg)", border: "none", borderRadius: 6, padding: "9px 18px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "var(--mh-font-body)" }}
          >
            Create a key
          </button>
        </div>
      ) : (
        <div style={{ background: "var(--mh-surface)", border: "1px solid var(--mh-border)", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          {keys.map((key, i) => (
            <div
              key={key.id}
              style={{ padding: "20px 24px", borderBottom: i < keys.length - 1 ? "1px solid var(--mh-border)" : "none" }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span style={{ color: "var(--mh-text)", fontWeight: 600, fontSize: 14 }}>{key.name}</span>
                    <Badge status={key.status.toLowerCase() as "active" | "revoked"} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--mh-bg)", border: "1px solid var(--mh-border)", borderRadius: 6, padding: "7px 12px", marginBottom: 10, maxWidth: 420 }}>
                    <code style={{ fontFamily: "var(--mh-font-mono)", fontSize: 12, color: "var(--mh-text)", flex: 1 }}>
                      {revealedKeys[key.id] || maskSecret(key.id)}
                    </code>
                    <button onClick={() => toggleReveal(key.id)} style={{ ...btnBase, padding: "2px 4px" }} title={revealedKeys[key.id] ? "Hide" : "Reveal"}>
                      {revealedKeys[key.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      onClick={() => handleCopy(key.id, revealedKeys[key.id] || maskSecret(key.id))}
                      style={{ ...btnBase, padding: "2px 4px", color: copiedIds.has(key.id) ? "var(--mh-green)" : "var(--mh-muted)" }}
                      title="Copy"
                    >
                      {copiedIds.has(key.id) ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 20 }}>
                    <span style={{ color: "var(--mh-muted)", fontSize: 12 }}>Created {formatDateLabel(key.created_at)}</span>
                    <span style={{ color: "var(--mh-muted)", fontSize: 12 }}>Last used {formatDateLabel(key.last_used)}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button
                    onClick={() => { setDevicesTarget(key); void loadDevices(key.id); }}
                    style={btnBase}
                    title="View Devices"
                  >
                    <Smartphone size={15} />
                  </button>
                  <button
                    onClick={() => { setEditTarget(key); setEditName(key.name); setEditStatus(key.status); }}
                    style={btnBase}
                    title="Edit"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => { setDeleteTarget(key); setDeleteInput(""); }}
                    style={btnBase}
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

export function Account() {
  const { session } = useAuth();

  // Profile / name
  const [name, setName] = useState(session?.user.user_metadata?.full_name ?? "");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Change email
  const [newEmail, setNewEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Change password
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const initials =
    session?.user.user_metadata?.full_name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p: string) => p[0]?.toUpperCase())
      .join("") ||
    session?.user.email?.slice(0, 2).toUpperCase() ||
    "MH";

  const handleSaveName = async () => {
    if (!name.trim()) return;
    setNameSaving(true);
    setNameMsg(null);
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    setNameSaving(false);
    setNameMsg(error ? { ok: false, text: error.message } : { ok: true, text: "Name updated." });
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) return;
    setEmailSaving(true);
    setEmailMsg(null);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setEmailSaving(false);
    if (error) {
      setEmailMsg({ ok: false, text: error.message });
    } else {
      setEmailMsg({ ok: true, text: "Confirmation sent to your new email." });
      setNewEmail("");
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) return;
    if (newPw !== confirmPw) {
      setPwMsg({ ok: false, text: "New passwords do not match." });
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    // Re-authenticate with current password first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: session?.user.email ?? "",
      password: currentPw,
    });
    if (signInError) {
      setPwSaving(false);
      setPwMsg({ ok: false, text: "Current password is incorrect." });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setPwSaving(false);
    if (error) {
      setPwMsg({ ok: false, text: error.message });
    } else {
      setPwMsg({ ok: true, text: "Password updated successfully." });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    }
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

  const sectionStyle: React.CSSProperties = {
    background: "var(--mh-surface)",
    border: "1px solid var(--mh-border)",
    borderRadius: 10,
    padding: 28,
    marginBottom: 20,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    color: "var(--mh-text)",
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 6,
  };

  const saveBtn = (loading: boolean, disabled: boolean): React.CSSProperties => ({
    background: "var(--mh-accent)",
    color: "var(--mh-accent-fg)",
    border: "none",
    borderRadius: 6,
    padding: "9px 18px",
    fontSize: 13,
    fontWeight: 500,
    cursor: loading || disabled ? "not-allowed" : "pointer",
    opacity: loading || disabled ? 0.6 : 1,
    fontFamily: "var(--mh-font-body)",
  });

  const msg = (m: { ok: boolean; text: string }) => (
    <span style={{ fontSize: 13, color: m.ok ? "var(--mh-green)" : "var(--mh-red)" }}>
      {m.ok ? "✓ " : "✗ "}{m.text}
    </span>
  );

  return (
    <div style={{ padding: 32, maxWidth: 600 }}>

      {/* Profile */}
      <section style={sectionStyle}>
        <h3 style={{ color: "var(--mh-text)", fontWeight: 600, fontSize: 15, fontFamily: "var(--mh-font-display)", marginBottom: 24 }}>
          Profile
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--mh-accent)", color: "var(--mh-accent-fg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <p style={{ color: "var(--mh-text)", fontWeight: 500, fontSize: 15 }}>{name || "—"}</p>
            <p style={{ color: "var(--mh-muted)", fontSize: 13 }}>{session?.user.email}</p>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Display Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ ...labelStyle }}>
              Email <span style={{ color: "var(--mh-muted)", fontWeight: 400 }}>(read-only — change below)</span>
            </label>
            <input type="email" value={session?.user.email ?? ""} readOnly style={{ ...inputStyle, opacity: 0.6, cursor: "not-allowed" }} />
          </div>
        </div>
        <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => void handleSaveName()} disabled={nameSaving || !name.trim()} style={saveBtn(nameSaving, !name.trim())}>
            {nameSaving ? "Saving…" : "Save Name"}
          </button>
          {nameMsg && msg(nameMsg)}
        </div>
      </section>

      {/* Change Email */}
      <section style={sectionStyle}>
        <h3 style={{ color: "var(--mh-text)", fontWeight: 600, fontSize: 15, fontFamily: "var(--mh-font-display)", marginBottom: 24 }}>
          Change Email
        </h3>
        <div>
          <label style={labelStyle}>New Email Address</label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Enter new email"
            style={inputStyle}
          />
        </div>
        <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => void handleChangeEmail()} disabled={emailSaving || !newEmail.trim()} style={saveBtn(emailSaving, !newEmail.trim())}>
            {emailSaving ? "Sending…" : "Update Email"}
          </button>
          {emailMsg && msg(emailMsg)}
        </div>
      </section>

      {/* Change Password */}
      <section style={sectionStyle}>
        <h3 style={{ color: "var(--mh-text)", fontWeight: 600, fontSize: 15, fontFamily: "var(--mh-font-display)", marginBottom: 24 }}>
          Change Password
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Current Password</label>
            <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="••••••••" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>New Password</label>
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="••••••••" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Confirm New Password</label>
            <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="••••••••" style={inputStyle} />
          </div>
        </div>
        <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => void handleChangePassword()}
            disabled={pwSaving || !currentPw || !newPw || !confirmPw}
            style={saveBtn(pwSaving, !currentPw || !newPw || !confirmPw)}
          >
            {pwSaving ? "Updating…" : "Update Password"}
          </button>
          {pwMsg && msg(pwMsg)}
        </div>
      </section>

    </div>
  );
}

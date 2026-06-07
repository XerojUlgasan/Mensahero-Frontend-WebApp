import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function ResetPassword() {
  const navigate = useNavigate();
  const { updatePassword, session } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const result = await updatePassword(password);

    if (!result.success) {
      setError(result.error ?? "Unable to update password.");
      return;
    }

    setSuccess("Password updated. Redirecting to the dashboard.");
    navigate("/dashboard", { replace: true });
  };

  return (
    <div style={{ display: "grid", gap: 22 }}>
      <div>
        <p
          style={{
            color: "var(--mh-muted)",
            fontSize: 13,
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Recovery
        </p>
        <h2
          style={{
            color: "var(--mh-text)",
            fontSize: 30,
            marginBottom: 8,
            letterSpacing: "-0.03em",
          }}
        >
          Set a new password
        </h2>
        <p
          style={{
            color: "var(--mh-muted)",
            fontSize: 15,
            lineHeight: 1.6,
            maxWidth: 480,
          }}
        >
          Use the password reset link from Supabase to finish recovery and
          return to your account.
        </p>
      </div>

      {!session && (
        <div
          style={{
            borderRadius: 14,
            border: "1px solid var(--mh-border)",
            background: "var(--mh-bg)",
            padding: 16,
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              background: "var(--mh-accent)",
              color: "var(--mh-accent-fg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={15} />
          </div>
          <p
            style={{
              margin: 0,
              color: "var(--mh-muted)",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            If you open this page from the recovery email, Supabase will attach
            your temporary recovery session here.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
        <label style={{ display: "grid", gap: 8 }}>
          <span
            style={{ color: "var(--mh-text)", fontSize: 14, fontWeight: 600 }}
          >
            New password
          </span>
          <div style={{ position: "relative" }}>
            <LockKeyhole
              size={16}
              style={{
                position: "absolute",
                left: 14,
                top: 15,
                color: "var(--mh-muted)",
              }}
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              style={{
                width: "100%",
                height: 48,
                borderRadius: 12,
                border: "1px solid var(--mh-border)",
                background: "var(--mh-bg)",
                color: "var(--mh-text)",
                padding: "0 14px 0 40px",
                fontSize: 15,
                outline: "none",
              }}
            />
          </div>
        </label>

        <label style={{ display: "grid", gap: 8 }}>
          <span
            style={{ color: "var(--mh-text)", fontSize: 14, fontWeight: 600 }}
          >
            Confirm password
          </span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            style={{
              width: "100%",
              height: 48,
              borderRadius: 12,
              border: "1px solid var(--mh-border)",
              background: "var(--mh-bg)",
              color: "var(--mh-text)",
              padding: "0 14px",
              fontSize: 15,
              outline: "none",
            }}
          />
        </label>

        {error && (
          <div
            style={{
              borderRadius: 12,
              border: "1px solid rgba(220,38,38,0.2)",
              background: "rgba(220,38,38,0.06)",
              color: "var(--mh-red)",
              padding: "12px 14px",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            style={{
              borderRadius: 12,
              border: "1px solid rgba(22,163,74,0.25)",
              background: "rgba(22,163,74,0.06)",
              color: "var(--mh-green)",
              padding: "12px 14px",
              fontSize: 14,
            }}
          >
            {success}
          </div>
        )}

        <button
          type="submit"
          style={{
            height: 48,
            borderRadius: 12,
            border: "none",
            background: "var(--mh-accent)",
            color: "var(--mh-accent-fg)",
            cursor: "pointer",
            fontSize: 15,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          Update password
          <ArrowRight size={16} />
        </button>
      </form>

      <Link
        to="/login"
        style={{
          color: "var(--mh-text)",
          textDecoration: "none",
          fontWeight: 500,
          fontSize: 14,
        }}
      >
        Back to login
      </Link>
    </div>
  );
}

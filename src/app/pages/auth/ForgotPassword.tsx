import React, { useState } from "react";
import { Link } from "react-router";
import { ArrowRight, MailCheck, ShieldAlert } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function ForgotPassword() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const result = await sendPasswordReset(email);

    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Unable to send a reset email.");
      return;
    }

    setSubmitted(true);
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
          Password help
        </p>
        <h2
          style={{
            color: "var(--mh-text)",
            fontSize: 30,
            marginBottom: 8,
            letterSpacing: "-0.03em",
          }}
        >
          Forgot your password?
        </h2>
        <p
          style={{
            color: "var(--mh-muted)",
            fontSize: 15,
            lineHeight: 1.6,
            maxWidth: 460,
          }}
        >
          Send a real Supabase recovery email so the user can reset their
          password.
        </p>
      </div>

      {!submitted ? (
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
          <label style={{ display: "grid", gap: 8 }}>
            <span
              style={{ color: "var(--mh-text)", fontSize: 14, fontWeight: 600 }}
            >
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
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
            {loading ? "Sending..." : "Send reset link"}
            <ArrowRight size={16} />
          </button>
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
        </form>
      ) : (
        <div
          style={{
            borderRadius: 16,
            border: "1px solid rgba(22,163,74,0.25)",
            background: "rgba(22,163,74,0.06)",
            padding: 18,
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              background: "var(--mh-green)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <MailCheck size={16} />
          </div>
          <div>
            <p
              style={{
                margin: "0 0 6px",
                color: "var(--mh-text)",
                fontWeight: 600,
              }}
            >
              Reset email sent
            </p>
            <p
              style={{
                margin: 0,
                color: "var(--mh-muted)",
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              If {email} matches a Supabase user account, a recovery link has
              been sent.
            </p>
          </div>
        </div>
      )}

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
          <ShieldAlert size={15} />
        </div>
        <p
          style={{
            margin: 0,
            color: "var(--mh-muted)",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          The reset link should redirect to the in-app recovery screen so the
          user can choose a new password.
        </p>
      </div>

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

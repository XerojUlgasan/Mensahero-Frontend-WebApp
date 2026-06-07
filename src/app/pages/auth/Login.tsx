import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { ArrowRight, EyeOff, Lock, Mail, UserRound } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from =
    (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const result = await signInWithEmail(email, password);

    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Unable to sign in.");
      return;
    }

    navigate(from, { replace: true });
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);

    const result = await signInWithGoogle();

    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Unable to start Google sign-in.");
    }
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
          Sign in
        </p>
        <h2
          style={{
            color: "var(--mh-text)",
            fontSize: 30,
            marginBottom: 8,
            letterSpacing: "-0.03em",
          }}
        >
          Welcome back
        </h2>
        <p
          style={{
            color: "var(--mh-muted)",
            fontSize: 15,
            lineHeight: 1.6,
            maxWidth: 460,
          }}
        >
          Sign in with your email and password.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
        <label style={{ display: "grid", gap: 8 }}>
          <span
            style={{ color: "var(--mh-text)", fontSize: 14, fontWeight: 600 }}
          >
            Email
          </span>
          <div style={{ position: "relative" }}>
            <Mail
              size={16}
              style={{
                position: "absolute",
                left: 14,
                top: 15,
                color: "var(--mh-muted)",
              }}
            />
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
            Password
          </span>
          <div style={{ position: "relative" }}>
            <Lock
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
              autoComplete="current-password"
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
            <EyeOff
              size={16}
              style={{
                position: "absolute",
                right: 14,
                top: 15,
                color: "var(--mh-muted)",
              }}
            />
          </div>
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

        <button
          type="submit"
          disabled={loading}
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
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Signing in..." : "Sign in to dashboard"}
          <ArrowRight size={16} />
        </button>
      </form>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: 12,
          color: "var(--mh-muted)",
          fontSize: 14,
        }}
      >
        <Link
          to="/forgot-password"
          style={{
            color: "var(--mh-text)",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Forgot password?
        </Link>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <UserRound size={14} />
          <Link
            to="/register"
            style={{
              color: "var(--mh-text)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Register
          </Link>
        </span>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, UserPlus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function Register() {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const result = await signUp(fullName, email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Unable to create account.");
      return;
    }

    if (result.requiresConfirmation) {
      setSuccess(
        "Account created. Check your email to confirm the registration.",
      );
      return;
    }

    navigate("/dashboard", { replace: true });
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
          Register
        </p>
        <h2
          style={{
            color: "var(--mh-text)",
            fontSize: 30,
            marginBottom: 8,
            letterSpacing: "-0.03em",
          }}
        >
          Create your profile
        </h2>
        <p
          style={{
            color: "var(--mh-muted)",
            fontSize: 15,
            lineHeight: 1.6,
            maxWidth: 460,
          }}
        >
          Create a Supabase-backed account with email and password.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          color: "var(--mh-muted)",
          fontSize: 13,
        }}
      >
        <span style={{ flex: 1, height: 1, background: "var(--mh-border)" }} />
        <span>or fill in the form</span>
        <span style={{ flex: 1, height: 1, background: "var(--mh-border)" }} />
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
        <label style={{ display: "grid", gap: 8 }}>
          <span
            style={{ color: "var(--mh-text)", fontSize: 14, fontWeight: 600 }}
          >
            Full name
          </span>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            autoComplete="name"
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

        <label style={{ display: "grid", gap: 8 }}>
          <span
            style={{ color: "var(--mh-text)", fontSize: 14, fontWeight: 600 }}
          >
            Email
          </span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
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

        <label style={{ display: "grid", gap: 8 }}>
          <span
            style={{ color: "var(--mh-text)", fontSize: 14, fontWeight: 600 }}
          >
            Password
          </span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
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

        <label style={{ display: "grid", gap: 8 }}>
          <span
            style={{ color: "var(--mh-text)", fontSize: 14, fontWeight: 600 }}
          >
            Confirm password
          </span>
          <input
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            type="password"
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
          {loading ? "Creating account..." : "Create account"}
          <ArrowRight size={16} />
        </button>
      </form>

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
          <UserPlus size={15} />
        </div>
        <p
          style={{
            margin: 0,
            color: "var(--mh-muted)",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          The register flow is connected to Supabase. Depending on your auth
          settings, you may need to confirm your email before the dashboard
          opens.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          gap: 16,
          flexWrap: "wrap",
          color: "var(--mh-muted)",
          fontSize: 14,
        }}
      >
        <Link
          to="/login"
          style={{
            color: "var(--mh-text)",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}

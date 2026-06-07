import React from "react";
import { Link, Outlet, useLocation } from "react-router";
import { ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";

const routeMeta: Record<string, { title: string; description: string }> = {
  "/login": {
    title: "Sign in to MensaHERO",
    description:
      "Access the dashboard with Supabase email login or continue with Google.",
  },
  "/register": {
    title: "Create an account",
    description: "Register a new Supabase user account with email or Google.",
  },
  "/forgot-password": {
    title: "Reset your password",
    description:
      "Send a real Supabase password reset email and complete recovery.",
  },
  "/reset-password": {
    title: "Reset your password",
    description: "Set a new password after opening the Supabase recovery link.",
  },
};

const highlights = [
  "Supabase handles Google OAuth, sign-up, sign-in, and password recovery.",
  "The dashboard stays protected until a valid session exists.",
  "The design stays aligned with the existing MensaHERO visual language.",
];

export function AuthLayout() {
  const location = useLocation();
  const meta = routeMeta[location.pathname] ?? routeMeta["/login"];

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(26,26,26,0.08), transparent 36%), radial-gradient(circle at bottom right, rgba(26,26,26,0.06), transparent 30%), var(--mh-bg)",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: 24 }}>
        <div
          style={{
            marginBottom: 20,
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            gap: 16,
          }}
        >
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: "var(--mh-text)",
              textDecoration: "none",
              fontFamily: "var(--mh-font-mono)",
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            <ArrowLeft size={16} />
            Back to site
          </Link>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 24,
            minHeight: "calc(100vh - 160px)",
          }}
        >
          <main
            style={{
              width: "100%",
              maxWidth: 640,
              background: "var(--mh-surface)",
              border: "1px solid var(--mh-border)",
              borderRadius: 20,
              padding: 24,
              boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
              minHeight: 420,
            }}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

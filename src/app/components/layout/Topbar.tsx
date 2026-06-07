import React from "react";
import { useNavigate, useLocation } from "react-router";
import { Bell, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const routeTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/messages": "Messages",
  "/api-keys": "API Keys",
  "/account": "Account",
};

export function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const title = routeTitles[location.pathname] ?? "Dashboard";
  const initials =
    session?.user.user_metadata?.full_name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0]?.toUpperCase())
      .join("") ||
    session?.user.email?.slice(0, 2).toUpperCase() ||
    "MH";

  return (
    <div
      style={{
        height: 56,
        background: "var(--mh-surface)",
        borderBottom: "1px solid var(--mh-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        flexShrink: 0,
      }}
    >
      <h2
        style={{
          color: "var(--mh-text)",
          fontWeight: 600,
          fontSize: 15,
          fontFamily: "var(--mh-font-display)",
        }}
      >
        {title}
      </h2>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={() => {
            logout().then(() => navigate("/login", { replace: true }));
          }}
          style={{
            background: "transparent",
            border: "1px solid var(--mh-border)",
            cursor: "pointer",
            color: "var(--mh-muted)",
            padding: "7px 12px",
            borderRadius: 8,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
          }}
        >
          <LogOut size={15} />
          Log out
        </button>

        <button
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--mh-muted)",
            padding: 7,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Bell size={17} />
        </button>

        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "var(--mh-accent)",
            color: "var(--mh-accent-fg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.05em",
          }}
        >
          {initials}
        </div>
      </div>
    </div>
  );
}

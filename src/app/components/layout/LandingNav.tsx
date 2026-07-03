import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { Sun, Moon, Menu, X, Download } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const navLinks = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About", end: false },
  { to: "/features", label: "Features", end: false },
  { to: "/pricing", label: "Pricing", end: false },
  { to: "/docs", label: "Docs", end: false },
  { to: "/contact", label: "Contact", end: false },
];

export function LandingNav() {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      style={{
        background: "var(--mh-surface)",
        borderBottom: "1px solid var(--mh-border)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link to="/" style={{ textDecoration: "none" }}>
          <span
            style={{
              color: "var(--mh-text)",
              fontFamily: "var(--mh-font-mono)",
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            MensaHERO
          </span>
        </Link>

        <div className="hidden md:flex" style={{ gap: 4 }}>
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              style={({ isActive }) => ({
                textDecoration: "none",
                color: isActive ? "var(--mh-text)" : "var(--mh-muted)",
                fontWeight: isActive ? 500 : 400,
                fontSize: 14,
                padding: "5px 12px",
                borderRadius: 6,
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={toggle}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--mh-muted)",
              padding: 8,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
            }}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <a
            href="https://drive.google.com/file/d/1rSYuMfHuKMyssJoNocvIjk5bZFZaKIsG/view?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "transparent",
              color: "var(--mh-text)",
              border: "1px solid var(--mh-border)",
              borderRadius: 6,
              padding: "7px 14px",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "var(--mh-font-body)",
              whiteSpace: "nowrap",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Download size={14} />
            Download App
          </a>

          <button
            onClick={() => navigate("/login")}
            style={{
              background: "var(--mh-accent)",
              color: "var(--mh-accent-fg)",
              border: "none",
              borderRadius: 6,
              padding: "7px 14px",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "var(--mh-font-body)",
              whiteSpace: "nowrap",
            }}
          >
            Get Started →
          </button>

          <button
            className="flex md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--mh-text)",
              padding: 8,
              display: "flex",
              alignItems: "center",
            }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="md:hidden"
          style={{
            background: "var(--mh-surface)",
            borderTop: "1px solid var(--mh-border)",
            padding: "8px 24px 16px",
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              style={{
                display: "block",
                color: "var(--mh-text)",
                textDecoration: "none",
                padding: "10px 0",
                fontSize: 15,
                borderBottom: "1px solid var(--mh-border)",
              }}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://drive.google.com/file/d/1rSYuMfHuKMyssJoNocvIjk5bZFZaKIsG/view?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "var(--mh-text)",
              textDecoration: "none",
              padding: "10px 0",
              fontSize: 15,
              borderBottom: "1px solid var(--mh-border)",
            }}
          >
            <Download size={16} />
            Download App
          </a>
        </div>
      )}
    </nav>
  );
}

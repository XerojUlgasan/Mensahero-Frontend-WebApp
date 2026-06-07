import React, { useState } from "react";
import { X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";

const timezones = [
  { value: "Asia/Manila", label: "Asia/Manila (UTC+8)" },
  { value: "America/New_York", label: "America/New_York (UTC-5)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (UTC-8)" },
  { value: "Europe/London", label: "Europe/London (UTC+0)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (UTC+1)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (UTC+9)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (UTC+8)" },
  { value: "UTC", label: "UTC (UTC+0)" },
];

export function Account() {
  const { theme, toggle } = useTheme();
  const { session } = useAuth();
  const [name, setName] = useState(
    session?.user.user_metadata?.full_name ?? "",
  );
  const [timezone, setTimezone] = useState("Asia/Manila");
  const [bannerVisible, setBannerVisible] = useState(true);
  const [profileSaved, setProfileSaved] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  const handleSaveProfile = () => {
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleSavePrefs = () => {
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2000);
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
  };

  const sectionStyle: React.CSSProperties = {
    background: "var(--mh-surface)",
    border: "1px solid var(--mh-border)",
    borderRadius: 10,
    padding: 28,
    marginBottom: 20,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  };

  return (
    <div style={{ padding: 32, maxWidth: 600 }}>
      {bannerVisible && (
        <div
          style={{
            background: "var(--mh-surface)",
            border: "1px solid var(--mh-border)",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <p style={{ color: "var(--mh-muted)", fontSize: 13 }}>
            Your profile is connected to your Supabase account.
          </p>
          <button
            onClick={() => setBannerVisible(false)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--mh-muted)",
              padding: 4,
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      <section style={sectionStyle}>
        <h3
          style={{
            color: "var(--mh-text)",
            fontWeight: 600,
            fontSize: 15,
            fontFamily: "var(--mh-font-display)",
            marginBottom: 24,
          }}
        >
          Profile
        </h3>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--mh-accent)",
              color: "var(--mh-accent-fg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "0.05em",
              flexShrink: 0,
            }}
          >
            {session?.user.user_metadata?.full_name
              ?.split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase())
              .join("") ||
              session?.user.email?.slice(0, 2).toUpperCase() ||
              "MH"}
          </div>
          <div>
            <p
              style={{ color: "var(--mh-text)", fontWeight: 500, fontSize: 15 }}
            >
              {name}
            </p>
            <p style={{ color: "var(--mh-muted)", fontSize: 13 }}>
              {session?.user.email}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label
              style={{
                display: "block",
                color: "var(--mh-text)",
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 6,
              }}
            >
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                color: "var(--mh-text)",
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 6,
              }}
            >
              Email{" "}
              <span style={{ color: "var(--mh-muted)", fontWeight: 400 }}>
                (read-only)
              </span>
            </label>
            <input
              type="email"
              value={session?.user.email ?? ""}
              readOnly
              style={{ ...inputStyle, opacity: 0.6, cursor: "not-allowed" }}
            />
          </div>
        </div>

        <div
          style={{
            marginTop: 20,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            onClick={handleSaveProfile}
            style={{
              background: "var(--mh-accent)",
              color: "var(--mh-accent-fg)",
              border: "none",
              borderRadius: 6,
              padding: "9px 18px",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "var(--mh-font-body)",
            }}
          >
            Save Changes
          </button>
          {profileSaved && (
            <span style={{ color: "var(--mh-green)", fontSize: 13 }}>
              ✓ Saved
            </span>
          )}
        </div>
      </section>

      <section style={sectionStyle}>
        <h3
          style={{
            color: "var(--mh-text)",
            fontWeight: 600,
            fontSize: 15,
            fontFamily: "var(--mh-font-display)",
            marginBottom: 24,
          }}
        >
          Preferences
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <p
                style={{
                  color: "var(--mh-text)",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Dark mode
              </p>
              <p
                style={{ color: "var(--mh-muted)", fontSize: 12, marginTop: 2 }}
              >
                Currently {theme === "dark" ? "dark" : "light"}
              </p>
            </div>
            <button
              onClick={toggle}
              role="switch"
              aria-checked={theme === "dark"}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                background:
                  theme === "dark" ? "var(--mh-accent)" : "var(--mh-border)",
                border: "none",
                cursor: "pointer",
                position: "relative",
                transition: "background 0.2s",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  left: theme === "dark" ? 23 : 3,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background:
                    theme === "dark" ? "var(--mh-accent-fg)" : "#FFFFFF",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  transition: "left 0.2s",
                }}
              />
            </button>
          </div>

          <div>
            <label
              style={{
                display: "block",
                color: "var(--mh-text)",
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 6,
              }}
            >
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              style={{
                ...inputStyle,
                cursor: "pointer",
              }}
            >
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          style={{
            marginTop: 20,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            onClick={handleSavePrefs}
            style={{
              background: "var(--mh-accent)",
              color: "var(--mh-accent-fg)",
              border: "none",
              borderRadius: 6,
              padding: "9px 18px",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "var(--mh-font-body)",
            }}
          >
            Save Preferences
          </button>
          {prefsSaved && (
            <span style={{ color: "var(--mh-green)", fontSize: 13 }}>
              ✓ Saved
            </span>
          )}
        </div>
      </section>
    </div>
  );
}

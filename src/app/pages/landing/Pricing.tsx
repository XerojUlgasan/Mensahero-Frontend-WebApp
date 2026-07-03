import React from "react";
import { useNavigate } from "react-router";
import { Check } from "lucide-react";

const features = [
  "1,000 messages per day",
  "1 API key",
  "Connect up to 3 Android devices per API key",
  "Delivery tracking",
  "REST API access",
];

export function Pricing() {
  const navigate = useNavigate();

  return (
    <div style={{ background: "var(--mh-bg)", padding: "80px 24px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center", marginBottom: 48 }}>
        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 40px)",
            fontWeight: 700,
            fontFamily: "var(--mh-font-display)",
            color: "var(--mh-text)",
            letterSpacing: "-0.02em",
            marginBottom: 12,
          }}
        >
          Simple, transparent pricing
        </h1>
        <p style={{ color: "var(--mh-muted)", fontSize: 16, lineHeight: 1.6 }}>
          Get started for free. No credit card required.
        </p>
      </div>

      <div style={{ maxWidth: 360, margin: "0 auto" }}>
        <div
          style={{
            background: "var(--mh-surface)",
            border: "1px solid var(--mh-border)",
            borderRadius: 14,
            padding: 32,
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <span
              style={{
                background: "var(--mh-bg)",
                border: "1px solid var(--mh-border)",
                borderRadius: 6,
                padding: "3px 10px",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--mh-muted)",
                letterSpacing: "0.07em",
                textTransform: "uppercase",
              }}
            >
              Free Tier
            </span>
          </div>

          <div style={{ marginBottom: 28 }}>
            <span
              style={{
                fontSize: 48,
                fontWeight: 700,
                fontFamily: "var(--mh-font-display)",
                color: "var(--mh-text)",
                letterSpacing: "-0.03em",
              }}
            >
              $0
            </span>
            <span style={{ color: "var(--mh-muted)", fontSize: 14, marginLeft: 6 }}>
              / month
            </span>
          </div>

          <div
            style={{
              borderTop: "1px solid var(--mh-border)",
              paddingTop: 24,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              marginBottom: 28,
            }}
          >
            {features.map((f) => (
              <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <Check size={15} style={{ color: "var(--mh-green)", flexShrink: 0, marginTop: 1 }} />
                <span style={{ color: "var(--mh-text)", fontSize: 14, lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate("/register")}
            style={{
              width: "100%",
              background: "var(--mh-accent)",
              color: "var(--mh-accent-fg)",
              border: "none",
              borderRadius: 8,
              padding: "11px 0",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--mh-font-body)",
            }}
          >
            Get Started for Free →
          </button>
        </div>
      </div>
    </div>
  );
}

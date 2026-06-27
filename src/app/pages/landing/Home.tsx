import React from "react";
import { useNavigate } from "react-router";
import { Smartphone, Key, CheckCircle2 } from "lucide-react";
import { CodeBlock } from "../../components/ui/CodeBlock";

const curlCode = `curl --location 'https://mensahero.onrender.com/api/messages/create' \\
--header 'Content-Type: application/json' \\
--data '{
  "apiKey": "YOUR_API_KEY",
  "to": "+639123123123",
  "message": "YOUR_MESSAGE"
}'`;

const curlResponse = `{
    "message": "YOUR_MESSAGE",
    "receiver": "+639123123123",
    "sender": null,
    "api_id": "ec674b6b-22e9-4aa1-be1b-c709e835375d",
    "created_at": null,
    "id": "7d4a35d9-4048-4eb8-be24-28a248b9e7eb",
    "sent_at": null,
    "status": "pending"
}`;

const features = [
  {
    icon: <Smartphone size={22} />,
    title: "Real SIM Cards",
    desc: "Messages sent from actual Android phones, not virtual numbers.",
  },
  {
    icon: <Key size={22} />,
    title: "Multi-Key API",
    desc: "Isolate traffic per project with dedicated API keys.",
  },
  {
    icon: <CheckCircle2 size={22} />,
    title: "Delivery Tracking",
    desc: "Know exactly when each message is delivered or fails.",
  },
];

export function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ background: "var(--mh-bg)" }}>
      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "96px 24px 80px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(40px, 7vw, 64px)",
            fontWeight: 700,
            fontFamily: "var(--mh-font-display)",
            color: "var(--mh-text)",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            marginBottom: 20,
          }}
        >
          Send SMS.{" "}
          <span style={{ color: "var(--mh-muted)" }}>Programmatically.</span>
        </h1>

        <p
          style={{
            fontSize: 18,
            color: "var(--mh-muted)",
            maxWidth: 520,
            margin: "0 auto 36px",
            lineHeight: 1.6,
          }}
        >
          MensaHERO turns your Android phones into a real SMS gateway. No
          carrier API. No monthly contracts.
        </p>

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => navigate("/login")}
            style={{
              background: "var(--mh-accent)",
              color: "var(--mh-accent-fg)",
              border: "none",
              borderRadius: 8,
              padding: "12px 24px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--mh-font-body)",
            }}
          >
            Get Started →
          </button>
          <button
            onClick={() => navigate("/docs")}
            style={{
              background: "transparent",
              color: "var(--mh-text)",
              border: "1px solid var(--mh-border)",
              borderRadius: 8,
              padding: "12px 24px",
              fontSize: 15,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "var(--mh-font-body)",
            }}
          >
            Read the Docs
          </button>
        </div>
      </section>

      <section
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "0 24px 80px",
        }}
      >
        <CodeBlock code={curlCode} language="bash">
          <span style={{ color: "#8B949E" }}># Send your first SMS{"\n"}</span>
          <span style={{ color: "#79C0FF" }}>curl</span>
          <span style={{ color: "#E6EDF3" }}>{" --location "}</span>
          <span style={{ color: "#A5D6FF" }}>
            'https://mensahero.onrender.com/api/messages/create'
          </span>
          {" \\\n"}
          <span style={{ color: "#79C0FF" }}>--header</span>
          <span style={{ color: "#E6EDF3" }}>{" "}</span>
          <span style={{ color: "#A5D6FF" }}>
            'Content-Type: application/json'
          </span>
          {" \\\n"}
          <span style={{ color: "#79C0FF" }}>--data</span>
          <span style={{ color: "#E6EDF3" }}>{" '{\n  "}</span>
          <span style={{ color: "#7EE787" }}>"apiKey"</span>
          <span style={{ color: "#E6EDF3" }}>{": "}</span>
          <span style={{ color: "#A5D6FF" }}>"YOUR_API_KEY"</span>
          <span style={{ color: "#E6EDF3" }}>{",\n  "}</span>
          <span style={{ color: "#7EE787" }}>"to"</span>
          <span style={{ color: "#E6EDF3" }}>{": "}</span>
          <span style={{ color: "#A5D6FF" }}>"+639123123123"</span>
          <span style={{ color: "#E6EDF3" }}>{",\n  "}</span>
          <span style={{ color: "#7EE787" }}>"message"</span>
          <span style={{ color: "#E6EDF3" }}>{": "}</span>
          <span style={{ color: "#A5D6FF" }}>"YOUR_MESSAGE"</span>
          <span style={{ color: "#E6EDF3" }}>{"\n}'"}</span>
          {"\n\n"}
          <span style={{ color: "#8B949E" }}>{"# → "}</span>
          <span style={{ color: "#7EE787" }}>
            {'{"message":"YOUR_MESSAGE","receiver":"+639123123123","status":"pending"}'}
          </span>
        </CodeBlock>
      </section>

      <section
        style={{
          background: "var(--mh-surface)",
          borderTop: "1px solid var(--mh-border)",
          borderBottom: "1px solid var(--mh-border)",
          padding: "64px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 40,
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: "var(--mh-bg)",
                  border: "1px solid var(--mh-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--mh-text)",
                }}
              >
                {f.icon}
              </div>
              <h3
                style={{
                  color: "var(--mh-text)",
                  fontWeight: 600,
                  fontSize: 15,
                  fontFamily: "var(--mh-font-display)",
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  color: "var(--mh-muted)",
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          padding: "40px 24px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: "var(--mh-muted)",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          {["Open source", "Self-hostable", "Android-powered"].map((tag, i) => (
            <React.Fragment key={tag}>
              {i > 0 && <span style={{ opacity: 0.3 }}>·</span>}
              <span>{tag}</span>
            </React.Fragment>
          ))}
        </p>
      </section>
    </div>
  );
}

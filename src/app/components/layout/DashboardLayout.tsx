import React from "react";
import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function DashboardLayout() {
  return (
    <div
      style={{ display: "flex", height: "100vh", background: "var(--mh-bg)" }}
    >
      <div className="hidden md:flex" style={{ flexShrink: 0 }}>
        <Sidebar />
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <Topbar />
        <main style={{ flex: 1, overflow: "auto" }}>
          <Outlet />
        </main>
      </div>

      {/* mobile bottom navigation removed */}
    </div>
  );
}

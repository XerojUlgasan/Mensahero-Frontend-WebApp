import React, { useEffect, useRef } from "react";
import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import {
  initHistoryController,
  disposeHistoryController,
} from "../../lib/historyController";

export function DashboardLayout() {
  const { session } = useAuth();

  // Always read the freshest token (Supabase rotates it via autoRefreshToken).
  const sessionRef = useRef(session);
  sessionRef.current = session;

  // One SSE connection per authenticated session. Re-init only on identity
  // change (not on every token refresh), and dispose on logout/unmount.
  const userId = session?.user?.id;
  useEffect(() => {
    if (!userId) return;
    initHistoryController({
      getToken: () => sessionRef.current?.access_token ?? null,
      refreshToken: async () =>
        (await supabase.auth.refreshSession()).data.session?.access_token ??
        null,
    });
    return () => disposeHistoryController();
  }, [userId]);

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

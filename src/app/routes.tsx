import { createBrowserRouter } from "react-router";
import { LandingLayout } from "./components/layout/LandingLayout";
import { AuthLayout } from "./components/layout/AuthLayout";
import { RequireAuth } from "./components/layout/RequireAuth";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { Home } from "./pages/landing/Home";
import { About } from "./pages/landing/About";
import { Features } from "./pages/landing/Features";
import { Docs } from "./pages/landing/Docs";
import { Pricing } from "./pages/landing/Pricing";
import { Contact } from "./pages/landing/Contact";
import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";
import { ForgotPassword } from "./pages/auth/ForgotPassword";
import { ResetPassword } from "./pages/auth/ResetPassword";
import { Dashboard } from "./pages/app/Dashboard";
import { Messages } from "./pages/app/Messages";
import { ApiKeys } from "./pages/app/ApiKeys";
import { Account } from "./pages/app/Account";

export const router = createBrowserRouter([
  {
    Component: AuthLayout,
    children: [
      { path: "/login", Component: Login },
      { path: "/register", Component: Register },
      { path: "/forgot-password", Component: ForgotPassword },
      { path: "/reset-password", Component: ResetPassword },
    ],
  },
  {
    Component: RequireAuth,
    children: [
      {
        Component: DashboardLayout,
        children: [
          { path: "/dashboard", Component: Dashboard },
          { path: "/messages", Component: Messages },
          { path: "/api-keys", Component: ApiKeys },
          { path: "/account", Component: Account },
        ],
      },
    ],
  },
  {
    Component: LandingLayout,
    children: [
      { path: "/", Component: Home },
      { path: "/about", Component: About },
      { path: "/features", Component: Features },
      { path: "/docs", Component: Docs },
      { path: "/contact", Component: Contact },
      { path: "/pricing", Component: Pricing },
    ],
  },
]);

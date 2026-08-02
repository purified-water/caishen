import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu, Plus, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { QuickLogSheet } from "../pages/QuickLogSheet/QuickLogSheet";

const navItems = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/transactions", label: "Transactions", end: false },
  { to: "/budget", label: "Budget", end: false },
  { to: "/settings/categories", label: "Categories", end: false },
  { to: "/settings/accounts", label: "Accounts", end: false },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded px-3 py-2 text-sm font-medium ${
    isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
  }`;

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded px-3 py-2.5 text-sm font-medium ${
    isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
  }`;

export function Layout() {
  const { signOut } = useAuth();
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navigateHome = () => {
    navigate("/");
  };

  const handleSignOut = () => {
    if (!window.confirm("Are you sure you want to log out?")) {
      return;
    }
    signOut();
  };

  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div
            className="flex cursor-pointer items-center gap-2"
            onClick={navigateHome}
          >
            <img
              src="/ic-app-icon.png"
              alt=""
              className="h-8 w-8 rounded-full"
            />
            <span className="text-lg font-semibold text-slate-900">
              Caishen
            </span>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={navLinkClass}
              >
                {item.label}
              </NavLink>
            ))}
            <button
              onClick={handleSignOut}
              className="rounded px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Log out
            </button>
          </nav>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Open menu"
            className="rounded p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <nav className="space-y-1 border-t border-slate-200 px-4 py-3 md:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={mobileNavLinkClass}
              >
                {item.label}
              </NavLink>
            ))}
            <button
              onClick={handleSignOut}
              className="block w-full rounded px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Log out
            </button>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 pb-24">
        <Outlet />
      </main>

      <button
        onClick={() => setQuickLogOpen(true)}
        aria-label="Add transaction"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg hover:bg-slate-800"
      >
        <Plus size={24} />
      </button>

      {quickLogOpen && <QuickLogSheet onClose={() => setQuickLogOpen(false)} />}
    </div>
  );
}

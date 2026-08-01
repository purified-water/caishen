import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
  }`

export function Layout() {
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <span className="text-lg font-semibold text-slate-900">Caishen</span>
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/budget" className={navLinkClass}>
              Budget
            </NavLink>
            <NavLink to="/settings/categories" className={navLinkClass}>
              Categories
            </NavLink>
            <NavLink to="/settings/accounts" className={navLinkClass}>
              Accounts
            </NavLink>
            <button
              onClick={() => signOut()}
              className="rounded px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Đăng xuất
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

import { useAuth } from '../contexts/AuthContext'

export function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
      <p className="text-slate-600">Logged in as: {user?.email}</p>
    </div>
  )
}

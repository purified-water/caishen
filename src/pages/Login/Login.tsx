import { Link } from 'react-router-dom'
import { useLoginViewModel } from './Login.viewModel'

export function Login() {
  const { username, setUsername, password, setPassword, error, submitting, handleSubmit } =
    useLoginViewModel()

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow"
      >
        <div className="flex flex-col items-center gap-2">
          <img src="/ic-app-icon.png" alt="Caishen" className="h-16 w-16" />
          <h1 className="text-xl font-semibold text-slate-900">
            Log in to Caishen
          </h1>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Username</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Logging in..." : "Log in"}
        </button>

        <p className="text-center text-sm text-slate-600">
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-slate-900 underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}

import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { isValidUsername } from '../lib/authEmail'

export function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!isValidUsername(username)) {
      setError('Username phải 3-20 ký tự, chỉ gồm chữ thường, số, dấu . _ -')
      return
    }
    if (password.length < 6) {
      setError('Password phải có ít nhất 6 ký tự')
      return
    }

    setSubmitting(true)
    try {
      await signUp(username, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow"
      >
        <div className="flex flex-col items-center gap-2">
          <img src="/ic-app-icon.png" alt="Caishen" className="h-16 w-16" />
          <h1 className="text-xl font-semibold text-slate-900">
            Tạo tài khoản Caishen
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
          {submitting ? "Đang tạo tài khoản..." : "Đăng ký"}
        </button>

        <p className="text-center text-sm text-slate-600">
          Đã có tài khoản?{" "}
          <Link to="/login" className="font-medium text-slate-900 underline">
            Đăng nhập
          </Link>
        </p>
      </form>
    </div>
  );
}

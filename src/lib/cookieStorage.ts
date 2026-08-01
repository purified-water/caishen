const COOKIE_MAX_AGE_DAYS = 30

function getCookie(name: string): string | null {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null
}

function setCookie(name: string, value: string) {
  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`
}

function removeCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`
}

/**
 * Supabase auth storage adapter backed by document.cookie instead of
 * localStorage, so the session survives across PWA relaunches and is
 * readable if the app later gains an SSR layer. Not HttpOnly (client JS
 * can't set that) — it only substitutes localStorage's storage medium.
 */
export const cookieStorage = {
  getItem: (key: string) => Promise.resolve(getCookie(key)),
  setItem: (key: string, value: string) => {
    setCookie(key, value)
    return Promise.resolve()
  },
  removeItem: (key: string) => {
    removeCookie(key)
    return Promise.resolve()
  },
}

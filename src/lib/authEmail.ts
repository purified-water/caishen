const USERNAME_REGEX = /^[a-z0-9_.-]{3,20}$/
const EMAIL_DOMAIN = 'caishen.local'

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${EMAIL_DOMAIN}`
}

export function isValidUsername(username: string): boolean {
  return USERNAME_REGEX.test(username.trim().toLowerCase())
}

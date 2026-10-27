import { redirect } from 'react-router'

/** Thrown on 422 so forms can show Laravel's messages next to each field. */
export class AdminValidationError extends Error {
  errors: Record<string, string[]>
  constructor(message: string, errors: Record<string, string[]>) {
    super(message)
    this.errors = errors
  }
}

// Laravel sets XSRF-TOKEN on every web response; sending it back as a header satisfies CSRF protection.
const xsrf = () => decodeURIComponent(document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/)?.[1] ?? '')

export async function adminFetch<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch('/api/admin' + path, {
    method,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-XSRF-TOKEN': xsrf() },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  // 401 = not logged in, 419 = session (and CSRF token) expired.
  if (res.status === 401 || res.status === 419) throw redirect('/admin/login')
  if (res.status === 204) return undefined as T
  const json = await res.json().catch(() => ({}))
  if (res.status === 422) throw new AdminValidationError(json.message, json.errors ?? {})
  if (!res.ok) throw new Error(json.message || `Request failed (${res.status})`)
  return json as T
}

export type Admin = { id: number; name: string; email: string }

export const getMe = async () => (await adminFetch<{ data: Admin | null }>('GET', '/me')).data

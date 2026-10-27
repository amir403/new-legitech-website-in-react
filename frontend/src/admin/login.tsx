import { useState, type FormEvent } from 'react'
import { redirect, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AdminValidationError, adminFetch, getMe } from './api'

export async function loader() {
  if (await getMe()) throw redirect('/admin')
  return null
}

export function Login() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    setBusy(true)
    setError('')
    try {
      await adminFetch('POST', '/login', { email: d.get('email'), password: d.get('password'), remember: d.get('remember') === 'on' })
      navigate('/admin')
    } catch (err) {
      setError(err instanceof AdminValidationError ? Object.values(err.errors)[0]?.[0] ?? err.message : err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background p-4 text-foreground">
      <title>Admin login | LegiTech.io</title>
      <meta name="robots" content="noindex" />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">LegiTech.io admin</CardTitle>
          <CardDescription>Sign in to manage enquiries and site content.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="username" required autoFocus />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="remember" name="remember" />
              <Label htmlFor="remember" className="font-normal">
                Keep me signed in
              </Label>
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

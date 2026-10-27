import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { Button } from '@/components/ui/button'

export const navLinks = [
  { to: '/services', label: 'Services' },
  { to: '/work', label: 'Our work' },
  { to: '/about', label: 'About' },
  { to: '/industries', label: 'Industries' },
  { to: '/insights', label: 'Insights' },
]

export const Logo = () => <img className="site-logo" src="/legitech-logo.png" alt="LegiTech.io" width={270} height={68} />

/** index.html sets the `dark` class before first paint (saved choice, else system preference); this only flips and saves it. */
function ThemeToggle() {
  const [isLight, setIsLight] = useState(() => !document.documentElement.classList.contains('dark'))
  const toggle = () => {
    const light = !isLight
    document.documentElement.classList.toggle('dark', !light)
    try {
      localStorage.setItem('legitech-theme', light ? 'light' : 'dark')
    } catch {
      // Storage can be blocked (private mode); the theme still applies for this visit.
    }
    setIsLight(light)
  }
  return (
    <Button
      type="button"
      variant="ghost"
      className="theme-toggle"
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      onClick={toggle}
    >
      {isLight ? '☾' : '☀'} <span>{isLight ? 'Dark' : 'Light'}</span>
    </Button>
  )
}

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className="nav">
      <Link className="logo-link" to="/" aria-label="LegiTech.io home">
        <Logo />
      </Link>
      <nav id="main-nav" aria-label="Main navigation" className={open ? 'is-open' : undefined} onClick={(e) => (e.target as HTMLElement).closest('a') && setOpen(false)}>
        {navLinks.map((l) => (
          <NavLink key={l.to} to={l.to}>
            {l.label}
          </NavLink>
        ))}
        <Link className="mobile-contact" to="/contact">
          Start a project ↗
        </Link>
      </nav>
      <Button asChild className="nav-cta">
        <Link to="/contact">
          Let’s talk <span>↗</span>
        </Link>
      </Button>
      <ThemeToggle />
      <Button
        type="button"
        variant="ghost"
        className="menu-toggle"
        aria-expanded={open}
        aria-controls="main-nav"
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        onClick={() => setOpen((o) => !o)}
      >
        <span></span>
        <span></span>
      </Button>
    </header>
  )
}

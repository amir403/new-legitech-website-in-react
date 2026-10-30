import { isRouteErrorResponse, Link, Outlet, ScrollRestoration, useMatches, useRouteError } from 'react-router'
import { ContactBand, SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'

/** Routes set `handle: { contactBand: false }` to hide the lime band (contact, privacy, terms). */
function Shell({ children, band = true }: { children: React.ReactNode; band?: boolean }) {
  return (
    <div className="site">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div id="top"></div>
      <SiteHeader />
      <main id="main">{children}</main>
      {band && <ContactBand />}
      <SiteFooter />
      <ScrollRestoration />
    </div>
  )
}

export function RootLayout() {
  const matches = useMatches()
  const band = !matches.some((m) => (m.handle as { contactBand?: boolean } | undefined)?.contactBand === false)
  return (
    <Shell band={band}>
      <Outlet />
    </Shell>
  )
}

/** Shown on first load while the page's API data arrives, so visitors see the header and footer instead of a blank screen. */
export function LoadingShell() {
  return (
    <Shell band={false}>
      <section className="page-hero section" aria-busy="true" />
    </Shell>
  )
}

export function RouteError() {
  const error = useRouteError()
  const notFound = isRouteErrorResponse(error) && error.status === 404
  if (!notFound) console.error(error)
  return (
    <Shell>
      <title>{notFound ? 'Page not found | LegiTech.io' : 'Something went wrong | LegiTech.io'}</title>
      <meta name="robots" content="noindex" />
      <section className="page-hero section">
        <p className="eyebrow">{notFound ? '404 / PAGE NOT FOUND' : 'SOMETHING WENT WRONG'}</p>
        <h1>
          {notFound ? 'This page' : 'We could not'}
          <br />
          <span>{notFound ? 'has moved on.' : 'load this page.'}</span>
        </h1>
        <p className="intro">{notFound ? 'The page you were looking for does not exist.' : 'Please refresh, or try again in a moment.'}</p>
        <div className="hero-actions">
          <Link className="pill" to="/">
            Back to home <span>↗</span>
          </Link>
        </div>
      </section>
    </Shell>
  )
}

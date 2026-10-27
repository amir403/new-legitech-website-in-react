import { createBrowserRouter, data, redirect } from 'react-router'
import { adminRoute } from '@/admin/routes'
import { LoadingShell, RootLayout, RouteError } from '@/layouts/root-layout'
import About from '@/pages/about'
import * as contact from '@/pages/contact'
import * as home from '@/pages/home'
import * as industries from '@/pages/industries'
import * as insightDetail from '@/pages/insight-detail'
import * as insights from '@/pages/insights'
import { Privacy, Terms } from '@/pages/legal'
import * as serviceDetail from '@/pages/service-detail'
import * as services from '@/pages/services'
import * as work from '@/pages/work'

/** Old static URLs (legacy-static/*.html) → new routes, so existing links and search results keep working. */
const legacyRedirects = [
  ['index.html', '/'],
  ...['services', 'work', 'about', 'industries', 'insights', 'contact', 'privacy', 'terms'].map((p) => [`${p}.html`, `/${p}`]),
  ...['custom-software', 'web-development', 'mobile-apps', 'saas-products', 'product-design', 'ai-automation', 'ecommerce', 'cloud-support'].map((s) => [`service-${s}.html`, `/services/${s}`]),
  ...['planning-your-mvp', 'design-before-development', 'practical-automation'].map((s) => [`insight-${s}.html`, `/insights/${s}`]),
  // The hash (e.g. work.html#operations) never reaches the loader's request, so carry it over explicitly.
].map(([from, to]) => ({ path: from, loader: () => redirect(to + window.location.hash) }))

const noBand = { contactBand: false }

export const router = createBrowserRouter([
  adminRoute,
  {
    Component: RootLayout,
    HydrateFallback: LoadingShell,
    errorElement: <RouteError />,
    children: [
      { index: true, Component: home.default, loader: home.loader },
      { path: 'services', Component: services.default, loader: services.loader },
      { path: 'services/:slug', Component: serviceDetail.default, loader: serviceDetail.loader },
      { path: 'work', Component: work.default, loader: work.loader },
      { path: 'about', Component: About },
      { path: 'industries', Component: industries.default, loader: industries.loader },
      { path: 'insights', Component: insights.default, loader: insights.loader },
      { path: 'insights/:slug', Component: insightDetail.default, loader: insightDetail.loader },
      { path: 'contact', Component: contact.default, loader: contact.loader, handle: noBand },
      { path: 'privacy', Component: Privacy, handle: noBand },
      { path: 'terms', Component: Terms, handle: noBand },
      ...legacyRedirects,
      {
        path: '*',
        loader: () => {
          throw data(null, { status: 404 })
        },
      },
    ],
  },
])
